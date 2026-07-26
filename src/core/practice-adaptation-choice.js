export const ADAPTATION_LEVELS=['regression','technique','progression'];

export function availableAdaptationLevels(guidance={}){
  return ADAPTATION_LEVELS.filter(level=>Array.isArray(guidance[level])&&guidance[level].length);
}

export function resolveAdaptationChoice({
  guidance,
  recommendedLevel='technique',
  selectedLevel=null
}={}){
  const available=availableAdaptationLevels(guidance);
  const requested=selectedLevel&&available.includes(selectedLevel)
    ?selectedLevel
    :recommendedLevel;
  const applied=available.includes(requested)
    ?requested
    :available.includes('technique')
      ?'technique'
      :available[0]||null;
  const text=applied?guidance[applied][0]:null;

  return {
    available,
    requestedLevel:requested,
    appliedLevel:applied,
    text,
    personSelected:Boolean(selectedLevel&&available.includes(selectedLevel)),
    differsFromRecommendation:Boolean(
      selectedLevel&&applied&&applied!==recommendedLevel
    )
  };
}

export function setPhaseAdaptationChoice(current,phaseIndex,level){
  if(!current||!Number.isInteger(Number(phaseIndex)))return current;
  const choices={...(current.phaseAdaptations||{})};
  choices[String(Number(phaseIndex))]={
    level,
    selectedAt:new Date().toISOString(),
    source:'person'
  };
  return {...current,phaseAdaptations:choices};
}

export function getPhaseAdaptationChoice(current,phaseIndex){
  return current?.phaseAdaptations?.[String(Number(phaseIndex))]?.level||null;
}

export function adaptationChoiceSummary(choice){
  if(!choice?.appliedLevel)return 'No adaptation available.';
  const labels={
    regression:'Easier version',
    technique:'Standard technique',
    progression:'Harder version'
  };
  return `${labels[choice.appliedLevel]||choice.appliedLevel}${choice.personSelected?' · chosen by you':''}`;
}
