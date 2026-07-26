export function verifyJudgementLongitudinalSources(judgement,state){
  if(!judgement?.longitudinalEvidence?.items?.length){
    return {status:'not-applicable',valid:true,reasons:[],sourceCount:0};
  }

  const patterns=new Map((state?.outcomePatterns||[]).map(item=>[item.id,item]));
  const transfers=state?.patternTransfers||[];
  const reasons=[];

  for(const item of judgement.longitudinalEvidence.items){
    const pattern=patterns.get(item.patternId);
    if(!pattern){
      reasons.push(`Pattern ${item.patternId} no longer exists.`);
      continue;
    }

    if(pattern.status==='rejected'){
      reasons.push(`Pattern ${item.patternId} was rejected.`);
    }

    const transfer=transfers.find(record=>
      record.patternId===item.patternId&&
      record.targetContextKey===item.targetContextKey
    );

    if(!transfer){
      reasons.push(`Transfer for pattern ${item.patternId} no longer exists.`);
      continue;
    }

    if(transfer.status==='rejected'){
      reasons.push(`Transfer for pattern ${item.patternId} was rejected.`);
    }

    if(Math.abs(Number(item.adjustment||0))>.14){
      reasons.push(`Pattern ${item.patternId} exceeds the longitudinal influence boundary.`);
    }

    if(pattern.practiceId!==item.practiceId){
      reasons.push(`Pattern ${item.patternId} no longer matches practice ${item.practiceId}.`);
    }
  }

  return {
    status:reasons.length?'review-required':'valid',
    valid:reasons.length===0,
    reasons,
    sourceCount:judgement.longitudinalEvidence.items.length
  };
}

export function reconcileJudgementLongitudinalIntegrity(state){
  const next=clone(state||{});
  const report={
    checked:0,
    valid:0,
    reviewRequired:0,
    currentRefreshed:false
  };

  next.judgements=(next.judgements||[]).map(judgement=>{
    const verification=verifyJudgementLongitudinalSources(judgement,next);
    if(verification.status==='not-applicable')return judgement;

    report.checked+=1;

    if(verification.valid){
      report.valid+=1;
      return {
        ...judgement,
        longitudinalIntegrity:{
          status:'valid',
          checkedAt:new Date().toISOString(),
          reasons:[]
        }
      };
    }

    report.reviewRequired+=1;
    return {
      ...judgement,
      status:isClosed(judgement)?judgement.status:'review-required',
      longitudinalIntegrity:{
        status:'review-required',
        checkedAt:new Date().toISOString(),
        reasons:verification.reasons
      }
    };
  });

  if(next.current?.decision?.id){
    const canonical=next.judgements.find(item=>item.id===next.current.decision.id);
    if(canonical){
      next.current={...next.current,decision:{...canonical}};
      report.currentRefreshed=true;
    }
  }

  next.longitudinalAccountability={
    lastReconciledAt:new Date().toISOString(),
    lastReport:report
  };

  return {state:next,report};
}

export function buildLongitudinalAuditEntry(judgement){
  if(!judgement?.longitudinalEvidence?.items?.length)return null;

  return {
    judgementId:judgement.id,
    createdAt:judgement.createdAt,
    status:judgement.longitudinalIntegrity?.status||'unchecked',
    sourceCount:judgement.longitudinalEvidence.items.length,
    sources:judgement.longitudinalEvidence.items.map(item=>({
      patternId:item.patternId,
      practiceId:item.practiceId,
      direction:item.direction,
      adjustment:item.adjustment,
      sourceContextKey:item.sourceContextKey,
      targetContextKey:item.targetContextKey,
      transferStatus:item.transferStatus
    })),
    reasons:[...(judgement.longitudinalIntegrity?.reasons||[])]
  };
}

export function longitudinalAccountabilitySummary(state){
  const judgements=(state?.judgements||[]).filter(item=>item.longitudinalEvidence?.items?.length);
  const valid=judgements.filter(item=>item.longitudinalIntegrity?.status==='valid').length;
  const reviewRequired=judgements.filter(item=>item.longitudinalIntegrity?.status==='review-required').length;

  return {
    total:judgements.length,
    valid,
    reviewRequired,
    statement:`${valid} longitudinal judgements valid · ${reviewRequired} require review.`
  };
}

function isClosed(judgement){
  return ['reviewed','declined','completed','closed','superseded'].includes(judgement?.status)||
    judgement?.validity?.status==='closed';
}

function clone(value){
  return typeof structuredClone==='function'
    ?structuredClone(value)
    :JSON.parse(JSON.stringify(value));
}
