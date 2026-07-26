const FAMILY_LABELS={
  current_signal:'Current person signal',
  person_history:'Reflected person history',
  advisor_memory:'Advisor-specific memory',
  scientific_framework:'Scientific framework',
  deterministic_rule:'Deterministic safety rule',
  professional_input:'Professional input',
  tool_result:'Tool result',
  model_inference:'Model inference'
};

export function evidenceItem(family,description,{source='Strategos',reliability='moderate',independent=true,observedAt=null}={}){
  return {family,description,source,reliability,independent,observedAt};
}

export function assessEvidenceDiversity(advisors=[]){
  const items=advisors.flatMap(a=>a.evidence||[]);
  const families=[...new Set(items.map(x=>x.family).filter(Boolean))];
  const independentFamilies=[...new Set(items.filter(x=>x.independent!==false).map(x=>x.family).filter(Boolean))];
  const advisorFamilies=Object.fromEntries(advisors.map(a=>[a.advisor,[...new Set((a.evidence||[]).map(x=>x.family).filter(Boolean))]]));
  const correlated=items.length>1 && independentFamilies.length<=1;
  const level=independentFamilies.length>=3?'Diverse':independentFamilies.length===2?'Mixed':'Narrow';
  return {
    level,
    families,
    independentFamilies,
    advisorFamilies,
    correlated,
    statement: level==='Diverse'
      ?`The judgement draws on ${independentFamilies.length} independent evidence families.`
      :level==='Mixed'
        ?'The judgement draws on two evidence families; important conclusions remain partly correlated.'
        :'The judgement relies on a narrow evidence base and should remain provisional.'
  };
}

export function detectContradictions(context={},understanding={},history=[]){
  const contradictions=[];
  if(context.energy===3 && context.soreness==='significant') contradictions.push({
    id:'energy-vs-soreness',severity:'high',domains:['Body','Recovery'],
    statement:'High reported energy conflicts with significant soreness.',
    implication:'Physical loading should remain constrained despite subjective energy.'
  });
  if(context.challenge==='work' && context.emotionalLoad==='heavy') contradictions.push({
    id:'work-vs-emotional-load',severity:'moderate',domains:['Mind','Recovery','Purpose'],
    statement:'A strong work claim conflicts with heavy emotional load.',
    implication:'A smaller action or recovery-oriented option may preserve capacity better than full focus work.'
  });
  if(context.challenge==='body' && (context.sleep<=1 || context.energy<=1)) contradictions.push({
    id:'body-goal-vs-capacity',severity:'moderate',domains:['Body','Recovery','Agency'],
    statement:'The desire for physical work conflicts with low available capacity.',
    implication:'The physical goal may remain valid while today’s implementation needs modification.'
  });
  const recentWorse=(history||[]).slice(0,6).filter(x=>x.reflection==='worse').length;
  if(recentWorse>=2) contradictions.push({
    id:'recent-outcomes-vs-current-model',severity:'moderate',domains:['Agency','Mind'],
    statement:'Several recent outcomes did not validate the previous judgements.',
    implication:'Confidence should be reduced until the model explains the mismatch.'
  });
  if(understanding?.helpfulRate!=null && understanding.helpfulRate<.45) contradictions.push({
    id:'low-validation-rate',severity:'moderate',domains:['Mind','Agency'],
    statement:'Recent reflected outcomes provide limited validation of the current decision model.',
    implication:'Prefer reversible choices and preserve alternatives.'
  });
  return contradictions;
}

export function familyLabel(family){return FAMILY_LABELS[family]||family}
