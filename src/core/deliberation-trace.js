const SEVERITY_WEIGHT={critical:4,high:3,moderate:2,low:1};

export function buildDeliberationTrace({context={},understanding={},advisors=[],agora={},decision={}}={}){
  const events=[];
  let order=1;

  events.push(event(order++,'signals','Signals received',{
    summary:summarizeContext(context),
    data:pick(context,['sleep','energy','time','challenge','soreness','emotionalLoad'])
  }));

  events.push(event(order++,'understanding','Context interpreted',{
    summary:`Understanding confidence was ${Math.round(Number(understanding.confidence||0)*100)}% with ${(understanding.unknowns||[]).length} explicit unknowns.`,
    data:{
      confidence:understanding.confidence||0,
      unknowns:[...(understanding.unknowns||[])],
      contradictions:[...(understanding.contradictions||[])]
    }
  }));

  for(const advisor of advisors){
    events.push(event(order++,'advisor',`${advisor.advisor} position recorded`,{
      actor:advisor.advisor,
      position:advisor.position,
      summary:advisor.reason,
      data:{
        confidence:advisor.confidence,
        weight:advisor.weight,
        scores:{...(advisor.scores||{})},
        riskFlags:[...(advisor.riskFlags||[])],
        evidenceFamilies:[...(advisor.evidence||[])].map(item=>item.family)
      }
    }));
  }

  if((agora.blockedPractices||[]).length){
    events.push(event(order++,'constraint','Safety constraints applied',{
      summary:(agora.blockedPractices||[]).map(item=>`${item.practiceId}: ${item.reason}`).join(' '),
      data:{blockedPractices:[...(agora.blockedPractices||[])]}
    }));
  }

  events.push(event(order++,'synthesis','Agora synthesis formed',{
    summary:`${decision.practice?.name||'A practice'} was selected with ${decision.confidenceLevel||'limited'} confidence.`,
    data:{
      practiceId:decision.practice?.id||null,
      confidence:decision.confidence||null,
      evidenceDiversity:agora.evidenceDiversity?.level||decision.evidenceDiversity?.level||null,
      contradictions:[...(agora.contradictions||decision.contradictions||[])],
      strongestCaution:agora.strongestCaution||null
    }
  }));

  return {
    id:makeId('trace'),
    createdAt:new Date().toISOString(),
    version:1,
    events,
    eventCount:events.length,
    actors:[...new Set(advisors.map(item=>item.advisor))],
    finalPracticeId:decision.practice?.id||null
  };
}

export function buildMinorityReports(advisors=[],winnerId,agora={}){
  const reports=[];
  for(const advisor of advisors){
    const winnerScore=Number(advisor.scores?.[winnerId]||0);
    const preferred=Object.entries(advisor.scores||{})
      .sort((a,b)=>Number(b[1])-Number(a[1]))[0];
    const riskFlags=[...(advisor.riskFlags||[])];
    const isMinority=
      advisor.position==='Oppose'||
      advisor.position==='Caution'||
      winnerScore<.35||
      (preferred&&preferred[0]!==winnerId&&Number(preferred[1])-winnerScore>=.25)||
      riskFlags.length>0;
    if(!isMinority)continue;

    const severity=maxSeverity(riskFlags);
    const report={
      id:makeId('minority'),
      advisor:advisor.advisor,
      position:advisor.position,
      confidence:advisor.confidence,
      winnerId,
      winnerScore:+winnerScore.toFixed(3),
      preferredPracticeId:preferred?.[0]||null,
      preferredScore:preferred?+Number(preferred[1]).toFixed(3):null,
      reason:advisor.reason,
      riskFlags,
      severity,
      preservedBecause:preservationReason(advisor,preferred,winnerId,winnerScore,riskFlags),
      evidence:[...(advisor.evidence||[])],
      status:'preserved'
    };
    reports.push(report);
  }

  const strongest=agora.strongestCaution?.advisor;
  return reports
    .sort((a,b)=>{
      if(a.advisor===strongest)return -1;
      if(b.advisor===strongest)return 1;
      const severityDelta=(SEVERITY_WEIGHT[b.severity]||0)-(SEVERITY_WEIGHT[a.severity]||0);
      if(severityDelta)return severityDelta;
      return Number(b.confidence||0)-Number(a.confidence||0);
    });
}

export function verifyTraceIntegrity(trace){
  if(!trace||!Array.isArray(trace.events)||!trace.events.length)return {valid:false,errors:['No deliberation events were recorded.']};
  const errors=[];
  const orders=trace.events.map(item=>item.order);
  if(new Set(orders).size!==orders.length)errors.push('Event order contains duplicates.');
  if(!orders.every((value,index)=>value===index+1))errors.push('Event order is not continuous.');
  const required=['signals','understanding','synthesis'];
  for(const type of required)if(!trace.events.some(item=>item.type===type))errors.push(`Missing ${type} event.`);
  if(!trace.finalPracticeId)errors.push('Final practice is not linked to the trace.');
  return {valid:errors.length===0,errors};
}

export function summarizeMinorityReports(reports=[]){
  if(!reports.length)return 'No material minority position required preservation.';
  const critical=reports.filter(report=>['critical','high'].includes(report.severity)).length;
  return `${reports.length} minority position${reports.length===1?' was':'s were'} preserved${critical?`, including ${critical} high-severity concern${critical===1?'':'s'}`:''}.`;
}

function event(order,type,title,{actor=null,position=null,summary='',data={}}={}){
  return {
    id:`event-${order}`,
    order,
    at:new Date().toISOString(),
    type,
    title,
    actor,
    position,
    summary,
    data
  };
}

function summarizeContext(context){
  const pieces=[];
  if(context.sleep)pieces.push(`sleep ${context.sleep}/4`);
  if(context.energy)pieces.push(`energy ${context.energy}/4`);
  if(context.time)pieces.push(`${context.time} minutes available`);
  if(context.challenge)pieces.push(`priority ${context.challenge}`);
  if(context.soreness)pieces.push(`soreness ${context.soreness}`);
  if(context.emotionalLoad)pieces.push(`emotional load ${context.emotionalLoad}`);
  return pieces.length?pieces.join(', '):'No contextual signals were supplied.';
}

function preservationReason(advisor,preferred,winnerId,winnerScore,riskFlags){
  if(riskFlags.length)return 'This position contains a risk or reversibility concern that synthesis must not erase.';
  if(advisor.position==='Oppose')return 'This Advisor explicitly opposed the selected direction.';
  if(advisor.position==='Caution')return 'This Advisor supported proceeding only with caution.';
  if(preferred&&preferred[0]!==winnerId)return `This Advisor preferred ${preferred[0]} over the selected practice by ${(Number(preferred[1])-winnerScore).toFixed(2)} score points.`;
  return 'This Advisor assigned weak support to the selected practice.';
}

function maxSeverity(flags=[]){
  return flags.reduce((current,flag)=>{
    const value=flag.severity||'low';
    return (SEVERITY_WEIGHT[value]||0)>(SEVERITY_WEIGHT[current]||0)?value:current;
  },'low');
}

function pick(source,keys){return Object.fromEntries(keys.map(key=>[key,source[key]]))}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
