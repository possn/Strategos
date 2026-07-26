export const FRICTION_TYPES=[
  'time',
  'environment',
  'energy',
  'emotion',
  'social',
  'uncertainty',
  'other'
];

export function createFrictionPlan({
  commitment,
  frictionType='other',
  description='',
  response='',
  fallback='',
  at=new Date().toISOString()
}={}){
  if(!commitment?.id)throw new Error('A commitment is required.');
  if(!FRICTION_TYPES.includes(frictionType))throw new Error('Unsupported friction type.');

  return {
    id:makeId('friction'),
    commitmentId:commitment.id,
    judgementId:commitment.judgementId,
    practiceId:commitment.practiceId,
    frictionType,
    description:String(description||'').trim(),
    response:String(response||'').trim(),
    fallback:String(fallback||'').trim(),
    createdAt:at,
    status:'active',
    encountered:false,
    encounteredAt:null,
    outcome:null
  };
}

export function markFrictionEncountered(plan,{
  outcome='managed',
  note='',
  at=new Date().toISOString()
}={}){
  if(!plan)throw new Error('A friction plan is required.');
  if(!['managed','partly-managed','blocked','not-relevant'].includes(outcome))
    throw new Error('Unsupported friction outcome.');

  return {
    ...plan,
    encountered:outcome!=='not-relevant',
    encounteredAt:outcome!=='not-relevant'?at:null,
    outcome,
    note:String(note||'').trim(),
    status:'closed'
  };
}

export function frictionReadiness(plan){
  if(!plan)return {
    ready:false,
    score:0,
    reason:'No friction plan exists.'
  };

  let score=0;
  if(plan.description)score+=.35;
  if(plan.response)score+=.4;
  if(plan.fallback)score+=.25;

  return {
    ready:score>=.6,
    score:+score.toFixed(2),
    reason:score>=.6
      ?'A concrete obstacle and response have been prepared.'
      :'The plan remains too vague to support follow-through.'
  };
}

export function suggestedResponse(frictionType){
  const suggestions={
    time:'Choose the smallest useful version and define a hard stop.',
    environment:'Prepare the space or materials before the start window opens.',
    energy:'Reduce intensity while preserving the intention of the practice.',
    emotion:'Name the feeling and use a two-minute entry step.',
    social:'Protect the time or tell the relevant person what you are doing.',
    uncertainty:'Define the first observable action only.',
    other:'Name the first obstacle and remove one source of resistance.'
  };
  return suggestions[frictionType]||suggestions.other;
}

export function canBeginWithFriction(commitment,plan){
  if(!commitment)return {canBegin:false,reason:'No commitment exists.'};
  if(!plan)return {canBegin:true,reason:'No explicit obstacle was identified.'};

  const readiness=frictionReadiness(plan);
  if(!readiness.ready)return {
    canBegin:false,
    reason:'The identified friction needs a concrete response or fallback.'
  };

  return {
    canBegin:true,
    reason:'The identified friction has a workable response.'
  };
}

export function reconcileFrictionPlans(state){
  const next=clone(state||{});
  const commitmentIds=new Set((next.commitments||[]).map(item=>item.id));

  next.frictionPlans=[...(next.frictionPlans||[])].filter(item=>
    item?.id&&item?.commitmentId&&commitmentIds.has(item.commitmentId)
  );

  const seen=new Set();
  next.frictionPlans=next.frictionPlans.filter(item=>{
    if(seen.has(item.id))return false;
    seen.add(item.id);
    return true;
  }).slice(0,200);

  if(next.current?.frictionPlanId){
    const exists=next.frictionPlans.some(item=>item.id===next.current.frictionPlanId);
    if(!exists)delete next.current.frictionPlanId;
  }

  return next;
}

export function frictionSummary(plan){
  if(!plan)return 'No friction has been prepared for.';
  if(plan.status==='closed'){
    if(plan.outcome==='managed')return 'The anticipated friction was managed.';
    if(plan.outcome==='partly-managed')return 'The friction was partly managed.';
    if(plan.outcome==='blocked')return 'The friction blocked the practice.';
    return 'The anticipated friction was not relevant.';
  }
  return `${plan.frictionType}: ${plan.description||'unnamed obstacle'}`;
}

function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
