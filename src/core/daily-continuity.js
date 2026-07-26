export const REFLECTION_DRAFT_VERSION=1;

export function createReflectionDraft({
  current,
  values={},
  at=new Date().toISOString()
}={}){
  if(!current?.decision?.id)throw new Error('An active judgement is required.');

  return {
    version:REFLECTION_DRAFT_VERSION,
    judgementId:current.decision.id,
    practiceId:current.decision.practice?.id||null,
    values:{
      effect:values.effect||'right',
      goalFit:values.goalFit||'partial',
      burden:values.burden||'moderate',
      surprise:values.surprise||'none',
      confidence:values.confidence||'medium',
      attributionSource:values.attributionSource||'unclear',
      attributionConfidence:values.attributionConfidence||'low',
      externalFactors:values.externalFactors||'',
      frictionOutcome:values.frictionOutcome||'not-relevant',
      note:values.note||''
    },
    updatedAt:at
  };
}

export function updateReflectionDraft(draft,patch={},at=new Date().toISOString()){
  if(!draft?.judgementId)throw new Error('A reflection draft is required.');
  return {
    ...draft,
    values:{...(draft.values||{}),...patch},
    updatedAt:at
  };
}

export function restoreReflectionDraft(state,current){
  const draft=state?.reflectionDraft;
  if(!draft||!current?.decision?.id)return null;
  if(draft.judgementId!==current.decision.id)return null;
  return draft;
}

export function clearReflectionDraft(state){
  return {...(state||{}),reflectionDraft:null};
}

export function dailyContinuityStatus(state){
  const current=state?.current;
  if(!current)return {status:'clear',route:'today',message:'No interrupted daily flow.'};

  if(current.execution?.status==='paused'||current.execution?.status==='interrupted'){
    return {status:'practice-paused',route:'resumePrompt',message:'A Practice is ready to resume.'};
  }

  if(current.execution?.status==='completed'&&!current.completed){
    return {status:'reflection-pending',route:'reflect',message:'A completed Practice is waiting for reflection.'};
  }

  if(current.decision&&!current.startedAt){
    return {status:'judgement-pending',route:'judgement',message:'A current judgement is waiting for a decision.'};
  }

  return {status:'active',route:'today',message:'The daily flow is active.'};
}

export function reconcileDailyContinuity(state){
  const next=clone(state||{});
  if(next.reflectionDraft&&!next.current?.decision?.id){
    next.reflectionDraft=null;
  }
  if(next.reflectionDraft&&next.current?.decision?.id&&next.reflectionDraft.judgementId!==next.current.decision.id){
    next.reflectionDraft=null;
  }
  return next;
}

function clone(value){
  return typeof structuredClone==='function'
    ?structuredClone(value)
    :JSON.parse(JSON.stringify(value));
}
