export const FALLBACK_STATUS={
  PROPOSED:'proposed',
  ACCEPTED:'accepted',
  STARTED:'started',
  COMPLETED:'completed',
  ABANDONED:'abandoned',
  DECLINED:'declined'
};

export function createFallbackPlan({
  commitment,
  frictionPlan=null,
  originalPractice,
  fallbackPractice,
  scope='reduced-duration',
  reductionRatio=.5,
  reason='',
  at=new Date().toISOString()
}={}){
  if(!commitment?.id)throw new Error('A commitment is required.');
  if(!originalPractice?.id)throw new Error('Original practice is required.');
  if(!fallbackPractice?.id)throw new Error('Fallback practice is required.');
  if(!['reduced-duration','reduced-intensity','reduced-scope','alternative-practice'].includes(scope))
    throw new Error('Unsupported fallback scope.');

  const ratio=Math.max(.1,Math.min(1,Number(reductionRatio)||.5));

  return {
    id:makeId('fallback'),
    commitmentId:commitment.id,
    frictionPlanId:frictionPlan?.id||null,
    judgementId:commitment.judgementId,
    originalPracticeId:originalPractice.id,
    fallbackPracticeId:fallbackPractice.id,
    scope,
    reductionRatio:+ratio.toFixed(2),
    reason:String(reason||'').trim(),
    createdAt:at,
    acceptedAt:null,
    startedAt:null,
    completedAt:null,
    abandonedAt:null,
    status:FALLBACK_STATUS.PROPOSED,
    integrity:'distinct-from-original'
  };
}

export function acceptFallback(plan,at=new Date().toISOString()){
  if(!plan)throw new Error('A fallback plan is required.');
  if(plan.status!==FALLBACK_STATUS.PROPOSED)return plan;
  return {...plan,status:FALLBACK_STATUS.ACCEPTED,acceptedAt:at};
}

export function declineFallback(plan,at=new Date().toISOString()){
  if(!plan)throw new Error('A fallback plan is required.');
  if([FALLBACK_STATUS.COMPLETED,FALLBACK_STATUS.ABANDONED].includes(plan.status))return plan;
  return {...plan,status:FALLBACK_STATUS.DECLINED,declinedAt:at};
}

export function startFallback(plan,at=new Date().toISOString()){
  if(!plan?.acceptedAt)throw new Error('Fallback must be accepted before start.');
  return {...plan,status:FALLBACK_STATUS.STARTED,startedAt:at};
}

export function completeFallback(plan,{
  completedRatio=1,
  at=new Date().toISOString()
}={}){
  if(!plan?.startedAt)throw new Error('Fallback must be started before completion.');
  const ratio=Math.max(0,Math.min(1,Number(completedRatio)||0));
  return {
    ...plan,
    status:FALLBACK_STATUS.COMPLETED,
    completedAt:at,
    completedRatio:+ratio.toFixed(3),
    integrity:'fallback-completed'
  };
}

export function abandonFallback(plan,{
  completedRatio=0,
  reason='person-ended',
  at=new Date().toISOString()
}={}){
  if(!plan)throw new Error('A fallback plan is required.');
  const ratio=Math.max(0,Math.min(1,Number(completedRatio)||0));
  return {
    ...plan,
    status:FALLBACK_STATUS.ABANDONED,
    abandonedAt:at,
    completedRatio:+ratio.toFixed(3),
    closureReason:reason,
    integrity:'fallback-abandoned'
  };
}

export function fallbackOutcomeRecord(plan,reflection=null){
  if(!plan)return null;
  const executed=[FALLBACK_STATUS.COMPLETED,FALLBACK_STATUS.ABANDONED].includes(plan.status);
  return {
    fallbackPlanId:plan.id,
    originalPracticeId:plan.originalPracticeId,
    executedPracticeId:plan.fallbackPracticeId,
    wasFallback:true,
    scope:plan.scope,
    reductionRatio:plan.reductionRatio,
    completedRatio:plan.completedRatio??0,
    executed,
    reflection,
    integrity:plan.integrity
  };
}

export function fallbackLearningEligibility(plan,reflection){
  if(!plan)return {eligible:false,reason:'No fallback plan exists.'};
  if(plan.status!==FALLBACK_STATUS.COMPLETED)
    return {eligible:false,reason:'Fallback was not completed.'};
  if(!['better','right','worse'].includes(reflection))
    return {eligible:false,reason:'A valid reflection is required.'};
  if(Number(plan.completedRatio||0)<.5)
    return {eligible:false,reason:'Less than half of the fallback was completed.'};

  const weight=Math.min(.6,Math.max(.2,Number(plan.reductionRatio||.5)*Number(plan.completedRatio||0)));
  return {
    eligible:true,
    weight:+weight.toFixed(3),
    reason:'Fallback produced a bounded learning signal and remains distinct from the original practice.'
  };
}

export function reconcileFallbackPlans(state){
  const next=clone(state||{});
  const commitments=new Set((next.commitments||[]).map(item=>item.id));
  next.fallbackPlans=[...(next.fallbackPlans||[])].filter(item=>
    item?.id&&item?.commitmentId&&commitments.has(item.commitmentId)
  );

  const seen=new Set();
  next.fallbackPlans=next.fallbackPlans.filter(item=>{
    if(seen.has(item.id))return false;
    seen.add(item.id);return true;
  }).slice(0,200);

  if(next.current?.fallbackPlanId){
    const exists=next.fallbackPlans.some(item=>item.id===next.current.fallbackPlanId);
    if(!exists)delete next.current.fallbackPlanId;
  }
  return next;
}

export function fallbackSummary(plan){
  if(!plan)return 'No fallback exists.';
  if(plan.status===FALLBACK_STATUS.PROPOSED)return `Fallback proposed: ${plan.fallbackPracticeId}.`;
  if(plan.status===FALLBACK_STATUS.ACCEPTED)return `Fallback accepted: ${plan.fallbackPracticeId}.`;
  if(plan.status===FALLBACK_STATUS.STARTED)return `Fallback started: ${plan.fallbackPracticeId}.`;
  if(plan.status===FALLBACK_STATUS.COMPLETED)return `Fallback completed at ${Math.round((plan.completedRatio||0)*100)}%.`;
  if(plan.status===FALLBACK_STATUS.ABANDONED)return `Fallback ended early at ${Math.round((plan.completedRatio||0)*100)}%.`;
  return 'Fallback declined.';
}

function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
