const SIGNAL_ORDER=['sleep','energy','time','challenge','soreness','emotionalLoad'];

export const CURRENT_MOMENTS=Object.freeze({
  ARRIVAL:'arrival',
  UNDERSTANDING:'understanding',
  READY:'ready',
  RECOMMENDATION:'recommendation',
  PRACTICE:'practice',
  REFLECTION:'reflection',
  CLOSURE:'closure'
});

export function nextMissingSignal(signals={}){
  return SIGNAL_ORDER.find(key=>signals?.[key]===undefined||signals?.[key]===null||signals?.[key]==='')||null;
}

export function resolveCurrentMoment({contextEvidence=null,judgement=null,story={},hasContinuity=false}={}){
  const stage=story?.stage||'opened';
  if(stage==='complete')return {moment:CURRENT_MOMENTS.CLOSURE,action:null};
  if(['reflection'].includes(stage))return {moment:CURRENT_MOMENTS.REFLECTION,action:'eveningReflection'};
  if(hasContinuity||['practice','started'].includes(stage))return {moment:CURRENT_MOMENTS.PRACTICE,action:'continue-flow'};
  if(judgement)return {moment:CURRENT_MOMENTS.RECOMMENDATION,action:'judgement'};
  if(contextEvidence?.sufficient)return {moment:CURRENT_MOMENTS.READY,action:'consult'};
  const completed=Number(contextEvidence?.completed||0);
  return {
    moment:completed>0?CURRENT_MOMENTS.UNDERSTANDING:CURRENT_MOMENTS.ARRIVAL,
    action:'focus-signals',
    nextSignal:nextMissingSignal(contextEvidence?.signals||{})
  };
}

export function currentMomentStatement(moment){
  switch(moment){
    case CURRENT_MOMENTS.UNDERSTANDING:return 'Let’s finish understanding today.';
    case CURRENT_MOMENTS.READY:return 'I understand today.';
    case CURRENT_MOMENTS.RECOMMENDATION:return 'Today’s direction is ready.';
    case CURRENT_MOMENTS.PRACTICE:return 'Continue where you left off.';
    case CURRENT_MOMENTS.REFLECTION:return 'What mattered today?';
    case CURRENT_MOMENTS.CLOSURE:return 'There is continuity.';
    default:return 'Let’s understand today.';
  }
}
