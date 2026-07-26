const TERMINAL_CHOICE_ACTIONS=new Set(['decline']);
const TERMINAL_OUTCOME_STAGES=new Set(['reflected','abandoned']);

export function reconcileAgencyState(state){
  const next=clone(state||{});
  const report={
    orphanChoicesRemoved:0,
    orphanOutcomesRemoved:0,
    duplicateOutcomeRecordsRemoved:0,
    duplicatePreferencesRemoved:0,
    judgementChoiceLinksRepaired:0,
    invalidPreferenceCandidatesRejected:0,
    impossibleCurrentCleared:false
  };

  const judgementIds=new Set((next.judgements||[]).map(item=>item.id).filter(Boolean));
  const choicesById=new Map();
  next.choiceLog=(next.choiceLog||[]).filter(choice=>{
    if(!choice?.id||!choice?.judgementId||!judgementIds.has(choice.judgementId)){
      report.orphanChoicesRemoved+=1;
      return false;
    }
    choicesById.set(choice.id,choice);
    return true;
  });

  const seenOutcomes=new Set();
  next.outcomeRecords=(next.outcomeRecords||[]).filter(record=>{
    if(!record?.id||seenOutcomes.has(record.id)){
      report.duplicateOutcomeRecordsRemoved+=1;
      return false;
    }
    seenOutcomes.add(record.id);
    if(!judgementIds.has(record.judgementId)||!choicesById.has(record.choiceId)){
      report.orphanOutcomesRemoved+=1;
      return false;
    }
    return true;
  });

  const latestChoiceByJudgement=new Map();
  for(const choice of next.choiceLog){
    const existing=latestChoiceByJudgement.get(choice.judgementId);
    if(!existing||new Date(choice.at)>new Date(existing.at))latestChoiceByJudgement.set(choice.judgementId,choice);
  }

  next.judgements=(next.judgements||[]).map(judgement=>{
    const choice=latestChoiceByJudgement.get(judgement.id);
    if(!choice)return judgement;
    if(judgement.personChoice?.id===choice.id)return judgement;
    report.judgementChoiceLinksRepaired+=1;
    return {...judgement,personChoice:choice};
  });

  const validPreferenceKeys=new Set();
  next.preferenceModel=(next.preferenceModel||[]).filter(preference=>{
    const sourceChoice=choicesById.get(preference.sourceChoiceId);
    const sourceOutcome=(next.outcomeRecords||[]).find(record=>record.choiceId===preference.sourceChoiceId);
    const validSource=
      sourceChoice?.action==='choose-alternative'&&
      sourceOutcome?.stage==='reflected'&&
      sourceOutcome?.startedPracticeId===sourceOutcome?.chosenPracticeId&&
      Number(sourceOutcome?.completionRatio||0)>=.5;

    if(!validSource){
      report.invalidPreferenceCandidatesRejected+=1;
      preference.status='rejected';
      preference.correction={
        at:new Date().toISOString(),
        note:'Preference source did not contain an eligible choice-to-outcome record.'
      };
    }

    const key=[
      preference.preferredPracticeId,
      preference.recommendedPracticeId,
      preference.contextKey,
      preference.status
    ].join('|');
    if(validPreferenceKeys.has(key)){
      report.duplicatePreferencesRemoved+=1;
      return false;
    }
    validPreferenceKeys.add(key);
    return true;
  });

  if(next.current?.decision){
    const currentJudgement=next.judgements.find(item=>item.id===next.current.decision.id);
    const currentChoice=currentJudgement?.personChoice;
    const currentOutcome=(next.outcomeRecords||[]).find(record=>record.judgementId===currentJudgement?.id);

    const impossible=
      !currentJudgement||
      TERMINAL_CHOICE_ACTIONS.has(currentChoice?.action)||
      currentJudgement.status==='declined'||
      currentJudgement.validity?.status==='closed'||
      (currentOutcome&&TERMINAL_OUTCOME_STAGES.has(currentOutcome.stage));

    if(impossible){
      next.current=null;
      report.impossibleCurrentCleared=true;
    }else{
      next.current={...next.current,decision:{...currentJudgement}};
      if(currentOutcome)next.current.outcomeRecordId=currentOutcome.id;
    }
  }

  next.agencyIntegrity={
    ...(next.agencyIntegrity||{}),
    lastReconciledAt:new Date().toISOString(),
    lastReport:report
  };

  return {state:next,report};
}

export function agencyConsistencySnapshot(state){
  const choices=(state.choiceLog||[]).length;
  const outcomes=(state.outcomeRecords||[]).length;
  const reflected=(state.outcomeRecords||[]).filter(item=>item.stage==='reflected').length;
  const eligiblePreferences=(state.preferenceModel||[]).filter(item=>['candidate','confirmed'].includes(item.status)).length;
  const mismatches=(state.outcomeRecords||[]).filter(item=>String(item.integrity||'').includes('mismatch')).length;

  return {
    choices,
    outcomes,
    reflected,
    eligiblePreferences,
    mismatches,
    status:mismatches===0?'coherent':'review-required'
  };
}

export function canCreatePreferenceFromOutcome(choice,outcome){
  return Boolean(
    choice?.action==='choose-alternative'&&
    outcome?.stage==='reflected'&&
    outcome?.startedPracticeId===outcome?.chosenPracticeId&&
    Number(outcome?.completionRatio||0)>=.5
  );
}

export function learningSourceSummary(state){
  const records=(state.outcomeRecords||[]);
  const eligible=records.filter(record=>
    record.stage==='reflected'&&
    record.startedPracticeId===record.chosenPracticeId&&
    Number(record.completionRatio||0)>=.5
  ).length;
  return {
    total:records.length,
    eligible,
    ineligible:records.length-eligible,
    statement:`${eligible} of ${records.length} choice-to-outcome records are eligible to inform learning.`
  };
}

function clone(value){
  return typeof structuredClone==='function'
    ?structuredClone(value)
    :JSON.parse(JSON.stringify(value));
}
