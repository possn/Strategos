// Product constraints, not a clinical clearance or a fitness assessment.
export function supportedPracticeDuration(practice,availableMinutes){
  const available=Number(availableMinutes);
  if(!Number.isFinite(available)||available<=0)return null;
  const options=(practice?.durationOptions||[]).map(Number).filter(value=>Number.isFinite(value)&&value>0&&value<=available);
  return options.length?Math.max(...options):null;
}

export function assessPracticeEligibility(practice,context={}){
  const reasons=[],matchedContraindications=[];
  const practiceId=practice?.basePracticeId||practice?.id;
  if(context.movementPreference==='avoid-movement'&&['strength','walk','recovery'].includes(practiceId)){
    reasons.push('You asked to avoid practices involving movement.');
    matchedContraindications.push('person-avoid-movement');
  }else if(context.movementPreference==='avoid-strength'&&practiceId==='strength'){
    reasons.push('You asked to avoid strength practice.');
    matchedContraindications.push('person-avoid-strength');
  }
  if(practiceId==='strength'&&context.soreness==='significant'){
    reasons.push('Significant soreness excludes additional strength loading until reassessment.');
    matchedContraindications.push('significant-soreness');
  }
  if(supportedPracticeDuration(practice,context.time)===null){
    reasons.push('No supported session fits the time currently available.');
    matchedContraindications.push('insufficient-time');
  }
  const blocked=reasons.length>0;
  return {practiceId:practice?.id||'unknown',status:blocked?'blocked':'eligible',reasons:blocked?reasons:['No conflict with the checked time and soreness constraints was declared. This is not clinical clearance.'],matchedContraindications,selectionInfluence:0,assessedFrom:['time','soreness','movementPreference'],statement:blocked?reasons.join(' '):'Checked product constraints only; clinical suitability remains unknown.'};
}

export function buildTimedPracticePlan(practice,durationMinutes,context={}){
  const eligibility=assessPracticeEligibility(practice,context);
  if(eligibility.status==='blocked')throw new Error(eligibility.reasons.join(' '));
  const minutes=Number(durationMinutes),minimum=Math.min(...practice.durationOptions.map(Number));
  if(!Number.isFinite(minutes)||minutes<minimum||minutes>Number(context.time))throw new Error('The planned duration does not fit the current time and supported minimum.');
  const phases=practice.phases;
  if(!Array.isArray(phases)||!phases.length)throw new Error('No practice phases are available.');
  const target=Math.round(minutes*60),floor=20;
  if(target<phases.length*floor)throw new Error('There is not enough time for the practice phases.');
  const weights=phases.map(phase=>Number(phase[1]));
  if(weights.some(weight=>!Number.isFinite(weight)||weight<=0))throw new Error('Invalid phase duration.');
  const totalWeight=weights.reduce((sum,value)=>sum+value,0),remaining=target-floor*phases.length;
  const shares=weights.map(weight=>remaining*weight/totalWeight);
  const seconds=shares.map(share=>floor+Math.floor(share));
  let spare=target-seconds.reduce((sum,value)=>sum+value,0);
  const order=shares.map((share,index)=>({index,fraction:share-Math.floor(share)})).sort((a,b)=>b.fraction-a.fraction||a.index-b.index);
  for(let i=0;i<spare;i++)seconds[order[i].index]++;
  return phases.map((phase,index)=>[phase[0],seconds[index],phase[2],[...(phase[3]||[])]]);
}
