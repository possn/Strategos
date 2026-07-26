export function buildExplanation(decision, context = {}) {
  const observations = [
    `You reported ${sleepLabel(context.sleep)} sleep.`,
    `Your energy is ${energyLabel(context.energy)}.`,
    `You have about ${Number(context.time || decision.duration)} minutes available.`,
    `Today, ${claimLabel(context.challenge)} has the strongest claim on your attention.`
  ];
  if (context.soreness) observations.push(`You described physical soreness as ${context.soreness}.`);
  if (context.emotionalLoad) observations.push(`You described today’s emotional load as ${context.emotionalLoad}.`);

  const ranked = [...decision.advisors]
    .sort((a, b) => (b.scores[decision.practice.id] || 0) - (a.scores[decision.practice.id] || 0));
  const strongest = ranked[0];
  const counterweight = ranked.find(a => a.position === 'Caution' || a.position === 'Oppose');

  const inferences = [decision.understanding.summary];
  if (strongest) inferences.push(`${strongest.advisor} carried the greatest weight because ${lowerFirst(strongest.reason)}`);
  if (counterweight && counterweight !== strongest) inferences.push(`${counterweight.advisor} limited the strength of the judgement because ${lowerFirst(counterweight.reason)}`);

  const changeConditions = [];
  if (!context.soreness) changeConditions.push('Significant pain or soreness would make me reassess the physical cost.');
  if (!context.emotionalLoad) changeConditions.push('Unusual emotional exhaustion could shift the judgement toward recovery or connection.');
  changeConditions.push('A meaningful change in available time would alter the feasible practice.');

  return {
    observations,
    inferences,
    decisiveFactors: ranked.slice(0, 3).map(a => ({ advisor: a.advisor, reason: a.reason })),
    unknowns: decision.unknowns,
    changeConditions,
    confidenceStatement: confidenceText(decision.confidence)
  };
}

function sleepLabel(value) { return ({1:'poor',2:'fair',3:'good',4:'excellent'})[value] || 'unreported'; }
function energyLabel(value) { return ({1:'low',2:'moderate',3:'high'})[value] || 'unreported'; }
function claimLabel(value) { return ({body:'your body',mind:'mental clarity',focus:'focused work',recovery:'recovery',family:'your relationships',work:'meaningful work'})[value] || 'your current priorities'; }
function lowerFirst(text='') { return text ? text[0].toLowerCase() + text.slice(1) : ''; }
function confidenceText(value) {
  if (value >= 85) return 'I have relatively strong confidence, while remaining open to correction.';
  if (value >= 70) return 'I have moderate confidence. A missing signal could still change this judgement.';
  return 'My confidence is limited. Treat this as a cautious working hypothesis.';
}


export const EXPLAIN_ENGINE_VERSION=1;

export function buildExplainRecord(decision,{context={},at=new Date().toISOString()}={}){
  const explanation=decision?.explain||buildExplanation(decision,context);
  const boundaries=decision?.boundaries||{};
  const observations=(explanation.observations||[]).map((statement,index)=>({
    id:`explain-observation-${index+1}`,
    type:'observation',
    statement,
    source:'person-reported-context',
    certainty:'reported'
  }));
  const inferences=(explanation.inferences||[]).map((statement,index)=>({
    id:`explain-inference-${index+1}`,
    type:'inference',
    statement,
    source:'Strategos-reasoning',
    certainty:'inferred'
  }));
  const unknowns=(explanation.unknowns||decision?.unknowns||[]).map((statement,index)=>({
    id:`explain-unknown-${index+1}`,
    type:'unknown',
    statement,
    source:'epistemic-boundary',
    certainty:'unknown'
  }));
  const decisiveFactors=(explanation.decisiveFactors||[]).map((item,index)=>({
    id:`explain-factor-${index+1}`,
    type:'decisive-factor',
    advisor:item.advisor,
    statement:item.reason,
    source:'Agora',
    certainty:'weighted'
  }));
  const alternatives=(boundaries.runnerUp?[{
    id:'explain-alternative-runner-up',
    type:'alternative',
    practiceId:boundaries.runnerUp.id,
    practiceName:boundaries.runnerUp.name,
    statement:`${boundaries.runnerUp.name} was the nearest alternative.`,
    source:'Agora-ranking',
    certainty:'ranked'
  }]:[]);
  const changeConditions=(boundaries.changeConditions||explanation.changeConditions||[]).map((statement,index)=>({
    id:`explain-change-condition-${index+1}`,
    type:'change-condition',
    statement,
    source:'decision-boundary',
    certainty:'conditional'
  }));

  return {
    version:EXPLAIN_ENGINE_VERSION,
    judgementId:decision?.id||null,
    createdAt:at,
    recommendation:{
      practiceId:decision?.practice?.id||null,
      practiceName:decision?.practice?.name||null,
      judgement:decision?.judgement||null,
      confidence:Number(decision?.confidence)||0,
      confidenceStatement:explanation.confidenceStatement||''
    },
    observations,
    inferences,
    decisiveFactors,
    unknowns,
    alternatives,
    changeConditions,
    provenance:{
      contextSnapshot:{...context},
      humanModelSnapshotAt:decision?.humanModelSnapshot?.createdAt||null,
      safetyEnvelopeAt:decision?.safetyEnvelope?.createdAt||null,
      source:'current-judgement',
      behaviourInfluence:0
    },
    statement:'This record separates what Strategos observed, inferred, did not know, considered and expected could change the judgement.'
  };
}

export function explainRecordAudit(record){
  if(!record)return {
    status:'missing',
    observations:0,
    inferences:0,
    unknowns:0,
    alternatives:0,
    changeConditions:0,
    statement:'No canonical explanation record is available.'
  };
  return {
    status:'preserved',
    observations:record.observations?.length||0,
    inferences:record.inferences?.length||0,
    unknowns:record.unknowns?.length||0,
    alternatives:record.alternatives?.length||0,
    changeConditions:record.changeConditions?.length||0,
    statement:'The explanation record is preserved with explicit epistemic classes.'
  };
}

export function explainRecordSummary(record){
  const audit=explainRecordAudit(record);
  return `${audit.observations} observed · ${audit.inferences} inferred · ${audit.unknowns} unknown · ${audit.alternatives} alternative`;
}

export function validateExplainRecord(record){
  const errors=[];
  if(!record||typeof record!=='object')errors.push('record-missing');
  if(record&&record.version!==EXPLAIN_ENGINE_VERSION)errors.push('version-invalid');
  if(record&&!record.judgementId)errors.push('judgement-id-missing');
  for(const key of ['observations','inferences','decisiveFactors','unknowns','alternatives','changeConditions']){
    if(record&&!Array.isArray(record[key]))errors.push(`${key}-invalid`);
  }
  if(record?.provenance?.behaviourInfluence!==0)errors.push('behaviour-influence-invalid');
  return {valid:errors.length===0,errors};
}


export function applyExplainRecordReview(record,{action,note='',at=new Date().toISOString()}={}){
  if(!record||!['confirm','reject','reopen'].includes(action))return record||null;
  if(action==='reopen'){const next={...record};delete next.review;return next}
  return {...record,review:{
    status:action==='confirm'?'confirmed':'rejected',
    note:String(note||'').trim(),
    reviewedAt:at,
    source:'person',
    judgementInfluence:0,
    rankingInfluence:0,
    confidenceInfluence:0,
    safetyInfluence:0,
    statement:action==='confirm'
      ?'The person confirmed that this explanation represents the judgement fairly.'
      :'The person marked this explanation as misleading or incomplete.'
  }};
}
export function explainRecordReviewAudit(record){
  const review=record?.review||null;
  return {
    status:review?.status||'unreviewed',
    note:review?.note||'',
    reviewedAt:review?.reviewedAt||null,
    judgementInfluence:0,rankingInfluence:0,confidenceInfluence:0,safetyInfluence:0,
    statement:review?.statement||'The explanation has not yet been reviewed by the person.'
  };
}
export function explainRecordReviewSummary(record){
  const status=record?.review?.status||'unreviewed';
  return status==='confirmed'?'Confirmed by the person as a fair explanation.'
    :status==='rejected'?'Marked by the person as misleading or incomplete.'
    :'Awaiting person review.';
}
