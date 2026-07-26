const DAY=86400000;

export const JUDGEMENT_VALIDITY={
  CURRENT:'current',
  REVIEW_REQUIRED:'review-required',
  EXPIRED:'expired',
  SUPERSEDED:'superseded',
  CLOSED:'closed'
};

export function contextFingerprint(context={}){
  return {
    sleep:Number(context.sleep||0),
    energy:Number(context.energy||0),
    time:Number(context.time||0),
    challenge:context.challenge||'unknown',
    soreness:context.soreness||'unknown',
    emotionalLoad:context.emotionalLoad||'unknown'
  };
}

export function compareDecisionContexts(previous={},next={}){
  const a=contextFingerprint(previous),b=contextFingerprint(next);
  const changes=[];
  let distance=0;
  const numerical=[['sleep',3],['energy',2],['time',55]];
  for(const [field,range] of numerical){
    const delta=Math.abs(a[field]-b[field]);
    if(delta>0)changes.push({field,from:a[field],to:b[field],material:field!=='time'&&delta>=2});
    distance+=Math.min(1,delta/range)*.18;
  }
  for(const field of ['challenge','soreness','emotionalLoad']){
    if(a[field]!==b[field]){
      const material=field==='challenge'||b.soreness==='significant'||b.emotionalLoad==='heavy';
      changes.push({field,from:a[field],to:b[field],material});
      distance+=field==='challenge'?.22:.18;
    }
  }
  const similarity=Math.max(0,Math.min(1,1-distance));
  return {
    similarity:+similarity.toFixed(3),
    changes,
    materialChange:changes.some(change=>change.material),
    criticalChange:b.soreness==='significant'&&a.soreness!=='significant'
  };
}

export function createJudgementValidity(context,createdAt=new Date().toISOString(),hours=24){
  const start=new Date(createdAt).getTime();
  return {
    status:JUDGEMENT_VALIDITY.CURRENT,
    createdAt,
    validUntil:new Date(start+hours*3600000).toISOString(),
    contextFingerprint:contextFingerprint(context),
    reviewTriggers:[
      'A material change in soreness, emotional load, energy or priority.',
      'A correction to information used in this judgement.',
      'New professional input or a new safety concern.',
      'The validity period expires.'
    ],
    reviewReason:null,
    supersededBy:null
  };
}

export function assessJudgementValidity(judgement,currentContext,now=Date.now()){
  const validity=judgement?.validity||createJudgementValidity(judgement?.context||currentContext,judgement?.createdAt);
  if(validity.status===JUDGEMENT_VALIDITY.SUPERSEDED||validity.status===JUDGEMENT_VALIDITY.CLOSED)return validity;
  if(new Date(validity.validUntil).getTime()<=now){
    return {...validity,status:JUDGEMENT_VALIDITY.EXPIRED,reviewReason:'The judgement validity period has expired.'};
  }
  const comparison=compareDecisionContexts(validity.contextFingerprint,currentContext);
  if(comparison.materialChange){
    return {
      ...validity,
      status:JUDGEMENT_VALIDITY.REVIEW_REQUIRED,
      reviewReason:'Material context changed after this judgement was formed.',
      contextComparison:comparison
    };
  }
  return {...validity,status:JUDGEMENT_VALIDITY.CURRENT,reviewReason:null,contextComparison:comparison};
}

export function markJudgementsForReview(judgements=[],reason,at=new Date().toISOString()){
  return judgements.map(judgement=>{
    if(['superseded','closed'].includes(judgement.validity?.status))return judgement;
    if(['abandoned','reviewed'].includes(judgement.status))return judgement;
    return {
      ...judgement,
      validity:{
        ...(judgement.validity||createJudgementValidity(judgement.context||{},judgement.createdAt)),
        status:JUDGEMENT_VALIDITY.REVIEW_REQUIRED,
        reviewReason:reason,
        reviewMarkedAt:at
      }
    };
  });
}

export function supersedeJudgement(previous,nextId,at=new Date().toISOString()){
  if(!previous)return previous;
  return {
    ...previous,
    validity:{
      ...(previous.validity||createJudgementValidity(previous.context||{},previous.createdAt)),
      status:JUDGEMENT_VALIDITY.SUPERSEDED,
      supersededBy:nextId,
      supersededAt:at
    }
  };
}

export function assessCandidateStability(previous,candidate,previousContext,nextContext){
  if(!previous||!candidate)return {action:'use-candidate',reason:'No comparable prior judgement.'};
  if(previous.practice?.id===candidate.practice?.id)return {action:'use-candidate',reason:'The preferred direction is stable.'};
  const comparison=compareDecisionContexts(previousContext,nextContext);
  if(comparison.materialChange||comparison.criticalChange){
    return {action:'use-candidate',reason:'A material context change justifies a different judgement.',comparison};
  }
  const confidenceDifference=Math.abs(Number(candidate.confidence||0)-Number(previous.confidence||0));
  if(comparison.similarity>=.82&&confidenceDifference<=7){
    return {
      action:'retain-previous',
      reason:'The context changed only slightly and the alternative did not gain enough confidence to justify judgement churn.',
      comparison
    };
  }
  return {action:'use-candidate',reason:'The new evidence is sufficiently different to justify reconsideration.',comparison};
}

export function attachValidity(judgement,context){
  return {
    ...judgement,
    context:contextFingerprint(context),
    validity:judgement.validity||createJudgementValidity(context,judgement.createdAt)
  };
}
