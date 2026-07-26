export const REFLECTION_EFFECTS=['better','right','worse'];
export const GOAL_FIT=['strong','partial','poor','unknown'];
export const BURDEN_LEVELS=['low','moderate','high','unknown'];
export const SURPRISE_LEVELS=['none','some','material'];
export const REFLECTION_CONFIDENCE=['low','medium','high'];

export function createStructuredReflection({
  outcomeRecord,effect,goalFit='unknown',burden='unknown',
  surprise='none',confidence='medium',note='',at=new Date().toISOString()
}={}){
  if(!outcomeRecord?.id)throw new Error('An outcome record is required.');
  if(!REFLECTION_EFFECTS.includes(effect))throw new Error('Unsupported effect.');
  if(!GOAL_FIT.includes(goalFit))throw new Error('Unsupported goal fit.');
  if(!BURDEN_LEVELS.includes(burden))throw new Error('Unsupported burden.');
  if(!SURPRISE_LEVELS.includes(surprise))throw new Error('Unsupported surprise.');
  if(!REFLECTION_CONFIDENCE.includes(confidence))throw new Error('Unsupported confidence.');
  return {
    id:makeId('reflection'),outcomeRecordId:outcomeRecord.id,
    judgementId:outcomeRecord.judgementId,effect,goalFit,burden,
    surprise,confidence,note:String(note||'').trim(),createdAt:at,
    status:'recorded',integrity:'structured-person-reflection'
  };
}

export function reflectionLearningSignal(reflection,{completionRatio=1,wasFallback=false,frictionOutcome=null}={}){
  if(!reflection)return {eligible:false,weight:0,reason:'No reflection exists.'};
  const confidenceWeight={low:.35,medium:.65,high:1}[reflection.confidence]||.65;
  const goalWeight={strong:1,partial:.7,poor:.35,unknown:.5}[reflection.goalFit]||.5;
  const burdenWeight={low:1,moderate:.8,high:.5,unknown:.7}[reflection.burden]||.7;
  const executionWeight=Math.max(0,Math.min(1,Number(completionRatio)||0));
  if(executionWeight<.5)return {eligible:false,weight:0,reason:'Execution was too limited for reflection-led learning.'};
  if(frictionOutcome==='blocked')return {eligible:false,weight:0,reason:'The practice was blocked before a reliable effect could be observed.'};
  let weight=confidenceWeight*goalWeight*burdenWeight*executionWeight;
  if(wasFallback)weight=Math.min(.6,weight);
  if(reflection.surprise==='material')weight=Math.min(1,weight+.08);
  return {
    eligible:true,weight:+Math.max(.15,Math.min(1,weight)).toFixed(3),
    reason:wasFallback?'Structured fallback reflection produced a bounded learning signal.':'Structured reflection produced a calibrated learning signal.'
  };
}

export function reflectionContradiction(reflection){
  if(!reflection)return {present:false,severity:'none',reasons:[]};
  const reasons=[];
  if(reflection.effect==='better'&&reflection.goalFit==='poor')reasons.push('Felt better but poorly matched the intended goal.');
  if(reflection.effect==='worse'&&reflection.goalFit==='strong')reasons.push('Matched the goal but produced a worse experienced effect.');
  if(reflection.effect==='right'&&reflection.burden==='high')reasons.push('Felt appropriate but carried a high burden.');
  if(reflection.surprise==='material')reasons.push('The outcome materially differed from expectation.');
  return {present:reasons.length>0,severity:reasons.length>=2?'high':'moderate',reasons};
}

export function reflectionCompleteness(reflection){
  if(!reflection)return {complete:false,score:0,missing:['reflection']};
  const fields=['effect','goalFit','burden','surprise','confidence'];
  const missing=fields.filter(field=>reflection[field]===undefined||reflection[field]===null||reflection[field]==='unknown');
  return {complete:missing.length===0,score:+((fields.length-missing.length)/fields.length).toFixed(2),missing};
}

export function reconcileStructuredReflections(state){
  const next=clone(state||{});
  const outcomeIds=new Set((next.outcomeRecords||[]).map(item=>item.id));
  next.structuredReflections=[...(next.structuredReflections||[])].filter(item=>item?.id&&item?.outcomeRecordId&&outcomeIds.has(item.outcomeRecordId));
  const seen=new Set();
  next.structuredReflections=next.structuredReflections.filter(item=>{
    if(seen.has(item.id))return false;
    seen.add(item.id);return true;
  }).slice(0,200);
  return next;
}

export function reflectionSummary(reflection){
  if(!reflection)return 'No structured reflection exists.';
  return `${reflection.effect} · goal fit ${reflection.goalFit} · burden ${reflection.burden} · confidence ${reflection.confidence}`;
}

function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
