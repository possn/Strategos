function clean(value){return String(value||'').trim()}

export function buildPracticeExperience({phase=[],guidance=null,snapshot=null,paused=false,safetyPaused=false}={}){
  const name=clean(phase?.[0])||'Practice';
  const summary=clean(phase?.[2])||'Move with control.';
  const technique=Array.isArray(guidance?.technique)?guidance.technique.map(clean).filter(Boolean):[];
  const cue=technique[0]||summary;
  const nextName=clean(snapshot?.next?.name);
  const state=safetyPaused?'safety-paused':paused?'paused':'active';
  return {
    state,
    name,
    cue,
    summary,
    phaseLabel:snapshot?`${Number(snapshot.phaseIndex||0)+1} of ${Number(snapshot.totalPhases||1)}`:'Practice',
    nextLabel:nextName?`Next: ${nextName}`:'Final phase',
    showTechnique:technique.length>1,
    technique,
    statement:safetyPaused?'Practice is paused until you explicitly reassess.':paused?'Take the time you need. Resume when ready.':'One cue. One phase. Stay present.'
  };
}

export function practiceExperienceAudit(model={}){
  return {
    primaryCues:model?.cue?1:0,
    automaticProgression:0,
    automaticAdaptation:0,
    safetyOverride:0,
    statement:'The focused Practice surface changes presentation only. Execution, safety and person control remain authoritative.'
  };
}
