export const COMMITMENT_STATUS={
  ACTIVE:'active',
  STARTED:'started',
  COMPLETED:'completed',
  CANCELLED:'cancelled',
  EXPIRED:'expired'
};

export function createCommitment({
  judgement,
  choice,
  startMode='now',
  startAfterMinutes=0,
  reason='',
  at=new Date().toISOString()
}={}){
  if(!judgement?.id)throw new Error('A judgement is required.');
  if(!choice?.id)throw new Error('An active person choice is required.');
  if(!['accept','choose-alternative'].includes(choice.action))
    throw new Error('Only an active choice can create a commitment.');
  if(!['now','later'].includes(startMode))
    throw new Error('Unsupported commitment start mode.');

  const createdAt=new Date(at);
  const delay=startMode==='later'
    ?Math.max(1,Math.min(1440,Number(startAfterMinutes)||30))
    :0;
  const notBeforeAt=new Date(createdAt.getTime()+delay*60000);
  const expiresAt=new Date(notBeforeAt.getTime()+(startMode==='later'?180:30)*60000);

  return {
    id:makeId('commitment'),
    judgementId:judgement.id,
    choiceId:choice.id,
    practiceId:choice.selectedPracticeId||judgement.practice?.id||null,
    startMode,
    startAfterMinutes:delay,
    reason:String(reason||'').trim(),
    createdAt:createdAt.toISOString(),
    notBeforeAt:notBeforeAt.toISOString(),
    expiresAt:expiresAt.toISOString(),
    status:COMMITMENT_STATUS.ACTIVE,
    startedAt:null,
    completedAt:null,
    cancelledAt:null,
    cancelReason:null,
    consentVersion:1
  };
}

export function commitmentAvailability(commitment,now=Date.now()){
  if(!commitment)return {canStart:false,status:'missing',reason:'No commitment exists.'};
  if(commitment.status!==COMMITMENT_STATUS.ACTIVE)
    return {canStart:false,status:commitment.status,reason:`Commitment is ${commitment.status}.`};

  const current=Number(now);
  const notBefore=new Date(commitment.notBeforeAt).getTime();
  const expires=new Date(commitment.expiresAt).getTime();

  if(current<notBefore)return {
    canStart:false,
    status:'scheduled',
    waitMs:notBefore-current,
    reason:'The chosen start window has not opened yet.'
  };

  if(current>expires)return {
    canStart:false,
    status:COMMITMENT_STATUS.EXPIRED,
    reason:'The commitment window expired and requires fresh consent.'
  };

  return {
    canStart:true,
    status:COMMITMENT_STATUS.ACTIVE,
    remainingMs:expires-current,
    reason:'Commitment is active and may begin.'
  };
}

export function refreshExpiredCommitments(commitments=[],now=Date.now()){
  return (commitments||[]).map(item=>{
    const availability=commitmentAvailability(item,now);
    if(availability.status!==COMMITMENT_STATUS.EXPIRED)return item;
    return {
      ...item,
      status:COMMITMENT_STATUS.EXPIRED,
      expiredAt:new Date(now).toISOString()
    };
  });
}

export function markCommitmentStarted(commitment,at=new Date().toISOString()){
  const availability=commitmentAvailability(commitment,new Date(at).getTime());
  if(!availability.canStart)throw new Error(availability.reason);
  return {
    ...commitment,
    status:COMMITMENT_STATUS.STARTED,
    startedAt:at
  };
}

export function markCommitmentCompleted(commitment,at=new Date().toISOString()){
  if(!commitment?.startedAt)throw new Error('Commitment must be started before completion.');
  return {
    ...commitment,
    status:COMMITMENT_STATUS.COMPLETED,
    completedAt:at
  };
}

export function cancelCommitment(commitment,{
  reason='person-cancelled',
  at=new Date().toISOString()
}={}){
  if(!commitment)throw new Error('A commitment is required.');
  if([COMMITMENT_STATUS.COMPLETED,COMMITMENT_STATUS.CANCELLED].includes(commitment.status))
    return commitment;
  return {
    ...commitment,
    status:COMMITMENT_STATUS.CANCELLED,
    cancelledAt:at,
    cancelReason:reason
  };
}

export function reconcileCommitments(state,now=Date.now()){
  const next=clone(state||{});
  next.commitments=refreshExpiredCommitments(next.commitments||[],now)
    .filter(item=>item?.id&&item?.judgementId&&item?.choiceId);

  const seen=new Set();
  next.commitments=next.commitments.filter(item=>{
    if(seen.has(item.id))return false;
    seen.add(item.id);
    return true;
  }).slice(0,200);

  if(next.current?.commitmentId){
    const current=next.commitments.find(item=>item.id===next.current.commitmentId);
    if(!current||[COMMITMENT_STATUS.CANCELLED,COMMITMENT_STATUS.EXPIRED,COMMITMENT_STATUS.COMPLETED].includes(current.status)){
      delete next.current.commitmentId;
    }
  }

  return next;
}

export function commitmentSummary(commitment,now=Date.now()){
  if(!commitment)return 'No commitment has been created.';
  const availability=commitmentAvailability(commitment,now);
  if(commitment.status===COMMITMENT_STATUS.CANCELLED)return 'Commitment cancelled without penalty.';
  if(commitment.status===COMMITMENT_STATUS.COMPLETED)return 'Commitment completed.';
  if(commitment.status===COMMITMENT_STATUS.STARTED)return 'Commitment started.';
  if(availability.status==='scheduled')return `Scheduled to open in ${Math.ceil(availability.waitMs/60000)} minutes.`;
  if(availability.status===COMMITMENT_STATUS.EXPIRED)return 'Commitment expired and requires fresh consent.';
  return `Active for approximately ${Math.ceil(availability.remainingMs/60000)} more minutes.`;
}

function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
