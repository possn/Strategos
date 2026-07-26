export const OUTCOME_LEDGER_RESULTS=['yes','partly','no','unknown'];

export function createOutcomeLedgerEntry({
  historyEntry,
  structuredReflection=null,
  outcomeRecord=null,
  result,
  note='',
  at=new Date().toISOString()
}={}){
  if(!historyEntry?.judgementId&&!historyEntry?.decision?.id)throw new Error('A judgement-linked history entry is required.');
  if(!OUTCOME_LEDGER_RESULTS.includes(result))throw new Error('Unsupported outcome result.');
  const judgement=historyEntry.decision||historyEntry.current?.decision||null;
  const practice=judgement?.practice||historyEntry.adjusted?.practice||null;
  return {
    id:makeId('outcome-ledger'),
    judgementId:historyEntry.judgementId||judgement?.id||null,
    outcomeRecordId:outcomeRecord?.id||historyEntry.outcomeRecord?.id||null,
    structuredReflectionId:structuredReflection?.id||historyEntry.structuredReflection?.id||null,
    practiceId:practice?.id||outcomeRecord?.completedPracticeId||outcomeRecord?.startedPracticeId||null,
    practiceName:practice?.name||'Practice',
    result,
    note:String(note||'').trim(),
    recordedAt:at,
    source:'person-reported-reflection',
    immutableContext:{
      humanModelSnapshot:clone(judgement?.humanModelSnapshot||historyEntry.humanModelSnapshot||null),
      explainRecord:clone(judgement?.explainRecord||historyEntry.explainRecord||null),
      practiceSnapshot:clone(historyEntry.practiceContentSnapshot||judgement?.practiceContentSnapshot||null),
      context:clone(judgement?.context||historyEntry.context||null),
      choice:clone(judgement?.personChoice||historyEntry.personChoice||null)
    },
    learningStatus:'eligible-for-review',
    modelInfluence:0,
    judgementInfluence:0,
    integrity:'person-reported-outcome-with-frozen-context'
  };
}

export function outcomeLedgerResultFromReflection(reflection){
  const value=typeof reflection==='string'?reflection:reflection?.effect;
  if(value==='better')return 'yes';
  if(value==='right')return 'partly';
  if(value==='worse')return 'no';
  return 'unknown';
}

export function upsertOutcomeLedger(entries=[],entry){
  if(!entry?.id)return [...entries];
  const duplicateIndex=entries.findIndex(item=>
    (entry.outcomeRecordId&&item.outcomeRecordId===entry.outcomeRecordId)||
    (entry.structuredReflectionId&&item.structuredReflectionId===entry.structuredReflectionId)
  );
  if(duplicateIndex<0)return [entry,...entries].slice(0,500);
  const next=[...entries];
  next[duplicateIndex]=entry;
  return next.slice(0,500);
}

export function outcomeLedgerAudit(entries=[]){
  const valid=(entries||[]).filter(item=>item?.id&&OUTCOME_LEDGER_RESULTS.includes(item.result));
  const counts=Object.fromEntries(OUTCOME_LEDGER_RESULTS.map(result=>[result,0]));
  valid.forEach(item=>counts[item.result]++);
  const known=valid.length-counts.unknown;
  return {
    total:valid.length,
    known,
    counts,
    statement:valid.length
      ?`${known} of ${valid.length} outcomes have a person-reported direction.`
      :'No outcomes have entered the learning ledger yet.'
  };
}

export function outcomeLedgerLabel(result){
  return ({yes:'Helped',partly:'Helped partly',no:'Did not help',unknown:'Unknown'})[result]||'Unknown';
}

export function outcomeLedgerLearningGate(entry){
  if(!entry)return {eligible:false,reason:'No ledger entry exists.'};
  if(entry.result==='unknown')return {eligible:false,reason:'The person did not report a directional outcome.'};
  if(!entry.outcomeRecordId)return {eligible:false,reason:'No execution outcome is linked.'};
  if(!entry.immutableContext)return {eligible:false,reason:'The decision context was not frozen.'};
  return {eligible:true,weight:entry.result==='partly'?.65:1,reason:'A person-reported outcome is linked to frozen decision context.'};
}

function clone(value){
  if(value==null)return null;
  return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
