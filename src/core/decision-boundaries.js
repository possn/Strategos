const SIGNAL_LABELS={
  sleep:'sleep',
  energy:'energy',
  time:'available time',
  challenge:'today’s principal claim',
  soreness:'physical soreness',
  emotionalLoad:'emotional load'
};

export function buildDecisionBoundaries(decision,context={}){
  const ranking=rankPractices(decision);
  const chosen=ranking.find(item=>item.id===decision.practice?.id)||ranking[0]||null;
  const runnerUp=ranking.find(item=>item.id!==chosen?.id)||null;
  const scoreMargin=chosen&&runnerUp?chosen.score-runnerUp.score:null;
  const unknowns=collectUnknowns(decision,context);
  const decisiveSignals=collectDecisiveSignals(decision,context);
  const changeConditions=deriveChangeConditions(decision,context,runnerUp,scoreMargin);
  const alternativeExplanation=runnerUp
    ?explainAlternative(decision,runnerUp,chosen,scoreMargin)
    :'No credible alternative was available in the current practice set.';
  const provenance=summarizeProvenance(decision.advisors||[]);
  return {
    createdAt:new Date().toISOString(),
    chosen:chosen?{id:chosen.id,name:chosen.name,score:round(chosen.score)}:null,
    runnerUp:runnerUp?{id:runnerUp.id,name:runnerUp.name,score:round(runnerUp.score)}:null,
    scoreMargin:scoreMargin===null?null:round(scoreMargin),
    stability:scoreMargin===null?'undetermined':scoreMargin<.18?'fragile':scoreMargin<.45?'conditional':'stable',
    unknowns,
    decisiveSignals,
    changeConditions,
    alternativeExplanation,
    provenance
  };
}

export function rankPractices(decision){
  const names=new Map([
    [decision.practice?.id,decision.practice?.name],
    ...((decision.agora?.blockedPractices||[]).map(item=>[item.practiceId,item.practiceId]))
  ]);
  for(const advisor of decision.advisors||[]){
    for(const id of Object.keys(advisor.scores||{}))if(!names.has(id))names.set(id,title(id));
  }
  return Object.entries(decision.scores||{})
    .map(([id,score])=>({id,name:names.get(id)||title(id),score:Number(score||0)}))
    .filter(item=>!(decision.agora?.blockedPractices||[]).some(blocked=>blocked.practiceId===item.id))
    .sort((a,b)=>b.score-a.score);
}

export function collectUnknowns(decision,context){
  const unknowns=[...(decision.unknowns||[])];
  for(const [key,label] of Object.entries(SIGNAL_LABELS)){
    const value=context[key];
    if(value===undefined||value===null||value===''||value==='unknown')unknowns.push(`${capitalize(label)} was not reported.`);
  }
  const diversity=decision.evidenceDiversity?.level;
  if(diversity==='Narrow')unknowns.push('Most of the supporting evidence comes from the same current self-report.');
  if(!(decision.advisors||[]).some(a=>(a.evidence||[]).some(e=>e.family==='professional_input')))
    unknowns.push('No professional input was available to this judgement.');
  return unique(unknowns).slice(0,6);
}

export function collectDecisiveSignals(decision,context){
  const chosen=decision.practice?.id;
  const advisorEffects=(decision.advisors||[]).map(advisor=>({
    advisor:advisor.advisor,
    contribution:Number(advisor.scores?.[chosen]||0)*Number(advisor.weight||1),
    reason:advisor.reason
  })).sort((a,b)=>Math.abs(b.contribution)-Math.abs(a.contribution));

  const signals=[];
  if(context.soreness==='significant')signals.push({signal:'Significant soreness',effect:'Strength was blocked by a deterministic safety rule.',kind:'constraint'});
  if(context.emotionalLoad==='heavy')signals.push({signal:'Heavy emotional load',effect:'Cognitive and performance-heavy options were down-weighted.',kind:'constraint'});
  if(context.challenge)signals.push({signal:`Priority: ${context.challenge}`,effect:'The stated priority shaped Purpose, Mind and Relationships positions.',kind:'preference'});
  if(context.time)signals.push({signal:`${context.time} minutes available`,effect:'Only practices feasible within the available time were considered.',kind:'feasibility'});
  for(const effect of advisorEffects.slice(0,2)){
    signals.push({signal:`${effect.advisor} position`,effect:effect.reason,kind:effect.contribution>=0?'support':'constraint'});
  }
  return signals.slice(0,5);
}

export function deriveChangeConditions(decision,context,runnerUp,margin){
  const conditions=[];
  if(context.soreness!=='significant')conditions.push('Significant soreness or pain would trigger an immediate physical-safety reassessment.');
  if(context.emotionalLoad!=='heavy')conditions.push('A shift to heavy emotional load could move the judgement toward Recovery or Connection.');
  if(Number(context.energy||0)>1)conditions.push('A substantial fall in energy could reduce the value of the current practice.');
  if(runnerUp){
    const threshold=margin===null?.2:Math.max(.08,margin);
    conditions.push(`${runnerUp.name} would become more plausible if new evidence improved its relative support by about ${threshold.toFixed(2)} weighted points.`);
  }
  conditions.push('A correction to any decisive signal would reopen the Agora.');
  return unique(conditions).slice(0,5);
}

export function explainAlternative(decision,runnerUp,chosen,margin){
  const supporters=(decision.advisors||[])
    .filter(a=>(a.scores?.[runnerUp.id]||0)>.45)
    .sort((a,b)=>(b.scores?.[runnerUp.id]||0)-(a.scores?.[runnerUp.id]||0));
  const support=supporters[0]?.reason;
  const gap=margin===null?'an unknown margin':`${Math.abs(margin).toFixed(2)} weighted points`;
  return support
    ?`${runnerUp.name} remained credible because ${lowerFirst(support)} It was not selected because ${chosen?.name||'the chosen practice'} retained a lead of ${gap}.`
    :`${runnerUp.name} was the nearest alternative, but it did not receive enough distinct Advisor support to overcome the ${gap} lead.`;
}

export function summarizeProvenance(advisors=[]){
  const families={};
  let independent=0,total=0;
  for(const advisor of advisors){
    for(const evidence of advisor.evidence||[]){
      const family=evidence.family||'unclassified';
      families[family]=(families[family]||0)+1;
      total+=1;
      if(evidence.independent!==false)independent+=1;
    }
  }
  return {
    families,
    totalItems:total,
    independentItems:independent,
    independenceRatio:total?round(independent/total):0,
    statement:total
      ?`${Object.keys(families).length} evidence families were represented across ${total} evidence items; ${independent} were treated as independent.`
      :'No structured evidence provenance was available.'
  };
}

function round(value){return +Number(value||0).toFixed(3)}
function title(value=''){return value.charAt(0).toUpperCase()+value.slice(1)}
function capitalize(value=''){return value.charAt(0).toUpperCase()+value.slice(1)}
function lowerFirst(value=''){return value?value.charAt(0).toLowerCase()+value.slice(1):''}
function unique(items){return [...new Set(items.filter(Boolean))]}
