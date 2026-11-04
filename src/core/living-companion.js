import { resolveCurrentMoment,CURRENT_MOMENTS } from './current-moment.js?v=0476p1';
const completeContext=context=>['sleep','energy','time','challenge','soreness','emotionalLoad'].every(key=>context?.[key]!==undefined&&context?.[key]!==null&&context?.[key]!=='');

export function buildLivingCompanion({name='',context={},contextEvidence=null,judgement=null,story={},hasContinuity=false}={}){
  const complete=contextEvidence?Boolean(contextEvidence.sufficient):completeContext(context);
  const stage=story?.stage||'opened';
  const completed=stage==='complete';
  const practiceComplete=['reflection','complete'].includes(stage);
  const greeting=`${timeGreeting()}${name?`, ${name}`:''}.`;

  if(completed)return {
    mode:'complete',greeting,judgement:'O dia está encerrado.',
    reasons:['The day has been deliberately closed.'],confidence:'Continuity preserved.',
    action:null,actionLabel:null,continuity:'There is continuity.'
  };
  if(practiceComplete)return {
    mode:'reflection',greeting,judgement:'O que teve valor hoje?',
    reasons:['A brief reflection can preserve what mattered without scoring the day.'],confidence:'Writing remains optional.',
    action:'eveningReflection',actionLabel:'Fechar o dia',continuity:''
  };
  if(hasContinuity)return {
    mode:'continuity',greeting,judgement:'Continua de onde ficaste.',
    reasons:['An unfinished action is already present.'],confidence:'Your existing direction is preserved.',
    action:'continue-flow',actionLabel:'Continuar',continuity:''
  };
  if(judgement){
    const choiceAction=judgement.personChoice?.action;
    if(choiceAction==='decline')return {
      mode:'declined',greeting,judgement:'Descansar também é uma decisão.',
      reasons:['This is your choice. Strategos will offer a fresh perspective whenever you are ready.'],
      confidence:'No practice is expected.',
      action:'consult',actionLabel:'Reavaliar o próximo passo',continuity:''
    };
    if(choiceAction==='defer')return {
      mode:'deferred',greeting,judgement:judgement.judgement||judgement.practice?.name||'Your recommendation is waiting.',
      reasons:['You chose to return to this later. It is still here.'],
      confidence:judgement.confidence?`${Math.round(judgement.confidence)}% confidence`:'Your current judgement is preserved.',
      action:'currentJudgement',actionLabel:'Voltar à orientação',continuity:''
    };
    return {
      mode:'judgement',greeting,judgement:judgement.judgement||judgement.practice?.name||'Your recommendation is ready.',
      reasons:[judgement.explain?.summary||judgement.intention||'This recommendation reflects what is currently known.'].filter(Boolean),
      confidence:judgement.confidence?`${Math.round(judgement.confidence)}% confidence`:'Uncertainty remains explicit.',
      action:'currentJudgement',actionLabel:'Ver a orientação de hoje',continuity:''
    };
  }
  if(complete)return {
    mode:'ready',greeting,judgement:'Há contexto para escolher um próximo passo.',
    reasons:['Your check-in is complete. Strategos can now deliberate from the context you provided.'],confidence:'No recommendation exists until deliberation completes.',
    action:'consult',actionLabel:'Ver a orientação de hoje',continuity:''
  };
  const moment=resolveCurrentMoment({contextEvidence:contextEvidence||{signals:context,completed:Object.values(context||{}).filter(value=>value!==undefined&&value!==null&&value!=='').length,sufficient:false},story});
  const partial=moment.moment===CURRENT_MOMENTS.UNDERSTANDING;
  return {
    mode:'listen',greeting,judgement:partial?'Falta pouco para compreender o teu dia.':'Como chegas a este dia?',
    reasons:['Strategos needs only the minimum context required to reason responsibly.'],confidence:'Nothing is inferred from silence.',
    action:'focus-signals',actionLabel:partial?'Continuar o check-in':'Começar o check-in',continuity:''
  };
}

export function timeGreeting(hour=new Date().getHours()){
  if(hour<12)return 'Bom dia';
  if(hour<18)return 'Boa tarde';
  return 'Boa noite';
}
