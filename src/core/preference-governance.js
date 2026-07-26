const ACTIVE_STATUSES=new Set(['candidate','confirmed']);
const TERMINAL_STATUSES=new Set(['rejected','expired']);

export function createPreferenceCandidate({
  choice,
  context={},
  at=new Date().toISOString()
}={}){
  if(!choice?.id)throw new Error('A person choice is required.');
  if(choice.action!=='choose-alternative')
    throw new Error('Only an explicit alternative choice can create a preference candidate.');

  return {
    id:makeId('preference'),
    sourceChoiceId:choice.id,
    sourceJudgementId:choice.judgementId,
    recommendedPracticeId:choice.recommendedPracticeId,
    preferredPracticeId:choice.selectedPracticeId,
    contextKey:contextKeyFor(context),
    context:pickContext(context),
    status:'candidate',
    evidenceCount:1,
    confirmations:0,
    contradictions:0,
    createdAt:at,
    lastObservedAt:at,
    expiresAt:new Date(new Date(at).getTime()+120*86400000).toISOString(),
    correction:null
  };
}

export function upsertPreferenceCandidate(preferences=[],candidate){
  const next=[...(preferences||[])];
  const index=next.findIndex(item=>
    ACTIVE_STATUSES.has(item.status)&&
    item.preferredPracticeId===candidate.preferredPracticeId&&
    item.recommendedPracticeId===candidate.recommendedPracticeId&&
    item.contextKey===candidate.contextKey
  );

  if(index<0)return [candidate,...next].slice(0,100);

  const current={...next[index]};
  current.evidenceCount=Number(current.evidenceCount||0)+1;
  current.lastObservedAt=candidate.lastObservedAt;
  current.confirmations=Number(current.confirmations||0)+1;
  current.status=evaluatePreferenceStatus(current);
  next[index]=current;
  return next;
}

export function evaluatePreferenceStatus(preference,now=Date.now()){
  if(TERMINAL_STATUSES.has(preference.status))return preference.status;
  if(preference.status==='confirmed'&&preference.confirmationSource==='person')return 'confirmed';
  if(new Date(preference.expiresAt||0).getTime()<now)return 'expired';
  if(Number(preference.evidenceCount||0)>=3&&Number(preference.confirmations||0)>=2&&Number(preference.contradictions||0)<=1)
    return 'confirmed';
  return 'candidate';
}

export function preferenceInfluence(preference,context={},now=Date.now()){
  const status=evaluatePreferenceStatus(preference,now);
  if(status==='rejected'||status==='expired')return {
    applies:false,
    weight:0,
    status,
    reason:'Rejected or expired preference cannot influence judgement.'
  };

  const similarity=contextSimilarity(preference.context||{},context);
  if(similarity<.72)return {
    applies:false,
    weight:0,
    status,
    similarity,
    reason:'Current context is too different from the context in which the preference was observed.'
  };

  const base=status==='confirmed'?.18:.07;
  const evidenceFactor=Math.min(1,Math.max(.35,Number(preference.evidenceCount||1)/3));
  return {
    applies:true,
    status,
    similarity,
    weight:+(base*evidenceFactor*similarity).toFixed(3),
    reason:status==='confirmed'
      ?'Confirmed contextual preference applies with bounded weight.'
      :'Candidate preference applies with reduced weight.'
  };
}

export function applyPreferenceCorrection(preferences,{
  preferenceId,
  action,
  note='',
  at=new Date().toISOString()
}={}){
  if(!['confirm','reject','reopen'].includes(action))
    throw new Error('Unsupported preference action.');

  return (preferences||[]).map(item=>{
    if(item.id!==preferenceId)return item;
    if(action==='confirm')return {
      ...item,
      status:'confirmed',
      confirmationSource:'person',
      lastObservedAt:at,
      correction:null
    };
    if(action==='reject')return {
      ...item,
      status:'rejected',
      correction:{at,note:note||'Rejected by the person.'}
    };
    return {
      ...item,
      status:'candidate',
      confirmationSource:null,
      correction:null,
      expiresAt:new Date(new Date(at).getTime()+120*86400000).toISOString()
    };
  });
}

export function expirePreferences(preferences=[],now=Date.now()){
  return (preferences||[]).map(item=>{
    const status=evaluatePreferenceStatus(item,now);
    return status===item.status?item:{...item,status};
  });
}

export function preferenceAudit(preferences=[]){
  return {
    total:preferences.length,
    candidate:preferences.filter(item=>item.status==='candidate').length,
    confirmed:preferences.filter(item=>item.status==='confirmed').length,
    rejected:preferences.filter(item=>item.status==='rejected').length,
    expired:preferences.filter(item=>item.status==='expired').length
  };
}

export function contextSimilarity(a={},b={}){
  let score=1;
  if(a.challenge&&b.challenge&&a.challenge!==b.challenge)score-=.28;
  if(a.soreness&&b.soreness&&a.soreness!==b.soreness)score-=.18;
  if(a.emotionalLoad&&b.emotionalLoad&&a.emotionalLoad!==b.emotionalLoad)score-=.18;
  if(Number.isFinite(Number(a.energy))&&Number.isFinite(Number(b.energy))){
    score-=Math.min(.18,Math.abs(Number(a.energy)-Number(b.energy))*.06);
  }
  if(Number.isFinite(Number(a.sleep))&&Number.isFinite(Number(b.sleep))){
    score-=Math.min(.12,Math.abs(Number(a.sleep)-Number(b.sleep))*.04);
  }
  return +Math.max(0,Math.min(1,score)).toFixed(3);
}

function contextKeyFor(context){
  return [
    context.challenge||'unknown',
    context.soreness||'unknown',
    context.emotionalLoad||'unknown'
  ].join('|');
}

function pickContext(context){
  return {
    sleep:context.sleep??null,
    energy:context.energy??null,
    challenge:context.challenge||'unknown',
    soreness:context.soreness||'unknown',
    emotionalLoad:context.emotionalLoad||'unknown'
  };
}

function makeId(prefix){
  return globalThis.crypto?.randomUUID
    ?`${prefix}-${crypto.randomUUID()}`
    :`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
