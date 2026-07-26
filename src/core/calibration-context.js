export function calibrationContextKey({
  domain='unknown',
  practiceId='unknown',
  challenge='unknown'
}={}){
  return [domain||'unknown',practiceId||'unknown',challenge||'unknown'].join('|');
}

export function selectCalibrationCohort(forecasts=[],{
  domain='unknown',
  practiceId='unknown',
  challenge='unknown',
  now=Date.now(),
  maxAgeDays=180
}={}){
  const exactKey=calibrationContextKey({domain,practiceId,challenge});
  const domainKey=String(domain||'unknown');
  const cutoff=now-maxAgeDays*86400000;

  const resolved=(forecasts||[]).filter(item=>
    item?.status==='resolved'&&
    new Date(item.resolvedAt||item.predictedAt||0).getTime()>=cutoff
  );

  const exact=resolved.filter(item=>
    calibrationContextKey({
      domain:item.domain||'unknown',
      practiceId:item.practiceId||'unknown',
      challenge:item.challenge||item.contextKey?.split('|')?.[0]||'unknown'
    })===exactKey
  );

  if(exact.length>=4)return {
    scope:'exact',
    key:exactKey,
    forecasts:exact,
    excluded:resolved.length-exact.length
  };

  const domainMatches=resolved.filter(item=>(item.domain||'unknown')===domainKey);
  if(domainMatches.length>=4)return {
    scope:'domain',
    key:domainKey,
    forecasts:domainMatches,
    excluded:resolved.length-domainMatches.length
  };

  return {
    scope:'insufficient',
    key:exactKey,
    forecasts:[],
    excluded:resolved.length
  };
}

export function calibrationRecencyWeight(forecast,now=Date.now()){
  const resolvedAt=new Date(forecast?.resolvedAt||forecast?.predictedAt||now).getTime();
  const ageDays=Math.max(0,(now-resolvedAt)/86400000);
  if(ageDays<=30)return 1;
  if(ageDays<=90)return .85;
  if(ageDays<=180)return .65;
  return 0;
}

export function weightedCalibrationSummary(forecasts=[],now=Date.now()){
  const resolved=(forecasts||[]).filter(item=>item?.status==='resolved'&&item.calibration);

  let totalWeight=0;
  let exactWeight=0;
  let overWeight=0;
  let underWeight=0;
  let scoreWeight=0;

  for(const item of resolved){
    const weight=calibrationRecencyWeight(item,now);
    if(weight<=0)continue;
    totalWeight+=weight;
    if(item.calibration.exact)exactWeight+=weight;
    if(item.calibration.direction==='overestimated')overWeight+=weight;
    if(item.calibration.direction==='underestimated')underWeight+=weight;
    scoreWeight+=Number(item.calibration.score||0)*weight;
  }

  if(totalWeight===0)return {
    resolved:0,
    weightedResolved:0,
    exactRatio:0,
    overestimatedRatio:0,
    underestimatedRatio:0,
    meanScore:0
  };

  return {
    resolved:resolved.length,
    weightedResolved:+totalWeight.toFixed(3),
    exactRatio:+(exactWeight/totalWeight).toFixed(3),
    overestimatedRatio:+(overWeight/totalWeight).toFixed(3),
    underestimatedRatio:+(underWeight/totalWeight).toFixed(3),
    meanScore:+(scoreWeight/totalWeight).toFixed(3)
  };
}

export function contextCalibrationCorrection(cohort,now=Date.now()){
  if(!cohort||cohort.scope==='insufficient'||cohort.forecasts.length<4)return {
    applies:false,
    adjustment:0,
    scope:cohort?.scope||'insufficient',
    reason:'No sufficiently comparable calibration cohort exists.'
  };

  const summary=weightedCalibrationSummary(cohort.forecasts,now);

  if(summary.overestimatedRatio>=.5)return {
    applies:true,
    adjustment:-.03,
    scope:cohort.scope,
    summary,
    reason:`Comparable forecasts were overestimated ${Math.round(summary.overestimatedRatio*100)}% of the weighted time.`
  };

  if(summary.exactRatio>=.7&&summary.meanScore>=.65)return {
    applies:true,
    adjustment:.015,
    scope:cohort.scope,
    summary,
    reason:`Comparable forecasts matched exactly ${Math.round(summary.exactRatio*100)}% of the weighted time.`
  };

  return {
    applies:false,
    adjustment:0,
    scope:cohort.scope,
    summary,
    reason:'Comparable forecast calibration is mixed.'
  };
}

export function calibrationCohortSummary(cohort,correction){
  if(!cohort||cohort.scope==='insufficient')
    return 'No comparable calibration cohort exists yet.';
  const label=cohort.scope==='exact'?'same practice and context':'same domain';
  return `${cohort.forecasts.length} recent forecasts from the ${label} cohort · ${correction.reason}`;
}
