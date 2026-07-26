import { resolveCurrentMoment,CURRENT_MOMENTS } from './current-moment.js?v=0476p1';
const completeContext=context=>['sleep','energy','time','challenge','soreness','emotionalLoad'].every(key=>context?.[key]!==undefined&&context?.[key]!==null&&context?.[key]!=='');

export function buildLivingCompanion({name='',context={},contextEvidence=null,judgement=null,story={},hasContinuity=false}={}){
  const complete=contextEvidence?Boolean(contextEvidence.sufficient):completeContext(context);
  const stage=story?.stage||'opened';
  const completed=stage==='complete';
  const practiceComplete=['reflection','complete'].includes(stage);
  const greeting=`${timeGreeting()}${name?`, ${name}`:''}.`;

  if(completed)return {
    mode:'complete',greeting,judgement:'Today is closed.',
    reasons:['The day has been deliberately closed.'],confidence:'Continuity preserved.',
    action:null,actionLabel:null,continuity:'There is continuity.'
  };
  if(practiceComplete)return {
    mode:'reflection',greeting,judgement:'What mattered today?',
    reasons:['A brief reflection can preserve what mattered without scoring the day.'],confidence:'Writing remains optional.',
    action:'eveningReflection',actionLabel:'Close today',continuity:''
  };
  if(hasContinuity)return {
    mode:'continuity',greeting,judgement:'Continue where you left off.',
    reasons:['An unfinished action is already present.'],confidence:'Your existing direction is preserved.',
    action:'continue-flow',actionLabel:'Continue',continuity:''
  };
  if(judgement){
    const choiceAction=judgement.personChoice?.action;
    if(choiceAction==='decline')return {
      mode:'declined',greeting,judgement:'Rest is a decision.',
      reasons:['This is your choice. Strategos will offer a fresh perspective whenever you are ready.'],
      confidence:'No practice is expected.',
      action:'consult',actionLabel:'Get a new recommendation',continuity:''
    };
    if(choiceAction==='defer')return {
      mode:'deferred',greeting,judgement:judgement.judgement||judgement.practice?.name||'Your recommendation is waiting.',
      reasons:['You chose to return to this later. It is still here.'],
      confidence:judgement.confidence?`${Math.round(judgement.confidence)}% confidence`:'Your current judgement is preserved.',
      action:'currentJudgement',actionLabel:'Return to recommendation',continuity:''
    };
    return {
      mode:'judgement',greeting,judgement:judgement.judgement||judgement.practice?.name||'Your recommendation is ready.',
      reasons:[judgement.explain?.summary||judgement.intention||'This recommendation reflects what is currently known.'].filter(Boolean),
      confidence:judgement.confidence?`${Math.round(judgement.confidence)}% confidence`:'Uncertainty remains explicit.',
      action:'currentJudgement',actionLabel:'Open today\'s recommendation',continuity:''
    };
  }
  if(complete)return {
    mode:'ready',greeting,judgement:'Strategos has what it needs.',
    reasons:['Your check-in is complete. Strategos can now deliberate from the context you provided.'],confidence:'No recommendation exists until deliberation completes.',
    action:'consult',actionLabel:'See today\u2019s recommendation',continuity:''
  };
  const moment=resolveCurrentMoment({contextEvidence:contextEvidence||{signals:context,completed:Object.values(context||{}).filter(value=>value!==undefined&&value!==null&&value!=='').length,sufficient:false},story});
  const partial=moment.moment===CURRENT_MOMENTS.UNDERSTANDING;
  return {
    mode:'listen',greeting,judgement:partial?'Almost there.':'What is today asking of you?',
    reasons:['Strategos needs only the minimum context required to reason responsibly.'],confidence:'Nothing is inferred from silence.',
    action:'focus-signals',actionLabel:partial?'Continue today\u2019s check-in':'Start today\u2019s check-in',continuity:''
  };
}

export function timeGreeting(hour=new Date().getHours()){
  if(hour<12)return 'Good morning';
  if(hour<18)return 'Good afternoon';
  return 'Good evening';
}
