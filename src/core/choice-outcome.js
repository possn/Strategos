export const OUTCOME_STAGES={
  CHOSEN:'chosen',
  STARTED:'started',
  COMPLETED:'completed',
  ABANDONED:'abandoned',
  REFLECTED:'reflected'
};

export function createOutcomeRecord({judgement,choice,at=new Date().toISOString()}={}){
  if(!judgement?.id)throw new Error('A judgement is required.');
  if(!choice?.id)throw new Error('A person choice is required.');
  return {
    id:makeId('outcome'),
    judgementId:judgement.id,
    choiceId:choice.id,
    recommendedPracticeId:choice.recommendedPracticeId||judgement.practice?.id||null,
    chosenPracticeId:choice.selectedPracticeId||null,
    startedPracticeId:null,
    completedPracticeId:null,
    stage:OUTCOME_STAGES.CHOSEN,
    chosenAt:choice.at||at,
    startedAt:null,
    completedAt:null,
    abandonedAt:null,
    reflectedAt:null,
    completionRatio:0,
    closureReason:null,
    reflection:null,
    integrity:'choice-recorded'
  };
}

export function markOutcomeStarted(record,practiceId,at=new Date().toISOString()){
  if(!record)throw new Error('An outcome record is required.');
  if(!practiceId)throw new Error('A started practice is required.');
  return {
    ...record,
    startedPracticeId:practiceId,
    stage:OUTCOME_STAGES.STARTED,
    startedAt:at,
    integrity:practiceId===record.chosenPracticeId?'choice-matched':'choice-execution-mismatch'
  };
}

export function markOutcomeCompleted(record,{
  practiceId,
  completedPhases=0,
  totalPhases=0,
  at=new Date().toISOString()
}={}){
  if(!record?.startedAt)throw new Error('Outcome must be started before completion.');
  const ratio=totalPhases>0?Math.max(0,Math.min(1,completedPhases/totalPhases)):1;
  return {
    ...record,
    completedPracticeId:practiceId||record.startedPracticeId,
    stage:OUTCOME_STAGES.COMPLETED,
    completedAt:at,
    completionRatio:+ratio.toFixed(3),
    integrity:(practiceId||record.startedPracticeId)===record.chosenPracticeId
      ?'choice-execution-completed'
      :'completed-different-practice'
  };
}

export function markOutcomeAbandoned(record,{
  reason='person-ended',
  completedPhases=0,
  totalPhases=0,
  at=new Date().toISOString()
}={}){
  if(!record)throw new Error('An outcome record is required.');
  const ratio=totalPhases>0?Math.max(0,Math.min(1,completedPhases/totalPhases)):0;
  return {
    ...record,
    stage:OUTCOME_STAGES.ABANDONED,
    abandonedAt:at,
    completionRatio:+ratio.toFixed(3),
    closureReason:reason,
    integrity:'execution-abandoned'
  };
}

export function attachOutcomeReflection(record,reflection,at=new Date().toISOString()){
  if(!record)throw new Error('An outcome record is required.');
  if(!['better','right','worse'].includes(reflection))
    throw new Error('Unsupported reflection.');
  if(![OUTCOME_STAGES.COMPLETED,OUTCOME_STAGES.ABANDONED].includes(record.stage))
    throw new Error('Reflection requires a completed or abandoned execution.');
  return {
    ...record,
    stage:OUTCOME_STAGES.REFLECTED,
    reflectedAt:at,
    reflection,
    integrity:record.stage===OUTCOME_STAGES.COMPLETED
      ?'completed-and-reflected'
      :'abandoned-and-reflected'
  };
}

export function learningEligibility(record){
  if(!record)return {eligible:false,reason:'No outcome record exists.'};
  if(record.stage!==OUTCOME_STAGES.REFLECTED)
    return {eligible:false,reason:'Execution has not produced a reflection.'};
  if(!record.startedAt)
    return {eligible:false,reason:'The selected practice was never started.'};
  if(record.completionRatio<.5)
    return {eligible:false,reason:'Less than half of the practice was completed.'};
  if(record.startedPracticeId!==record.chosenPracticeId)
    return {eligible:false,reason:'The executed practice did not match the recorded choice.'};
  return {
    eligible:true,
    weight:record.completionRatio>=.95?1:.65,
    reason:record.completionRatio>=.95
      ?'Choice, execution and reflection are aligned.'
      :'Partial but material execution produced a bounded learning signal.'
  };
}

export function reconcileOutcomeRecords(state){
  const next=clone(state||{});
  next.outcomeRecords=[...(next.outcomeRecords||[])].filter(item=>item?.id&&item?.judgementId&&item?.choiceId);
  const seen=new Set();
  next.outcomeRecords=next.outcomeRecords.filter(item=>{
    if(seen.has(item.id))return false;
    seen.add(item.id);return true;
  }).slice(0,200);
  return next;
}

export function outcomeSummary(record){
  if(!record)return 'No choice-to-outcome record exists.';
  const chosen=record.chosenPracticeId||'no practice';
  if(record.stage===OUTCOME_STAGES.CHOSEN)return `${chosen} was chosen but not started.`;
  if(record.stage===OUTCOME_STAGES.STARTED)return `${record.startedPracticeId} was started.`;
  if(record.stage===OUTCOME_STAGES.COMPLETED)return `${record.completedPracticeId} was completed (${Math.round(record.completionRatio*100)}%).`;
  if(record.stage===OUTCOME_STAGES.ABANDONED)return `${record.startedPracticeId||chosen} was ended early (${Math.round(record.completionRatio*100)}%).`;
  return `${record.completedPracticeId||record.startedPracticeId||chosen} was reflected as ${record.reflection}.`;
}

function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
