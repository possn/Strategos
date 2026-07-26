export const FORECAST_EFFECTS=['better','right','worse'];
export const FORECAST_CONFIDENCE=['low','medium','high'];

export function createJudgementForecast({
  judgement,
  context,
  expectedEffect='right',
  confidence='medium',
  at=new Date().toISOString()
}={}){
  if(!judgement?.id)throw new Error('A judgement is required.');
  if(!FORECAST_EFFECTS.includes(expectedEffect))throw new Error('Unsupported expected effect.');
  if(!FORECAST_CONFIDENCE.includes(confidence))throw new Error('Unsupported forecast confidence.');

  return {
    id:makeId('forecast'),
    judgementId:judgement.id,
    practiceId:judgement.practice?.id||null,
    domain:judgement.domain||judgement.practice?.domain||'unknown',
    challenge:context?.challenge||'unknown',
    contextKey:[
      context?.challenge||'unknown',
      context?.soreness||'unknown',
      context?.emotionalLoad||'unknown'
    ].join('|'),
    expectedEffect,
    confidence,
    predictedAt:at,
    status:'open',
    resolvedAt:null,
    actualEffect:null,
    calibration:null
  };
}

export function resolveJudgementForecast(forecast,{
  actualEffect,
  causalSource='unclear',
  at=new Date().toISOString()
}={}){
  if(!forecast)throw new Error('A forecast is required.');
  if(!FORECAST_EFFECTS.includes(actualEffect))throw new Error('Unsupported actual effect.');

  const distance=effectDistance(forecast.expectedEffect,actualEffect);
  const confidenceWeight={low:.55,medium:.8,high:1}[forecast.confidence]||.8;
  const causalWeight={practice:1,mixed:.75,time:.45,external:.3,unclear:.4}[causalSource]||.4;
  const accuracy=Math.max(0,1-distance*.5);
  const calibrationScore=+(accuracy*confidenceWeight*causalWeight).toFixed(3);

  return {
    ...forecast,
    status:'resolved',
    resolvedAt:at,
    actualEffect,
    causalSource,
    calibration:{
      exact:distance===0,
      distance,
      accuracy:+accuracy.toFixed(3),
      score:calibrationScore,
      direction:distance===0?'matched':ordinal(actualEffect)>ordinal(forecast.expectedEffect)?'underestimated':'overestimated'
    }
  };
}

export function predictionCalibrationSummary(forecasts=[]){
  const resolved=(forecasts||[]).filter(item=>item.status==='resolved'&&item.calibration);
  if(!resolved.length)return {
    resolved:0,
    exact:0,
    meanScore:0,
    overestimated:0,
    underestimated:0,
    statement:'No resolved judgement forecasts yet.'
  };

  const exact=resolved.filter(item=>item.calibration.exact).length;
  const meanScore=resolved.reduce((sum,item)=>sum+Number(item.calibration.score||0),0)/resolved.length;
  const overestimated=resolved.filter(item=>item.calibration.direction==='overestimated').length;
  const underestimated=resolved.filter(item=>item.calibration.direction==='underestimated').length;

  return {
    resolved:resolved.length,
    exact,
    meanScore:+meanScore.toFixed(3),
    overestimated,
    underestimated,
    statement:`${exact} of ${resolved.length} forecasts matched exactly · mean calibration ${Math.round(meanScore*100)}%.`
  };
}

export function confidenceCorrection(summary){
  if(!summary?.resolved||summary.resolved<4)return {
    applies:false,
    adjustment:0,
    reason:'At least four resolved forecasts are required.'
  };

  if(summary.overestimated/summary.resolved>=.5)return {
    applies:true,
    adjustment:-.03,
    reason:'Recent judgements have tended to overestimate outcomes.'
  };

  if(summary.exact/summary.resolved>=.7&&summary.meanScore>=.65)return {
    applies:true,
    adjustment:.015,
    reason:'Recent forecasts have been consistently well calibrated.'
  };

  return {
    applies:false,
    adjustment:0,
    reason:'Calibration is mixed and does not justify a confidence correction.'
  };
}

export function reconcileJudgementForecasts(state){
  const next=clone(state||{});
  const judgementIds=new Set((next.judgements||[]).map(item=>item.id));
  next.judgementForecasts=[...(next.judgementForecasts||[])].filter(item=>
    item?.id&&item?.judgementId&&judgementIds.has(item.judgementId)
  );

  const seen=new Set();
  next.judgementForecasts=next.judgementForecasts.filter(item=>{
    if(seen.has(item.id))return false;
    seen.add(item.id);
    return true;
  }).slice(0,200);

  return next;
}

export function forecastSummary(forecast){
  if(!forecast)return 'No forecast exists.';
  if(forecast.status==='open')return `Expected ${forecast.expectedEffect} · ${forecast.confidence} confidence.`;
  return `Expected ${forecast.expectedEffect} · observed ${forecast.actualEffect} · ${forecast.calibration.direction}.`;
}

function effectDistance(a,b){return Math.abs(ordinal(a)-ordinal(b))}
function ordinal(value){return {worse:-1,right:0,better:1}[value]??0}
function clone(value){return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value))}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
