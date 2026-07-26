export function buildPracticeSessionSnapshot({phases=[],execution=null,now=Date.now()}={}){
  if(!Array.isArray(phases)||!phases.length)return {phaseIndex:0,phaseCount:0,completedPhases:0,progressRatio:0,current:null,next:null,previous:null,remainingPracticeSeconds:0,elapsedPracticeSeconds:0};
  const phaseIndex=Math.max(0,Math.min(phases.length-1,Number(execution?.phaseIndex)||0));
  const current=normalisePhase(phases[phaseIndex],phaseIndex);
  const next=phaseIndex+1<phases.length?normalisePhase(phases[phaseIndex+1],phaseIndex+1):null;
  const previous=phaseIndex>0?normalisePhase(phases[phaseIndex-1],phaseIndex-1):null;
  const phaseRemaining=remainingPhaseSeconds(execution,current.duration,now);
  const completedDuration=phases.slice(0,phaseIndex).reduce((s,p)=>s+Number(p?.[1]||0),0);
  const currentElapsed=Math.max(0,current.duration-phaseRemaining);
  const totalDuration=phases.reduce((s,p)=>s+Number(p?.[1]||0),0);
  const elapsedPracticeSeconds=Math.min(totalDuration,completedDuration+currentElapsed);
  return {phaseIndex,phaseCount:phases.length,completedPhases:phaseIndex,progressRatio:totalDuration?+(elapsedPracticeSeconds/totalDuration).toFixed(4):0,current:{...current,remainingSeconds:phaseRemaining},next,previous,remainingPracticeSeconds:Math.max(0,Math.ceil(totalDuration-elapsedPracticeSeconds)),elapsedPracticeSeconds:Math.floor(elapsedPracticeSeconds)};
}
export function sessionCompletionRatio(phases=[],execution=null,now=Date.now()){return buildPracticeSessionSnapshot({phases,execution,now}).progressRatio}
export function canMovePhase(phases=[],execution=null,direction=1){if(!Array.isArray(phases)||!phases.length)return false;const i=Math.max(0,Math.min(phases.length-1,Number(execution?.phaseIndex)||0));const target=i+Math.sign(direction||1);return target>=0&&target<phases.length}
export function describePracticeResume(snapshot){if(!snapshot?.current)return 'The Practice can be resumed.';return `You were in “${snapshot.current.name}” with ${formatDuration(snapshot.current.remainingSeconds)} remaining.${snapshot.next?` Next: ${snapshot.next.name}.`:' This is the final phase.'}`}
export function practiceSessionSummary(snapshot){if(!snapshot?.phaseCount)return 'No active Practice session.';return `${snapshot.phaseIndex+1} of ${snapshot.phaseCount} phases · ${formatDuration(snapshot.remainingPracticeSeconds)} remaining`}
export function formatDuration(seconds){const safe=Math.max(0,Math.ceil(Number(seconds)||0)),m=Math.floor(safe/60),r=safe%60;if(m===0)return `${r}s`;if(r===0)return `${m} min`;return `${m}m ${r}s`}
function remainingPhaseSeconds(execution,duration,now){if(!execution)return duration;const started=Date.parse(execution.phaseStartedAt||'');if(!Number.isFinite(started))return duration;const endpoint=execution.status==='paused'&&execution.pausedAt?Date.parse(execution.pausedAt):now;const elapsed=Math.max(0,(endpoint-started)/1000-(Number(execution.totalPausedDuration)||0));return Math.max(0,Math.ceil(duration-elapsed))}
function normalisePhase(phase,index){return {index,name:String(phase?.[0]||`Phase ${index+1}`),duration:Math.max(0,Number(phase?.[1]||0)),summary:String(phase?.[2]||''),guidance:Array.isArray(phase?.[3])?phase[3]:[]}}


/* v0.19.0 Phase 1 — explicit Practice contract before action */
export function buildPracticeContract({judgement=null,context={},phases=[],revision=null}={}){
  const practice=judgement?.practice||{};
  const duration=Math.max(1,Number(judgement?.duration)||Math.round((phases||[]).reduce((sum,phase)=>sum+Number(phase?.[1]||0),0)/60)||1);
  const intention=String(judgement?.intention||judgement?.judgement||practice?.name||'Complete the proposed Practice.').trim();
  const baseExpectedEffect=expectedEffectFor(practice,judgement);
  const expectedEffect=revision?.status==='accepted'&&revision?.practiceId===practice?.id
    ?String(revision.proposedExpectedEffect||baseExpectedEffect)
    :baseExpectedEffect;
  const enough=duration<=5
    ?'Completing the planned time is enough. Stop earlier if the Practice becomes unsafe or clearly unhelpful.'
    :`The planned ${duration} minutes are sufficient. Partial completion can still be recorded honestly.`;
  return {
    version:1,
    practiceId:practice?.id||null,
    practiceName:String(practice?.name||'Practice'),
    intention,
    expectedEffect,
    baseExpectedEffect,
    revisionId:revision?.status==='accepted'&&revision?.practiceId===practice?.id?(revision.proposalId||revision.id||null):null,
    durationMinutes:duration,
    enough,
    review:reviewQuestionFor(practice),
    stopConditions:contractStopConditions(practice,context),
    certainty:'This is a working expectation, not a promised outcome.',
    judgementId:judgement?.id||null
  };
}
export function practiceContractSummary(contract){
  if(!contract)return 'No Practice contract is available.';
  return `${contract.practiceName} · ${contract.durationMinutes} min · expected: ${contract.expectedEffect}`;
}
export function snapshotPracticeContract(contract,at=new Date().toISOString()){
  if(!contract)return null;
  return {...contract,createdAt:at,source:'current-judgement',editableDuringPractice:false};
}
function expectedEffectFor(practice,judgement){
  const text=`${practice?.domain||''} ${practice?.id||''} ${practice?.name||''}`.toLowerCase();
  if(/recovery|restore|breath|calm|reset/.test(text))return 'A modest improvement in steadiness, recovery or perceived load.';
  if(/connection|relationship|social/.test(text))return 'A clearer sense of contact, support or relational presence.';
  if(/focus|agency|plan|clarity/.test(text))return 'Greater clarity about the next deliberate action.';
  if(/strength|movement|body|mobility/.test(text))return 'A controlled physical stimulus without loss of technique or safety.';
  return String(judgement?.forecast?.expectedEffect||'A useful, proportionate change in the area this Practice addresses.');
}
function reviewQuestionFor(practice){
  const domain=String(practice?.domain||'').toLowerCase();
  if(domain==='recovery')return 'Did this leave you steadier or less burdened than before?';
  if(domain==='relationships')return 'Did this create meaningful contact or understanding?';
  if(domain==='agency')return 'Did this make the next action clearer or easier to begin?';
  return 'Did the Practice produce the intended effect at an acceptable burden?';
}
function contractStopConditions(practice,context){
  const conditions=['Stop for sharp pain, dizziness, loss of control or a clear worsening of distress.','You may end early and record what actually happened.'];
  const soreness=String(context?.soreness||'').toLowerCase();
  const energy=Number(context?.energy);
  if(['significant','high','severe'].includes(soreness))conditions.unshift('Use the least demanding valid version because significant soreness is present.');
  if(energy===1||String(context?.energy).toLowerCase()==='low')conditions.unshift('Keep intensity conservative because energy is low.');
  if(String(practice?.domain||'').toLowerCase()==='recovery')conditions.push('This should feel restorative rather than effortful.');
  return [...new Set(conditions)];
}


/* v0.19.0 Phase 2 — resolve Practice contract against reflection */
export function resolvePracticeContract({
  contract=null,
  reflection={},
  completedRatio=1,
  at=new Date().toISOString()
}={}){
  if(!contract)return null;
  const effect=normaliseReflectionValue(reflection.effect,['better','right','worse'],'unknown');
  const goalFit=normaliseReflectionValue(reflection.goalFit,['strong','partial','poor','unknown'],'unknown');
  const burden=normaliseReflectionValue(reflection.burden,['low','moderate','high','unknown'],'unknown');
  const ratio=Math.max(0,Math.min(1,Number(completedRatio)||0));

  let status='uncertain';
  if(effect==='worse'||goalFit==='poor'||burden==='high')status='misaligned';
  else if((effect==='better'||effect==='right')&&goalFit==='strong'&&['low','moderate'].includes(burden))status='aligned';
  else if(effect!=='unknown'||goalFit!=='unknown'||burden!=='unknown')status='partially-aligned';

  return {
    id:`practice-contract-outcome-${Date.parse(at)||Date.now()}`,
    contractVersion:contract.version||1,
    judgementId:contract.judgementId||null,
    practiceId:contract.practiceId||null,
    expectedEffect:contract.expectedEffect,
    reflectionQuestion:contract.review,
    effect,
    goalFit,
    burden,
    completedRatio:ratio,
    status,
    resolvedAt:at,
    statement:practiceContractOutcomeStatement({status,effect,goalFit,burden,completedRatio:ratio})
  };
}

export function practiceContractOutcomeStatement(outcome){
  if(!outcome)return 'The Practice contract has not been resolved.';
  if(outcome.status==='aligned')return 'The observed result broadly matched the pre-action contract.';
  if(outcome.status==='misaligned')return 'The observed result did not match the pre-action contract closely enough.';
  if(outcome.status==='partially-aligned')return 'The observed result matched part of the pre-action contract, with important uncertainty.';
  return 'There is not enough reflection evidence to judge the pre-action contract.';
}

function normaliseReflectionValue(value,allowed,fallback){
  return allowed.includes(value)?value:fallback;
}


/* v0.19.0 Phase 3 — repeated Practice contract calibration candidates */
export function derivePracticeContractCalibration(history=[],now=Date.now()){
  const cutoff=now-180*86400000;
  const groups=new Map();

  for(const entry of history||[]){
    const outcome=entry?.practiceContractOutcome;
    const contract=entry?.practiceContract;
    const at=Date.parse(outcome?.resolvedAt||entry?.completedAt||'');
    const practiceId=outcome?.practiceId||contract?.practiceId||entry?.decision?.practice?.id||null;
    if(!practiceId||!Number.isFinite(at)||at<cutoff||!outcome)continue;
    if(!['aligned','partially-aligned','misaligned'].includes(outcome.status))continue;

    const current=groups.get(practiceId)||{
      id:`practice-contract-calibration-${String(practiceId).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,
      practiceId,
      observations:[],
      aligned:0,
      partial:0,
      misaligned:0,
      firstObservedAt:null,
      lastObservedAt:null,
      judgementInfluence:0
    };

    current.observations.push({
      historyId:entry.id||entry.judgementId||`${practiceId}-${at}`,
      at:new Date(at).toISOString(),
      status:outcome.status,
      effect:outcome.effect,
      goalFit:outcome.goalFit,
      burden:outcome.burden,
      expectedEffect:outcome.expectedEffect
    });
    current.aligned+=outcome.status==='aligned'?1:0;
    current.partial+=outcome.status==='partially-aligned'?1:0;
    current.misaligned+=outcome.status==='misaligned'?1:0;
    current.firstObservedAt=current.firstObservedAt&&Date.parse(current.firstObservedAt)<at
      ?current.firstObservedAt:new Date(at).toISOString();
    current.lastObservedAt=current.lastObservedAt&&Date.parse(current.lastObservedAt)>at
      ?current.lastObservedAt:new Date(at).toISOString();
    groups.set(practiceId,current);
  }

  return [...groups.values()].map(finaliseContractCalibration)
    .sort((a,b)=>Date.parse(b.lastObservedAt||0)-Date.parse(a.lastObservedAt||0));
}

export function practiceContractCalibrationCandidates(history=[],now=Date.now()){
  return derivePracticeContractCalibration(history,now).filter(item=>item.status==='candidate');
}

export function practiceContractCalibrationSummary(item){
  if(!item)return 'No Practice contract calibration.';
  if(item.direction==='mostly-aligned'){
    return `${item.aligned} of ${item.total} comparable contracts broadly matched what happened.`;
  }
  if(item.direction==='often-misaligned'){
    return `${item.misaligned} of ${item.total} comparable contracts did not match closely enough.`;
  }
  return `${item.total} comparable contracts show mixed or incomplete alignment.`;
}

export function practiceContractCalibrationAudit(history=[],now=Date.now()){
  const items=derivePracticeContractCalibration(history,now);
  return {
    total:items.length,
    candidates:items.filter(item=>item.status==='candidate').length,
    insufficient:items.filter(item=>item.status==='insufficient').length,
    influential:0,
    statement:items.some(item=>item.status==='candidate')
      ?'Repeated contract outcomes are visible for calibration review but do not alter future contracts or judgements.'
      :'No Practice has enough comparable contract outcomes for calibration yet.'
  };
}

function finaliseContractCalibration(item){
  const uniqueSessions=new Set(item.observations.map(observation=>observation.historyId)).size;
  const total=item.aligned+item.partial+item.misaligned;
  const direction=total&&item.aligned/total>=2/3
    ?'mostly-aligned'
    :item.misaligned>=Math.ceil(total*0.5)
      ?'often-misaligned'
      :'mixed';
  return {
    ...item,
    uniqueSessions,
    total,
    status:uniqueSessions>=3?'candidate':'insufficient',
    direction,
    expectedEffectSamples:[...new Set(item.observations.map(observation=>observation.expectedEffect).filter(Boolean))].slice(0,3),
    eligibleForContractChange:false,
    eligibleForJudgementInfluence:false,
    evidenceBoundary:'Minimum 3 resolved comparable contracts within 180 days.'
  };
}


/* v0.19.0 Phase 4 — person review of Practice contract calibration */
export function applyPracticeContractCalibrationReview(reviews=[],{
  calibrationId,
  action,
  at=new Date().toISOString()
}={}){
  if(!calibrationId||!['confirm','reject','reopen'].includes(action))return [...(reviews||[])];
  const status=action==='confirm'?'confirmed':action==='reject'?'rejected':'candidate';
  const next={
    calibrationId,
    status,
    reviewedAt:at,
    source:'person',
    contractInfluence:0,
    judgementInfluence:0
  };
  return [
    next,
    ...(reviews||[]).filter(item=>item?.calibrationId!==calibrationId)
  ].slice(0,200);
}

export function practiceContractCalibrationReviewFor(reviews=[],calibrationId){
  return (reviews||[]).find(item=>item?.calibrationId===calibrationId)||null;
}

export function mergePracticeContractCalibrationReviews(items=[],reviews=[]){
  return (items||[]).map(item=>{
    const review=practiceContractCalibrationReviewFor(reviews,item.id);
    return {
      ...item,
      review,
      reviewStatus:review?.status||item.status,
      personConfirmed:review?.status==='confirmed',
      personRejected:review?.status==='rejected',
      eligibleForContractChange:false,
      eligibleForJudgementInfluence:false,
      contractInfluence:0,
      judgementInfluence:0
    };
  });
}

export function reconcilePracticeContractCalibrationReviews(reviews=[],items=[]){
  const known=new Set((items||[]).map(item=>item.id));
  const seen=new Set();
  return (reviews||[]).filter(item=>{
    if(!item?.calibrationId||seen.has(item.calibrationId)||!known.has(item.calibrationId))return false;
    seen.add(item.calibrationId);
    return true;
  }).map(item=>({
    calibrationId:item.calibrationId,
    status:['candidate','confirmed','rejected'].includes(item.status)?item.status:'candidate',
    reviewedAt:item.reviewedAt||null,
    source:'person',
    contractInfluence:0,
    judgementInfluence:0
  }));
}

export function practiceContractCalibrationReviewSummary(item){
  if(!item)return 'No calibration review available.';
  if(item.reviewStatus==='confirmed')return 'Confirmed by you as an accurate description of repeated contract outcomes.';
  if(item.reviewStatus==='rejected')return 'Rejected by you as a misleading calibration pattern.';
  return 'Awaiting your review.';
}

export function practiceContractCalibrationReviewAudit(items=[]){
  return {
    candidate:(items||[]).filter(item=>item.reviewStatus==='candidate').length,
    confirmed:(items||[]).filter(item=>item.reviewStatus==='confirmed').length,
    rejected:(items||[]).filter(item=>item.reviewStatus==='rejected').length,
    contractInfluence:0,
    judgementInfluence:0,
    statement:'Review changes accountability status only. Contract calibration still changes neither future contracts nor judgements.'
  };
}


/* v0.19.0 Phase 5 — person-authorised Practice contract revision */
export function buildPracticeContractRevisionProposals(calibrations=[],reviews=[],decisions=[]){
  const reviewById=new Map((reviews||[]).map(review=>[review.calibrationId,review]));
  const decisionById=new Map((decisions||[]).map(decision=>[decision.proposalId,decision]));

  return (calibrations||[])
    .filter(item=>reviewById.get(item.id)?.status==='confirmed')
    .map(item=>{
      const proposal=proposalFromCalibration(item);
      const decision=decisionById.get(proposal.id);
      return {
        ...proposal,
        decision:decision||null,
        status:decision?.status||'proposed',
        decidedAt:decision?.decidedAt||null,
        source:'confirmed-contract-calibration',
        judgementInfluence:0
      };
    });
}

export function applyPracticeContractRevisionDecision(decisions=[],{
  proposal,
  action,
  at=new Date().toISOString()
}={}){
  if(!proposal?.id||!['accept','decline','reopen'].includes(action))return [...(decisions||[])];
  const status=action==='accept'?'accepted':action==='decline'?'declined':'proposed';
  const next={
    proposalId:proposal.id,
    calibrationId:proposal.calibrationId,
    practiceId:proposal.practiceId,
    status,
    proposedExpectedEffect:proposal.proposedExpectedEffect,
    previousExpectedEffect:proposal.previousExpectedEffect,
    direction:proposal.direction,
    decidedAt:at,
    source:'person',
    judgementInfluence:0
  };
  return [
    next,
    ...(decisions||[]).filter(item=>item?.proposalId!==proposal.id)
  ].slice(0,200);
}

export function reconcilePracticeContractRevisionDecisions(decisions=[],proposals=[]){
  const known=new Map((proposals||[]).map(proposal=>[proposal.id,proposal]));
  const seen=new Set();
  return (decisions||[]).filter(item=>{
    if(!item?.proposalId||seen.has(item.proposalId)||!known.has(item.proposalId))return false;
    seen.add(item.proposalId);
    return true;
  }).map(item=>{
    const proposal=known.get(item.proposalId);
    return {
      proposalId:item.proposalId,
      calibrationId:proposal.calibrationId,
      practiceId:proposal.practiceId,
      status:['proposed','accepted','declined'].includes(item.status)?item.status:'proposed',
      proposedExpectedEffect:proposal.proposedExpectedEffect,
      previousExpectedEffect:proposal.previousExpectedEffect,
      direction:proposal.direction,
      decidedAt:item.decidedAt||null,
      source:'person',
      judgementInfluence:0
    };
  });
}

export function effectivePracticeContractRevision(decisions=[],practiceId){
  if(!practiceId)return null;
  return (decisions||[])
    .filter(item=>item?.practiceId===practiceId&&item.status==='accepted')
    .sort((a,b)=>Date.parse(b.decidedAt||0)-Date.parse(a.decidedAt||0))[0]||null;
}

export function practiceContractRevisionSummary(proposal){
  if(!proposal)return 'No Practice contract revision proposal.';
  if(proposal.status==='accepted')return 'Accepted by you for future contracts of this Practice.';
  if(proposal.status==='declined')return 'Declined by you. The existing contract wording remains.';
  return 'Awaiting your decision. Nothing changes until you accept.';
}

function proposalFromCalibration(item){
  const previousExpectedEffect=item.expectedEffectSamples?.[0]||'A useful, proportionate change in the area this Practice addresses.';
  const proposedExpectedEffect=item.direction==='often-misaligned'
    ?`A smaller or less consistent effect than previously expected; the result should be treated as uncertain until more evidence accumulates.`
    :item.direction==='mostly-aligned'
      ?`A modest effect broadly consistent with prior experience, while remaining uncertain for any single Practice.`
      :`A variable effect that may help in some contexts but should not be expected consistently.`;

  return {
    id:`practice-contract-revision-${item.practiceId}-${item.direction}`,
    calibrationId:item.id,
    practiceId:item.practiceId,
    direction:item.direction,
    previousExpectedEffect,
    proposedExpectedEffect,
    evidenceCount:item.total,
    evidenceBoundary:item.evidenceBoundary,
    contractScope:'expected-effect-only',
    judgementInfluence:0
  };
}


/* v0.20.0 Phase 1 — Practice dose evidence, visibility only */
export function derivePracticeDoseEvidence(history=[],now=Date.now()){
  const cutoff=now-180*86400000;
  const groups=new Map();

  for(const entry of history||[]){
    const contract=entry?.practiceContract;
    const outcome=entry?.practiceContractOutcome;
    const at=Date.parse(outcome?.resolvedAt||entry?.completedAt||'');
    const practiceId=outcome?.practiceId||contract?.practiceId||entry?.decision?.practice?.id||null;
    if(!practiceId||!Number.isFinite(at)||at<cutoff||!contract||!outcome)continue;

    const plannedMinutes=Math.max(1,Number(contract.durationMinutes)||0);
    const completionRatio=normaliseCompletionRatio(
      entry?.outcomeRecord?.completionRatio ??
      outcome?.completedRatio ??
      entry?.completionRatio ??
      (entry?.completed?1:0)
    );
    const actualMinutes=+(plannedMinutes*completionRatio).toFixed(1);
    const doseBand=practiceDoseBand(completionRatio);
    const key=`${practiceId}|${doseBand}`;

    const current=groups.get(key)||{
      id:`practice-dose-evidence-${slug(practiceId)}-${doseBand}`,
      practiceId,
      doseBand,
      observations:[],
      aligned:0,
      partial:0,
      misaligned:0,
      totalActualMinutes:0,
      judgementInfluence:0,
      contractInfluence:0,
      durationInfluence:0
    };

    current.observations.push({
      historyId:entry.id||entry.judgementId||`${practiceId}-${at}`,
      at:new Date(at).toISOString(),
      plannedMinutes,
      actualMinutes,
      completionRatio,
      contractStatus:outcome.status,
      effect:outcome.effect,
      goalFit:outcome.goalFit,
      burden:outcome.burden
    });
    current.aligned+=outcome.status==='aligned'?1:0;
    current.partial+=outcome.status==='partially-aligned'?1:0;
    current.misaligned+=outcome.status==='misaligned'?1:0;
    current.totalActualMinutes+=actualMinutes;
    groups.set(key,current);
  }

  return [...groups.values()]
    .map(finalisePracticeDoseEvidence)
    .sort((a,b)=>Date.parse(b.lastObservedAt||0)-Date.parse(a.lastObservedAt||0));
}

export function practiceDoseEvidenceCandidates(history=[],now=Date.now()){
  return derivePracticeDoseEvidence(history,now).filter(item=>item.status==='candidate');
}

export function practiceDoseEvidenceSummary(item){
  if(!item)return 'No Practice dose evidence.';
  const label=item.doseBand==='full'?'full planned dose':item.doseBand==='partial'?'partial planned dose':'short dose';
  if(item.direction==='mostly-aligned')return `${label}: ${item.aligned} of ${item.total} comparable outcomes broadly matched the contract.`;
  if(item.direction==='often-misaligned')return `${label}: ${item.misaligned} of ${item.total} comparable outcomes did not match closely enough.`;
  return `${label}: ${item.total} comparable outcomes remain mixed or incomplete.`;
}

export function practiceDoseEvidenceAudit(history=[],now=Date.now()){
  const items=derivePracticeDoseEvidence(history,now);
  return {
    total:items.length,
    candidates:items.filter(item=>item.status==='candidate').length,
    insufficient:items.filter(item=>item.status==='insufficient').length,
    durationInfluence:0,
    contractInfluence:0,
    judgementInfluence:0,
    statement:items.some(item=>item.status==='candidate')
      ?'Repeated dose-outcome evidence is visible for review but changes neither duration, contracts nor judgements.'
      :'No Practice dose band has enough comparable resolved outcomes yet.'
  };
}

function finalisePracticeDoseEvidence(item){
  const uniqueSessions=new Set(item.observations.map(observation=>observation.historyId)).size;
  const total=item.aligned+item.partial+item.misaligned;
  const direction=total&&item.aligned/total>=2/3
    ?'mostly-aligned'
    :item.misaligned>=Math.ceil(total*0.5)
      ?'often-misaligned'
      :'mixed';
  const averageActualMinutes=total?+(item.totalActualMinutes/total).toFixed(1):0;
  const ordered=[...item.observations].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
  return {
    ...item,
    uniqueSessions,
    total,
    direction,
    averageActualMinutes,
    firstObservedAt:ordered[0]?.at||null,
    lastObservedAt:ordered.at(-1)?.at||null,
    status:uniqueSessions>=3?'candidate':'insufficient',
    evidenceBoundary:'Minimum 3 resolved same-Practice outcomes in the same dose band within 180 days.',
    eligibleForDurationChange:false,
    eligibleForContractChange:false,
    eligibleForJudgementInfluence:false
  };
}

function practiceDoseBand(ratio){
  if(ratio>=0.9)return 'full';
  if(ratio>=0.5)return 'partial';
  return 'short';
}

function normaliseCompletionRatio(value){
  const number=Number(value);
  if(!Number.isFinite(number))return 0;
  return Math.max(0,Math.min(1,number));
}

function slug(value){
  return String(value||'practice').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}


/* v0.20.0 Phase 2 — person review of Practice dose evidence */
export function applyPracticeDoseEvidenceReview(reviews=[],{
  evidenceId,
  action,
  at=new Date().toISOString()
}={}){
  if(!evidenceId||!['confirm','reject','reopen'].includes(action))return [...(reviews||[])];
  const status=action==='confirm'?'confirmed':action==='reject'?'rejected':'candidate';
  const next={
    evidenceId,
    status,
    reviewedAt:at,
    source:'person',
    durationInfluence:0,
    contractInfluence:0,
    judgementInfluence:0
  };
  return [
    next,
    ...(reviews||[]).filter(item=>item?.evidenceId!==evidenceId)
  ].slice(0,200);
}

export function practiceDoseEvidenceReviewFor(reviews=[],evidenceId){
  return (reviews||[]).find(item=>item?.evidenceId===evidenceId)||null;
}

export function mergePracticeDoseEvidenceReviews(items=[],reviews=[]){
  return (items||[]).map(item=>{
    const review=practiceDoseEvidenceReviewFor(reviews,item.id);
    return {
      ...item,
      review,
      reviewStatus:review?.status||item.status,
      personConfirmed:review?.status==='confirmed',
      personRejected:review?.status==='rejected',
      eligibleForDurationChange:false,
      eligibleForContractChange:false,
      eligibleForJudgementInfluence:false,
      durationInfluence:0,
      contractInfluence:0,
      judgementInfluence:0
    };
  });
}

export function reconcilePracticeDoseEvidenceReviews(reviews=[],items=[]){
  const known=new Set((items||[]).map(item=>item.id));
  const seen=new Set();
  return (reviews||[]).filter(item=>{
    if(!item?.evidenceId||seen.has(item.evidenceId)||!known.has(item.evidenceId))return false;
    seen.add(item.evidenceId);
    return true;
  }).map(item=>({
    evidenceId:item.evidenceId,
    status:['candidate','confirmed','rejected'].includes(item.status)?item.status:'candidate',
    reviewedAt:item.reviewedAt||null,
    source:'person',
    durationInfluence:0,
    contractInfluence:0,
    judgementInfluence:0
  }));
}

export function practiceDoseEvidenceReviewSummary(item){
  if(!item)return 'No dose evidence review available.';
  if(item.reviewStatus==='confirmed')return 'Confirmed by you as an accurate description of this dose-outcome pattern.';
  if(item.reviewStatus==='rejected')return 'Rejected by you as a misleading dose-outcome pattern.';
  return 'Awaiting your review.';
}

export function practiceDoseEvidenceReviewAudit(items=[]){
  return {
    candidate:(items||[]).filter(item=>item.reviewStatus==='candidate').length,
    confirmed:(items||[]).filter(item=>item.reviewStatus==='confirmed').length,
    rejected:(items||[]).filter(item=>item.reviewStatus==='rejected').length,
    durationInfluence:0,
    contractInfluence:0,
    judgementInfluence:0,
    statement:'Review changes accountability status only. Dose evidence still changes neither duration, contracts nor judgements.'
  };
}


/* v0.20.0 Phase 3 — person-authorised Practice duration proposal */
export function buildPracticeDoseRevisionProposals(evidenceItems=[],reviews=[],decisions=[]){
  const reviewById=new Map((reviews||[]).map(review=>[review.evidenceId,review]));
  const decisionById=new Map((decisions||[]).map(decision=>[decision.proposalId,decision]));

  return (evidenceItems||[])
    .filter(item=>reviewById.get(item.id)?.status==='confirmed')
    .map(item=>{
      const proposal=proposalFromDoseEvidence(item);
      const decision=decisionById.get(proposal.id);
      return {
        ...proposal,
        decision:decision||null,
        status:decision?.status||'proposed',
        decidedAt:decision?.decidedAt||null,
        source:'confirmed-dose-evidence',
        judgementInfluence:0,
        contractInfluence:0
      };
    });
}

export function applyPracticeDoseRevisionDecision(decisions=[],{
  proposal,
  action,
  at=new Date().toISOString()
}={}){
  if(!proposal?.id||!['accept','decline','reopen'].includes(action))return [...(decisions||[])];
  const status=action==='accept'?'accepted':action==='decline'?'declined':'proposed';
  const next={
    proposalId:proposal.id,
    evidenceId:proposal.evidenceId,
    practiceId:proposal.practiceId,
    status,
    proposedDurationMinutes:proposal.proposedDurationMinutes,
    previousDurationMinutes:proposal.previousDurationMinutes,
    doseBand:proposal.doseBand,
    direction:proposal.direction,
    decidedAt:at,
    source:'person',
    judgementInfluence:0,
    contractInfluence:0
  };
  return [
    next,
    ...(decisions||[]).filter(item=>item?.proposalId!==proposal.id)
  ].slice(0,200);
}

export function reconcilePracticeDoseRevisionDecisions(decisions=[],proposals=[]){
  const known=new Map((proposals||[]).map(proposal=>[proposal.id,proposal]));
  const seen=new Set();

  return (decisions||[]).filter(item=>{
    if(!item?.proposalId||seen.has(item.proposalId)||!known.has(item.proposalId))return false;
    seen.add(item.proposalId);
    return true;
  }).map(item=>{
    const proposal=known.get(item.proposalId);
    return {
      proposalId:item.proposalId,
      evidenceId:proposal.evidenceId,
      practiceId:proposal.practiceId,
      status:['proposed','accepted','declined'].includes(item.status)?item.status:'proposed',
      proposedDurationMinutes:proposal.proposedDurationMinutes,
      previousDurationMinutes:proposal.previousDurationMinutes,
      doseBand:proposal.doseBand,
      direction:proposal.direction,
      decidedAt:item.decidedAt||null,
      source:'person',
      judgementInfluence:0,
      contractInfluence:0
    };
  });
}

export function effectivePracticeDoseRevision(decisions=[],practiceId){
  if(!practiceId)return null;
  return (decisions||[])
    .filter(item=>item?.practiceId===practiceId&&item.status==='accepted')
    .sort((a,b)=>Date.parse(b.decidedAt||0)-Date.parse(a.decidedAt||0))[0]||null;
}

export function applyPracticeDoseRevisionToJudgement(judgement,revision){
  if(!judgement||!revision||revision.status!=='accepted'||revision.practiceId!==judgement?.practice?.id)return judgement;
  return {
    ...judgement,
    duration:revision.proposedDurationMinutes,
    doseRevisionId:revision.proposalId,
    doseRevisionSource:'person-accepted',
    baseDuration:Number(judgement.duration)||null
  };
}

export function practiceDoseRevisionSummary(proposal){
  if(!proposal)return 'No Practice duration proposal.';
  if(proposal.status==='accepted')return 'Accepted by you for future judgements of this Practice.';
  if(proposal.status==='declined')return 'Declined by you. The current duration remains.';
  return 'Awaiting your decision. Duration will not change until you accept.';
}

function proposalFromDoseEvidence(item){
  const average=Math.max(1,Math.round(Number(item.averageActualMinutes)||1));
  const inferredPlanned=item.observations?.length
    ?Math.max(1,Math.round(item.observations.reduce((sum,observation)=>sum+Number(observation.plannedMinutes||0),0)/item.observations.length))
    :average;

  let proposedDurationMinutes=inferredPlanned;
  if(item.doseBand==='partial'&&item.direction==='mostly-aligned')proposedDurationMinutes=average;
  if(item.doseBand==='short'&&item.direction==='mostly-aligned')proposedDurationMinutes=average;
  if(item.direction==='often-misaligned'&&item.doseBand==='full')proposedDurationMinutes=Math.max(1,Math.round(inferredPlanned*.8));

  return {
    id:`practice-dose-revision-${slug(item.practiceId)}-${item.doseBand}-${item.direction}`,
    evidenceId:item.id,
    practiceId:item.practiceId,
    doseBand:item.doseBand,
    direction:item.direction,
    previousDurationMinutes:inferredPlanned,
    proposedDurationMinutes,
    evidenceCount:item.total,
    averageActualMinutes:item.averageActualMinutes,
    scope:'duration-only',
    judgementInfluence:0,
    contractInfluence:0
  };
}


/* v0.20.0 Phase 4 — accepted duration outcome accountability */
export function recordPracticeDoseRevisionUse({
  revision=null,
  contract=null,
  at=new Date().toISOString()
}={}){
  if(!revision||revision.status!=='accepted'||!contract)return null;
  return {
    id:`practice-dose-revision-use-${Date.parse(at)||Date.now()}`,
    proposalId:revision.proposalId,
    evidenceId:revision.evidenceId,
    practiceId:revision.practiceId,
    durationMinutes:Number(revision.proposedDurationMinutes)||Number(contract.durationMinutes)||null,
    baseDurationMinutes:Number(revision.previousDurationMinutes)||Number(contract.durationMinutes)||null,
    startedAt:at,
    source:'person-accepted-duration',
    status:'started'
  };
}

export function resolvePracticeDoseRevisionUse(use,{
  contractOutcome=null,
  completionRatio=1,
  at=new Date().toISOString()
}={}){
  if(!use)return null;
  const fit=contractOutcome?.status==='aligned'
    ?'right'
    :contractOutcome?.status==='misaligned'
      ?'worse'
      :contractOutcome?.status==='partially-aligned'
        ?'mixed'
        :'unknown';
  return {
    ...use,
    completedAt:at,
    completionRatio:Math.max(0,Math.min(1,Number(completionRatio)||0)),
    contractStatus:contractOutcome?.status||'uncertain',
    fit,
    status:'resolved'
  };
}

export function assessPracticeDoseRevisionHealth(history=[],proposalId,{recentWindow=3,pauseThreshold=2}={}){
  if(!proposalId)return {status:'unknown',suspended:false,recent:[],worseCount:0};
  const uses=(history||[])
    .map(entry=>entry?.practiceDoseRevisionUse)
    .filter(use=>use?.proposalId===proposalId&&use.status==='resolved')
    .sort((a,b)=>Date.parse(b.completedAt||0)-Date.parse(a.completedAt||0));

  const recent=uses.slice(0,recentWindow);
  const worseCount=recent.filter(use=>use.fit==='worse').length;
  const suspended=recent.length>=pauseThreshold&&worseCount>=pauseThreshold;

  return {
    status:suspended?'review-required':uses.length?'healthy':'unproven',
    suspended,
    recent,
    worseCount,
    supportiveCount:recent.filter(use=>use.fit==='right').length,
    mixedCount:recent.filter(use=>use.fit==='mixed').length,
    statement:suspended
      ?'Automatic use is paused because the accepted duration produced repeated worse outcomes.'
      :uses.length
        ?'The accepted duration remains active while outcomes continue to be observed.'
        :'The accepted duration has not yet produced a resolved outcome.'
  };
}

export function effectivePracticeDoseRevisionWithHealth(decisions=[],history=[],practiceId){
  const revision=effectivePracticeDoseRevision(decisions,practiceId);
  if(!revision)return null;
  const health=assessPracticeDoseRevisionHealth(history,revision.proposalId);
  return health.suspended?null:{...revision,health};
}

export function practiceDoseRevisionHealthSummary(health){
  if(!health)return 'No duration outcome history.';
  return health.statement;
}
