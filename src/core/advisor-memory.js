const ADVISORS=['Body','Recovery','Mind','Agency','Purpose','Relationships'];
const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));
const DAY=86400000;
const MEMORY_HALF_LIFE_DAYS=90;
const CANDIDATE_INFLUENCE=.45;
const blank=name=>({name,experience:0,confidence:38,coverage:18,notes:[],weights:{},updatedAt:null});

function normalizeWeight(value){
  if(Number.isFinite(Number(value))) return {
    value:Number(value),observations:1,positive:Number(value)>0?1:0,neutral:0,
    negative:Number(value)<0?1:0,lastObservedAt:null,contexts:{},learningStatus:'candidate'
  };
  const v=value&&typeof value==='object'?value:{};
  return {
    value:Number(v.value||0),
    observations:Number(v.observations||0),
    positive:Number(v.positive||0),
    neutral:Number(v.neutral||0),
    negative:Number(v.negative||0),
    lastObservedAt:v.lastObservedAt||null,
    contexts:{...(v.contexts||{})},
    learningStatus:v.learningStatus||'candidate'
  };
}

function normalizeNote(note={}){
  const at=note.lastObservedAt||note.at||new Date().toISOString();
  return {
    id:note.id||makeId('learning'),
    advisor:note.advisor||null,
    practice:note.practice||note.context?.practice||null,
    contextKey:note.contextKey||contextKeyFor(note.context||{}),
    status:note.status||'candidate',
    confirmationSource:note.confirmationSource||null,
    evidenceCount:Number(note.evidenceCount ?? note.observations ?? 1),
    outcomeCounts:{
      positive:Number(note.outcomeCounts?.positive||0),
      neutral:Number(note.outcomeCounts?.neutral||0),
      negative:Number(note.outcomeCounts?.negative||0)
    },
    contexts:{...(note.contexts||{})},
    firstObservedAt:note.firstObservedAt||note.at||at,
    lastObservedAt:at,
    reviewAfter:note.reviewAfter||new Date(new Date(at).getTime()+120*DAY).toISOString(),
    observation:note.observation||'',
    reflection:note.reflection||'',
    learning:note.learning||'',
    context:{...(note.context||{})},
    correction:note.correction||null
  };
}

export function normalizeAdvisorMemories(value={}){
  const result={};
  for(const name of ADVISORS){
    const current=value[name]||{};
    const weights=Object.fromEntries(Object.entries(current.weights||{}).map(([k,v])=>[k,normalizeWeight(v)]));
    result[name]={
      ...blank(name),
      ...current,
      notes:[...(current.notes||[])].map(normalizeNote),
      weights
    };
  }
  return result;
}

export function evaluateLearningStatus(note,now=Date.now()){
  const n=normalizeNote(note);
  if(['rejected','expired'].includes(n.status)) return n.status;
  if(n.status==='confirmed' && n.confirmationSource==='person') return 'confirmed';
  if(new Date(n.reviewAfter).getTime()<now && n.status==='candidate') return 'expired';
  const counts=n.outcomeCounts;
  const dominant=Math.max(counts.positive,counts.neutral,counts.negative);
  const contradiction=n.evidenceCount-dominant;
  const consistency=n.evidenceCount?dominant/n.evidenceCount:0;
  const sameContextEvidence=Math.max(0,...Object.values(n.contexts).map(Number));
  if(n.evidenceCount>=3 && dominant>=2 && consistency>=(2/3) && sameContextEvidence>=2 && contradiction<=1) return 'confirmed';
  return 'candidate';
}

export function effectiveMemoryWeight(weight,now=Date.now()){
  const item=normalizeWeight(weight);
  if(['rejected','expired'].includes(item.learningStatus)) return 0;
  const statusFactor=item.learningStatus==='confirmed'?1:CANDIDATE_INFLUENCE;
  const age=item.lastObservedAt?Math.max(0,now-new Date(item.lastObservedAt).getTime()):0;
  const decay=item.lastObservedAt?Math.pow(.5,age/(MEMORY_HALF_LIFE_DAYS*DAY)):1;
  const evidenceFactor=clamp(item.observations/3,.34,1);
  return +clamp(item.value*decay*evidenceFactor*statusFactor,-.28,.28).toFixed(3);
}

export function learnFromReflection(memories,entry){
  const next=normalizeAdvisorMemories(memories);
  const outcome=entry.reflection;
  const judgement=entry.decision;
  const context=entry.context||{};
  const now=new Date().toISOString();
  const practice=judgement?.practice?.id;
  const cKey=contextKeyFor(context);

  for(const opinion of judgement?.advisors||[]){
    const m=next[opinion.advisor]||blank(opinion.advisor);
    const supported=(opinion.scores?.[practice]||0)>.45;
    const signal=outcome==='worse'?-1:outcome==='better'?1:.35;
    const outcomeClass=outcome==='worse'?'negative':outcome==='better'?'positive':'neutral';
    const relevance=supported?1:.45;

    m.experience+=1;
    m.confidence=Math.round(clamp((m.confidence/100)+(signal*relevance*.03),.22,.92)*100);
    m.coverage=Math.round(clamp((m.coverage/100)+.04,.18,.94)*100);

    if(practice){
      const prior=normalizeWeight(m.weights[practice]);
      const contradiction=(signal<0 && prior.value>0)||(signal>0 && prior.value<0);
      const learningRate=contradiction?.035:.055;
      prior.value=+clamp(prior.value+signal*relevance*learningRate,-.28,.28).toFixed(3);
      prior.observations+=1;
      prior[outcomeClass]+=1;
      prior.lastObservedAt=now;
      prior.contexts[cKey]=(prior.contexts[cKey]||0)+1;
      m.weights[practice]=prior;
    }

    const noteIndex=m.notes.findIndex(n=>n.practice===practice && n.contextKey===cKey && !['rejected','expired'].includes(n.status));
    const base=noteIndex>=0?normalizeNote(m.notes[noteIndex]):normalizeNote({
      id:makeId(opinion.advisor),
      advisor:opinion.advisor,
      practice,
      contextKey:cKey,
      evidenceCount:0,
      outcomeCounts:{positive:0,neutral:0,negative:0},
      contexts:{},
      firstObservedAt:now,
      lastObservedAt:now,
      context:{...context,practice}
    });

    base.evidenceCount+=1;
    base.outcomeCounts[outcomeClass]+=1;
    base.contexts[cKey]=(base.contexts[cKey]||0)+1;
    base.lastObservedAt=now;
    base.reviewAfter=new Date(new Date(now).getTime()+120*DAY).toISOString();
    Object.assign(base,buildNote(opinion,judgement,context,outcome));
    base.status=evaluateLearningStatus(base,new Date(now).getTime());
    if(base.status==='confirmed'&&!base.confirmationSource)base.confirmationSource='repeated-evidence';

    if(noteIndex>=0)m.notes[noteIndex]=base;
    else m.notes.unshift(base);
    m.notes=m.notes.slice(0,18);

    if(practice&&m.weights[practice]){
      const related=m.notes.filter(n=>n.practice===practice);
      const confirmed=related.some(n=>n.status==='confirmed');
      const activeCandidate=related.some(n=>n.status==='candidate');
      m.weights[practice].learningStatus=confirmed?'confirmed':activeCandidate?'candidate':'expired';
    }

    m.updatedAt=now;
    next[opinion.advisor]=m;
  }
  return next;
}

export function updateLearningStatus(memories,{advisor,learningId,status,correction=''}) {
  if(!['confirmed','rejected','expired','candidate'].includes(status)) throw new Error('Unsupported learning status.');
  const next=normalizeAdvisorMemories(memories);
  const memory=next[advisor];
  if(!memory) return next;
  const index=memory.notes.findIndex(note=>note.id===learningId);
  if(index<0) return next;
  const note={...memory.notes[index],status};
  if(status==='confirmed')note.confirmationSource='person';
  if(status==='rejected')note.correction={at:new Date().toISOString(),note:correction||'Rejected by the person.'};
  memory.notes[index]=note;

  if(note.practice&&memory.weights[note.practice]){
    const related=memory.notes.filter(n=>n.practice===note.practice);
    const confirmed=related.some(n=>n.status==='confirmed');
    const candidate=related.some(n=>n.status==='candidate');
    memory.weights[note.practice].learningStatus=confirmed?'confirmed':candidate?'candidate':'expired';
  }
  memory.updatedAt=new Date().toISOString();
  return next;
}

export function expireStaleLearnings(memories,now=Date.now()){
  const next=normalizeAdvisorMemories(memories);
  for(const memory of Object.values(next)){
    memory.notes=memory.notes.map(note=>{
      const status=evaluateLearningStatus(note,now);
      return status===note.status?note:{...note,status};
    });
    for(const [practice,weight] of Object.entries(memory.weights)){
      const related=memory.notes.filter(n=>n.practice===practice);
      const confirmed=related.some(n=>n.status==='confirmed');
      const candidate=related.some(n=>n.status==='candidate');
      weight.learningStatus=confirmed?'confirmed':candidate?'candidate':'expired';
    }
  }
  return next;
}

export function learningReviewItems(memories){
  const normalized=normalizeAdvisorMemories(memories);
  return Object.entries(normalized)
    .flatMap(([advisor,memory])=>memory.notes.map(note=>({...note,advisor})))
    .sort((a,b)=>new Date(b.lastObservedAt)-new Date(a.lastObservedAt));
}

function contextKeyFor(context){
  return [context.challenge||'unknown',context.soreness||'unknown',context.emotionalLoad||'unknown'].join('|');
}

function buildNote(opinion,judgement,context,outcome){
  const practice=judgement.practice?.name||'the practice';
  const learning=outcome==='worse'
    ?`My support for ${practice} was not validated in this context. Similar conditions should receive less weight until new evidence appears.`
    :outcome==='better'
      ?`${practice} created more value than expected in this context.`
      :`${practice} was approximately right in this context.`;
  return {
    observation:`${opinion.advisor} held a ${opinion.position.toLowerCase()} position with ${opinion.confidence}% internal confidence.`,
    reflection:`The person judged the result ${outcome}.`,
    learning,
    context:{sleep:context.sleep,energy:context.energy,challenge:context.challenge,soreness:context.soreness,emotionalLoad:context.emotionalLoad,practice:judgement.practice?.id}
  };
}

export function applyAdvisorMemory(opinion,memory){
  if(!memory)return opinion;
  const scores={...opinion.scores};
  const applied=[];
  for(const [practice,record] of Object.entries(memory.weights||{})){
    const normalized=normalizeWeight(record);
    const delta=effectiveMemoryWeight(normalized);
    scores[practice]=(scores[practice]||0)+delta;
    if(Math.abs(delta)>=.01)applied.push({
      practice,delta,observations:normalized.observations,status:normalized.learningStatus
    });
  }
  const experienced=memory.experience>0;
  const evidence=[...(opinion.evidence||[])];
  if(experienced)evidence.push({
    family:'advisor_memory',
    description:`${memory.experience} reflected domain experience${memory.experience===1?'':'s'}, filtered by learning status and recency.`,
    source:`${opinion.advisor} Memory`,
    reliability:memory.experience>=3?'moderate':'limited',
    independent:false
  });
  return {
    ...opinion,scores,evidence,
    memory:{experience:memory.experience,confidence:memory.confidence,coverage:memory.coverage,applied},
    reason:experienced
      ?`${opinion.reason} I am also carrying ${memory.experience} reflected experience${memory.experience===1?'':'s'} in this domain. Candidate learning is deliberately down-weighted; rejected and expired learning has no effect.`
      :opinion.reason
  };
}

export function advisorCoverage(memories){
  const normalized=normalizeAdvisorMemories(memories);
  return ADVISORS.map(name=>{
    const m=normalized[name];
    return {name,coverage:m.coverage,confidence:m.confidence,experience:m.experience,latest:m.notes[0]||null};
  });
}

export function buildMonthlyCouncil(memories,history=[]){
  const normalized=expireStaleLearnings(memories);
  const coverage=advisorCoverage(normalized);
  const now=new Date();
  const month=now.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const recent=history.filter(x=>{
    const d=new Date(x.completedAt||x.decision?.createdAt||0);
    return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
  });
  const voices=coverage.map(x=>({
    advisor:x.name,
    statement:x.latest?.learning||`${x.name} is still building enough experience to make a reliable monthly claim.`,
    coverage:x.coverage,
    status:x.latest?.status||'insufficient'
  }));
  const strongest=[...coverage].sort((a,b)=>b.coverage-a.coverage)[0];
  const weakest=[...coverage].sort((a,b)=>a.coverage-b.coverage)[0];
  const learnings=learningReviewItems(normalized);
  const confirmed=learnings.filter(x=>x.status==='confirmed').length;
  const candidates=learnings.filter(x=>x.status==='candidate').length;
  return {
    month,completed:recent.length,voices,confirmed,candidates,
    summary:recent.length
      ?`This month produced ${recent.length} reflected practice${recent.length===1?'':'s'}. ${confirmed} learning${confirmed===1?' is':'s are'} confirmed and ${candidates} remain candidate evidence.`
      :'The council does not yet have a reflected practice this month. Its conclusions remain deliberately limited.',
    strongest,weakest
  };
}

function makeId(prefix){
  return globalThis.crypto?.randomUUID
    ?`${prefix}-${crypto.randomUUID()}`
    :`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
