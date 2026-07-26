export function detectCalibrationDrift(forecasts=[],{
  domain='unknown',
  practiceId='unknown',
  challenge='unknown',
  now=Date.now()
}={}){
  const relevant=(forecasts||[]).filter(item=>
    item?.status==='resolved'&&
    (item.domain||'unknown')===domain&&
    (item.practiceId||'unknown')===practiceId&&
    (item.challenge||item.contextKey?.split('|')?.[0]||'unknown')===challenge
  ).sort((a,b)=>new Date(b.resolvedAt||0)-new Date(a.resolvedAt||0));

  if(relevant.length<6)return {
    status:'insufficient',
    drift:false,
    reason:'At least six comparable resolved forecasts are required.',
    recentCount:relevant.length,
    previousCount:0,
    recentScore:0,
    previousScore:0,
    delta:0
  };

  const recent=relevant.slice(0,3);
  const previous=relevant.slice(3,6);
  const recentScore=mean(recent.map(item=>Number(item.calibration?.score||0)));
  const previousScore=mean(previous.map(item=>Number(item.calibration?.score||0)));
  const delta=+(recentScore-previousScore).toFixed(3);

  const overestimatedRecent=recent.filter(item=>item.calibration?.direction==='overestimated').length;
  const drift=delta<=-.2||overestimatedRecent>=2;

  return {
    status:drift?'drift-detected':'stable',
    drift,
    reason:drift
      ?'Recent forecast calibration has deteriorated materially.'
      :'Recent calibration remains within the expected range.',
    recentCount:recent.length,
    previousCount:previous.length,
    recentScore:+recentScore.toFixed(3),
    previousScore:+previousScore.toFixed(3),
    delta,
    overestimatedRecent
  };
}

export function calibrationDriftCorrection(drift){
  if(!drift?.drift)return {
    applies:false,
    adjustment:0,
    reason:'No calibration drift was detected.'
  };

  return {
    applies:true,
    adjustment:-.02,
    reason:'Detected calibration drift requires an additional confidence reduction.'
  };
}

export function buildCalibrationAccountability({
  calibrationEvidence,
  drift,
  judgementId,
  at=new Date().toISOString()
}={}){
  return {
    id:makeId('calibration-accountability'),
    judgementId,
    calibrationScope:calibrationEvidence?.scope||'insufficient',
    cohortKey:calibrationEvidence?.cohortKey||null,
    cohortSize:Number(calibrationEvidence?.cohortSize||0),
    calibrationAdjustment:Number(calibrationEvidence?.adjustment||0),
    driftStatus:drift?.status||'not-assessed',
    driftDelta:Number(drift?.delta||0),
    driftAdjustment:calibrationDriftCorrection(drift).adjustment,
    totalAdjustment:+(
      Number(calibrationEvidence?.adjustment||0)+
      Number(calibrationDriftCorrection(drift).adjustment||0)
    ).toFixed(3),
    createdAt:at,
    status:'active'
  };
}

export function verifyCalibrationAccountability(record){
  const reasons=[];
  if(!record?.judgementId)reasons.push('Judgement provenance is missing.');
  if(Number(record?.calibrationAdjustment||0)<-.03||Number(record?.calibrationAdjustment||0)>.015)
    reasons.push('Calibration adjustment exceeds its constitutional boundary.');
  if(Number(record?.driftAdjustment||0)<-.02||Number(record?.driftAdjustment||0)>0)
    reasons.push('Drift adjustment exceeds its boundary.');
  if(Number(record?.totalAdjustment||0)<-.05||Number(record?.totalAdjustment||0)>.015)
    reasons.push('Total calibration adjustment exceeds the combined boundary.');

  return {
    valid:reasons.length===0,
    reasons
  };
}

export function reconcileCalibrationAccountability(state){
  const next=clone(state||{});
  const judgementIds=new Set((next.judgements||[]).map(item=>item.id));

  next.calibrationAccountability=(next.calibrationAccountability||[]).filter(item=>
    item?.id&&item?.judgementId&&judgementIds.has(item.judgementId)
  );

  const seen=new Set();
  next.calibrationAccountability=next.calibrationAccountability.filter(item=>{
    if(seen.has(item.judgementId))return false;
    seen.add(item.judgementId);
    return true;
  }).slice(0,200);

  return next;
}

export function calibrationAccountabilitySummary(records=[]){
  const valid=(records||[]).filter(item=>verifyCalibrationAccountability(item).valid).length;
  const invalid=(records||[]).length-valid;
  return {
    total:(records||[]).length,
    valid,
    invalid,
    statement:`${valid} calibration records valid · ${invalid} invalid.`
  };
}

function mean(values){return values.length?values.reduce((a,b)=>a+b,0)/values.length:0}
function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
