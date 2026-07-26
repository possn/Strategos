const requiredSignals=['sleep','energy','time','challenge','soreness','emotionalLoad'];

export function morningSignalProgress(context={}){
  const completed=requiredSignals.filter(key=>context[key]!==undefined&&context[key]!==null&&context[key]!=='').length;
  return {completed,total:requiredSignals.length,complete:completed===requiredSignals.length,ratio:completed/requiredSignals.length};
}

export function buildMorningExperience({context={},orientation=null,judgement=null,story=null,name=''}={}){
  const progress=morningSignalProgress(context);
  const hasJudgement=Boolean(judgement);
  const salutation=name?`Good morning, ${name}.`:'Good morning.';
  if(hasJudgement){
    const practice=judgement.practice?.name||judgement.practiceName||'Today’s Practice';
    const statement=judgement.judgement||judgement.statement||`Continue with ${practice}.`;
    return {
      mode:'judgement',
      salutation,
      eyebrow:"TODAY'S JUDGEMENT",
      title:statement,
      practice,
      primaryAction:'OPEN TODAY’S JUDGEMENT',
      primaryActionId:'currentJudgement',
      reasons:[
        orientation?.primary,
        orientation?.constraintText,
        orientation?.supportText
      ].filter(Boolean),
      status:story?.stage||'judgement-formed',
      progress
    };
  }
  if(progress.complete){
    return {
      mode:'ready',salutation,eyebrow:'READY TO DELIBERATE',
      title:orientation?.title||'Your context is ready.',
      practice:null,primaryAction:'CONVENE THE AGORA',primaryActionId:'consult',
      reasons:[orientation?.primary,orientation?.constraintText,orientation?.supportText].filter(Boolean),
      status:story?.stage||'context-recorded',progress
    };
  }
  return {
    mode:'check-in',salutation,eyebrow:'BEGIN THE DAY',
    title:'A few signals are enough to begin.',
    practice:null,primaryAction:'COMPLETE TODAY’S CONTEXT',primaryActionId:'morning-context',
    reasons:['Strategos will use only what you explicitly report.','You can revise today’s context at any time.'],
    status:story?.stage||'ready-to-begin',progress
  };
}
