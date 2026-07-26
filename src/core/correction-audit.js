const ACTIVE_STATUSES=new Set(['proposed','in-practice','completed']);
const TERMINAL_VALIDITY=new Set(['closed','superseded']);

export function createCorrectionEvent({type,sourceId=null,field=null,previousValue=null,newValue=null,note='',at=new Date().toISOString()}={}){
  if(!type)throw new Error('Correction event type is required.');
  return {id:makeId('correction'),type,sourceId,field,previousValue,newValue,note,at,status:'recorded'};
}

export function determineCorrectionImpact(state,correction){
  const affectedJudgements=[],affectedLearnings=[],affectedHistory=[];
  const field=correction.field;

  for(const judgement of state.judgements||[]){
    if(TERMINAL_VALIDITY.has(judgement.validity?.status))continue;
    const reasons=[];
    if(correction.type==='understanding-correction')reasons.push('Understanding used by Strategos was corrected.');
    if(correction.type==='signal-correction'&&field){
      const fingerprint=judgement.validity?.contextFingerprint||judgement.context||{};
      if(Object.prototype.hasOwnProperty.call(fingerprint,field))reasons.push(`The ${field} signal used in this judgement was corrected.`);
    }
    if(correction.type==='learning-rejection'){
      const used=(judgement.advisors||[]).some(advisor=>
        (advisor.memory?.applied||[]).some(item=>item.learningId===correction.sourceId||item.practice===correction.sourceId)
      );
      if(used)reasons.push('Rejected Advisor learning may have influenced this judgement.');
      else if(ACTIVE_STATUSES.has(judgement.status))reasons.push('Active judgement requires review after Advisor learning rejection.');
    }
    if(reasons.length)affectedJudgements.push({id:judgement.id,status:judgement.status,currentValidity:judgement.validity?.status||'unknown',reasons});
  }

  for(const [advisor,memory] of Object.entries(state.advisorMemories||{})){
    for(const learning of memory.notes||[]){
      const reasons=[];
      if(correction.type==='learning-rejection'&&learning.id===correction.sourceId)reasons.push('This learning was directly rejected by the person.');
      if(correction.type==='signal-correction'&&field&&learning.context&&Object.prototype.hasOwnProperty.call(learning.context,field))reasons.push(`This learning used the corrected ${field} signal.`);
      if(reasons.length)affectedLearnings.push({advisor,id:learning.id,status:learning.status,practice:learning.practice,reasons});
    }
  }

  for(const entry of state.history||[]){
    const reasons=[];
    if(correction.type==='signal-correction'&&field&&entry.context&&Object.prototype.hasOwnProperty.call(entry.context,field))reasons.push(`This historical practice used the corrected ${field} signal.`);
    if(correction.type==='understanding-correction'&&entry.decision?.understanding)reasons.push('This historical judgement contains an earlier Understanding record.');
    if(reasons.length)affectedHistory.push({judgementId:entry.judgementId||entry.decision?.id||null,completedAt:entry.completedAt||null,reasons});
  }

  return {
    correctionId:correction.id,
    createdAt:new Date().toISOString(),
    affectedJudgements,affectedLearnings,affectedHistory,
    totals:{judgements:affectedJudgements.length,learnings:affectedLearnings.length,history:affectedHistory.length}
  };
}

export function applyCorrectionImpact(state,correction,impact){
  const next=clone(state),now=new Date().toISOString();
  const judgementIds=new Set((impact.affectedJudgements||[]).map(item=>item.id));
  const learningIds=new Set((impact.affectedLearnings||[]).map(item=>item.id));

  next.judgements=(next.judgements||[]).map(judgement=>judgementIds.has(judgement.id)?{
    ...judgement,
    validity:{...(judgement.validity||{}),status:'review-required',reviewReason:`Correction impact: ${correction.note||correction.type}.`,reviewMarkedAt:now,correctionId:correction.id}
  }:judgement);

  for(const memory of Object.values(next.advisorMemories||{})){
    memory.notes=(memory.notes||[]).map(learning=>{
      if(!learningIds.has(learning.id))return learning;
      if(correction.type==='learning-rejection'&&learning.id===correction.sourceId)return {
        ...learning,status:'rejected',correction:{at:correction.at,note:correction.note||'Rejected by the person.'}
      };
      return {
        ...learning,
        status:learning.status==='confirmed'?'candidate':learning.status,
        correctionReview:{correctionId:correction.id,at:now,reason:`Related ${correction.field||'information'} was corrected.`}
      };
    });
  }

  next.correctionAudit=[{...correction,impact,appliedAt:now,status:'applied'},...(next.correctionAudit||[])].slice(0,100);
  if(next.current?.decision&&judgementIds.has(next.current.decision.id)){
    const canonical=next.judgements.find(item=>item.id===next.current.decision.id);
    if(canonical)next.current={...next.current,decision:{...canonical}};
  }
  return next;
}

export function correctionAuditSummary(event){
  const totals=event?.impact?.totals||{judgements:0,learnings:0,history:0};
  return `${totals.judgements} judgement${totals.judgements===1?'':'s'}, ${totals.learnings} learning${totals.learnings===1?'':'s'} and ${totals.history} historical record${totals.history===1?'':'s'} were identified as potentially affected.`;
}

export function reconcileCorrectionAudit(state){
  const next=clone(state||{});
  next.correctionAudit=[...(next.correctionAudit||[])].filter(event=>event?.id&&event?.at);
  const seen=new Set();
  next.correctionAudit=next.correctionAudit.filter(event=>{
    if(seen.has(event.id))return false;
    seen.add(event.id);return true;
  }).slice(0,100);
  return next;
}

function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
