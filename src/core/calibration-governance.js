import { predictionCalibrationSummary,confidenceCorrection } from './prediction-calibration.js?v=0476p1';
import { selectCalibrationCohort,contextCalibrationCorrection,calibrationCohortSummary } from './calibration-context.js?v=0476p1';

export function buildCalibrationEvidence(forecasts=[]){
  const summary=predictionCalibrationSummary(forecasts);
  const correction=confidenceCorrection(summary);

  return {
    status:correction.applies?'applied':'insufficient',
    resolvedForecasts:summary.resolved,
    exactForecasts:summary.exact,
    overestimated:summary.overestimated,
    underestimated:summary.underestimated,
    meanScore:summary.meanScore,
    adjustment:Number(correction.adjustment||0),
    reason:correction.reason,
    generatedAt:new Date().toISOString()
  };
}

export function verifyCalibrationEvidence(evidence){
  const reasons=[];
  if(!evidence||typeof evidence!=='object')reasons.push('Calibration evidence is missing.');

  const adjustment=Number(evidence?.adjustment||0);
  if(adjustment < -.03 || adjustment > .015)
    reasons.push('Calibration adjustment exceeds the constitutional boundary.');

  if(adjustment!==0 && Number(evidence?.resolvedForecasts||0)<4)
    reasons.push('At least four resolved forecasts are required.');

  if(evidence?.status==='applied' && adjustment===0)
    reasons.push('Applied calibration evidence must contain a non-zero adjustment.');

  return {
    valid:reasons.length===0,
    reasons
  };
}

export function applyCalibrationToConfidence(baseConfidence,evidence){
  const verification=verifyCalibrationEvidence(evidence);
  if(!verification.valid)return {
    confidence:baseConfidence,
    applied:false,
    adjustment:0,
    verification
  };

  const adjustment=Number(evidence?.adjustment||0);
  const corrected=Math.max(45,Math.min(90,Math.round(baseConfidence + adjustment*100)));

  return {
    confidence:corrected,
    applied:adjustment!==0,
    adjustment,
    verification
  };
}

export function calibrationGovernanceSummary(evidence){
  if(!evidence)return 'No calibration evidence was available.';
  if(evidence.status!=='applied')
    return `${evidence.resolvedForecasts} resolved forecasts · no confidence correction.`;

  const direction=evidence.adjustment>0?'increased':'reduced';
  return `Confidence ${direction} by ${Math.abs(evidence.adjustment*100).toFixed(1)} points after ${evidence.resolvedForecasts} resolved forecasts.`;
}


export function buildContextCalibrationEvidence(forecasts=[],{
  judgement,
  context,
  now=Date.now()
}={}){
  const cohort=selectCalibrationCohort(forecasts,{
    domain:judgement?.domain||judgement?.practice?.domain||'unknown',
    practiceId:judgement?.practice?.id||'unknown',
    challenge:context?.challenge||'unknown',
    now
  });
  const correction=contextCalibrationCorrection(cohort,now);

  return {
    status:correction.applies?'applied':'insufficient',
    scope:cohort.scope,
    cohortKey:cohort.key,
    cohortSize:cohort.forecasts.length,
    excludedForecasts:cohort.excluded,
    resolvedForecasts:cohort.forecasts.length,
    adjustment:correction.adjustment,
    reason:correction.reason,
    summary:calibrationCohortSummary(cohort,correction),
    generatedAt:new Date(now).toISOString()
  };
}
