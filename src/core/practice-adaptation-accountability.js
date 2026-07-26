export function buildAdaptationAccountability({
  phaseAdaptations={},
  confirmedDefaults={},
  phases=[],
  reflectionValue='unknown',
  fit='unknown',
  at=new Date().toISOString()
}={}){
  const combined={...(confirmedDefaults||{}),...(phaseAdaptations||{})};
  const choices=Object.entries(combined)
    .map(([index,record])=>{
      const phaseIndex=Number(index);
      const phase=phases?.[phaseIndex];
      return {
        phaseIndex,
        phaseName:String(phase?.[0]||`Phase ${phaseIndex+1}`),
        level:normaliseLevel(record?.level),
        selectedAt:record?.selectedAt||record?.appliedAt||null,
        source:record?.source==='confirmed-pattern'?'confirmed-pattern':'person',
        patternId:record?.patternId||null
      };
    })
    .filter(item=>item.level)
    .sort((a,b)=>a.phaseIndex-b.phaseIndex);

  return {
    id:`adaptation-accountability-${Date.parse(at)||Date.now()}`,
    at,
    choices,
    choiceCount:choices.length,
    fit:normaliseFit(fit),
    reflectionValue,
    eligibleForPreferenceLearning:false,
    statement:buildStatement(choices,fit)
  };
}

export function hasPersonAdaptations(current){
  return Boolean(current?.phaseAdaptations&&Object.keys(current.phaseAdaptations).length);
}

export function hasAppliedAdaptations(current){
  return Boolean(
    (current?.phaseAdaptations&&Object.keys(current.phaseAdaptations).length)||
    (current?.confirmedAdaptationDefaults&&Object.keys(current.confirmedAdaptationDefaults).length)
  );
}

export function adaptationReflectionPrompt(current,phases=[]){
  if(!hasAppliedAdaptations(current))return null;
  const personCount=Object.keys(current?.phaseAdaptations||{}).length;
  const defaultCount=Object.keys(current?.confirmedAdaptationDefaults||{}).length;
  const count=new Set([
    ...Object.keys(current?.confirmedAdaptationDefaults||{}),
    ...Object.keys(current?.phaseAdaptations||{})
  ]).size;
  const source=personCount?'chosen':'started';
  return {
    count,
    title:count===1?`Did the ${source} version fit?`:`Did the ${source} versions fit?`,
    description:defaultCount&&!personCount
      ?'This checks whether the confirmed recurring choice still fits in real use. A worse result can pause that default for review.'
      :'This records what happened. It does not turn a single choice into a permanent preference.'
  };
}

export function adaptationAccountabilitySummary(record){
  if(!record?.choiceCount)return 'No in-session adaptation was selected.';
  const labels=record.choices.map(item=>`${item.phaseName}: ${labelForLevel(item.level)}${item.source==='confirmed-pattern'?' (confirmed default)':''}`);
  return `${labels.join(' · ')} · fit: ${labelForFit(record.fit)}`;
}

function buildStatement(choices,fit){
  if(!choices.length)return 'No adaptation was used.';
  const confirmed=choices.filter(item=>item.source==='confirmed-pattern').length;
  const person=choices.length-confirmed;
  const sources=[
    person?`${person} person-directed`:null,
    confirmed?`${confirmed} confirmed-default`:null
  ].filter(Boolean).join(' and ');
  return `${sources} adaptation${choices.length===1?'':'s'} recorded; perceived fit: ${labelForFit(normaliseFit(fit))}.`;
}

function normaliseLevel(level){
  return ['regression','technique','progression'].includes(level)?level:null;
}

function normaliseFit(value){
  return ['better','right','worse','unknown'].includes(value)?value:'unknown';
}

function labelForLevel(level){
  return level==='regression'?'easier':level==='progression'?'harder':'standard';
}

function labelForFit(fit){
  return fit==='better'?'better than the suggested level'
    :fit==='right'?'about right'
      :fit==='worse'?'worse than the suggested level'
        :'not assessed';
}
