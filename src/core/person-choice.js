export const CHOICE_ACTIONS={
  ACCEPT:'accept',
  CHOOSE_ALTERNATIVE:'choose-alternative',
  DEFER:'defer',
  DECLINE:'decline'
};

export function createChoiceRecord({judgement,action,selectedPracticeId=null,reason='',at=new Date().toISOString()}={}){
  if(!judgement?.id)throw new Error('A judgement is required.');
  if(!Object.values(CHOICE_ACTIONS).includes(action))throw new Error('Unsupported choice action.');

  const available=new Set([
    judgement.practice?.id,
    judgement.boundaries?.runnerUp?.id,
    ...(judgement.alternatives||[]).map(item=>typeof item==='string'?slug(item):item?.id)
  ].filter(Boolean));

  if(action===CHOICE_ACTIONS.CHOOSE_ALTERNATIVE&&!selectedPracticeId)
    throw new Error('An alternative practice is required.');
  if(action===CHOICE_ACTIONS.CHOOSE_ALTERNATIVE&&!available.has(selectedPracticeId))
    throw new Error('Selected practice is not part of this judgement.');

  return {
    id:makeId('choice'),
    judgementId:judgement.id,
    action,
    recommendedPracticeId:judgement.practice?.id||null,
    selectedPracticeId:action===CHOICE_ACTIONS.ACCEPT?judgement.practice?.id||null:selectedPracticeId,
    reason:String(reason||'').trim(),
    at,
    source:'person',
    status:'recorded'
  };
}

export function applyChoiceToJudgement(judgement,choice){
  if(!judgement||judgement.id!==choice.judgementId)throw new Error('Choice does not belong to this judgement.');
  const next={...judgement,personChoice:choice};

  if(choice.action===CHOICE_ACTIONS.ACCEPT){
    next.status='accepted';
    next.validity={...(next.validity||{}),status:'current'};
  }
  if(choice.action===CHOICE_ACTIONS.CHOOSE_ALTERNATIVE){
    next.status='overridden';
    next.override={
      selectedPracticeId:choice.selectedPracticeId,
      recommendedPracticeId:choice.recommendedPracticeId,
      reason:choice.reason,
      at:choice.at
    };
    next.validity={...(next.validity||{}),status:'superseded-by-person-choice'};
  }
  if(choice.action===CHOICE_ACTIONS.DEFER){
    next.status='deferred';
    next.validity={...(next.validity||{}),status:'review-required',reviewReason:'The person chose to defer this judgement.',reviewMarkedAt:choice.at};
  }
  if(choice.action===CHOICE_ACTIONS.DECLINE){
    next.status='declined';
    next.validity={...(next.validity||{}),status:'closed',closedAt:choice.at,reviewReason:'The person declined this judgement.'};
  }
  return next;
}

export function choiceImpactOnLearning(choice){
  if(!choice)return {shouldLearn:false,weight:0,reason:'No choice was recorded.'};
  if(choice.action===CHOICE_ACTIONS.ACCEPT)return {shouldLearn:true,weight:.35,reason:'Acceptance alone is weak evidence.'};
  if(choice.action===CHOICE_ACTIONS.CHOOSE_ALTERNATIVE)return {shouldLearn:true,weight:.65,reason:'Choosing another practice is meaningful but bounded preference evidence.'};
  if(choice.action===CHOICE_ACTIONS.DEFER)return {shouldLearn:false,weight:0,reason:'Deferral implies neither agreement nor disagreement.'};
  return {shouldLearn:false,weight:0,reason:'Declining closes the judgement without inferring preference.'};
}

export function summarizeChoice(choice){
  if(!choice)return 'No person choice has been recorded.';
  if(choice.action===CHOICE_ACTIONS.ACCEPT)return `The person accepted ${choice.selectedPracticeId}.`;
  if(choice.action===CHOICE_ACTIONS.CHOOSE_ALTERNATIVE)return `The person chose ${choice.selectedPracticeId} instead of ${choice.recommendedPracticeId}.`;
  if(choice.action===CHOICE_ACTIONS.DEFER)return 'The person deferred the judgement.';
  return 'The person declined the judgement.';
}

export function reconcileChoiceLog(state){
  const next=clone(state||{});
  next.choiceLog=[...(next.choiceLog||[])].filter(item=>item?.id&&item?.judgementId&&item?.action);
  const seen=new Set();
  next.choiceLog=next.choiceLog.filter(item=>{
    if(seen.has(item.id))return false;
    seen.add(item.id);return true;
  }).slice(0,200);
  return next;
}

function slug(value=''){return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
