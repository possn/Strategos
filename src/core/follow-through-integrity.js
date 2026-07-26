const TERMINAL_COMMITMENTS=new Set(['completed','cancelled','expired']);
const TERMINAL_FALLBACKS=new Set(['completed','abandoned','declined']);

export function reconcileFollowThroughState(state,now=Date.now()){
  const next=clone(state||{});
  const report={
    orphanFrictionRemoved:0,
    orphanFallbacksRemoved:0,
    duplicateFrictionRemoved:0,
    duplicateFallbacksRemoved:0,
    commitmentLinksRepaired:0,
    impossibleCurrentCleared:false,
    invalidFallbacksDeclined:0,
    staleActiveFrictionClosed:0
  };

  const commitmentsById=new Map((next.commitments||[]).map(item=>[item.id,item]));
  const seenFriction=new Set();
  next.frictionPlans=(next.frictionPlans||[]).filter(plan=>{
    if(!plan?.id||seenFriction.has(plan.id)){
      report.duplicateFrictionRemoved+=1;
      return false;
    }
    seenFriction.add(plan.id);
    if(!commitmentsById.has(plan.commitmentId)){
      report.orphanFrictionRemoved+=1;
      return false;
    }
    return true;
  });

  const frictionById=new Map(next.frictionPlans.map(item=>[item.id,item]));
  const seenFallbacks=new Set();
  next.fallbackPlans=(next.fallbackPlans||[]).filter(plan=>{
    if(!plan?.id||seenFallbacks.has(plan.id)){
      report.duplicateFallbacksRemoved+=1;
      return false;
    }
    seenFallbacks.add(plan.id);
    if(!commitmentsById.has(plan.commitmentId)){
      report.orphanFallbacksRemoved+=1;
      return false;
    }
    return true;
  });

  next.fallbackPlans=next.fallbackPlans.map(plan=>{
    const commitment=commitmentsById.get(plan.commitmentId);
    const invalid=
      !commitment||
      (plan.frictionPlanId&&!frictionById.has(plan.frictionPlanId))||
      !plan.originalPracticeId||
      !plan.fallbackPracticeId||
      plan.originalPracticeId===plan.fallbackPracticeId;

    if(!invalid)return plan;
    report.invalidFallbacksDeclined+=1;
    return {
      ...plan,
      status:'declined',
      declinedAt:new Date(now).toISOString(),
      integrity:'invalid-fallback-reconciled',
      correction:{
        at:new Date(now).toISOString(),
        note:'Fallback could not be reconciled to a valid commitment, friction plan, and distinct practice.'
      }
    };
  });

  const fallbackById=new Map(next.fallbackPlans.map(item=>[item.id,item]));

  next.commitments=(next.commitments||[]).map(commitment=>{
    const friction=next.frictionPlans.find(item=>item.commitmentId===commitment.id&&item.status==='active');
    const fallback=next.fallbackPlans.find(item=>item.commitmentId===commitment.id&&!TERMINAL_FALLBACKS.has(item.status));
    const changed=
      (friction&&commitment.frictionPlanId!==friction.id)||
      (fallback&&commitment.fallbackPlanId!==fallback.id);
    if(changed)report.commitmentLinksRepaired+=1;
    return {
      ...commitment,
      ...(friction?{frictionPlanId:friction.id}:{}),
      ...(fallback?{fallbackPlanId:fallback.id}:{})
    };
  });

  const refreshedCommitments=new Map(next.commitments.map(item=>[item.id,item]));
  next.frictionPlans=next.frictionPlans.map(plan=>{
    const commitment=refreshedCommitments.get(plan.commitmentId);
    if(plan.status==='active'&&commitment&&TERMINAL_COMMITMENTS.has(commitment.status)){
      report.staleActiveFrictionClosed+=1;
      return {
        ...plan,
        status:'closed',
        outcome:'not-relevant',
        note:'Commitment closed before friction outcome was recorded.'
      };
    }
    return plan;
  });

  if(next.current){
    const commitment=next.current.commitmentId
      ?refreshedCommitments.get(next.current.commitmentId)
      :null;
    const friction=next.current.frictionPlanId
      ?next.frictionPlans.find(item=>item.id===next.current.frictionPlanId)
      :null;
    const fallback=next.current.fallbackPlanId
      ?fallbackById.get(next.current.fallbackPlanId)
      :null;

    const impossible=
      (next.current.commitmentId&&!commitment)||
      (commitment&&TERMINAL_COMMITMENTS.has(commitment.status)&&!next.current.execution)||
      (next.current.frictionPlanId&&!friction)||
      (next.current.fallbackPlanId&&!fallback);

    if(impossible){
      next.current=null;
      report.impossibleCurrentCleared=true;
    }
  }

  next.followThroughIntegrity={
    lastReconciledAt:new Date(now).toISOString(),
    lastReport:report
  };

  return {state:next,report};
}

export function followThroughSnapshot(state){
  const commitments=state.commitments||[];
  const friction=state.frictionPlans||[];
  const fallbacks=state.fallbackPlans||[];

  const activeCommitments=commitments.filter(item=>item.status==='active').length;
  const startedCommitments=commitments.filter(item=>item.status==='started').length;
  const closedCommitments=commitments.filter(item=>TERMINAL_COMMITMENTS.has(item.status)).length;
  const managedFriction=friction.filter(item=>item.outcome==='managed'||item.outcome==='partly-managed').length;
  const blockedFriction=friction.filter(item=>item.outcome==='blocked').length;
  const completedFallbacks=fallbacks.filter(item=>item.status==='completed').length;
  const invalidFallbacks=fallbacks.filter(item=>item.integrity==='invalid-fallback-reconciled').length;

  return {
    activeCommitments,
    startedCommitments,
    closedCommitments,
    managedFriction,
    blockedFriction,
    completedFallbacks,
    invalidFallbacks,
    status:invalidFallbacks||blockedFriction?'review-required':'coherent'
  };
}

export function canLearnFromFollowThrough({
  outcomeRecord,
  frictionPlan=null,
  fallbackPlan=null
}={}){
  if(!outcomeRecord)return {eligible:false,weight:0,reason:'No outcome record exists.'};
  if(outcomeRecord.stage!=='reflected')return {eligible:false,weight:0,reason:'Outcome has not been reflected.'};

  if(fallbackPlan){
    if(fallbackPlan.status!=='completed')return {eligible:false,weight:0,reason:'Fallback was not completed.'};
    if(Number(fallbackPlan.completedRatio||0)<.5)return {eligible:false,weight:0,reason:'Less than half of the fallback was completed.'};
    return {
      eligible:true,
      weight:+Math.min(.6,Math.max(.2,Number(fallbackPlan.reductionRatio||.5)*Number(fallbackPlan.completedRatio||0))).toFixed(3),
      reason:'Completed fallback produced a bounded learning signal.'
    };
  }

  if(outcomeRecord.startedPracticeId!==outcomeRecord.chosenPracticeId)
    return {eligible:false,weight:0,reason:'Executed practice differed from the recorded choice.'};
  if(Number(outcomeRecord.completionRatio||0)<.5)
    return {eligible:false,weight:0,reason:'Less than half of the chosen practice was completed.'};
  if(frictionPlan?.outcome==='blocked')
    return {eligible:false,weight:0,reason:'Recorded friction blocked the practice.'};

  return {
    eligible:true,
    weight:Number(outcomeRecord.completionRatio||0)>=.95?1:.65,
    reason:'Choice, execution, friction outcome and reflection are coherent.'
  };
}

export function followThroughSummary(state){
  const snapshot=followThroughSnapshot(state);
  return `${snapshot.activeCommitments} active commitments, ${snapshot.managedFriction} managed frictions, ${snapshot.completedFallbacks} completed fallbacks, ${snapshot.invalidFallbacks} invalid fallbacks.`;
}

function clone(value){
  return typeof structuredClone==='function'
    ?structuredClone(value)
    :JSON.parse(JSON.stringify(value));
}
