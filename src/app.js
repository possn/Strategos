import { todaySignals,upsertDailyCheckIn,localDayKey,dailyCheckInForDay,dailyCheckInSummary } from './core/daily-signals.js?v=0476p1';
import { buildDailyOrientation,recentCheckInTrajectory } from './core/daily-orientation.js?v=0476p1';
import { upsertDailyStory,deriveDailyStory,dailyStorySummary,dailyStoryTimeline,dayNumber } from './core/daily-story.js?v=0476p1';
import { buildMorningExperience } from './core/morning-experience.js?v=0476p1';
import { buildLivingCompanion } from './core/living-companion.js?v=0476p1';
import { evidenceGate } from './core/evidence-gate.js?v=0476p1';
import { nextMissingSignal } from './core/current-moment.js?v=0476p1';
import { buildPracticeExperience } from './core/practice-experience.js?v=0476p1';
import { buildEveningExperience,closeDailyStory } from './core/evening-experience.js?v=0476p1';
import { buildWeeklyReview,preserveWeeklyReview,weeklyReviewForWindow } from './core/weekly-review.js?v=0476p1';
import { WEEKLY_INTENTION_OPTIONS,createWeeklyIntention,upsertWeeklyIntention,weeklyIntentionForWeek,clearWeeklyIntention } from './core/weekly-intention.js?v=0476p1';
import { normaliseProfile, profileCompleteness, profileSummary } from './core/profile.js?v=0476p1';
import { createOutcomeLedgerEntry,outcomeLedgerResultFromReflection,upsertOutcomeLedger,outcomeLedgerAudit,outcomeLedgerLabel } from './core/outcome-ledger.js?v=0476p1';
import { personalEvidenceOverview } from './core/personal-evidence.js?v=0476p1';
import { reconcileBeliefs,reviewBelief,beliefAudit } from './core/belief-system.js?v=0476p1';
import { createEmotionalJournalEntry,updateEmotionalJournalEntry,deleteEmotionalJournalEntry,upsertEmotionalJournalEntry,emotionalJournalEntries,emotionalJournalToday,emotionalJournalAudit,emotionalJournalPreview,EMOTIONAL_JOURNAL_THEMES,toggleEmotionalJournalTheme,emotionalJournalEvolution,emotionalJournalThemeLabel,EMOTIONAL_JOURNAL_FOLLOW_UPS,applyEmotionalJournalFollowUp,reopenEmotionalJournalFollowUp,emotionalJournalFollowUpAudit,emotionalJournalFollowUpLabel } from './core/emotional-journal.js?v=0476p1';
import { buildSafetyEnvelope,safetyEnvelopeAudit,safetyEnvelopeSummary,safetyAcknowledgementRequirement,createSafetyAcknowledgement,safetyStartGate,createSafetyInterruption,resolveSafetyInterruption,activeSafetyInterruption,safetyRuntimeGate,safetyInterruptionAudit } from './core/safety-architecture.js?v=0476p1';
import { createHumanModel,updateHumanModel,normaliseHumanModel,humanModelSnapshot,humanModelAudit,humanModelSummary,humanModelDimensionSummary,applyHumanModelEvidenceReview,reconcileHumanModelReviews,humanModelReviewAudit,humanModelEvidenceSummary,buildHumanModelDeliberationSnapshot,humanModelDeliberationEvidence,humanModelDeliberationSnapshotAudit,humanModelDeliberationSnapshotSummary,humanModelFactCandidates,applyHumanModelFactPromotion,reconcileHumanModelFactPromotions,humanModelFactPromotionAudit,humanModelFactCandidateSummary } from './core/human-model.js?v=0476p1';
import * as PracticeLibrary from './data/codex.js?v=0476p1';
const CODEX=PracticeLibrary.CODEX||[];
const validatePracticeLibrary=PracticeLibrary.validatePracticeLibrary||((items=CODEX)=>({valid:items.length,invalid:0,items:[]}));
const practiceLibraryCatalog=PracticeLibrary.practiceLibraryCatalog||((items=CODEX)=>items);
const practiceLibrarySummary=PracticeLibrary.practiceLibrarySummary||((items=CODEX)=>`${items.length} Practices available.`);
const assessPracticeEligibility=PracticeLibrary.assessPracticeEligibility||((practice,context={})=>{const blocked=practice?.id==='strength'&&context.soreness==='significant';return {practiceId:practice?.id||'unknown',status:blocked?'blocked':'eligible',reasons:[blocked?'Significant soreness makes strength loading inappropriate until reassessment.':'No declared contextual conflict is visible.'],matchedContraindications:blocked?['significant-soreness']:[],selectionInfluence:0,assessedFrom:['soreness'],statement:blocked?'A declared contextual conflict is present.':'No declared contextual conflict is visible.'}});
const assessPracticeLibraryEligibility=PracticeLibrary.assessPracticeLibraryEligibility||((items=CODEX,context={})=>{const results=items.map(item=>assessPracticeEligibility(item,context));return {items:results,eligible:results.filter(x=>x.status==='eligible').length,caution:results.filter(x=>x.status==='caution').length,blocked:results.filter(x=>x.status==='blocked').length,selectionInfluence:0,statement:'Compatibility assessment active.'}});
const practiceEligibilitySummary=PracticeLibrary.practiceEligibilitySummary||((assessment)=>assessment?`${assessment.status}: ${assessment.statement||assessment.reasons?.[0]||''}`:'Eligibility assessment unavailable.');
const snapshotPracticeContent=PracticeLibrary.snapshotPracticeContent||((practice,{durationMinutes=null,phases=null,at=new Date().toISOString()}={})=>practice?{practiceId:practice.id,practiceName:practice.name,contentVersion:Number(practice.contentVersion)||1,libraryVersion:1,evidenceStatus:practice.evidenceStatus||'unknown',durationMinutes:Number(durationMinutes)||null,phases:(phases||practice.phases||[]).map(x=>[x[0],Number(x[1]),x[2],[...(x[3]||[])]]),phaseCount:(phases||practice.phases||[]).length,snapshottedAt:at,source:'compatibility-practice-library'}:null);
const assessPracticeContentProvenance=PracticeLibrary.assessPracticeContentProvenance||((snapshot)=>snapshot?{status:'current',currentVersion:snapshot.contentVersion,historicalVersion:snapshot.contentVersion,statement:'This session content snapshot is preserved.'}:{status:'missing',statement:'No Practice content snapshot was preserved for this session.'});
const practiceContentSnapshotSummary=PracticeLibrary.practiceContentSnapshotSummary||((snapshot,assessment=assessPracticeContentProvenance(snapshot))=>snapshot?`${snapshot.practiceName} · content v${snapshot.contentVersion} · ${assessment.status}`:'Practice content provenance unavailable.');
const practiceContentProvenanceAudit=PracticeLibrary.practiceContentProvenanceAudit||((history=[])=>({records:history.filter(x=>x?.practiceContentSnapshot).map(x=>({snapshot:x.practiceContentSnapshot,assessment:assessPracticeContentProvenance(x.practiceContentSnapshot)})),total:history.filter(x=>x?.practiceContentSnapshot).length,current:history.filter(x=>x?.practiceContentSnapshot).length,historical:0,retired:0,missing:history.filter(x=>!x?.practiceContentSnapshot).length,statement:'Compatibility provenance audit active.'}));
import { loadState,saveState,resetState,createLocalBackup,ONBOARDING_VERSION } from './core/storage.js?v=0476p1';
import { serializeStateExport,validateStateImport,createImportPreview,exportFilename } from './core/state-transfer.js?v=0476p1';
import { buildUnderstanding } from './core/understanding.js?v=0476p1';
import { conveneAgora } from './core/agora.js?v=0476p1';
import { buildHumanGraph,buildCheckinGraph,projectHumanReturn } from './core/human-graph.js?v=0476p1';
import { renderLivingGraph } from './components/living-graph.js?v=0476p1';
import { unlockAudio,playTone,speak,stopVoice,previewVoice } from './core/audio.js?v=0476p1';
import { buildExplanation,buildExplainRecord,explainRecordAudit,explainRecordSummary,validateExplainRecord,applyExplainRecordReview,explainRecordReviewAudit,explainRecordReviewSummary } from './core/explain.js?v=0476p1';
import { normalizeAdvisorMemories,learnFromReflection,advisorCoverage,buildMonthlyCouncil,learningReviewItems,updateLearningStatus,expireStaleLearnings } from './core/advisor-memory.js?v=0476p1';
import { createExecutionState,remainingSeconds,pauseExecution,resumeExecution,startPhase,closeExecution,isResumable,EXECUTION_STATUS } from './core/execution-state.js?v=0476p1';
import { buildPracticeSessionSnapshot,describePracticeResume,practiceSessionSummary,sessionCompletionRatio,canMovePhase,buildPracticeContract,practiceContractSummary,snapshotPracticeContract,resolvePracticeContract,practiceContractOutcomeStatement,practiceContractCalibrationCandidates,practiceContractCalibrationSummary,practiceContractCalibrationAudit,applyPracticeContractCalibrationReview,mergePracticeContractCalibrationReviews,reconcilePracticeContractCalibrationReviews,practiceContractCalibrationReviewSummary,practiceContractCalibrationReviewAudit,buildPracticeContractRevisionProposals,applyPracticeContractRevisionDecision,reconcilePracticeContractRevisionDecisions,effectivePracticeContractRevision,practiceContractRevisionSummary,practiceDoseEvidenceCandidates,practiceDoseEvidenceSummary,practiceDoseEvidenceAudit,applyPracticeDoseEvidenceReview,mergePracticeDoseEvidenceReviews,reconcilePracticeDoseEvidenceReviews,practiceDoseEvidenceReviewSummary,practiceDoseEvidenceReviewAudit,buildPracticeDoseRevisionProposals,applyPracticeDoseRevisionDecision,reconcilePracticeDoseRevisionDecisions,effectivePracticeDoseRevision,applyPracticeDoseRevisionToJudgement,practiceDoseRevisionSummary,recordPracticeDoseRevisionUse,resolvePracticeDoseRevisionUse,assessPracticeDoseRevisionHealth,effectivePracticeDoseRevisionWithHealth,practiceDoseRevisionHealthSummary } from './core/practice-session.js?v=0476p1';
import { buildPracticeExitModel,canResumePractice,normalisePracticeExitReason } from './core/practice-exit.js?v=0476p1';
import { buildPhaseGuidance,buildGuidanceDecision,shouldShowSafetyPanel } from './core/practice-guidance.js?v=0476p1';
import { availableAdaptationLevels,resolveAdaptationChoice,setPhaseAdaptationChoice,getPhaseAdaptationChoice,adaptationChoiceSummary } from './core/practice-adaptation-choice.js?v=0476p1';
import { buildAdaptationAccountability,hasAppliedAdaptations,adaptationReflectionPrompt,adaptationAccountabilitySummary } from './core/practice-adaptation-accountability.js?v=0476p1';
import { adaptationPatternCandidates,adaptationPatternSummary,adaptationPatternAudit,applyAdaptationPatternReview,mergeAdaptationPatternReviews,adaptationPatternReviewAudit,adaptationPatternReviewSummary,reconcileAdaptationPatternReviews,resolveConfirmedAdaptationDefault,confirmedAdaptationDefaultSummary,recordConfirmedAdaptationDefault,attachConfirmedDefaultHealth,confirmedDefaultHealthSummary,confirmedDefaultRecentOutcomes,buildAdaptationAuditTrace,adaptationAuditTraceSummary,attachAdaptationReconfirmation,canConfirmAdaptationPattern } from './core/adaptation-patterns.js?v=0476p1';
import { attachValidity,assessCandidateStability,assessJudgementValidity,markJudgementsForReview,supersedeJudgement,JUDGEMENT_VALIDITY } from './core/judgement-stability.js?v=0476p1';
import { reconcileLongitudinalState,upsertMonthlyCouncilReport,journeyRecords } from './core/longitudinal-integrity.js?v=0476p1';
import { buildDecisionBoundaries } from './core/decision-boundaries.js?v=0476p1';
import { createCorrectionEvent,determineCorrectionImpact,applyCorrectionImpact,correctionAuditSummary,reconcileCorrectionAudit } from './core/correction-audit.js?v=0476p1';
import { CHOICE_ACTIONS,createChoiceRecord,applyChoiceToJudgement,summarizeChoice,reconcileChoiceLog } from './core/person-choice.js?v=0476p1';
import { createPreferenceCandidate,upsertPreferenceCandidate,applyPreferenceCorrection,expirePreferences,preferenceAudit } from './core/preference-governance.js?v=0476p1';
import { createOutcomeRecord,markOutcomeStarted,markOutcomeCompleted,markOutcomeAbandoned,attachOutcomeReflection,learningEligibility,reconcileOutcomeRecords,outcomeSummary } from './core/choice-outcome.js?v=0476p1';
import { reconcileAgencyState,agencyConsistencySnapshot,learningSourceSummary } from './core/agency-integrity.js?v=0476p1';
import { createCommitment,commitmentAvailability,markCommitmentStarted,markCommitmentCompleted,cancelCommitment,reconcileCommitments,commitmentSummary } from './core/commitment-integrity.js?v=0476p1';
import { createFrictionPlan,markFrictionEncountered,frictionReadiness,suggestedResponse,canBeginWithFriction,reconcileFrictionPlans,frictionSummary } from './core/friction-plan.js?v=0476p1';
import { createFallbackPlan,acceptFallback,declineFallback,startFallback,completeFallback,abandonFallback,fallbackOutcomeRecord,fallbackLearningEligibility,reconcileFallbackPlans,fallbackSummary } from './core/adaptive-fallback.js?v=0476p1';
import { reconcileFollowThroughState,followThroughSnapshot,followThroughSummary } from './core/follow-through-integrity.js?v=0476p1';
import { createStructuredReflection,reflectionLearningSignal,reflectionContradiction,reflectionCompleteness,reconcileStructuredReflections,reflectionSummary } from './core/reflection-integrity.js?v=0476p1';
import { createOutcomeAttribution,calibrateLearningWithAttribution,attributionContradiction,reconcileOutcomeAttributions,attributionSummary } from './core/outcome-attribution.js?v=0476p1';
import { createOutcomeEpisode,upsertOutcomePattern,rejectOutcomePattern,reconcileOutcomePatterns,outcomePatternSummary } from './core/outcome-patterns.js?v=0476p1';
import { assessPatternTransfer,createTransferRecord,rejectTransferRecord,reconcilePatternTransfers,transferSummary } from './core/pattern-transfer.js?v=0476p1';
import { buildLongitudinalEvidence,longitudinalEvidenceSummary } from './core/longitudinal-evidence.js?v=0476p1';
import { reconcileJudgementLongitudinalIntegrity,buildLongitudinalAuditEntry,longitudinalAccountabilitySummary } from './core/longitudinal-accountability.js?v=0476p1';
import { createJudgementForecast,resolveJudgementForecast,predictionCalibrationSummary,confidenceCorrection,reconcileJudgementForecasts,forecastSummary } from './core/prediction-calibration.js?v=0476p1';
import { buildContextCalibrationEvidence } from './core/calibration-governance.js?v=0476p1';
import { detectCalibrationDrift,calibrationDriftCorrection,buildCalibrationAccountability,reconcileCalibrationAccountability,calibrationAccountabilitySummary } from './core/calibration-drift.js?v=0476p1';
import { createReflectionDraft,updateReflectionDraft,restoreReflectionDraft,clearReflectionDraft,reconcileDailyContinuity } from './core/daily-continuity.js?v=0476p1';
import { resolveStartupDestination,resolveContinuityDestination,buildContinuityNotice,shouldShowContinuityCard } from './core/startup-continuity.js?v=0476p1';
const app=document.querySelector('#app');window.__strategosStarted=true;
const a11yStatus=document.querySelector('#a11y-status');
const announceStatus=message=>{if(!a11yStatus)return;a11yStatus.textContent='';requestAnimationFrame(()=>{a11yStatus.textContent=message||''})};
const focusCurrentScreen=()=>requestAnimationFrame(()=>{const target=app.querySelector('main.screen');if(target&&!target.matches(':focus'))target.focus({preventScroll:true})});
async function registerServiceWorker(){if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;try{await navigator.serviceWorker.register('./service-worker.js?v=0476p1',{scope:'./'})}catch(error){console.warn('Strategos offline support unavailable.',error)}}
registerServiceWorker();
function reconcileLoadedState(input){
  let next=reconcileDailyContinuity(input);
  next.preferenceModel=expirePreferences(next.preferenceModel||[]);
  next=reconcilePatternTransfers(reconcileOutcomePatterns(reconcileOutcomeAttributions(reconcileStructuredReflections(reconcileFallbackPlans(reconcileFrictionPlans(reconcileCommitments(next)))))));
  ({state:next}=reconcileJudgementLongitudinalIntegrity(reconcileJudgementForecasts(reconcileCalibrationAccountability(next))));
  ({state:next}=reconcileFollowThroughState(next));
  ({state:next}=reconcileAgencyState(reconcileLongitudinalState(reconcileCorrectionAudit(reconcileChoiceLog(reconcileOutcomeRecords(next)))).state));
  const derivedAdaptationPatterns=adaptationPatternCandidates(next.history);
  next.adaptationPatternReviews=reconcileAdaptationPatternReviews(next.adaptationPatternReviews,derivedAdaptationPatterns);
  const derivedContractCalibrations=practiceContractCalibrationCandidates(next.history);
  next.practiceContractCalibrationReviews=reconcilePracticeContractCalibrationReviews(next.practiceContractCalibrationReviews,derivedContractCalibrations);
  const derivedContractRevisionProposals=buildPracticeContractRevisionProposals(derivedContractCalibrations,next.practiceContractCalibrationReviews,next.practiceContractRevisionDecisions);
  next.practiceContractRevisionDecisions=reconcilePracticeContractRevisionDecisions(next.practiceContractRevisionDecisions,derivedContractRevisionProposals);
  const derivedDoseEvidence=practiceDoseEvidenceCandidates(next.history);
  next.practiceDoseEvidenceReviews=reconcilePracticeDoseEvidenceReviews(next.practiceDoseEvidenceReviews,derivedDoseEvidence);
  const derivedDoseRevisionProposals=buildPracticeDoseRevisionProposals(derivedDoseEvidence,next.practiceDoseEvidenceReviews,next.practiceDoseRevisionDecisions);
  next.practiceDoseRevisionDecisions=reconcilePracticeDoseRevisionDecisions(next.practiceDoseRevisionDecisions,derivedDoseRevisionProposals);
  next.dailyStories=upsertDailyStory(next.dailyStories||[],{stage:deriveDailyStory({stories:next.dailyStories,checkIns:next.dailyCheckIns,judgements:next.judgements,history:next.history,journalEntries:next.emotionalJournalEntries}).stage});
  next.humanModel=reconcileHumanModelFactPromotions(reconcileHumanModelReviews(normaliseHumanModel(next.humanModel,{profile:next.profile})));
  return next;
}
let state=reconcileLoadedState(loadState());saveState(state);const startupContinuity=buildContinuityNotice(state);let settingsNotice=state.persistenceWarning||'',selectedInsightId=null,context=todaySignals(state.dailyCheckIns),decision=null,timer=null,secondsLeft=0,phaseIndex=0,paused=false,wakeLock=null,onboardingStep=0,onboardingDraft={name:''};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const supportsHaptics=()=>typeof navigator.vibrate==='function';
const supportsWakeLock=()=>Boolean(navigator.wakeLock?.request);
const vibrate=(p=12)=>{if(state.settings.haptics&&supportsHaptics())navigator.vibrate(p)};
let wakeLockStatus='idle';
const persist=()=>{const result=saveState(state);if(!result.ok){settingsNotice=result.error;state.persistenceWarning=result.error}return result};
const recordDailyStoryStage=(stage,extra={})=>{state.dailyStories=upsertDailyStory(state.dailyStories,{stage,...extra})};
const setNotice=message=>{settingsNotice=message||''};
const dailyContextComplete=()=>['sleep','energy','time','challenge','soreness','emotionalLoad'].every(key=>context?.[key]!==undefined&&context?.[key]!==null&&context?.[key]!=='');
const companionPresence=()=>{
  if(['splash','onboarding','thinking'].includes(currentRoute))return '';
  return `<div class="companion-presence" aria-label="Living Human Graph present"><span></span><span></span><span></span><i></i></div>`;
};
const livingCompanionToday=()=>{
  if(currentRoute!=='today')return '';
  const gate=evidenceGate({checkIns:state.dailyCheckIns,judgements:state.judgements});
  const story=deriveDailyStory({stories:state.dailyStories,checkIns:state.dailyCheckIns,judgements:state.judgements,history:state.history,journalEntries:state.emotionalJournalEntries});
  const model=buildLivingCompanion({name:state.profile?.name||'',context:gate.context.signals,contextEvidence:gate.context,judgement:gate.judgement,story,hasContinuity:gate.context.sufficient&&shouldShowContinuityCard(state)});
  const graph=gate.context.sufficient?buildHumanGraph(state.history,gate.context.signals):buildHumanGraph([],null);
  const action=model.action?`<button class="moment-action" data-action="${esc(model.action)}">${esc(model.actionLabel)}</button>`:'';
  return `<section class="current-moment ${esc(model.mode)}" aria-label="Current moment">
    <div class="organism-field"><div class="organism-aura"></div>${renderLivingGraph(graph,{ambient:true})}</div>
    <div class="moment-language"><h1>${esc(model.judgement)}</h1>${action}</div>
  </section>`;
};
const shell=(content,cls='')=>app.innerHTML=`<main class="screen ${cls} route-${currentRoute}" tabindex="-1" role="main">${currentRoute==='today'?'':companionPresence()}${livingCompanionToday()}${content}</main>`;
const deltaMark=(size='large')=>`<svg class="delta ${size}" viewBox="0 0 140 140" aria-label="OneArete Delta"><circle class="ring" cx="70" cy="70" r="56"/><path class="glyph" d="M70 25 L112 108 M112 108 L28 108 M28 108 L63 39"/></svg>`;
const button=(label,action,secondary=false)=>`<button class="action ${secondary?'secondary':''}" data-action="${action}">${label}</button>`;
const header=(title='STRATEGOS',right='')=>`<header>${deltaMark('small')}<span>${title}</span>${right}</header>`;
const nav=active=>`<nav class="tabbar" aria-label="Primary navigation">${[['today','◉','Today'],['understanding','◇','Understanding'],['journey','↗','Journey'],['settings','••','Settings']].map(([a,i,l])=>`<button class="${active===a?'active':''}" data-action="${a}" aria-current="${active===a?'page':'false'}"><span class="tab-icon" aria-hidden="true">${i}</span><span>${l}</span></button>`).join('')}</nav>`;
const ROUTES={splash,onboarding,today,checkin,thinking,judgement,execute,resumePrompt,practiceExit,reflect,journal,understanding,correctUnderstanding,humanModelCorrection,journey,emotionalJournal,eveningReflection,settings,guide};
const HISTORY_ROUTES=new Set(['today','checkin','thinking','understanding','journey','emotionalJournal','eveningReflection','settings','guide','judgement','reflect','resumePrompt']);
let currentRoute='splash',deliberationCycle=null,deliberationTimeout=null,deliberationRun=0,guideFocus='overview',practiceExitSource='active',pendingChoice=null,selectedHumanModelEvidenceId=null;
function cancelDeliberation(){if(deliberationCycle)clearInterval(deliberationCycle);if(deliberationTimeout)clearTimeout(deliberationTimeout);deliberationCycle=null;deliberationTimeout=null;deliberationRun+=1}

function normaliseExplainRecordForDisplay(record){
  if(!record)return null;
  return {
    ...record,
    observations:Array.isArray(record.observations)?record.observations:[],
    inferences:Array.isArray(record.inferences)?record.inferences:[],
    decisiveFactors:Array.isArray(record.decisiveFactors)?record.decisiveFactors:[],
    unknowns:Array.isArray(record.unknowns)?record.unknowns:[],
    alternatives:Array.isArray(record.alternatives)?record.alternatives:[],
    changeConditions:Array.isArray(record.changeConditions)?record.changeConditions:[],
    recommendation:record.recommendation||{},
    provenance:record.provenance||{behaviourInfluence:0}
  };
}
function recoverUnderstanding(error){
  console.error('Understanding render failed.',error);
  const active=state.current?.decision||state.judgements?.[0]||null;
  const record=normaliseExplainRecordForDisplay(active?.explainRecord||null);
  shell(`${header('UNDERSTANDING','<button class="icon-btn" aria-label="Close and return to Today" data-action="today">×</button>')}
    <section class="stack understanding-recovery">
      <p class="eyebrow">UNDERSTANDING</p>
      <h2>Your reasoning remains available.</h2>
      <p class="muted">Strategos recovered this view without changing your judgement or data.</p>
      ${record?`<section class="canonical-explain-record"><p class="eyebrow">EXPLAIN ENGINE</p><h3>${esc(active?.judgement||'Current judgement')}</h3><p>${esc(explainRecordSummary(record))}</p><details open><summary>Observed and inferred</summary><div class="explain-record-details"><p class="eyebrow">OBSERVED</p>${record.observations.map(item=>`<p>${esc(item.statement||'')}</p>`).join('')||'<p>No observations were preserved.</p>'}<p class="eyebrow">INFERRED</p>${record.inferences.map(item=>`<p>${esc(item.statement||'')}</p>`).join('')||'<p>No inferences were preserved.</p>'}<p class="eyebrow">UNKNOWN</p>${record.unknowns.map(item=>`<p>${esc(item.statement||item||'')}</p>`).join('')||'<p>No explicit unknown was preserved.</p>'}</div></details></section>`:'<p class="muted">No canonical explanation record is available for the current judgement.</p>'}
      <button class="action secondary" data-action="understanding">Try full Understanding again</button>
    </section>
    ${nav('understanding')}`);
}
function route(name,{history='push',preserveScroll=false}={}){
  const next=ROUTES[name]?name:'splash';
  clearInterval(timer);timer=null;cancelDeliberation();stopVoice();
  currentRoute=next;
  if(HISTORY_ROUTES.has(next)){
    const statePayload={strategosRoute:next};
    const url=`#${next}`;
    if(history==='replace'||!window.history.state?.strategosRoute)window.history.replaceState(statePayload,'',url);
    else if(history==='push'&&window.history.state?.strategosRoute!==next)window.history.pushState(statePayload,'',url);
  }
  try{
    ROUTES[next]();
  }catch(error){
    if(next==='understanding')recoverUnderstanding(error);
    else throw error;
  }
  if(!preserveScroll)window.scrollTo(0,0);
  focusCurrentScreen();
}
function rerenderJudgementAt(selector){
  route('judgement',{history:'none',preserveScroll:true});
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const target=document.querySelector(selector);
    if(target)target.scrollIntoView({behavior:'smooth',block:'center'});
  }));
}
window.addEventListener('popstate',event=>{
  const next=event.state?.strategosRoute||location.hash.replace('#','')||'today';
  route(ROUTES[next]?next:'today',{history:'none'});
});
function splash(){shell(`${deltaMark()}<div class="brand"><div class="eyebrow">ONEARETE</div><h1>STRATEGOS</h1><p>Understand first.<br/>Act deliberately.</p></div><button class="tap" data-action="begin">Tap to begin</button>`,'splash')}
function onboarding(){
  const neutralGraph=buildHumanGraph([],null);
  const steps=[
    `${header('STRATEGOS')}<section class="stack onboarding"><p class="eyebrow">ONE QUESTION</p><h2>What does your body actually need today?</h2><p class="muted">Not what you planned. Not what worked last week. What your specific state right now calls for.</p><p class="muted">Strategos examines six dimensions, deliberates, and offers its best current judgement. Then you decide.</p><div class="onboarding-mark">${deltaMark()}</div>${button('CONTINUE','onboarding-next')}</section>`,
    `${header('STRATEGOS')}<section class="stack onboarding"><p class="eyebrow">SIX DIMENSIONS</p><h2>A living model that learns from experience.</h2><div class="living-graph compact" aria-hidden="true">${renderLivingGraph(neutralGraph,{})}</div><p class="graph-note">Body · Recovery · Mind · Agency · Purpose · Relationships</p><p class="muted">Each dimension reflects what is currently visible. The organism becomes more accurate as context accumulates. Nothing is inferred from silence.</p>${button('CONTINUE','onboarding-next')}</section>`,
    `${header('STRATEGOS')}<section class="stack onboarding"><p class="eyebrow">READY</p><h2>What should I call you?</h2><input class="name-input" id="onboarding-name" autocomplete="given-name" value="${esc(onboardingDraft.name||state.profile?.name||'')}" placeholder="Your name"/><p class="muted">Your name is enough to begin. Strategos will ask only what it needs — when it needs it.</p>${button('BEGIN','onboarding-complete')}</section>`
  ];
  shell(steps[onboardingStep]||steps[0]);
}

function today(){
  shell(`${nav('today')}`);
  const startButton=app.querySelector('.moment-action[data-action="focus-signals"],.moment-action[data-action="checkin"]');
  if(startButton){
    const openCheckIn=event=>{
      event.preventDefault();
      event.stopPropagation();
      route('checkin');
    };
    startButton.addEventListener('click',openCheckIn,{once:true});
    startButton.addEventListener('touchend',openCheckIn,{once:true,passive:false});
  }
}
function renderSymmetricCheckinOrganism(){
  const nodes=Array.from({length:6},(_,index)=>{
    const angle=(-90+index*60)*Math.PI/180;
    const x=(160+Math.cos(angle)*112).toFixed(2);
    const y=(160+Math.sin(angle)*112).toFixed(2);
    return `<g class="checkin-organism-node"><line x1="160" y1="160" x2="${x}" y2="${y}"/><circle class="checkin-node-halo" cx="${x}" cy="${y}" r="17"/><circle class="checkin-node-core" cx="${x}" cy="${y}" r="9"/></g>`;
  }).join('');
  return `<div class="checkin-organism" aria-hidden="true"><svg viewBox="0 0 320 320" role="img"><circle class="checkin-aura" cx="160" cy="160" r="139"/><circle class="checkin-membrane" cx="160" cy="160" r="112"/><circle class="checkin-inner" cx="160" cy="160" r="75"/>${nodes}<circle class="checkin-center-halo" cx="160" cy="160" r="24"/><circle class="checkin-center" cx="160" cy="160" r="11"/></svg></div>`;
}

function commitCheckinChoice(target){
  if(!target)return;
  const key=target.dataset.key;
  if(!key)return;
  const raw=target.dataset.value;
  const value=['sleep','energy','time'].includes(key)?Number(raw):raw;
  context={...context,[key]:value};
  target.classList.add('selected');
  target.setAttribute('aria-pressed','true');
  try{
    state.dailyCheckIns=upsertDailyCheckIn(state.dailyCheckIns,context);
    recordDailyStoryStage('check-in');
    persist();
    if(dailyContextComplete()){
      state.dailyCheckIns=upsertDailyCheckIn(state.dailyCheckIns,context,{source:'person-confirmed'});
      state.dailyStories=upsertDailyStory(state.dailyStories,{stage:'check-in',signals:{...context}});
      state.humanModel=updateHumanModel(state.humanModel,{profile:state.profile,context,source:'today-signals'});
      persist();
      announceStatus('Today is understood.');
      setTimeout(()=>route('today',{history:'replace'}),40);
      return;
    }
  }catch(error){
    console.error('Check-in persistence failed; continuing the visible flow.',error);
  }
  setTimeout(()=>route('checkin',{history:'replace'}),40);
}

window.strategosSelectSignal=(event,target)=>{
  if(event){event.preventDefault();event.stopPropagation();}
  commitCheckinChoice(target);
  return false;
};

function checkin(){
  const checkinGraph=buildCheckinGraph(context);
  const questions={
    sleep:['How did you sleep?',[[4,'Excellent'],[3,'Good'],[2,'Fair'],[1,'Poor']]],
    energy:['How is your energy?',[[3,'High'],[2,'Medium'],[1,'Low']]],
    time:['How much time is genuinely available?',[[5,'5'],[15,'15'],[30,'30'],[60,'60+']]],
    challenge:['What has the strongest claim on today?',[['body','Body'],['mind','Mind'],['focus','Focus'],['recovery','Recovery'],['family','Family'],['work','Work']]],
    soreness:['How does your body feel?',[['none','No soreness'],['mild','Some soreness'],['significant','Significant soreness']]],
    emotionalLoad:['How much emotional load are you carrying?',[['light','Light'],['usual','Usual'],['heavy','Heavy']]]
  };
  const nextKey=nextMissingSignal(context);
  const prompt=nextKey?questions[nextKey]:null;
  const body=prompt
    ?`<section class="seed-checkin"><button class="quiet-close" data-action="today" aria-label="Return to Today">×</button><div class="seed-organism">${renderLivingGraph(checkinGraph,{ambient:true})}</div><div class="seed-question">${question(prompt[0],nextKey,prompt[1])}<small>Nothing is inferred from silence.</small></div></section>`
    :`<section class="seed-checkin complete"><div class="seed-organism">${renderLivingGraph(checkinGraph,{ambient:true})}</div><div class="seed-question"><h1>Strategos has what it needs.</h1><p>Today is clear.</p></div></section>`;
  shell(body,'experience-flow');
}
function question(title,key,opts){return `<div class="question"><h3>${title}</h3><div class="choice-row" role="group" aria-label="${title}">${opts.map(([v,l])=>`<button type="button" class="pill ${context[key]===v?'selected':''}" data-key="${key}" data-value="${v}" aria-pressed="${context[key]===v?'true':'false'}" onclick="return window.strategosSelectSignal(event,this)">${l}${key==='time'?' min':''}</button>`).join('')}</div></div>`}
function thinking(){const graph=buildHumanGraph(state.history,context);shell(`<div class="quiet-deliberation"><div class="quiet-organism">${renderLivingGraph(graph,{ambient:true,deliberating:true})}</div><h2>Deliberating.</h2><p id="thinking-line" class="muted">Holding what you shared together…</p></div>`,'thinking');const lines=['Examining what you brought today…','Each Advisor weighing its domain…','Forming one prudent direction…'];let i=0;const run=deliberationRun;deliberationCycle=setInterval(()=>{const el=document.querySelector('#thinking-line');if(el)el.textContent=lines[Math.min(++i,lines.length-1)]},520);deliberationTimeout=setTimeout(()=>{if(run!==deliberationRun||currentRoute!=='thinking')return;clearInterval(deliberationCycle);deliberationCycle=null;const targetContextKey=[context.challenge||'unknown',context.soreness||'unknown',context.emotionalLoad||'unknown'].join('|');for(const pattern of state.outcomePatterns||[]){const assessment=assessPatternTransfer(pattern,{targetContextKey,targetPracticeId:pattern.practiceId});if(assessment.applies){const record=createTransferRecord({pattern,targetContextKey,assessment});state.patternTransfers=[record,...(state.patternTransfers||[]).filter(item=>!(item.patternId===record.patternId&&item.targetContextKey===record.targetContextKey))].slice(0,100)}}const understanding=buildUnderstanding(context,state.history);const humanModelDeliberationSnapshot=buildHumanModelDeliberationSnapshot(state.humanModel);const longitudinalEvidence=buildLongitudinalEvidence({patterns:state.outcomePatterns,transfers:state.patternTransfers,context});let candidate=attachValidity(conveneAgora(context,understanding,state.history,state.advisorMemories,longitudinalEvidence,null),context);candidate.humanModelSnapshot=humanModelDeliberationSnapshot;candidate.calibrationEvidence=buildContextCalibrationEvidence(state.judgementForecasts,{judgement:candidate,context});candidate.calibrationDrift=detectCalibrationDrift(state.judgementForecasts,{domain:candidate.domain||candidate.practice?.domain||context.challenge,practiceId:candidate.practice?.id||'unknown',challenge:context.challenge});const driftCorrection=calibrationDriftCorrection(candidate.calibrationDrift);if(candidate.calibrationEvidence.status==='applied'||driftCorrection.applies){candidate.baseConfidence=candidate.confidence;const totalCalibrationAdjustment=Number(candidate.calibrationEvidence.adjustment||0)+Number(driftCorrection.adjustment||0);candidate.confidence=Math.max(45,Math.min(90,Math.round((candidate.confidence+totalCalibrationAdjustment*100)*10)/10));candidate.confidenceLevel=confidenceLabel(candidate.confidence);candidate.confidenceCalibration={applied:true,adjustment:totalCalibrationAdjustment,confidence:candidate.confidence,driftAdjustment:driftCorrection.adjustment};const accountability=buildCalibrationAccountability({calibrationEvidence:candidate.calibrationEvidence,drift:candidate.calibrationDrift,judgementId:candidate.id});state.calibrationAccountability=[accountability,...(state.calibrationAccountability||[]).filter(item=>item.judgementId!==candidate.id)].slice(0,200)}candidate.safetyEnvelope=buildSafetyEnvelope({context,decision:candidate});candidate.explain=buildExplanation(candidate,context);candidate.boundaries=buildDecisionBoundaries(candidate,context);candidate.explainRecord=buildExplainRecord(candidate,{context});const previous=state.current?.decision;const previousContext=state.current?.context||previous?.context;const stability=assessCandidateStability(previous,candidate,previousContext,context);if(stability.action==='retain-previous'){decision={...previous,stability:{...stability,retainedAt:new Date().toISOString()}};decision.boundaries=buildDecisionBoundaries(decision,context);state.current={...state.current,context:{...context},decision};}else{decision={...candidate,stability};if(previous){const index=state.judgements.findIndex(item=>item.id===previous.id);if(index>=0)state.judgements[index]=supersedeJudgement(state.judgements[index],decision.id);}state.current={context:{...context},decision,startedAt:null};state.judgements.unshift({...decision,status:'proposed'});state.judgements=state.judgements.slice(0,100);}const forecast=createJudgementForecast({judgement:decision,context,expectedEffect:'better',confidence:decision.confidence>=75?'high':decision.confidence>=60?'medium':'low'});state.judgementForecasts=[forecast,...(state.judgementForecasts||[]).filter(item=>item.judgementId!==decision.id)].slice(0,200);state.current={...(state.current||{}),forecastId:forecast.id};persist();route('judgement',{history:'replace'})},2350)}
function completePersonChoice({action,selectedPracticeId=null,reason=''}={}){
  const base=decision||state.current?.decision;
  if(!base)return route('today');
  const choice=createChoiceRecord({judgement:base,action,selectedPracticeId,reason});
  let updated=applyChoiceToJudgement(base,choice);
  if(action==='choose-alternative'){
    const selected=CODEX.find(item=>item.id===selectedPracticeId);
    if(selected){
      updated={
        ...updated,
        practice:selected,
        mission:selected,
        intention:`You chose ${selected.name}. Strategos preserves this as your decision rather than relabelling it as its own recommendation.`
      };
    }
  }
  state.choiceLog=[choice,...(state.choiceLog||[])].slice(0,200);
  const outcome=createOutcomeRecord({judgement:updated,choice});
  state.outcomeRecords=[outcome,...(state.outcomeRecords||[])].slice(0,200);
  state.current={...(state.current||{}),outcomeRecordId:outcome.id};
  const index=state.judgements.findIndex(item=>item.id===updated.id);
  if(index>=0)state.judgements[index]=updated;
  state.current={...(state.current||{}),decision:updated};
  decision=updated;
  pendingChoice=null;
  persist();
  if(['accept','choose-alternative'].includes(action))return rerenderJudgementAt('#commitment-panel');
  return route('today');
}
function judgement(){
  decision ||= state.current?.decision;
  if(!decision)return route('today');
  const acceptedDoseRevision=effectivePracticeDoseRevisionWithHealth(state.practiceDoseRevisionDecisions,state.history,decision?.practice?.id);
  decision=applyPracticeDoseRevisionToJudgement(decision,acceptedDoseRevision);
  state.current.decision=decision;
  const d=decision;const p=d.practice;
  const acceptedContractRevision=effectivePracticeContractRevision(state.practiceContractRevisionDecisions,d.practice?.id);
  const practiceContract=buildPracticeContract({judgement:d,context:d.context||context,phases:d.practice?.phases||[],revision:acceptedContractRevision});
  const ex=d.explain||buildExplanation(d,context);
  const boundaries=d.boundaries||buildDecisionBoundaries(d,context);
  const decisive=(ex.decisiveFactors||[]).slice(0,2);
  const currentForecast=state.judgementForecasts.find(item=>item.id===state.current?.forecastId||item.judgementId===d.id);
  const practiceEligibility=assessPracticeEligibility(p,d.context||context);
  const humanModelDecisionAudit=humanModelDeliberationSnapshotAudit(d.humanModelSnapshot);
  const currentSafetyEnvelope=d.safetyEnvelope||buildSafetyEnvelope({context:d.context||context,decision:d});
  const currentSafetyAudit=safetyEnvelopeAudit(currentSafetyEnvelope);
  const currentSafetyRequirement=safetyAcknowledgementRequirement(currentSafetyEnvelope);
  const currentSafetyGate=safetyStartGate({envelope:currentSafetyEnvelope,acknowledgement:state.current?.safetyAcknowledgement,judgementId:d.id});
  const currentExplainRecord=d.explainRecord||buildExplainRecord(d,{context:d.context||context});
  shell(`${header('STRATEGOS','<button class="icon-btn" aria-label="Return to Today" data-action="today">\xd7</button>')}
    <section class="judgement-screen">
      <div class="judgement-hero">
        <p class="eyebrow">TODAY\'S JUDGEMENT</p>
        <h1 class="judgement-sentence">${esc(d.judgement)}</h1>
      </div>
      <section class="practice-card">
        <div class="practice-card-head">
          <div class="practice-card-identity">
            <h2>${esc(p.name)}</h2>
            <p>${esc(d.intention)}</p>
          </div>
          <span class="practice-duration">${d.duration} min</span>
        </div>
        ${decisive.length?`<div class="practice-voices">${decisive.map(item=>`<span><strong>${esc(item.advisor)}</strong> — ${esc(item.reason)}</span>`).join('')}</div>`:''}
        ${boundaries.runnerUp?`<p class="runner-up">Runner-up: <strong>${esc(boundaries.runnerUp.name)}</strong></p>`:''}
      </section>
      ${practiceEligibility.status==='blocked'?`<section class="eligibility-warning"><strong>Canonical eligibility assessment</strong><p>Excluded by declared conditions: ${esc(practiceEligibility.reasons[0])}</p><small>Caution states do not alter ranking</small></section>`:''}
      ${currentSafetyEnvelope.status!=='clear'?`<section class="safety-notice ${currentSafetyGate.canStart?'acknowledged':'pending'}"><strong>${currentSafetyGate.canStart?'Safety noted':'Acknowledgement required'}</strong><p>${esc(currentSafetyAudit.statement)}</p>${currentSafetyRequirement.required&&!currentSafetyGate.canStart?`<button data-safety-action="acknowledge">I understand this safety boundary</button>`:''}</section>`:''}
      <section class="judgement-choice ${pendingChoice?'has-pending':''}">
        <div class="choice-buttons">
          <button class="choice-accept" data-choice-action="accept">Accept</button>
          ${boundaries.runnerUp?`<button class="choice-alt" data-choice-action="choose-alternative" data-choice-practice="${esc(boundaries.runnerUp.id)}">Choose ${esc(boundaries.runnerUp.name)}</button>`:''}
          <div class="choice-minor-row">
            <button class="choice-minor" data-choice-action="defer">Decide later</button>
            <button class="choice-minor" data-choice-action="decline">Not today</button>
          </div>
        </div>
        ${pendingChoice?`<div class="choice-reason-panel" id="choice-reason-panel"><label><span>What is behind this choice?</span><small>Optional — helps Strategos understand your decision.</small><textarea id="choice-reason" rows="3" placeholder="Optional reason"></textarea></label><div><button class="action primary" data-choice-reason-action="continue">Continue</button><button class="action secondary" data-choice-reason-action="cancel">Cancel</button></div></div>`:''}
        ${d.personChoice?`<p class="choice-record">${esc(summarizeChoice(d.personChoice))}</p>`:''}
      </section>
      ${(d.status==='accepted'||d.status==='overridden')?`<section class="commitment-panel" id="commitment-panel">
        <p class="eyebrow">WHEN WILL YOU BEGIN?</p>
        <p class="contract-intention">${esc(practiceContract.intention)}</p>
        <p class="contract-label">Enough for today</p><p class="contract-enough">${esc(practiceContract.enough)}</p>
        <p class="contract-label">Reflection question</p><p class="contract-review">${esc(practiceContract.review||'What did you notice?')}</p>
        ${state.current?.commitmentId?(()=>{const c=state.commitments.find(item=>item.id===state.current.commitmentId),f=state.frictionPlans.find(item=>item.id===state.current?.frictionPlanId);if(!c)return '';return `<p class="commitment-status">${esc(commitmentSummary(c))}</p>${f?`<div class="friction-summary"><strong>Obstacle noted:</strong> ${esc(frictionSummary(f))}</div>${state.current?.fallbackPlanId?(()=>{const fp=state.fallbackPlans.find(item=>item.id===state.current.fallbackPlanId);return fp?`<div class="fallback-card"><p>${esc(fallbackSummary(fp))}</p><small>${esc(fp.scope)} · ${Math.round(fp.reductionRatio*100)}% scale</small><div class="fallback-actions">${fp.status==='proposed'?`<button data-fallback-action="accept">Use fallback</button><button data-fallback-action="decline">Keep original</button>`:''}</div></div>`:''})():`<button class="text-btn" data-fallback-action="create">Add a fallback plan</button>`}`:`<div class="friction-minimal"><p class="muted">What could get in the way?</p><div class="friction-actions">${['time','environment','energy','emotion','social','uncertainty','other'].map(type=>`<button data-friction-type="${type}">${type}</button>`).join('')}</div></div>`}<div class="commitment-actions" id="commitment-start">${commitmentAvailability(c).canStart&&canBeginWithFriction(c,f).canBegin&&currentSafetyGate.canStart?button('BEGIN PRACTICE','commit'):''}${commitmentAvailability(c).canStart&&canBeginWithFriction(c,f).canBegin&&!currentSafetyGate.canStart?`<p class="safety-start-gate">${esc(currentSafetyGate.reason)}</p>`:''}<button data-commitment-action="cancel">Cancel commitment</button></div>`;})():`<div class="commitment-actions" id="commitment-options"><button data-commitment-action="now">Begin within 30 minutes</button><button data-commitment-action="later">Schedule for later</button></div>`}
      </section>`:''}
      <details class="deliberation-detail">
        <summary>How this judgement was formed</summary>
        <div class="deliberation-detail-body">
          <div class="deliberation-section">
            <p class="eyebrow">ADVISORS</p>
            ${(d.advisors||[]).map(a=>`<article><div><strong>${esc(a.advisor)}</strong><span>${esc(a.position)}</span></div><p>${esc(a.reason)}</p></article>`).join('')}
            ${(d.minorityReports||[]).length?`<div class="deliberation-minority"><p class="eyebrow">MINORITY</p>${d.minorityReports.map(r=>`<article><strong>${esc(r.advisor)}</strong><p>${esc(r.reason)}</p></article>`).join('')}</div>`:''}
          </div>
          <div class="deliberation-section">
            <p class="eyebrow">CONFIDENCE</p>
            <p>${esc(ex.confidenceStatement)}</p>
            <p class="deliberation-meta">${esc(d.confidenceLevel||confidenceLabel(d.confidence))} confidence · ${d.duration} min</p>
          </div>
          ${boundaries.changeConditions?.length?`<div class="deliberation-section"><p class="eyebrow">WHAT WOULD CHANGE THIS</p><ul>${boundaries.changeConditions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
          <div class="deliberation-section"><p class="eyebrow">EXPLANATION RECORD</p><small>Explanation influence: 0 · Canonical explanation record · Descriptive and audit-only in Phase 1.</small></div>
          ${d.humanModelSnapshot?`<div class="deliberation-section"><p class="eyebrow">HUMAN MODEL EVIDENCE</p><p>${esc(humanModelDeliberationSnapshotSummary(d.humanModelSnapshot))}</p><small>Human Model evidence boundary: ${humanModelDecisionAudit.rejectedCount||0} excluded · Judgement influence: ${humanModelDecisionAudit.judgementInfluence}</small></div>`:''}
          ${currentSafetyEnvelope?`<div class="deliberation-section"><p class="eyebrow">SAFETY ENVELOPE</p><p>Safety envelope: ${esc(safetyEnvelopeSummary(currentSafetyEnvelope))}</p><small>Phase 2 requires explicit acknowledgement before Practice begins</small>${currentSafetyEnvelope.blockedPractices?.length?`<ul>${currentSafetyEnvelope.blockedPractices.map(item=>`<li><strong>${esc(item.practiceId)}</strong> — ${esc(item.reason)}</li>`).join('')}</ul>`:''}</div>`:''}
          ${d.agora?.blockedPractices?.length?`<div class="deliberation-section"><p class="eyebrow">EXCLUDED BY CONTEXT</p>${d.agora.blockedPractices.map(item=>`<p><strong>${esc(item.practiceId)}</strong> — ${esc(item.reason)}</p>`).join('')}</div>`:''}
          <div class="deliberation-section"><p class="eyebrow">FULL REASONING</p><button class="text-btn deliberation-understanding-link" data-action="understanding" data-guide-section="judgement">See the full reasoning in Understanding</button></div>
        </div>
      </details>
      <div class="judgement-footer-actions">
        <button class="text-btn" data-action="speak-judgement">Hear this</button>
        <button class="text-btn" data-action="today">Reassess today</button>
      </div>
    </section>
    ${nav('today')}`)
}
async function requestWakeLock(){
  if(!state.settings.keepAwake||!supportsWakeLock()||document.visibilityState!=='visible'){
    wakeLockStatus=supportsWakeLock()?'inactive':'unsupported';
    return false;
  }
  if(wakeLock&&!wakeLock.released){wakeLockStatus='active';return true}
  try{
    wakeLock=await navigator.wakeLock.request('screen');
    wakeLockStatus='active';
    wakeLock.addEventListener?.('release',()=>{wakeLock=null;wakeLockStatus='released'});
    return true;
  }catch(_){wakeLock=null;wakeLockStatus='failed';return false}
}
async function releaseWakeLock(){
  try{if(wakeLock&&!wakeLock.released)await wakeLock.release()}catch(_){}
  wakeLock=null;wakeLockStatus='inactive';
}
function execute(){
  const d=decision||state.current?.decision;if(!d)return route('today');
  const phases=d.practice.phases,total=d.duration*60,source=phases.reduce((a,x)=>a+x[1],0),scale=total/source;
  phaseIndex=0;paused=false;
  state.current.adjusted=phases.map(x=>[x[0],Math.max(20,Math.round(x[1]*scale)),x[2],x[3]||[]]);
  state.current.startedAt=new Date().toISOString();
  state.dailyStories=upsertDailyStory(state.dailyStories,{stage:'practice',judgement:{id:d.id,statement:d.judgement,practiceName:d.practice?.name||null,confidence:d.confidence}});
  const acceptedContractRevision=effectivePracticeContractRevision(state.practiceContractRevisionDecisions,d.practice?.id);const contract=buildPracticeContract({judgement:d,context:d.context||context,phases:state.current.adjusted,revision:acceptedContractRevision});
  state.current.practiceContract=snapshotPracticeContract(contract,state.current.startedAt);
  state.current.practiceContentSnapshot=snapshotPracticeContent(d.practice,{durationMinutes:d.duration,phases:state.current.adjusted,at:state.current.startedAt});
  const acceptedDoseRevision=effectivePracticeDoseRevisionWithHealth(state.practiceDoseRevisionDecisions,state.history,d.practice?.id);
  state.current.practiceDoseRevisionUse=recordPracticeDoseRevisionUse({revision:acceptedDoseRevision,contract:state.current.practiceContract,at:state.current.startedAt});
  state.current.execution={...createExecutionState(state.current.adjusted),startedAt:state.current.startedAt,practiceContractVersion:state.current.practiceContract?.version||1};
  state.current.safetyEvents=Array.isArray(state.current.safetyEvents)?state.current.safetyEvents:[];
  const outcomeIndex=state.outcomeRecords.findIndex(item=>item.id===state.current.outcomeRecordId);
  if(outcomeIndex>=0)state.outcomeRecords[outcomeIndex]=markOutcomeStarted(state.outcomeRecords[outcomeIndex],d.practice.id,state.current.startedAt);
  updateJudgementStatus('in-practice');
  persist();requestWakeLock();playTone('begin',state.settings.sound);runPhase(state.current.adjusted,{announce:true});
}
function resumePrompt(){
  const d=state.current?.decision,execution=state.current?.execution;
  if(!d||!isResumable(execution))return route('today');
  const snapshot=buildPracticeSessionSnapshot({phases:state.current.adjusted,execution});
  shell(`${header('PRACTICE PAUSED')}<section class="stack center resume-practice"><p class="eyebrow">AN INTERRUPTED PRACTICE</p><h2>${esc(d.practice.name)}</h2><p class="muted">${esc(describePracticeResume(snapshot))}</p><div class="resume-session-summary"><strong>${esc(practiceSessionSummary(snapshot))}</strong><span>${Math.round(snapshot.progressRatio*100)}% complete</span></div>${state.current?.practiceContract?`<small class="resume-contract">${esc(practiceContractSummary(state.current.practiceContract))}</small>`:''}${snapshot.next?`<div class="resume-next"><span>Next</span><strong>${esc(snapshot.next.name)}</strong></div>`:''}${button('RESUME PRACTICE','resume-practice')}${button('END AND RECORD','end-interrupted',true)}<button class="text-btn" data-action="discard-interrupted">Discard this session</button></section>`);
}
function practiceExit(){
  const d=state.current?.decision,execution=state.current?.execution;
  if(!d||!canResumePractice(execution))return route('today');

  if(execution.status===EXECUTION_STATUS.ACTIVE){
    state.current.execution=pauseExecution(execution);
    persist();
  }

  const model=buildPracticeExitModel({phases:state.current.adjusted,execution:state.current.execution});
  shell(`${header('PRACTICE')}<section class="stack practice-exit-screen">
    <div><p class="eyebrow">YOUR CONTROL</p><h2>${esc(model.title)}</h2><p class="muted">${esc(model.statement)}</p></div>
    <div class="practice-exit-progress"><strong>${model.percent}% complete</strong><span>${esc(practiceSessionSummary(model.snapshot))}</span></div>
    <div class="practice-exit-actions">
      <button class="action primary" data-action="continue-practice">Continue Practice</button>
      <button class="action secondary" data-action="record-practice-exit">End and record</button>
      <p>${esc(model.recordStatement)}</p>
      <button class="danger-btn subtle" data-action="discard-practice-session">Discard session</button>
      <p>${esc(model.discardStatement)}</p>
    </div>
  </section>`);
}
function runPhase(phases,{announce=false}={}){
  let execution=state.current?.execution;
  if(!execution)return route('today');
  const existingSafetyGate=safetyRuntimeGate(state.current?.safetyEvents);
  if(!existingSafetyGate.canRun&&execution.status!==EXECUTION_STATUS.PAUSED){
    state.current.execution=pauseExecution(execution);
    execution=state.current.execution;
    persist();
  }
  phaseIndex=execution.phaseIndex;
  const p=phases[phaseIndex];if(!p)return finishPractice();
  paused=execution.status===EXECUTION_STATUS.PAUSED;
  secondsLeft=remainingSeconds(execution);
  const phaseGuidance=buildPhaseGuidance({phase:p,practice:(decision||state.current.decision).practice,context});
  const guidanceDecision=buildGuidanceDecision({guidance:phaseGuidance,experience:state.profile?.experience,context});
  const availableLevels=availableAdaptationLevels(phaseGuidance);
  const confirmedDefault=resolveConfirmedAdaptationDefault({
    history:state.history,
    reviews:state.adaptationPatternReviews,
    practiceId:(decision||state.current.decision).practice?.id,
    phaseName:String(p[0]||`Phase ${phaseIndex+1}`),
    availableLevels,
    contextRecommendedLevel:guidanceDecision.appliedLevel||guidanceDecision.requestedLevel
  });
  if(confirmedDefault.applied){
    const nextCurrent=recordConfirmedAdaptationDefault(state.current,{
      phaseIndex,
      phaseName:String(p[0]||`Phase ${phaseIndex+1}`),
      level:confirmedDefault.level,
      patternId:confirmedDefault.pattern.id
    });
    if(nextCurrent!==state.current){state.current=nextCurrent;persist()}
  }
  const selectedAdaptation=getPhaseAdaptationChoice(state.current,phaseIndex);
  const startingLevel=confirmedDefault.applied?confirmedDefault.level:(guidanceDecision.appliedLevel||guidanceDecision.requestedLevel);
  const adaptationChoice=resolveAdaptationChoice({guidance:phaseGuidance,recommendedLevel:startingLevel,selectedLevel:selectedAdaptation});
  const recommendedGuidance=adaptationChoice.text?{level:adaptationChoice.appliedLevel,text:adaptationChoice.text}:guidanceDecision.recommendation;
  if(announce){playTone('phase',state.settings.sound);speak(state.settings.voice==='guided'?phaseGuidance.voiceCue:`${p[0]}.`,state.settings.voice,true);announceStatus(`Phase ${phaseIndex+1} of ${phases.length}: ${p[0]}`)}
  const snapshot=buildPracticeSessionSnapshot({phases,execution});
  const runtimeSafetyGate=safetyRuntimeGate(state.current?.safetyEvents);
  const runtimeSafetyEvent=runtimeSafetyGate.active;
  const practiceExperience=buildPracticeExperience({phase:p,guidance:phaseGuidance,snapshot,paused,safetyPaused:Boolean(runtimeSafetyEvent)});
  shell(`<header><span class="eyebrow">PRACTICE IN PROGRESS</span><div class="practice-header-actions"><button class="text-btn runtime-safety-trigger" data-runtime-safety-action="raise">Safety concern</button><button class="icon-btn" aria-label="End practice" data-action="abandon">×</button></div></header><section class="execution">${runtimeSafetyEvent?`<section class="runtime-safety-panel"><p class="eyebrow">SAFETY PAUSE</p><h3>Practice paused because you raised a concern.</h3><p>${esc(runtimeSafetyEvent.statement)}</p><div class="runtime-safety-actions"><button data-runtime-safety-action="resume">I reassessed and can resume</button><button data-runtime-safety-action="end">End Practice safely</button></div></section>`:''}<div class="practice-session-strip focused"><span>${esc(practiceExperience.phaseLabel)}</span><strong>${Math.round(snapshot.progressRatio*100)}% complete</strong></div><div class="practice-focus"><p class="practice-intention">${esc((decision||state.current.decision).intention)}</p><h2>${esc(practiceExperience.name)}</h2><div class="clock" id="clock" role="timer" aria-label="Time remaining">${formatTime(secondsLeft)}</div><p class="practice-primary-cue">${esc(practiceExperience.cue)}</p><small>${esc(practiceExperience.statement)}</small></div><div class="next-phase-card quiet"><span>${snapshot.next?'NEXT':'FINAL PHASE'}</span><strong>${esc(snapshot.next?snapshot.next.name:'Reflection follows')}</strong>${snapshot.next?`<small>${formatTime(snapshot.next.duration)}</small>`:''}</div>${phaseGuidance.hasDetail?`<section class="practice-guidance-card">${recommendedGuidance?`<div class="guidance-recommendation" data-active-adaptation="${esc(adaptationChoice.appliedLevel||'none')}"><span>${esc(adaptationChoiceSummary(adaptationChoice).toUpperCase())}</span><strong id="active-guidance-text">${esc(recommendedGuidance.text)}</strong>${adaptationChoice.personSelected?`<small>Your choice overrides today’s suggested level for this phase only.</small>`:confirmedDefault.applied?`<small>${esc(confirmedAdaptationDefaultSummary(confirmedDefault))}</small>`:confirmedDefault.suspended?`<small>${esc(confirmedDefault.reason)}</small>`:confirmedDefault.safetyBlocked?`<small>${esc(confirmedDefault.reason)}</small>`:guidanceDecision.adapted?`<small>${esc(guidanceDecision.reason)}</small>`:''}</div>`:''}${availableLevels.length>1?`<div class="adaptation-choice" role="group" aria-label="Choose guidance level">${availableLevels.map(level=>`<button data-adaptation-level="${level}" aria-pressed="${adaptationChoice.appliedLevel===level?'true':'false'}" class="${adaptationChoice.appliedLevel===level?'selected':''}">${level==='regression'?'Easier':level==='progression'?'Harder':'Standard'}</button>`).join('')}</div>`:''}<details class="exercise-guide"><summary>Technique</summary><ul>${phaseGuidance.technique.map(x=>`<li>${esc(x)}</li>`).join('')||'<li>Move slowly enough to preserve control.</li>'}</ul></details>${phaseGuidance.regression.length?`<details class="exercise-guide"><summary>Easier version</summary><ul>${phaseGuidance.regression.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''}${phaseGuidance.progression.length?`<details class="exercise-guide"><summary>Harder version</summary><ul>${phaseGuidance.progression.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''}${shouldShowSafetyPanel(phaseGuidance)?`<details class="exercise-guide safety-guide"><summary>Safety</summary><ul>${[...phaseGuidance.cautions,...phaseGuidance.stopSignals].map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''}</section>`:''}<div class="progress"><span id="phase-progress"></span></div><div class="practice-total-progress"><span id="practice-progress" style="width:${Math.round(snapshot.progressRatio*100)}%"></span></div></section><div class="practice-controls"><button class="round-control" aria-label="Previous phase" data-action="previous-phase" ${canMovePhase(phases,execution,-1)?'':'disabled'}>‹</button><button class="pause-control" aria-label="${paused?'Resume practice':'Pause practice'}" data-action="pause">${paused?'Resume':'Pause'}</button><button class="round-control" aria-label="Next phase" data-action="next-phase" ${canMovePhase(phases,execution,1)?'':'disabled'}>›</button></div>`,'execute');
  clearInterval(timer);let lastCountdown=null;
  const refresh=()=>{
    const current=state.current?.execution;if(!current)return;
    secondsLeft=remainingSeconds(current);
    const c=document.querySelector('#clock'),bar=document.querySelector('#phase-progress'),totalBar=document.querySelector('#practice-progress');
    if(c)c.textContent=formatTime(secondsLeft);
    if(bar)bar.style.width=`${100*(1-secondsLeft/current.phaseDuration)}%`;
    if(totalBar){const session=buildPracticeSessionSnapshot({phases,execution:current});totalBar.style.width=`${Math.round(session.progressRatio*100)}%`}
    if(current.status===EXECUTION_STATUS.ACTIVE&&secondsLeft<=5&&secondsLeft>0&&lastCountdown!==secondsLeft){lastCountdown=secondsLeft;playTone('countdown',state.settings.sound,{remaining:secondsLeft});if(state.settings.haptics&&supportsHaptics())navigator.vibrate(secondsLeft===1?28:12);if(secondsLeft===5)announceStatus('Five seconds remaining in this phase')}
    if(current.status===EXECUTION_STATUS.ACTIVE&&secondsLeft<=0){clearInterval(timer);advancePhase(1)}
  };
  refresh();timer=setInterval(refresh,250);
}
function advancePhase(direction){
  const phases=state.current?.adjusted;if(!phases)return route('today');
  const next=Math.max(0,(state.current.execution?.phaseIndex||0)+direction);
  if(next>=phases.length)return finishPractice();
  state.current.execution=startPhase(state.current.execution,phases,next);
  persist();runPhase(phases,{announce:true});
}
function togglePause(){
  const current=state.current?.execution;if(!current)return;
  const runtimeGate=safetyRuntimeGate(state.current?.safetyEvents);
  if(current.status===EXECUTION_STATUS.PAUSED&&!runtimeGate.canRun){announceStatus(runtimeGate.reason);return}
  state.current.execution=current.status===EXECUTION_STATUS.PAUSED?resumeExecution(current):pauseExecution(current);
  paused=state.current.execution.status===EXECUTION_STATUS.PAUSED;
  persist();runPhase(state.current.adjusted,{announce:false});playTone(paused?'pause':'resume',state.settings.sound);announceStatus(paused?'Practice paused':'Practice resumed');
}
function updateJudgementStatus(status,extra={}){const id=state.current?.decision?.id;const j=state.judgements.find(x=>x.id===id);if(j){Object.assign(j,{status,...extra});if(['reviewed','abandoned'].includes(status))j.validity={...(j.validity||{}),status:JUDGEMENT_VALIDITY.CLOSED,closedAt:new Date().toISOString()}}}
function discardPracticeSession(reason='person-discarded'){
  if(!state.current)return route('today');
  const discardedAt=new Date().toISOString();
  const outcomeIndex=state.outcomeRecords.findIndex(item=>item.id===state.current.outcomeRecordId);
  if(outcomeIndex>=0){
    state.outcomeRecords[outcomeIndex]=markOutcomeAbandoned(
      state.outcomeRecords[outcomeIndex],
      {reason:normalisePracticeExitReason(reason),completedPhases:0,totalPhases:state.current.adjusted?.length||0,at:discardedAt}
    );
  }
  updateJudgementStatus('abandoned',{closureReason:normalisePracticeExitReason(reason),discarded:true});
  state=clearReflectionDraft(state);
  state.current=null;
  decision=null;
  releaseWakeLock();
  persist();
  announceStatus('Practice session discarded.');
  route('today');
}
function abandonPractice(reason='person-ended'){
  if(!state.current)return route('today');
  state.current.execution=closeExecution(state.current.execution||{},EXECUTION_STATUS.ABANDONED,{reason});
  const abandonedAt=new Date().toISOString();
  const outcomeIndex=state.outcomeRecords.findIndex(item=>item.id===state.current.outcomeRecordId);
  if(outcomeIndex>=0)state.outcomeRecords[outcomeIndex]=markOutcomeAbandoned(state.outcomeRecords[outcomeIndex],{reason,completedPhases:state.current.execution?.phaseIndex||0,totalPhases:state.current.adjusted?.length||0,at:abandonedAt});
  const commitmentIndex=state.commitments.findIndex(item=>item.id===state.current?.commitmentId);
  if(commitmentIndex>=0)state.commitments[commitmentIndex]=cancelCommitment(state.commitments[commitmentIndex],{reason:'practice-ended-early',at:abandonedAt});
  const fallbackIndex=state.fallbackPlans.findIndex(item=>item.id===state.current?.fallbackPlanId);
  if(fallbackIndex>=0&&['accepted','started'].includes(state.fallbackPlans[fallbackIndex].status))state.fallbackPlans[fallbackIndex]=abandonFallback(state.fallbackPlans[fallbackIndex],{completedRatio:sessionCompletionRatio(state.current.adjusted,state.current.execution),reason});
  const completionRatio=sessionCompletionRatio(state.current.adjusted,state.current.execution);
  const entry={...state.current,outcomeRecord:outcomeIndex>=0?state.outcomeRecords[outcomeIndex]:null,completed:false,abandoned:true,abandonedAt,closureReason:reason,completionRatio};
  state.history.unshift(entry);state.history=state.history.slice(0,100);
  updateJudgementStatus('abandoned',{closureReason:reason});
  state.dailyStories=upsertDailyStory(state.dailyStories,{stage:'reflection',practice:{name:entry.decision?.practice?.name||null,reflection:value,completedAt:reflectedAt}});state=clearReflectionDraft(state);state.current=null;decision=null;releaseWakeLock();persist();route('today');
}
function finishPractice(){
  if(state.current?.execution)state.current.execution=closeExecution(state.current.execution,EXECUTION_STATUS.COMPLETED);
  const outcomeIndex=state.outcomeRecords.findIndex(item=>item.id===state.current?.outcomeRecordId);
  if(outcomeIndex>=0)state.outcomeRecords[outcomeIndex]=markOutcomeCompleted(state.outcomeRecords[outcomeIndex],{practiceId:state.current?.decision?.practice?.id,completedPhases:state.current?.adjusted?.length||0,totalPhases:state.current?.adjusted?.length||0});
  const commitmentIndex=state.commitments.findIndex(item=>item.id===state.current?.commitmentId);
  if(commitmentIndex>=0)state.commitments[commitmentIndex]=markCommitmentCompleted(state.commitments[commitmentIndex]);
  const fallbackIndex=state.fallbackPlans.findIndex(item=>item.id===state.current?.fallbackPlanId);
  if(fallbackIndex>=0&&state.fallbackPlans[fallbackIndex].status==='started')state.fallbackPlans[fallbackIndex]=completeFallback(state.fallbackPlans[fallbackIndex],{completedRatio:1});
  updateJudgementStatus('completed');persist();releaseWakeLock();playTone('complete',state.settings.sound);announceStatus('Practice complete');route('reflect');
}
function reflect(){
  const restored=restoreReflectionDraft(state,state.current);
  const values=restored?.values||createReflectionDraft({current:state.current}).values;
  if(!restored){state.reflectionDraft=createReflectionDraft({current:state.current,values});persist()}
  const friction=state.frictionPlans.find(item=>item.id===state.current?.frictionPlanId&&item.status==='active');
  const adaptationPrompt=adaptationReflectionPrompt(state.current,state.current?.adjusted||[]);
  const practiceContract=state.current?.practiceContract||null;
  shell(`${header('REFLECTION')}<section class="stack reflection-screen"><div><p class="eyebrow">LOOKING BACK</p><h2>What actually happened?</h2><p class="muted">Three answers are enough. Add detail only when it helps.</p></div>${practiceContract?`<section class="reflection-contract"><p class="eyebrow">PRE-ACTION CONTRACT</p><strong>${esc(practiceContract.review)}</strong><small>${esc(practiceContract.expectedEffect)}</small></section>`:''}
    <div class="reflection-essential">
      <label>Effect<select id="reflection-effect" data-reflection-draft="effect"><option value="better" ${values.effect==='better'?'selected':''}>Better than expected</option><option value="right" ${values.effect==='right'?'selected':''}>About right</option><option value="worse" ${values.effect==='worse'?'selected':''}>Worse than expected</option></select></label>
      <label>Goal fit<select id="reflection-goal" data-reflection-draft="goalFit"><option value="strong" ${values.goalFit==='strong'?'selected':''}>Strong</option><option value="partial" ${values.goalFit==='partial'?'selected':''}>Partial</option><option value="poor" ${values.goalFit==='poor'?'selected':''}>Poor</option><option value="unknown" ${values.goalFit==='unknown'?'selected':''}>Unknown</option></select></label>
      <label>Burden<select id="reflection-burden" data-reflection-draft="burden"><option value="low" ${values.burden==='low'?'selected':''}>Low</option><option value="moderate" ${values.burden==='moderate'?'selected':''}>Moderate</option><option value="high" ${values.burden==='high'?'selected':''}>High</option><option value="unknown" ${values.burden==='unknown'?'selected':''}>Unknown</option></select></label>
      ${friction?`<label>Did the anticipated friction appear?<select id="reflection-friction" data-reflection-draft="frictionOutcome"><option value="managed" ${values.frictionOutcome==='managed'?'selected':''}>Yes, and I managed it</option><option value="partly-managed" ${values.frictionOutcome==='partly-managed'?'selected':''}>Yes, partly managed</option><option value="blocked" ${values.frictionOutcome==='blocked'?'selected':''}>Yes, it blocked me</option><option value="not-relevant" ${values.frictionOutcome==='not-relevant'?'selected':''}>It did not appear</option></select></label>`:''}
      ${adaptationPrompt?`<label>${esc(adaptationPrompt.title)}<select id="reflection-adaptation-fit" data-reflection-draft="adaptationFit"><option value="right" ${values.adaptationFit==='right'?'selected':''}>About right</option><option value="better" ${values.adaptationFit==='better'?'selected':''}>Better than suggested</option><option value="worse" ${values.adaptationFit==='worse'?'selected':''}>Worse than suggested</option><option value="unknown" ${values.adaptationFit==='unknown'?'selected':''}>Not sure</option></select><small class="field-note">${esc(adaptationPrompt.description)}</small></label>`:''}
    </div>
    <details class="reflection-detail"><summary><span>Add more context</span><small>Optional. Use this only when it helps explain why the result happened.</small></summary><div class="structured-reflection">
      <div class="reflection-detail-intro">
        <strong>Help Strategos separate the effect of the Practice from coincidence or outside events.</strong>
        <p>There are no correct answers. Choose the closest option, or leave this section closed.</p>
      </div>
      <label>Was the result surprising?
        <small class="field-note">Compare what happened with what you expected before starting.</small>
        <select id="reflection-surprise" data-reflection-draft="surprise"><option value="none" ${values.surprise==='none'?'selected':''}>No — it was expected</option><option value="some" ${values.surprise==='some'?'selected':''}>Somewhat surprising</option><option value="material" ${values.surprise==='material'?'selected':''}>Very different from expected</option></select>
      </label>
      <label>How confident are you in this assessment?
        <small class="field-note">This is confidence in your overall feedback, not confidence in Strategos.</small>
        <select id="reflection-confidence" data-reflection-draft="confidence"><option value="low" ${values.confidence==='low'?'selected':''}>Low — mostly a guess</option><option value="medium" ${values.confidence==='medium'?'selected':''}>Medium — reasonably sure</option><option value="high" ${values.confidence==='high'?'selected':''}>High — quite certain</option></select>
      </label>
      <label>What most likely caused the outcome?
        <small class="field-note">Choose what contributed most to feeling better, the same or worse.</small>
        <select id="attribution-source" data-reflection-draft="attributionSource"><option value="practice" ${values.attributionSource==='practice'?'selected':''}>Mostly the Practice</option><option value="mixed" ${values.attributionSource==='mixed'?'selected':''}>The Practice and other factors</option><option value="time" ${values.attributionSource==='time'?'selected':''}>Mostly the passage of time</option><option value="external" ${values.attributionSource==='external'?'selected':''}>Mostly external factors</option><option value="unclear" ${values.attributionSource==='unclear'?'selected':''}>I cannot tell</option></select>
      </label>
      <label>How certain are you about that cause?
        <small class="field-note">Low is appropriate when several explanations are possible.</small>
        <select id="attribution-confidence" data-reflection-draft="attributionConfidence"><option value="low" ${values.attributionConfidence==='low'?'selected':''}>Low — uncertain</option><option value="medium" ${values.attributionConfidence==='medium'?'selected':''}>Medium — plausible</option><option value="high" ${values.attributionConfidence==='high'?'selected':''}>High — clear connection</option></select>
      </label>
      <label>Were there important external factors?
        <small class="field-note">Examples: medication, food, conversation, work interruption, pain changing naturally or another activity.</small>
        <textarea id="attribution-factors" rows="3" data-reflection-draft="externalFactors" placeholder="Optional — describe only what may have affected the result">${esc(values.externalFactors)}</textarea>
      </label>
      <label>Anything else Strategos should remember?
        <small class="field-note">Use this for context that the options above do not capture.</small>
        <textarea id="reflection-note" rows="3" data-reflection-draft="note" placeholder="Optional note">${esc(values.note)}</textarea>
      </label>
    </div></details>
    <button class="action primary" data-structured-reflection="save">SAVE REFLECTION</button>
    <p class="reflection-save-note">Your answers are saved automatically on this device.</p>
  </section>`)
}
function saveReflection(value){
  const reflectedAt=new Date().toISOString();
  const outcomeIndex=state.outcomeRecords.findIndex(item=>item.id===state.current?.outcomeRecordId);
  let outcomeRecord=outcomeIndex>=0?state.outcomeRecords[outcomeIndex]:null;
  if(outcomeRecord){
    outcomeRecord=attachOutcomeReflection(outcomeRecord,value,reflectedAt);
    state.outcomeRecords[outcomeIndex]=outcomeRecord;
  }
  const frictionIndex=state.frictionPlans.findIndex(item=>item.id===state.current?.frictionPlanId);
  if(frictionIndex>=0&&state.frictionPlans[frictionIndex].status==='active'){
    const frictionOutcome=state.reflectionDraft?.values?.frictionOutcome||'not-relevant';
    state.frictionPlans[frictionIndex]=markFrictionEncountered(state.frictionPlans[frictionIndex],{outcome:frictionOutcome});
  }
  let eligibility=learningEligibility(outcomeRecord);
  const fallback=state.fallbackPlans.find(item=>item.id===state.current?.fallbackPlanId);
  if(fallback){
    const fallbackEligibility=fallbackLearningEligibility(fallback,value);
    eligibility=fallbackEligibility;
  }
  const structuredReflection=state.structuredReflections.find(item=>item.id===state.current?.structuredReflectionId);
  let outcomeAttribution=null;
  if(structuredReflection){
    const friction=state.frictionPlans.find(item=>item.id===state.current?.frictionPlanId);
    eligibility=reflectionLearningSignal(structuredReflection,{completionRatio:fallback?.completedRatio??outcomeRecord?.completionRatio??0,wasFallback:Boolean(fallback),frictionOutcome:friction?.outcome||null});
    outcomeAttribution=state.outcomeAttributions.find(item=>item.id===state.current?.outcomeAttributionId)||null;
    eligibility=calibrateLearningWithAttribution(eligibility,outcomeAttribution);
  }
  const adaptationAccountability=hasAppliedAdaptations(state.current)?buildAdaptationAccountability({
    phaseAdaptations:state.current.phaseAdaptations,
    confirmedDefaults:state.current.confirmedAdaptationDefaults,
    phases:state.current.adjusted,
    reflectionValue:value,
    fit:state.reflectionDraft?.values?.adaptationFit||'unknown',
    at:reflectedAt
  }):null;
  const forecastIndex=state.judgementForecasts.findIndex(item=>item.id===state.current?.forecastId||item.judgementId===state.current?.decision?.id);
  let resolvedForecast=null;
  if(forecastIndex>=0){
    resolvedForecast=resolveJudgementForecast(state.judgementForecasts[forecastIndex],{actualEffect:value,causalSource:outcomeAttribution?.source||'unclear',at:reflectedAt});
    state.judgementForecasts[forecastIndex]=resolvedForecast;
  }
  const practiceContractOutcome=resolvePracticeContract({
    contract:state.current?.practiceContract||null,
    reflection:state.reflectionDraft?.values||{},
    completedRatio:fallback?.completedRatio??outcomeRecord?.completionRatio??1,
    at:reflectedAt
  });
  const practiceDoseRevisionUse=resolvePracticeDoseRevisionUse(state.current?.practiceDoseRevisionUse,{
    contractOutcome:practiceContractOutcome,
    completionRatio:fallback?.completedRatio??outcomeRecord?.completionRatio??1,
    at:reflectedAt
  });
  const entry={...state.current,structuredReflection,outcomeAttribution,resolvedForecast,adaptationAccountability,practiceContractOutcome,practiceDoseRevisionUse,fallbackOutcome:fallbackOutcomeRecord(fallback,value),judgementId:state.current?.decision?.id||null,outcomeRecord,learningEligibility:eligibility,reflection:value,completed:true,completedAt:reflectedAt};const ledgerEntry=createOutcomeLedgerEntry({historyEntry:entry,structuredReflection,outcomeRecord,result:outcomeLedgerResultFromReflection(structuredReflection||value),note:structuredReflection?.note||'',at:reflectedAt});state.outcomeLedger=upsertOutcomeLedger(state.outcomeLedger,ledgerEntry);
  const episode=createOutcomeEpisode({historyEntry:entry,structuredReflection,attribution:outcomeAttribution,learningSignal:eligibility});
  state.outcomeEpisodes=[episode,...(state.outcomeEpisodes||[]).filter(item=>item.id!==episode.id)].slice(0,200);
  state.outcomePatterns=upsertOutcomePattern(state.outcomePatterns,episode);
  state.history.unshift(entry);
  if(eligibility.eligible){
    state.advisorMemories=learnFromReflection(state.advisorMemories,entry);
    const choice=state.choiceLog.find(item=>item.id===outcomeRecord?.choiceId);
    if(choice?.action==='choose-alternative'){
      const candidate=createPreferenceCandidate({choice,context:entry.context||context,at:reflectedAt});
      state.preferenceModel=upsertPreferenceCandidate(state.preferenceModel,candidate);
    }
  }
  state.deltaTotal=+(state.deltaTotal+entry.decision.delta.overall).toFixed(2);
  const j=state.judgements.find(x=>x.id===entry.decision.id);
  if(j){j.status='reviewed';j.reflection=value;j.outcomeRecordId=outcomeRecord?.id||null;j.validity={...(j.validity||{}),status:JUDGEMENT_VALIDITY.CLOSED,closedAt:reflectedAt}}
  state.dailyStories=upsertDailyStory(state.dailyStories,{stage:'reflection',practice:{name:entry.decision?.practice?.name||null,reflection:value,completedAt:reflectedAt}});state=clearReflectionDraft(state);state.current=null;decision=null;state.councilReports=upsertMonthlyCouncilReport(state.councilReports,state);({state}=reconcileLongitudinalState(state));persist();journal(entry)
}
function journal(entry){const missed=entry.reflection==='worse';shell(`${header('LEARNING')}<section class="stack center"><p class="eyebrow">${missed?'A CORRECTION':'A NEW SIGNAL'}</p><h2>${missed?'I may have misunderstood today.':'I will carry this forward.'}</h2><p class="journal-copy">${missed?'The next judgement should place less confidence in today’s assumptions. A mistaken judgement is useful when it improves the next one.':'This reflection has been added to the relationship, not merely to a log.'}</p>${entry.adaptationAccountability?`<div class="adaptation-accountability-note"><span>IN-SESSION CHOICE</span><p>${esc(adaptationAccountabilitySummary(entry.adaptationAccountability))}</p><small>Recorded for accountability. Not yet treated as a stable preference.</small></div>`:''}${button('RETURN TO TODAY','today')}</section>`)}
function understanding(){
  const activeJudgement=state.current?.decision||state.judgements.find(item=>!['reviewed','abandoned','declined','superseded'].includes(item.status))||state.judgements[0];
  const latest=activeJudgement?.understanding||buildUnderstanding(context,state.history);
  const discoveries=deriveDiscoveries();
  const changes=(state.understandingModel?.changes||[]).slice(0,6);
  state.advisorMemories=expireStaleLearnings(normalizeAdvisorMemories(state.advisorMemories));
  const coverage=advisorCoverage(state.advisorMemories);
  const learningItems=learningReviewItems(state.advisorMemories).slice(0,12);
  const rawAdaptationPatterns=adaptationPatternCandidates(state.history).slice(0,12);
  const reviewedAdaptationPatterns=mergeAdaptationPatternReviews(rawAdaptationPatterns,state.adaptationPatternReviews);
  const healthyAdaptationPatterns=attachConfirmedDefaultHealth(reviewedAdaptationPatterns,state.history);
  const adaptationPatterns=attachAdaptationReconfirmation(healthyAdaptationPatterns,state.history);
  const adaptationAudit=adaptationPatternReviewAudit(rawAdaptationPatterns,state.adaptationPatternReviews);
  const suspendedAdaptationDefaults=adaptationPatterns.filter(pattern=>pattern.effectiveStatus==='review-required').length;
  const adaptationTrace=buildAdaptationAuditTrace({history:state.history,reviews:state.adaptationPatternReviews});
  const adaptationTraceSummary=adaptationAuditTraceSummary(adaptationTrace);
  const rawContractCalibrations=practiceContractCalibrationCandidates(state.history).slice(0,12);
  const contractCalibrations=mergePracticeContractCalibrationReviews(rawContractCalibrations,state.practiceContractCalibrationReviews);
  const contractCalibrationAudit=practiceContractCalibrationAudit(state.history);
  const contractCalibrationReviewAudit=practiceContractCalibrationReviewAudit(contractCalibrations);
  const contractRevisionProposals=buildPracticeContractRevisionProposals(rawContractCalibrations,state.practiceContractCalibrationReviews,state.practiceContractRevisionDecisions);
  const rawPracticeDoseEvidence=practiceDoseEvidenceCandidates(state.history).slice(0,12);
  const practiceDoseEvidence=mergePracticeDoseEvidenceReviews(rawPracticeDoseEvidence,state.practiceDoseEvidenceReviews);
  const practiceDoseAudit=practiceDoseEvidenceAudit(state.history);
  const practiceDoseReviewAudit=practiceDoseEvidenceReviewAudit(practiceDoseEvidence);
  const practiceDoseRevisionProposals=buildPracticeDoseRevisionProposals(rawPracticeDoseEvidence,state.practiceDoseEvidenceReviews,state.practiceDoseRevisionDecisions).map(proposal=>({
    ...proposal,
    health:assessPracticeDoseRevisionHealth(state.history,proposal.id)
  }));
  const practiceLibrary=practiceLibraryCatalog(CODEX);
  const practiceLibraryAudit=validatePracticeLibrary(CODEX);
  const practiceLibraryOverview=practiceLibrarySummary(practiceLibrary);
  const practiceEligibilityAudit=assessPracticeLibraryEligibility(CODEX,context);
  const practiceContentAudit=practiceContentProvenanceAudit(state.history,CODEX);
  const humanModel=normaliseHumanModel(state.humanModel,{profile:state.profile});
  const humanModelCurrent=humanModelSnapshot(humanModel);
  const humanModelStatus=humanModelAudit(humanModel);
  const humanModelReviewStatus=humanModelReviewAudit(humanModel);
  const latestHumanModelSnapshot=activeJudgement?.humanModelSnapshot||null;
  const humanModelSnapshotStatus=humanModelDeliberationSnapshotAudit(latestHumanModelSnapshot);
  const humanModelFactCandidatesList=humanModelFactCandidates(humanModel);
  const humanModelPromotionStatus=humanModelFactPromotionAudit(humanModel);
  const humanModelDimensions=humanModelDimensionSummary(humanModel);
  const latestSafetyEnvelope=activeJudgement?.safetyEnvelope||null;
  const latestSafetyAudit=safetyEnvelopeAudit(latestSafetyEnvelope);
  const latestExplainRecord=normaliseExplainRecordForDisplay(activeJudgement?.explainRecord||null);
  const latestExplainAudit=explainRecordAudit(latestExplainRecord);
  const latestExplainValidation=latestExplainRecord?validateExplainRecord(latestExplainRecord):{valid:false,errors:['record-missing']};
  const latestExplainReview=explainRecordReviewAudit(latestExplainRecord);
  const latestRuntimeSafetyEvents=state.current?.safetyEvents||state.history.find(item=>item?.safetyEvents?.length)?.safetyEvents||[];
  const latestRuntimeSafetyAudit=safetyInterruptionAudit(latestRuntimeSafetyEvents);
  state.councilReports=upsertMonthlyCouncilReport(state.councilReports,state);const council=state.councilReports[0]||buildMonthlyCouncil(state.advisorMemories,state.history);
  shell(`${header('UNDERSTANDING')}<section class="stack understanding-screen"><div><p class="eyebrow">CURRENT UNDERSTANDING</p><h2>A council that accumulates experience.</h2><p class="muted">Each Advisor learns only from reflections in its own domain. Their uncertainty remains visible and correctable.</p><button class="context-help inline" data-guide-section="understanding">How should I read Understanding?</button></div>
    <div class="understanding-summary"><span>${discoveries.filter(x=>x.level==='pattern').length} patterns</span><span>${discoveries.filter(x=>x.level==='hypothesis').length} hypotheses</span><span>${latest.unknowns.length} open questions</span></div>
    <details class="monthly-council" open><summary>Monthly Council · ${esc(council.month)}</summary><p class="council-summary">${esc(council.summary)}</p>${council.voices.map(v=>`<article><div><strong>${v.advisor}</strong><span>${v.coverage}% coverage</span></div><p>${esc(v.statement)}</p></article>`).join('')}</details>
    <section class="human-model-foundation understanding-group" data-understanding-group="overview">
      <div class="section-heading"><div><p class="eyebrow">HUMAN MODEL</p><h3>A progressive model with visible evidence and unknowns</h3></div></div>
      <p>${esc(humanModelSummary(humanModel))}</p>
      <div class="human-model-dimensions">${humanModelDimensions.map(item=>`<article class="${esc(item.status)}"><div><strong>${esc(item.dimension)}</strong><span>${item.evidenceCount}</span></div><small>${item.status==='visible'?'Direct information is currently visible.':'Still unknown; Strategos should not fill this gap by assumption.'}</small></article>`).join('')}</div>
      <details class="human-model-evidence"><summary>What the model currently contains</summary><div><p class="eyebrow">CONFIRMED FACTS</p>${humanModelCurrent.facts.length?humanModelCurrent.facts.map(item=>`<article class="human-model-evidence-item ${esc(item.reviewStatus||item.confidence)}"><div><strong>${esc(item.key)}</strong><span>${esc(item.reviewStatus||item.confidence)}</span></div><p>${esc(item.value)}</p><small>${esc(humanModelEvidenceSummary(item))}</small><div class="insight-actions">${item.reviewStatus==='rejected'?`<button data-human-model-action="reopen" data-human-model-evidence-id="${esc(item.id)}">Reopen</button>`:`<button data-human-model-action="confirm" data-human-model-evidence-id="${esc(item.id)}">Confirm</button><button data-human-model-action="correct" data-human-model-evidence-id="${esc(item.id)}">This is not accurate</button>`}</div></article>`).join(''):'<p>No confirmed facts yet.</p>'}<p class="eyebrow">CURRENT OBSERVATIONS</p>${humanModelCurrent.currentObservations.length?humanModelCurrent.currentObservations.map(item=>`<article class="human-model-evidence-item ${esc(item.reviewStatus||item.confidence)}"><div><strong>${esc(item.key)}</strong><span>${esc(item.reviewStatus||item.confidence)}</span></div><p>${esc(item.value)}</p><small>${esc(humanModelEvidenceSummary(item))}</small><div class="insight-actions">${item.reviewStatus==='rejected'?`<button data-human-model-action="reopen" data-human-model-evidence-id="${esc(item.id)}">Reopen</button>`:`<button data-human-model-action="confirm" data-human-model-evidence-id="${esc(item.id)}">Confirm</button><button data-human-model-action="correct" data-human-model-evidence-id="${esc(item.id)}">This is not accurate</button>`}</div></article>`).join(''):'<p>No current observations yet.</p>'}<p class="eyebrow">UNKNOWNS</p>${humanModelCurrent.unknowns.length?humanModelCurrent.unknowns.map(item=>`<p>${esc(item.statement)}</p>`).join(''):'<p>No unrepresented dimension is currently identified.</p>'}</div></details>
    </section>
    ${(()=>{const d=activeJudgement,ex=d?.explain||null,b=d?.boundaries||null;if(!d||!ex||!b)return '';return `<section class="latest-deliberation understanding-group" data-understanding-group="overview"><div class="section-heading"><div><p class="eyebrow">LATEST DELIBERATION</p><h3>${esc(d.practice?.name||'Current judgement')}</h3></div><span>${esc(d.confidenceLevel||confidenceLabel(d.confidence))}</span></div><p>${esc(d.judgement)}</p><details class="understanding-deliberation"><summary>Open full reasoning</summary>${d.humanModelSnapshot?`<div class="explain-section"><p class="eyebrow">HUMAN MODEL EVIDENCE BOUNDARY</p><p>${esc(humanModelDeliberationSnapshotSummary(d.humanModelSnapshot))}</p><ul>${humanModelDeliberationEvidence(d.humanModelSnapshot).map(item=>`<li><strong>${esc(item.evidenceClass)}</strong> — ${esc(item.key)}: ${esc(item.value)}</li>`).join('')}</ul>${d.humanModelSnapshot.rejectedEvidence?.length?`<small>${d.humanModelSnapshot.rejectedEvidence.length} rejected record${d.humanModelSnapshot.rejectedEvidence.length===1?' was':'s were'} preserved outside the active evidence set.</small>`:''}</div>`:''}<div class="explain-section"><p class="eyebrow">WHAT I OBSERVED</p><ul>${(ex.observations||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="explain-section"><p class="eyebrow">WHAT I INFERRED</p><ul>${(ex.inferences||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="explain-section"><p class="eyebrow">WHAT INFLUENCED ME MOST</p>${(ex.decisiveFactors||[]).map(x=>`<article><strong>${esc(x.advisor)}</strong><p>${esc(x.reason)}</p></article>`).join('')}</div><div class="explain-section"><p class="eyebrow">AGORA</p>${(d.advisors||[]).map(a=>`<article><div><strong>${esc(a.advisor)}</strong><span>${esc(a.position)}</span></div><p>${esc(a.reason)}</p></article>`).join('')}</div>${(d.minorityReports||[]).length?`<div class="explain-section"><p class="eyebrow">MINORITY REPORTS</p>${d.minorityReports.map(r=>`<article><strong>${esc(r.advisor)}</strong><p>${esc(r.reason)}</p></article>`).join('')}</div>`:''}<div class="explain-section"><p class="eyebrow">DECISION BOUNDARIES</p><ul>${(b.changeConditions||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>${esc(b.provenance?.statement||'')}</p></div></details></section>`})()}

    <nav class="understanding-switcher" aria-label="Understanding sections">
      <button class="active" data-understanding-view="overview" aria-pressed="true">Overview</button>
      <button data-understanding-view="evidence" aria-pressed="false">Evidence</button>
      <button data-understanding-view="audit" aria-pressed="false">Audit</button>
    </nav>
    <section class="emotional-follow-up-understanding understanding-group is-hidden" data-understanding-group="evidence">${(()=>{const followUp=emotionalJournalFollowUpAudit(state.emotionalJournalEntries);return `<div class="section-heading"><div><p class="eyebrow">REFLECTION OUTCOMES</p><h3>${esc(followUp.statement)}</h3></div><span>${followUp.reviewed}</span></div><div class="emotional-evolution-grid">${EMOTIONAL_JOURNAL_FOLLOW_UPS.map(outcome=>`<article><strong>${esc(emotionalJournalFollowUpLabel(outcome))}</strong><span>${followUp.counts[outcome]}</span></article>`).join('')}</div><small>Person-reported follow-up only. No text analysis.</small>`})()}</section>
<section class="emotional-evolution-understanding understanding-group is-hidden" data-understanding-group="evidence">${(()=>{const evolution=emotionalJournalEvolution(state.emotionalJournalEntries);return `<div class="section-heading"><div><p class="eyebrow">REFLECTIVE CONTINUITY</p><h3>${esc(evolution.statement)}</h3></div><span>${evolution.totalEntries}</span></div>${evolution.ranked.length?`<div class="emotional-evolution-grid">${evolution.ranked.slice(0,8).map(item=>`<article><strong>${esc(emotionalJournalThemeLabel(item.theme))}</strong><span>${item.count}</span></article>`).join('')}</div><small>Self-selected themes only. No automated interpretation.</small>`:`<p class="muted preference-summary">Write freely in Journey and optionally select themes to see continuity over time.</p>`}`})()}</section>
<section class="canonical-explain-record understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">EXPLAIN ENGINE</p><h3>What was observed, inferred and still unknown</h3></div></div>
  ${latestExplainRecord?`<p class="muted preference-summary">${esc(explainRecordSummary(latestExplainRecord))}</p><div class="explain-record-grid"><article><strong>Observed</strong><span>${latestExplainAudit.observations}</span></article><article><strong>Inferred</strong><span>${latestExplainAudit.inferences}</span></article><article><strong>Unknown</strong><span>${latestExplainAudit.unknowns}</span></article><article><strong>Alternatives</strong><span>${latestExplainAudit.alternatives}</span></article></div><details><summary>Canonical explanation record</summary><div class="explain-record-details"><p class="eyebrow">OBSERVED</p>${latestExplainRecord.observations.map(item=>`<p>${esc(item.statement)} <small>${esc(item.certainty)}</small></p>`).join('')}<p class="eyebrow">INFERRED</p>${latestExplainRecord.inferences.map(item=>`<p>${esc(item.statement)} <small>${esc(item.certainty)}</small></p>`).join('')}<p class="eyebrow">UNKNOWN</p>${latestExplainRecord.unknowns.length?latestExplainRecord.unknowns.map(item=>`<p>${esc(item.statement)}</p>`).join(''):'<p>No explicit unknown was preserved.</p>'}<p class="eyebrow">WHAT COULD CHANGE THIS</p>${latestExplainRecord.changeConditions.map(item=>`<p>${esc(item.statement)}</p>`).join('')}</div></details>`:`<p class="muted preference-summary">The next Agora judgement will preserve a canonical explanation record.</p>`}
</section>
<section class="explain-review understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">YOUR REVIEW</p><h3>Does this explanation represent the judgement fairly?</h3></div><span>${esc(latestExplainReview.status)}</span></div>
  ${latestExplainRecord?`<p class="muted preference-summary">${esc(explainRecordReviewSummary(latestExplainRecord))}</p>${latestExplainReview.status==='unreviewed'?`<label><span>Optional correction or missing context</span><textarea id="explain-review-note" rows="3" placeholder="What feels inaccurate, overstated or missing?"></textarea></label><div class="insight-actions"><button data-explain-review-action="confirm" data-explain-judgement-id="${esc(latestExplainRecord.judgementId)}">This explains it fairly</button><button data-explain-review-action="reject" data-explain-judgement-id="${esc(latestExplainRecord.judgementId)}">This is misleading</button></div>`:`<p>${esc(latestExplainReview.note||'No note provided.')}</p><button data-explain-review-action="reopen" data-explain-judgement-id="${esc(latestExplainRecord.judgementId)}">Review again</button>`}`:`<p class="muted preference-summary">No explanation record is available yet.</p>`}
</section>
<section class="advisor-coverage understanding-group" data-understanding-group="overview"><div class="section-heading"><div><p class="eyebrow">UNDERSTANDING COVERAGE</p><h3>How well each Advisor knows you</h3></div></div>${coverage.map(x=>`<article><div class="coverage-head"><strong>${x.name}</strong><span>${x.coverage}%</span></div><div class="coverage-track"><i style="width:${x.coverage}%"></i></div><p>${x.experience?`${x.experience} reflected experience${x.experience===1?'':'s'} · ${x.confidence}% advisor confidence`:'Still establishing a personal baseline.'}</p></article>`).join('')}</section>
    <section class="pattern-transfers understanding-group is-hidden" data-understanding-group="evidence"><div class="section-heading"><div><p class="eyebrow">PATTERN TRANSFER</p><h3>Where a pattern may — or may not — generalise</h3></div></div>${(state.patternTransfers||[]).length?(state.patternTransfers||[]).slice(0,12).map(record=>`<article class="pattern-transfer-item ${esc(record.status)}"><div><strong>${esc(record.practiceId)}</strong><span>${esc(record.status)}</span></div><p>${esc(transferSummary(record))}</p><small>${esc(record.sourceContextKey.replaceAll('|',' · '))} → ${esc(record.targetContextKey.replaceAll('|',' · '))}</small>${record.status!=='rejected'?`<button data-transfer-action="reject" data-transfer-id="${esc(record.id)}">Do not generalise this</button>`:''}${record.rejectionNote?`<small>${esc(record.rejectionNote)}</small>`:''}</article>`).join(''):`<div class="empty"><p class="muted">No pattern transfer has been assessed yet.</p></div>`}</section>
    <section class="contract-calibration understanding-group is-hidden" data-understanding-group="evidence">
      <div class="section-heading"><div><p class="eyebrow">PRACTICE CONTRACT CALIBRATION</p><h3>Whether pre-action expectations are matching experience</h3></div></div>
      ${contractCalibrations.length?contractCalibrations.map(item=>`<article class="contract-calibration-item ${esc(item.reviewStatus)}"><div><strong>${esc(item.practiceId)}</strong><span>${esc(item.reviewStatus)}</span></div><p>${esc(practiceContractCalibrationSummary(item))}</p><small>${item.uniqueSessions} distinct sessions · ${esc(item.evidenceBoundary)}</small><small>${esc(practiceContractCalibrationReviewSummary(item))}</small>${item.expectedEffectSamples.length?`<details><summary>Expected effect used</summary>${item.expectedEffectSamples.map(sample=>`<p>${esc(sample)}</p>`).join('')}</details>`:''}<div class="insight-actions">${item.reviewStatus==='candidate'?`<button data-contract-calibration-action="confirm" data-contract-calibration-id="${esc(item.id)}">Confirm this calibration</button><button data-contract-calibration-action="reject" data-contract-calibration-id="${esc(item.id)}">This is misleading</button>`:''}${item.reviewStatus==='confirmed'?`<button data-contract-calibration-action="reject" data-contract-calibration-id="${esc(item.id)}">Correct this calibration</button>`:''}${item.reviewStatus==='rejected'?`<button data-contract-calibration-action="reopen" data-contract-calibration-id="${esc(item.id)}">Reopen for review</button>`:''}</div><small>Contract change: none · Judgement influence: none</small></article>`).join(''):`<div class="empty"><p class="muted">No Practice has enough resolved contracts for calibration yet.</p></div>`}
      <p class="muted preference-summary">${contractCalibrationReviewAudit.confirmed} confirmed · ${contractCalibrationReviewAudit.candidate} candidate · ${contractCalibrationReviewAudit.rejected} rejected · 0 influential</p><p class="muted preference-summary">${esc(contractCalibrationReviewAudit.statement)}</p>
    </section>
    <section class="contract-revision-governance understanding-group is-hidden" data-understanding-group="evidence">
      <div class="section-heading"><div><p class="eyebrow">PRACTICE CONTRACT REVISION</p><h3>Proposed wording changes require your explicit permission</h3></div></div>
      ${contractRevisionProposals.length?contractRevisionProposals.map(proposal=>`<article class="contract-revision-item ${esc(proposal.status)}"><div><strong>${esc(proposal.practiceId)}</strong><span>${esc(proposal.status)}</span></div><small>Current expectation</small><p>${esc(proposal.previousExpectedEffect)}</p><small>Proposed expectation</small><p>${esc(proposal.proposedExpectedEffect)}</p><small>${proposal.evidenceCount} resolved contracts · scope: expected effect only</small><small>${esc(practiceContractRevisionSummary(proposal))}</small><div class="insight-actions">${proposal.status==='proposed'?`<button data-contract-revision-action="accept" data-contract-revision-id="${esc(proposal.id)}">Use this wording</button><button data-contract-revision-action="decline" data-contract-revision-id="${esc(proposal.id)}">Keep current wording</button>`:''}${proposal.status==='accepted'?`<button data-contract-revision-action="decline" data-contract-revision-id="${esc(proposal.id)}">Stop using this wording</button>`:''}${proposal.status==='declined'?`<button data-contract-revision-action="reopen" data-contract-revision-id="${esc(proposal.id)}">Review again</button>`:''}</div><small>Judgement influence: none</small></article>`).join(''):`<div class="empty"><p class="muted">No confirmed calibration supports a contract revision proposal yet.</p></div>`}
    </section>
    <section class="practice-dose-evidence understanding-group is-hidden" data-understanding-group="evidence">
      <div class="section-heading"><div><p class="eyebrow">PRACTICE DOSE EVIDENCE</p><h3>What happened at short, partial and full planned doses</h3></div></div>
      ${practiceDoseEvidence.length?practiceDoseEvidence.map(item=>`<article class="practice-dose-item ${esc(item.reviewStatus)}"><div><strong>${esc(item.practiceId)}</strong><span>${esc(item.reviewStatus)}</span></div><p>${esc(practiceDoseEvidenceSummary(item))}</p><small>${item.uniqueSessions} distinct sessions · ${esc(item.doseBand)} dose · average ${item.averageActualMinutes} min performed</small><small>${esc(item.evidenceBoundary)}</small><small>${esc(practiceDoseEvidenceReviewSummary(item))}</small><details><summary>Outcome counts</summary><p>${item.aligned} aligned · ${item.partial} partial · ${item.misaligned} misaligned</p></details><div class="insight-actions">${item.reviewStatus==='candidate'?`<button data-dose-evidence-action="confirm" data-dose-evidence-id="${esc(item.id)}">Confirm dose pattern</button><button data-dose-evidence-action="reject" data-dose-evidence-id="${esc(item.id)}">This is misleading</button>`:''}${item.reviewStatus==='confirmed'?`<button data-dose-evidence-action="reject" data-dose-evidence-id="${esc(item.id)}">Correct dose pattern</button>`:''}${item.reviewStatus==='rejected'?`<button data-dose-evidence-action="reopen" data-dose-evidence-id="${esc(item.id)}">Reopen for review</button>`:''}</div><small>Duration change: none · Contract change: none · Judgement influence: none</small></article>`).join(''):`<div class="empty"><p class="muted">No Practice dose band has enough resolved outcomes yet.</p></div>`}
      <p class="muted preference-summary">${practiceDoseReviewAudit.confirmed} confirmed · ${practiceDoseReviewAudit.candidate} candidate · ${practiceDoseReviewAudit.rejected} rejected · 0 influential</p><p class="muted preference-summary">${esc(practiceDoseReviewAudit.statement)}</p>
    </section>
    <section class="practice-dose-revision understanding-group is-hidden" data-understanding-group="evidence">
      <div class="section-heading"><div><p class="eyebrow">PRACTICE DURATION PROPOSAL</p><h3>Confirmed dose evidence may suggest a more realistic duration</h3></div></div>
      ${practiceDoseRevisionProposals.length?practiceDoseRevisionProposals.map(proposal=>`<article class="practice-dose-revision-item ${esc(proposal.health?.suspended?'review-required':proposal.status)}"><div><strong>${esc(proposal.practiceId)}</strong><span>${esc(proposal.health?.suspended?'review required':proposal.status)}</span></div><small>Current duration</small><p>${proposal.previousDurationMinutes} min</p><small>Proposed duration</small><p>${proposal.proposedDurationMinutes} min</p><small>${proposal.evidenceCount} resolved outcomes · ${esc(proposal.doseBand)} dose · average ${proposal.averageActualMinutes} min performed</small><small>${esc(practiceDoseRevisionSummary(proposal))}</small>${proposal.status==='accepted'?`<small>${esc(practiceDoseRevisionHealthSummary(proposal.health))}</small>`:''}<div class="insight-actions">${proposal.status==='proposed'?`<button data-dose-revision-action="accept" data-dose-revision-id="${esc(proposal.id)}">Use this duration</button><button data-dose-revision-action="decline" data-dose-revision-id="${esc(proposal.id)}">Keep current duration</button>`:''}${proposal.status==='accepted'&&!proposal.health?.suspended?`<button data-dose-revision-action="decline" data-dose-revision-id="${esc(proposal.id)}">Stop using this duration</button>`:''}${proposal.status==='accepted'&&proposal.health?.suspended?`<button data-dose-revision-action="decline" data-dose-revision-id="${esc(proposal.id)}">Stop using this duration</button><button data-dose-revision-action="reopen" data-dose-revision-id="${esc(proposal.id)}">Return to proposal</button>`:''}${proposal.status==='declined'?`<button data-dose-revision-action="reopen" data-dose-revision-id="${esc(proposal.id)}">Review again</button>`:''}</div><small>Contract wording: unchanged · Judgement influence: person-authorised duration only</small></article>`).join(''):`<div class="empty"><p class="muted">No confirmed dose evidence supports a duration proposal yet.</p></div>`}
    </section>
    <section class="practice-library understanding-group is-hidden" data-understanding-group="evidence">
      <div class="section-heading"><div><p class="eyebrow">PRACTICE LIBRARY</p><h3>A canonical contract for every Practice</h3></div><span>${practiceLibraryAudit.valid}/${practiceLibraryAudit.total}</span></div>
      <p>${esc(practiceLibraryOverview.statement)}</p>
      ${practiceLibrary.map(item=>`<details class="practice-library-item"><summary><span>${esc(item.name)}</span><strong>${esc(item.domain)}</strong></summary><div><p>${esc(item.goals.join(' · '))}</p><small>${esc(item.intensity)} intensity · ${item.phaseCount} phases · ${item.durationOptions.join(', ')} min</small><small>Levels: ${esc(item.levels.join(', '))}</small><small>Equipment: ${esc(item.equipment.join(', '))}</small><small>Evidence status: ${esc(item.evidenceStatus)}</small></div></details>`).join('')}
      <p class="muted preference-summary">${esc(practiceLibraryAudit.statement)}</p>
    </section>
    <section class="practice-eligibility-library understanding-group is-hidden" data-understanding-group="evidence">
      <div class="section-heading"><div><p class="eyebrow">CONTEXTUAL PRACTICE ELIGIBILITY</p><h3>How current signals relate to declared Practice conditions</h3></div></div>
      <p class="muted preference-summary">${practiceEligibilityAudit.eligible} eligible · ${practiceEligibilityAudit.caution} caution · ${practiceEligibilityAudit.blocked} blocked · 0 selection influence</p>
      ${practiceEligibilityAudit.items.map(item=>{const practice=CODEX.find(candidate=>candidate.id===item.practiceId);return `<article class="practice-eligibility-item ${esc(item.status)}"><div><strong>${esc(practice?.name||item.practiceId)}</strong><span>${esc(item.status)}</span></div><p>${esc(practiceEligibilitySummary(item))}</p><ul>${item.reasons.map(reason=>`<li>${esc(reason)}</li>`).join('')}</ul><small>Assessed from: ${esc(item.assessedFrom.join(', '))}</small><small>Selection effect: blocked only</small></article>`}).join('')}
      <p class="muted preference-summary">${esc(practiceEligibilityAudit.statement)}</p>
    </section>
    <section class="outcome-patterns understanding-group is-hidden" data-understanding-group="evidence"><div class="section-heading"><div><p class="eyebrow">LONGITUDINAL OUTCOMES</p><h3>Patterns that require repeated experience</h3></div></div>${(state.outcomePatterns||[]).length?(state.outcomePatterns||[]).slice(0,12).map(pattern=>`<article class="outcome-pattern-item ${esc(pattern.status)}"><div><strong>${esc(pattern.practiceId)}</strong><span>${esc(pattern.status)}</span></div><p>${esc(outcomePatternSummary(pattern))}</p><small>${esc(pattern.contextKey.replaceAll('|',' · '))}</small>${pattern.status!=='rejected'?`<button data-outcome-pattern-action="reject" data-pattern-id="${esc(pattern.id)}">This pattern is misleading</button>`:''}${pattern.rejectionNote?`<small>${esc(pattern.rejectionNote)}</small>`:''}</article>`).join(''):`<div class="empty"><p class="muted">No repeated outcome pattern exists yet.</p></div>`}</section>
    <section class="personal-evidence-understanding understanding-group is-hidden" data-understanding-group="evidence">${(()=>{const evidence=personalEvidenceOverview(state.outcomeLedger);return `<div class="section-heading"><div><p class="eyebrow">PERSONAL EVIDENCE</p><h3>${esc(evidence.statement)}</h3></div><span>${evidence.visible.length}</span></div>${evidence.summaries.length?`<div class="personal-evidence-grid">${evidence.summaries.map(item=>`<article class="${esc(item.evidenceLevel)}"><div><strong>${esc(item.practiceName)}</strong><span>${item.evidenceLevel==='insufficient'?`${item.directionalOutcomes}/3`:`${Math.round(item.helpRate*100)}%`}</span></div><p>${esc(item.statement)}</p><small>${item.counts.yes} helped · ${item.counts.partly} partly · ${item.counts.no} did not help</small></article>`).join('')}</div>`:`<p class="muted">Complete Practices and reflect on whether they helped to begin personal evidence.</p>`}<small>Person-reported outcomes only · no text inference · frozen decision context.</small><small>Automatic Human Model influence: 0 · Automatic judgement influence: 0</small></section>`})()}</section>
    <section class="belief-system-understanding understanding-group is-hidden" data-understanding-group="evidence">${(()=>{state.beliefs=reconcileBeliefs(state.beliefs,state.outcomeLedger);const audit=beliefAudit(state.beliefs);return `<div class="section-heading"><div><p class="eyebrow">BELIEF SYSTEM</p><h3>${esc(audit.statement)}</h3></div><span>${audit.total}</span></div>${state.beliefs.length?`<div class="belief-grid">${state.beliefs.map(item=>`<article class="${esc(item.status)}"><div><strong>${esc(item.subjectName)}</strong><span>${esc(item.status)}</span></div><p>${esc(item.statement)}</p><small>${Math.round(item.confidence*100)}% confidence · ${item.supportingEvidence} outcomes · ${item.contradictions} contradictions</small><div class="belief-actions">${item.status==='proposed'?`<button data-belief-action="confirm" data-belief-id="${esc(item.id)}">This fits me</button><button data-belief-action="reject" data-belief-id="${esc(item.id)}">This is misleading</button>`:`<button data-belief-action="reopen" data-belief-id="${esc(item.id)}">Review again</button>`}</div></article>`).join('')}</div>`:`<p class="muted">Repeated outcomes will create reviewable belief candidates here.</p>`}<small>Beliefs remain explicit, person-reviewable and auditable.</small><small>Automatic Human Model, judgement and Practice-selection influence: 0</small>`})()}</section>
    <section class="outcome-ledger-understanding understanding-group is-hidden" data-understanding-group="evidence">${(()=>{const audit=outcomeLedgerAudit(state.outcomeLedger);return `<div class="section-heading"><div><p class="eyebrow">OUTCOME LEDGER</p><h3>${esc(audit.statement)}</h3></div><span>${audit.total}</span></div><div class="emotional-evolution-grid">${['yes','partly','no','unknown'].map(result=>`<article><strong>${esc(outcomeLedgerLabel(result))}</strong><span>${audit.counts[result]}</span></article>`).join('')}</div><small>Person-reported outcomes only. Context is frozen at the time of judgement.</small><small>Automatic Human Model influence: 0 · Automatic judgement influence: 0</small>`})()}</section>
    <section class="attribution-history understanding-group is-hidden" data-understanding-group="evidence"><div class="section-heading"><div><p class="eyebrow">OUTCOME ATTRIBUTION</p><h3>What probably caused the result</h3></div></div>${(state.outcomeAttributions||[]).length?(state.outcomeAttributions||[]).slice(0,12).map(a=>{const r=state.structuredReflections.find(item=>item.id===a.reflectionId),x=attributionContradiction(r,a);return `<article class="attribution-item"><div><strong>${esc(a.source)}</strong><span>${esc(a.causalConfidence)}</span></div><p>${esc(attributionSummary(a))}</p>${x.present?`<small>Contradiction: ${esc(x.reasons.join(' '))}</small>`:''}</article>`}).join(''):`<div class="empty"><p class="muted">No outcome attribution has been recorded yet.</p></div>`}</section>
    <section class="reflection-history understanding-group is-hidden" data-understanding-group="evidence"><div class="section-heading"><div><p class="eyebrow">REFLECTION INTEGRITY</p><h3>Effect, goal fit, burden and confidence</h3></div></div>${(state.structuredReflections||[]).length?(state.structuredReflections||[]).slice(0,12).map(r=>{const c=reflectionCompleteness(r),x=reflectionContradiction(r);return `<article class="reflection-item"><div><strong>${esc(r.effect)}</strong><span>${Math.round(c.score*100)}%</span></div><p>${esc(reflectionSummary(r))}</p>${x.present?`<small>Contradiction: ${esc(x.reasons.join(' '))}</small>`:''}${r.note?`<small>${esc(r.note)}</small>`:''}</article>`}).join(''):`<div class="empty"><p class="muted">No structured reflection has been recorded yet.</p></div>`}</section>
    <section class="follow-through-summary understanding-group is-hidden" data-understanding-group="evidence">${(()=>{const s=followThroughSnapshot(state);return `<p class="eyebrow">FOLLOW-THROUGH INTEGRITY</p><div class="integrity-stats"><span>${s.activeCommitments} active</span><span>${s.startedCommitments} started</span><span>${s.managedFriction} managed frictions</span><span>${s.blockedFriction} blocked</span><span>${s.completedFallbacks} completed fallbacks</span></div><p>${esc(followThroughSummary(state))}</p>${s.status==='review-required'?`<p class="integrity-warning">Some follow-through records require review.</p>`:''}`})()}</section>
    <section class="fallback-history understanding-group is-hidden" data-understanding-group="evidence"><div class="section-heading"><div><p class="eyebrow">ADAPTIVE FALLBACKS</p><h3>Reduced practices, kept distinct from the original</h3></div></div>${(state.fallbackPlans||[]).length?(state.fallbackPlans||[]).slice(0,12).map(plan=>`<article class="fallback-item ${esc(plan.status)}"><div><strong>${esc(plan.fallbackPracticeId)}</strong><span>${esc(plan.status)}</span></div><p>${esc(fallbackSummary(plan))}</p><small>Original: ${esc(plan.originalPracticeId)} · ${esc(plan.scope)} · ${Math.round(plan.reductionRatio*100)}%</small></article>`).join(''):`<div class="empty"><p class="muted">No adaptive fallback has been created yet.</p></div>`}</section>
    <section class="friction-history understanding-group is-hidden" data-understanding-group="evidence"><div class="section-heading"><div><p class="eyebrow">FRICTION HISTORY</p><h3>Obstacles anticipated and what happened</h3></div></div>${(state.frictionPlans||[]).length?(state.frictionPlans||[]).slice(0,12).map(plan=>`<article class="friction-item ${esc(plan.status)}"><div><strong>${esc(plan.frictionType)}</strong><span>${esc(plan.status)}</span></div><p>${esc(plan.description||'Unnamed obstacle')}</p><small>Response: ${esc(plan.response||'none')}</small>${plan.fallback?`<small>Fallback: ${esc(plan.fallback)}</small>`:''}${plan.outcome?`<small>Outcome: ${esc(plan.outcome)}</small>`:''}</article>`).join(''):`<div class="empty"><p class="muted">No friction plan has been created yet.</p></div>`}</section>
    <section class="commitment-history understanding-group is-hidden" data-understanding-group="evidence"><div class="section-heading"><div><p class="eyebrow">COMMITMENT HISTORY</p><h3>Temporary start windows, without compliance pressure</h3></div></div>${(state.commitments||[]).length?(state.commitments||[]).slice(0,12).map(c=>`<article class="commitment-item ${esc(c.status)}"><div><strong>${esc(c.practiceId||'Practice')}</strong><span>${esc(c.status)}</span></div><p>${esc(commitmentSummary(c))}</p><small>${new Date(c.createdAt).toLocaleDateString(undefined,{day:'numeric',month:'short'})} · ${esc(c.startMode)}</small>${c.reason?`<small>${esc(c.reason)}</small>`:''}</article>`).join(''):`<div class="empty"><p class="muted">No temporary commitment has been created yet.</p></div>`}</section>
    <section class="agency-integrity-summary understanding-group is-hidden" data-understanding-group="evidence">${(()=>{const s=agencyConsistencySnapshot(state),l=learningSourceSummary(state);return `<p class="eyebrow">AGENCY INTEGRITY</p><div class="integrity-stats"><span>${s.choices} choices</span><span>${s.outcomes} outcomes</span><span>${s.reflected} reflected</span><span>${s.eligiblePreferences} active preferences</span></div><p>${esc(l.statement)}</p>${s.mismatches?`<p class="integrity-warning">${s.mismatches} execution mismatch${s.mismatches===1?'':'es'} require review.</p>`:''}`})()}</section>
    <section class="outcome-integrity understanding-group is-hidden" data-understanding-group="evidence"><div class="section-heading"><div><p class="eyebrow">CHOICE → OUTCOME</p><h3>What was chosen, started, completed and reflected</h3></div></div>${(state.outcomeRecords||[]).length?(state.outcomeRecords||[]).slice(0,12).map(record=>`<article class="outcome-item ${esc(record.stage)}"><div><strong>${esc(record.chosenPracticeId||'No practice')}</strong><span>${esc(record.stage)}</span></div><p>${esc(outcomeSummary(record))}</p><small>Recommended: ${esc(record.recommendedPracticeId||'unknown')} · Integrity: ${esc(record.integrity)}</small>${record.reflection?`<small>Reflection: ${esc(record.reflection)}</small>`:''}</article>`).join(''):`<div class="empty"><p class="muted">No choice-to-outcome record exists yet.</p></div>`}</section>
    <section class="adaptation-pattern-governance understanding-group is-hidden" data-understanding-group="evidence">
      <div class="section-heading"><div><p class="eyebrow">ADAPTATION PATTERNS</p><h3>Repeated in-session choices, without silent influence</h3></div></div>
      ${adaptationPatterns.length?adaptationPatterns.map(pattern=>`<article class="adaptation-pattern-item ${esc(pattern.effectiveStatus||pattern.reviewStatus)}"><div><strong>${esc(pattern.practiceId)}</strong><span>${esc(pattern.effectiveStatus||pattern.reviewStatus)}</span></div><p>${esc(adaptationPatternSummary(pattern))}</p><small>${pattern.uniqueSessions} distinct sessions · ${esc(pattern.evidenceBoundary)}</small><small>${esc(adaptationPatternReviewSummary(pattern))}</small>${pattern.reviewStatus==='confirmed'?`<div class="confirmed-default-health"><strong>${pattern.confirmedDefaultHealth?.suspended?'Automatic use paused':'Confirmed default health'}</strong><p>${esc(confirmedDefaultHealthSummary(pattern))}</p>${confirmedDefaultRecentOutcomes(pattern).length?`<details><summary>Recent automatic uses</summary><ul>${confirmedDefaultRecentOutcomes(pattern).map(item=>`<li><span>${esc(item.phaseName)}</span><strong>${esc(item.label)}</strong></li>`).join('')}</ul></details>`:''}</div>`:''}<div class="insight-actions">${pattern.reviewStatus==='candidate'?`${pattern.reconfirmation?.eligible?`<button data-adaptation-pattern-action="confirm" data-adaptation-pattern-id="${esc(pattern.id)}">Confirm recurring choice</button>`:`<button disabled aria-disabled="true">Fresh evidence required</button>`}<button data-adaptation-pattern-action="reject" data-adaptation-pattern-id="${esc(pattern.id)}">This is misleading</button>${pattern.reconfirmation?.required?`<small class="reconfirmation-gate">${esc(pattern.reconfirmation.statement)}</small>`:''}`:''}${pattern.reviewStatus==='confirmed'&&!pattern.confirmedDefaultHealth?.suspended?`<button data-adaptation-pattern-action="reject" data-adaptation-pattern-id="${esc(pattern.id)}">Correct this pattern</button>`:''}${pattern.reviewStatus==='confirmed'&&pattern.confirmedDefaultHealth?.suspended?`<button data-adaptation-pattern-action="reject" data-adaptation-pattern-id="${esc(pattern.id)}">Stop using this default</button><button data-adaptation-pattern-action="reopen" data-adaptation-pattern-id="${esc(pattern.id)}">Return to candidate</button>`:''}${pattern.reviewStatus==='rejected'?`<button data-adaptation-pattern-action="reopen" data-adaptation-pattern-id="${esc(pattern.id)}">Reopen for review</button>`:''}</div><small>Current judgement influence: none</small></article>`).join(''):`<div class="empty"><p class="muted">No repeated adaptation choice has enough comparable evidence yet.</p></div>`}
      <p class="muted preference-summary">${adaptationAudit.confirmed} confirmed · ${adaptationAudit.candidate} candidate · ${adaptationAudit.rejected} rejected · ${suspendedAdaptationDefaults} paused · 0 influential</p>
      <p class="muted preference-summary">${esc(adaptationAudit.statement)}</p>
    </section>
    <section class="preference-governance understanding-group is-hidden" data-understanding-group="evidence"><div class="section-heading"><div><p class="eyebrow">PREFERENCE GOVERNANCE</p><h3>Contextual preferences Strategos is carrying</h3></div></div>${(state.preferenceModel||[]).length?(state.preferenceModel||[]).slice(0,12).map(pref=>`<article class="preference-item ${esc(pref.status)}"><div><strong>${esc(pref.preferredPracticeId)}</strong><span>${esc(pref.status)}</span></div><p>Preferred over ${esc(pref.recommendedPracticeId)} in ${esc(pref.contextKey.replaceAll('|',' · '))}.</p><small>${pref.evidenceCount} observation${pref.evidenceCount===1?'':'s'} · context-bound</small><div class="insight-actions">${pref.status==='candidate'?`<button data-preference-action="confirm" data-preference-id="${esc(pref.id)}">Confirm preference</button><button data-preference-action="reject" data-preference-id="${esc(pref.id)}">This is not a real preference</button>`:''}${pref.status==='confirmed'?`<button data-preference-action="reject" data-preference-id="${esc(pref.id)}">Correct preference</button>`:''}${pref.status==='rejected'?`<button data-preference-action="reopen" data-preference-id="${esc(pref.id)}">Reopen as candidate</button>`:''}</div>${pref.correction?.note?`<small>Correction: ${esc(pref.correction.note)}</small>`:''}</article>`).join(''):`<div class="empty"><p class="muted">No contextual preference has been inferred yet.</p></div>`}<p class="muted preference-summary">${(()=>{const a=preferenceAudit(state.preferenceModel||[]);return `${a.confirmed} confirmed · ${a.candidate} candidate · ${a.rejected} rejected · ${a.expired} expired`;})()}</p></section>
    <section class="choice-audit understanding-group is-hidden" data-understanding-group="audit"><div class="section-heading"><div><p class="eyebrow">CHOICE HISTORY</p><h3>Where you accepted, deferred or overrode Strategos</h3></div></div>${(state.choiceLog||[]).length?(state.choiceLog||[]).slice(0,12).map(choice=>`<article class="choice-event"><div><strong>${new Date(choice.at).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</strong><span>${esc(choice.action.replaceAll('-',' '))}</span></div><p>${esc(summarizeChoice(choice))}</p>${choice.reason?`<small>${esc(choice.reason)}</small>`:''}</article>`).join(''):`<div class="empty"><p class="muted">No explicit choice has been recorded yet.</p></div>`}</section>
    <section class="calibration-accountability understanding-group is-hidden" data-understanding-group="audit">${(()=>{const summary=calibrationAccountabilitySummary(state.calibrationAccountability);return `<div class="section-heading"><div><p class="eyebrow">CALIBRATION ACCOUNTABILITY</p><h3>${esc(summary.statement)}</h3></div></div>${(state.calibrationAccountability||[]).slice(0,12).map(record=>`<article class="calibration-accountability-item"><div><strong>${esc(record.calibrationScope)}</strong><span>${record.totalAdjustment>0?'+':''}${(record.totalAdjustment*100).toFixed(1)} pts</span></div><p>${record.cohortSize} comparable forecasts · drift ${esc(record.driftStatus)}</p><small>${esc(record.cohortKey||'No cohort key')}</small></article>`).join('')||`<div class="empty"><p class="muted">No calibration adjustment has been applied yet.</p></div>`}`})()}</section>
<section class="prediction-calibration understanding-group is-hidden" data-understanding-group="audit">${(()=>{const summary=predictionCalibrationSummary(state.judgementForecasts),correction=confidenceCorrection(summary);return `<div class="section-heading"><div><p class="eyebrow">PREDICTION CALIBRATION</p><h3>${esc(summary.statement)}</h3></div></div><p>${esc(correction.reason)}</p>${(state.judgementForecasts||[]).filter(item=>item.status==='resolved').slice(0,12).map(item=>`<article class="forecast-audit-item ${esc(item.calibration.direction)}"><div><strong>${esc(item.practiceId||'Practice')}</strong><span>${esc(item.calibration.direction)}</span></div><p>${esc(forecastSummary(item))}</p><small>Calibration score ${Math.round(item.calibration.score*100)}%</small></article>`).join('')||`<div class="empty"><p class="muted">No resolved forecast exists yet.</p></div>`}`})()}</section>
<section class="longitudinal-accountability understanding-group is-hidden" data-understanding-group="audit">${(()=>{const summary=longitudinalAccountabilitySummary(state);return `<div class="section-heading"><div><p class="eyebrow">LONGITUDINAL ACCOUNTABILITY</p><h3>${esc(summary.statement)}</h3></div></div>${(state.judgements||[]).filter(j=>j.longitudinalEvidence?.items?.length).slice(0,12).map(j=>{const audit=buildLongitudinalAuditEntry(j);return `<article class="longitudinal-audit-item ${esc(audit.status)}"><div><strong>${esc(j.practice?.name||j.practice?.id||'Judgement')}</strong><span>${esc(audit.status)}</span></div><p>${audit.sourceCount} longitudinal source${audit.sourceCount===1?'':'s'}</p>${audit.sources.map(source=>`<small>${esc(source.practiceId)} · ${esc(source.direction)} · ${source.adjustment>0?'+':''}${Number(source.adjustment).toFixed(3)}</small>`).join('')}${audit.reasons.map(reason=>`<small class="audit-warning">${esc(reason)}</small>`).join('')}</article>`}).join('')||`<div class="empty"><p class="muted">No judgement has used longitudinal evidence yet.</p></div>`}`})()}</section>
<section class="practice-eligibility-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">PRACTICE ELIGIBILITY AUDIT</p><h3>Declared conditions matched against current signals</h3></div></div>
  ${practiceEligibilityAudit.items.map(item=>`<details class="practice-eligibility-audit-item"><summary><span>${esc(item.practiceId)}</span><strong>${esc(item.status)}</strong></summary><div>${item.reasons.map(reason=>`<p>${esc(reason)}</p>`).join('')}<small>Matched contraindications: ${esc(item.matchedContraindications.join(', ')||'none')}</small><small>Selection effect: ${item.status==='blocked'?'excluded':'none'}</small></div></details>`).join('')}
</section>
<section class="runtime-safety-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">RUNTIME SAFETY INTERRUPTIONS</p><h3>${esc(latestRuntimeSafetyAudit.statement)}</h3></div></div>
  <p class="muted preference-summary">${latestRuntimeSafetyAudit.total} total · ${latestRuntimeSafetyAudit.resumed} resumed · ${latestRuntimeSafetyAudit.ended} ended · ${latestRuntimeSafetyAudit.active} unresolved</p>
  <p class="muted preference-summary">A person-raised concern pauses execution immediately. Resume requires an explicit reassessment action.</p>
</section>
<section class="explain-engine-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">EXPLAIN ENGINE AUDIT</p><h3>${esc(latestExplainAudit.statement)}</h3></div><span>${latestExplainValidation.valid?'valid':'missing'}</span></div>
  ${latestExplainRecord?`<p class="muted preference-summary">${esc(explainRecordSummary(latestExplainRecord))}</p><p class="muted preference-summary">Judgement ${esc(latestExplainRecord.judgementId)} · created ${esc(latestExplainRecord.createdAt)}</p><p class="muted preference-summary">Behaviour influence: 0 · Validation errors: ${latestExplainValidation.errors.length}</p>`:`<p class="muted preference-summary">No explanation record is available yet.</p>`}
</section>
<section class="safety-architecture-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">SAFETY ARCHITECTURE</p><h3>${esc(latestSafetyAudit.statement)}</h3></div><span>${esc(latestSafetyAudit.status)}</span></div>
  ${latestSafetyEnvelope?`<p class="muted preference-summary">${esc(safetyEnvelopeSummary(latestSafetyEnvelope))}</p><p class="muted preference-summary">Existing sources: declared contraindications, blocked Practices, advisor risk flags and caution positions.</p><p class="muted preference-summary">Selection change: 0 · Confidence change: 0 · Duration change: 0 · Execution gate: constrained envelopes require acknowledgement</p>`:`<p class="muted preference-summary">A safety envelope will be preserved with the next judgement.</p>`}
</section>
<section class="human-model-promotion-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">HUMAN MODEL FACT PROMOTION AUDIT</p><h3>${esc(humanModelPromotionStatus.statement)}</h3></div></div>
  <p class="muted preference-summary">${humanModelPromotionStatus.candidate} candidate · ${humanModelPromotionStatus.promoted} promoted · ${humanModelPromotionStatus.rejected} rejected</p>
  <p class="muted preference-summary">Threshold: 3 confirmed observations with the same key and value within 180 days.</p>
</section>
<section class="human-model-snapshot-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">HUMAN MODEL DELIBERATION SNAPSHOT</p><h3>${esc(humanModelSnapshotStatus.statement)}</h3></div><span>${esc(humanModelSnapshotStatus.status)}</span></div>
  ${latestHumanModelSnapshot?`<p>${esc(humanModelDeliberationSnapshotSummary(latestHumanModelSnapshot))}</p><small>Created ${esc(latestHumanModelSnapshot.createdAt)}</small><small>Rejected evidence influence: 0 · Judgement influence: 0 · Practice selection influence: 0 · Safety influence: 0</small>`:`<p class="muted preference-summary">A snapshot will be preserved when the next Agora deliberation begins.</p>`}
</section>
<section class="human-model-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">HUMAN MODEL AUDIT</p><h3>${esc(humanModelStatus.statement)}</h3></div></div>
  <div class="human-model-audit-grid"><article><strong>${humanModelStatus.confirmed}</strong><span>confirmed facts</span></article><article><strong>${humanModelStatus.reported}</strong><span>current observations</span></article><article><strong>${humanModelStatus.unknowns}</strong><span>unknown dimensions</span></article><article><strong>${humanModelStatus.dimensionsCovered}/${humanModelStatus.dimensionsTotal}</strong><span>coverage</span></article></div>
  <p class="muted preference-summary">${humanModelReviewStatus.confirmed} confirmed · ${humanModelReviewStatus.candidate} awaiting review · ${humanModelReviewStatus.rejected} rejected</p>
  <p class="muted preference-summary">${esc(humanModelReviewStatus.statement)}</p>
  <p class="muted preference-summary">Sources remain explicit. Reported signals are observations, not permanent personal facts.</p>
</section>
<section class="practice-content-provenance-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">PRACTICE CONTENT PROVENANCE</p><h3>${esc(practiceContentAudit.statement)}</h3></div></div>
  <p class="muted preference-summary">${practiceContentAudit.current} current · ${practiceContentAudit.historical} historical · ${practiceContentAudit.retired} retired · ${practiceContentAudit.missing} legacy without snapshot</p>
  ${practiceContentAudit.records.slice(0,20).map(record=>`<details class="practice-content-audit-item"><summary><span>${esc(record.snapshot.practiceName)}</span><strong>${esc(record.assessment.status)}</strong></summary><div><p>${esc(record.assessment.statement)}</p><small>Content v${record.snapshot.contentVersion} · Library v${record.snapshot.libraryVersion}</small><small>${record.snapshot.phaseCount} executable phases · ${record.snapshot.durationMinutes||'unknown'} min</small><small>Snapshot: ${esc(record.snapshot.snapshottedAt)}</small></div></details>`).join('')}
</section>
<section class="practice-library-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">PRACTICE LIBRARY AUDIT</p><h3>${esc(practiceLibraryAudit.statement)}</h3></div></div>
  ${practiceLibraryAudit.records.map(record=>`<article class="practice-library-audit-item ${record.valid?'valid':'invalid'}"><div><strong>${esc(record.practiceId)}</strong><span>${record.valid?'complete':'incomplete'}</span></div>${record.valid?`<small>Canonical metadata, duration and phase structure present.</small>`:`<small>Missing: ${esc(record.missing.join(', ')||'structural validity')}</small>`}</article>`).join('')}
  <p class="muted preference-summary">Library metadata informs transparency only. Practice structure remains unchanged; explicit eligibility blocking is governed separately.</p>
</section>
<section class="practice-dose-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">PRACTICE DOSE AUDIT</p><h3>${esc(practiceDoseAudit.statement)}</h3></div></div>
  ${practiceDoseEvidence.length?practiceDoseEvidence.map(item=>`<details class="practice-dose-audit-item"><summary><span>${esc(item.practiceId)} · ${esc(item.doseBand)}</span><strong>${esc(item.direction)}</strong></summary><div><p>${esc(practiceDoseEvidenceSummary(item))}</p><small>Review status: ${esc(item.reviewStatus)}</small><small>Average actual dose: ${item.averageActualMinutes} min</small><small>${item.aligned} aligned · ${item.partial} partial · ${item.misaligned} misaligned</small><small>Duration influence: none</small><small>Contract influence: none</small><small>Judgement influence: none</small></div></details>`).join(''):`<div class="empty"><p class="muted">No dose evidence lineage exists yet.</p></div>`}
</section>
<section class="contract-calibration-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">CONTRACT CALIBRATION AUDIT</p><h3>${esc(contractCalibrationAudit.statement)}</h3></div></div>
  ${contractCalibrations.length?contractCalibrations.map(item=>`<details class="contract-calibration-audit-item"><summary><span>${esc(item.practiceId)}</span><strong>${esc(item.direction)}</strong></summary><div><p>${esc(practiceContractCalibrationSummary(item))}</p><small>${item.aligned} aligned · ${item.partial} partial · ${item.misaligned} misaligned</small><small>Review status: ${esc(item.reviewStatus)}</small><small>Future contract effect: none</small><small>Judgement influence: none</small></div></details>`).join(''):`<div class="empty"><p class="muted">No contract calibration lineage exists yet.</p></div>`}
</section>
<section class="adaptation-audit understanding-group is-hidden" data-understanding-group="audit">
  <div class="section-heading"><div><p class="eyebrow">ADAPTATION ACCOUNTABILITY</p><h3>${esc(adaptationTraceSummary.statement)}</h3></div></div>
  ${adaptationTrace.length?adaptationTrace.slice(0,12).map(item=>`<details class="adaptation-audit-item ${esc(item.effectiveStatus)}"><summary><span>${esc(item.practiceId)} · ${esc(item.phaseName)}</span><strong>${esc(item.effectiveStatus)}</strong></summary><div><p>${item.level==='regression'?'Easier':item.level==='progression'?'Harder':'Standard'} · ${esc(item.currentInfluence)}</p><small>Judgement influence: none</small><ol>${item.events.map(event=>`<li><time>${new Date(event.at).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</time><div><strong>${esc(event.title)}</strong><span>${esc(event.detail)}</span></div></li>`).join('')}</ol></div></details>`).join(''):`<div class="empty"><p class="muted">No adaptation lineage exists yet.</p></div>`}
</section>
<section class="correction-audit understanding-group is-hidden" data-understanding-group="audit"><div class="section-heading"><div><p class="eyebrow">DECISION AUDIT</p><h3>How corrections propagated</h3></div></div>${(state.correctionAudit||[]).length?(state.correctionAudit||[]).slice(0,10).map(event=>`<details class="audit-event"><summary>${new Date(event.at).toLocaleDateString(undefined,{day:'numeric',month:'short'})} · ${esc(event.type.replaceAll('-',' '))}</summary><p>${esc(event.note||'Correction recorded.')}</p><p><strong>${esc(correctionAuditSummary(event))}</strong></p>${event.impact?.affectedJudgements?.length?`<h4>Judgements</h4><ul>${event.impact.affectedJudgements.map(item=>`<li>${esc(item.id)} — ${esc(item.reasons.join(' '))}</li>`).join('')}</ul>`:''}${event.impact?.affectedLearnings?.length?`<h4>Learnings</h4><ul>${event.impact.affectedLearnings.map(item=>`<li>${esc(item.advisor)} · ${esc(item.id)} — ${esc(item.reasons.join(' '))}</li>`).join('')}</ul>`:''}${event.impact?.affectedHistory?.length?`<h4>Historical records</h4><ul>${event.impact.affectedHistory.map(item=>`<li>${esc(item.judgementId||'unlinked record')} — ${esc(item.reasons.join(' '))}</li>`).join('')}</ul>`:''}</details>`).join(''):`<div class="empty"><p class="muted">No correction has required propagation yet.</p></div>`}</section>
    <section class="human-model-promotions understanding-group" data-understanding-group="overview">
      <div class="section-heading"><div><p class="eyebrow">HUMAN MODEL FACT CANDIDATES</p><h3>Repeated observations never become stable facts without you</h3></div><span>${humanModelPromotionStatus.total}</span></div>
      <p class="muted preference-summary">${esc(humanModelPromotionStatus.statement)}</p>
      ${humanModelFactCandidatesList.length?humanModelFactCandidatesList.map(candidate=>`<article class="human-model-promotion ${esc(candidate.status)}"><div><strong>${esc(candidate.key)}</strong><span>${esc(candidate.status)}</span></div><p>${esc(candidate.value)}</p><small>${esc(humanModelFactCandidateSummary(candidate))}</small><small>${candidate.evidenceCount} observations</small><div class="insight-actions">${candidate.status==='candidate'?`<button data-human-model-promotion-action="promote" data-human-model-promotion-id="${esc(candidate.id)}">Promote to stable fact</button><button data-human-model-promotion-action="reject" data-human-model-promotion-id="${esc(candidate.id)}">Keep as observations</button>`:''}${candidate.status==='promoted'?`<button data-human-model-promotion-action="reopen" data-human-model-promotion-id="${esc(candidate.id)}">Reopen</button>`:''}${candidate.status==='rejected'?`<button data-human-model-promotion-action="reopen" data-human-model-promotion-id="${esc(candidate.id)}">Review again</button>`:''}</div><small>Judgement influence: 0 · Practice selection influence: 0 · Safety influence: 0</small></article>`).join(''):`<div class="empty"><p class="muted">No stable-fact candidate has enough confirmed evidence yet.</p></div>`}
    </section>
    <section class="learning-review understanding-group" data-understanding-group="overview"><div class="section-heading"><div><p class="eyebrow">ACCOUNTABLE LEARNING</p><h3>What remains candidate, confirmed or rejected</h3></div></div>${learningItems.length?learningItems.map(item=>`<article class="learning-item ${item.status}"><div class="learning-head"><strong>${esc(item.advisor)}</strong><span>${esc(item.status)}</span></div><p>${esc(item.learning)}</p><small>${item.evidenceCount} observation${item.evidenceCount===1?'':'s'} · last seen ${new Date(item.lastObservedAt).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</small><div class="insight-actions">${item.status==='candidate'?`<button data-learning-action="confirmed" data-learning-advisor="${esc(item.advisor)}" data-learning-id="${esc(item.id)}">Confirm this learning</button><button data-learning-action="rejected" data-learning-advisor="${esc(item.advisor)}" data-learning-id="${esc(item.id)}">This is not right</button>`:''}${item.status==='confirmed'?`<button data-learning-action="rejected" data-learning-advisor="${esc(item.advisor)}" data-learning-id="${esc(item.id)}">Correct this learning</button>`:''}${item.status==='rejected'?`<button data-learning-action="candidate" data-learning-advisor="${esc(item.advisor)}" data-learning-id="${esc(item.id)}">Reopen as candidate</button>`:''}</div>${item.correction?.note?`<small>Correction: ${esc(item.correction.note)}</small>`:''}</article>`).join(''):`<div class="empty"><p class="muted">No Advisor learning has been proposed yet.</p></div>`}</section>
    ${discoveries.map(x=>`<article class="insight ${x.feedback==='disagree'?'challenged':''}"><div class="insight-head"><p class="eyebrow">${x.level==='pattern'?'CURRENT PATTERN':'WORKING HYPOTHESIS'}</p><span>${x.confidence}% confidence</span></div><strong>${esc(x.title)}</strong><p>${esc(x.copy)}</p><div class="insight-actions"><button data-insight-feedback="agree" data-insight-id="${x.id}">This feels right</button><button data-insight-feedback="disagree" data-insight-id="${x.id}">${x.feedback==='disagree'?'Correction recorded':'Not quite'}</button></div>${x.feedback==='disagree'?`<small>I will reduce confidence in this interpretation until new evidence supports it.</small>`:''}</article>`).join('')}
    <section class="unknowns understanding-group" data-understanding-group="overview"><p class="eyebrow">STILL LEARNING</p><ul>${latest.unknowns.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
    ${changes.length?`<section class="understanding-changes understanding-group is-hidden" data-understanding-group="audit"><p class="eyebrow">HOW MY UNDERSTANDING CHANGED</p>${changes.map(c=>`<article><time>${new Date(c.at).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</time><div><strong>${esc(c.title)}</strong><p>${esc(c.note)}</p></div></article>`).join('')}</section>`:''}
  </section>${nav('understanding')}`)
}
function deriveDiscoveries(){
  const h=state.history.slice(0,12), feedback=state.understandingModel?.feedback||{};
  const short=h.filter(x=>x.decision?.duration<=15), good=short.filter(x=>x.reflection!=='worse').length;
  const recovery=h.filter(x=>x.context?.challenge==='recovery'||x.context?.sleep<=2);
  const relational=h.filter(x=>x.context?.challenge==='family');
  const raw=[
    {id:'consistency-over-intensity',level:h.length>=4?'pattern':'hypothesis',title:'Consistency may matter more than intensity.',copy:h.length?'Your recent pattern suggests that completing a bounded practice is often more valuable than increasing its size.':'I need several completed reflections before treating this as more than a hypothesis.',confidence:Math.min(84,42+h.length*4)},
    {id:'short-practices-sustainable',level:short.length>=3?'pattern':'hypothesis',title:'Short practices appear sustainable.',copy:short.length?`${good} of ${short.length} recent short practices were judged useful or approximately right.`:'There is not enough evidence yet.',confidence:Math.min(82,38+short.length*7)},
    {id:'priorities-change-action',level:h.length>=3?'pattern':'hypothesis',title:'Your priorities change the best action.',copy:'Body, work, recovery and relationships are treated as competing legitimate claims—not as distractions from fitness.',confidence:Math.min(82,58+h.length*3)},
    {id:'recovery-response',level:recovery.length>=3?'pattern':'hypothesis',title:'Recovery signals may deserve more weight on low-capacity days.',copy:recovery.length?`I have ${recovery.length} recent decisions involving recovery or poorer sleep. I am testing whether restraint improves the following day.`:'I do not yet have enough recovery-specific reflections.',confidence:Math.min(78,35+recovery.length*9)},
    {id:'relational-return',level:relational.length>=2?'pattern':'hypothesis',title:'Relational presence may sometimes create the highest return.',copy:relational.length?`Family was the strongest claim on ${relational.length} recent day${relational.length===1?'':'s'}. I am learning when presence should outrank a physical practice.`:'I have not yet observed enough days where relationships were the leading priority.',confidence:Math.min(75,32+relational.length*12)}
  ];
  return raw.map(x=>{const f=feedback[x.id];let confidence=x.confidence;if(f==='agree')confidence=Math.min(92,confidence+6);if(f==='disagree')confidence=Math.max(20,confidence-22);return {...x,confidence,feedback:f||null}})
}
function humanModelCorrection(){
  const model=normaliseHumanModel(state.humanModel,{profile:state.profile});
  const item=[...(model.facts||[]),...(model.observations||[])].find(entry=>entry.id===selectedHumanModelEvidenceId);
  if(!item)return route('understanding');
  shell(`${header('CORRECT HUMAN MODEL','<button class="icon-btn" aria-label="Close correction" data-action="understanding">×</button>')}<section class="stack correction-screen"><div><p class="eyebrow">YOUR RECORD, YOUR AUTHORITY</p><h2>${esc(item.key)}</h2><p class="muted">Explain what is inaccurate. Strategos will preserve the correction and mark this evidence as rejected.</p></div><div class="human-model-correction-target"><strong>${esc(item.value)}</strong><small>${esc(item.observedAt||item.updatedAt||'')}</small></div><textarea id="human-model-correction-note" maxlength="280" placeholder="What should Strategos understand instead?"></textarea>${button('SAVE CORRECTION','save-human-model-correction')}${button('CANCEL','understanding',true)}</section>`)
}
function correctUnderstanding(){
  const insight=deriveDiscoveries().find(x=>x.id===selectedInsightId);
  if(!insight)return route('understanding');
  shell(`${header('CORRECT MY UNDERSTANDING','<button class="icon-btn" aria-label="Close correction" data-action="understanding">×</button>')}<section class="stack correction-screen"><div><p class="eyebrow">YOUR PERSPECTIVE MATTERS</p><h2>${esc(insight.title)}</h2><p class="muted">Tell me what I misunderstood. I will preserve the correction as part of how my model changes.</p></div><textarea id="correction-note" maxlength="280" placeholder="For example: short practices work only on busy days…"></textarea>${button('SAVE CORRECTION','save-correction')}${button('CANCEL','understanding',true)}</section>`)
}
function recordInsightFeedback(id,value,note=''){
  state.understandingModel ||= {feedback:{},changes:[]};
  state.understandingModel.feedback ||= {};state.understandingModel.changes ||= [];
  const insight=deriveDiscoveries().find(x=>x.id===id);
  state.understandingModel.feedback[id]=value;
  state.understandingModel.changes.unshift({id:`change-${Date.now()}`,insightId:id,at:new Date().toISOString(),title:value==='agree'?'Understanding confirmed':'Understanding corrected',note:value==='agree'?`You confirmed: “${insight?.title||id}”`:(note||`You challenged: “${insight?.title||id}”`)});
  state.understandingModel.changes=state.understandingModel.changes.slice(0,50);
  if(value==='disagree'){
    const correction=createCorrectionEvent({type:'understanding-correction',sourceId:id,note:note||'Understanding corrected by the person.'});
    const impact=determineCorrectionImpact(state,correction);
    state=applyCorrectionImpact(state,correction,impact);
  }
  persist()
}
function journey(){const dayStories=dailyStoryTimeline(state,14);const weeklyReview=buildWeeklyReview(state);const preservedWeeklyReview=weeklyReviewForWindow(state.weeklyReviews,weeklyReview.id);const weeklyIntention=weeklyIntentionForWeek(state.weeklyIntentions,weeklyReview.id);const items=journeyRecords(state);const emotionalEntries=emotionalJournalEntries(state.emotionalJournalEntries);const emotionalAudit=emotionalJournalAudit(state.emotionalJournalEntries);const emotionalEvolution=emotionalJournalEvolution(state.emotionalJournalEntries);const emotionalFollowUp=emotionalJournalFollowUpAudit(state.emotionalJournalEntries);shell(`${header('JOURNEY')}<section class="daily-story-timeline"><div class="section-heading"><div><p class="eyebrow">LIVING TIMELINE</p><h3>Each day is one continuous story.</h3></div><span>${dayStories.length}</span></div>${dayStories.length?dayStories.map(day=>`<article class="daily-story-day ${esc(day.stage)}"><time>${new Date(`${day.day}T12:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</time><div><strong>${esc(dailyStorySummary(day))}</strong><small>${day.judgement?.practiceName?esc(day.judgement.practiceName):day.signals?`Sleep ${day.signals.sleep}/4 · Energy ${day.signals.energy}/3`:'No context recorded'}</small></div><span>${esc(day.stage.replace('-',' '))}</span></article>`).join(''):`<p class="muted">Your first daily story begins in Today.</p>`}</section><section class="weekly-review-card"><div class="section-heading"><div><p class="eyebrow">WEEKLY REVIEW</p><h3>${esc(weeklyReview.headline)}</h3></div><span>${weeklyReview.recordedDays}/7</span></div><p>${esc(weeklyReview.carry)}</p><p>${esc(weeklyReview.evidence)}</p><div class="weekly-review-metrics"><article><strong>${weeklyReview.completedDays}</strong><span>days closed</span></article><article><strong>${weeklyReview.practiceDays}</strong><span>Practices reflected</span></article><article><strong>${weeklyReview.directionalOutcomes}</strong><span>outcomes</span></article></div><small>${esc(weeklyReview.statement)}</small>${weeklyReview.ready?(preservedWeeklyReview?`<div class="weekly-review-preserved"><strong>Preserved</strong><span>${new Date(preservedWeeklyReview.preservedAt).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</span></div>`:`<button class="action secondary" data-action="preserve-weekly-review">Preserve this review</button>`):''}${weeklyReview.ready?`<div class="weekly-intention"><p class="eyebrow">CARRY INTO THIS WEEK</p>${weeklyIntention?`<h3>${esc(weeklyIntention.label)}</h3>${weeklyIntention.note?`<p>${esc(weeklyIntention.note)}</p>`:''}<div class="weekly-intention-actions"><button class="text-btn" data-action="edit-weekly-intention">Change</button><button class="text-btn" data-action="clear-weekly-intention">Clear</button></div>`:`<p>Choose one direction. It remains visible in Today but does not silently change any judgement.</p><label><span>Direction</span><select id="weekly-intention-choice">${WEEKLY_INTENTION_OPTIONS.map(([id,label])=>`<option value="${id}">${esc(label)}</option>`).join('')}</select></label><label><span>Optional note or custom direction</span><input id="weekly-intention-note" maxlength="180" placeholder="What do you want to protect or build?"></label><button class="action secondary" data-action="save-weekly-intention">Set this direction</button>`}</div>`:''}</section><section class="stack"><div><p class="eyebrow">DELIBERATION ARCHIVE</p><h2>How my judgement is evolving.</h2><p class="muted">Every meaningful judgement leaves an understandable record.</p></div>${items.length?items.map(j=>`<article class="journey-item"><time>${new Date(j.createdAt).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</time><div><strong>${esc(j.practice.name)}</strong><p>${esc(j.judgement)}</p><span>${esc(j.confidenceLevel||confidenceLabel(j.confidence))} confidence · ${j.reflection||'not reviewed'} · ${j.historyLinked?'linked record':'recovered record'}</span>${j.adaptationAccountability?.choiceCount?`<details class="journey-adaptation"><summary>Practice adaptation</summary><div><p>${esc(adaptationAccountabilitySummary(j.adaptationAccountability))}</p><small>${j.adaptationAccountability.choices.some(choice=>choice.source==='confirmed-pattern')?'A confirmed default shaped the starting version.':'The person changed the version during the Practice.'}</small><ul>${j.adaptationAccountability.choices.map(choice=>`<li><span>${esc(choice.phaseName)}</span><strong>${choice.level==='regression'?'Easier':choice.level==='progression'?'Harder':'Standard'}</strong><small>${choice.source==='confirmed-pattern'?'confirmed default':'chosen during Practice'}</small></li>`).join('')}</ul></div></details>`:''}${j.explainRecord?`<details class="journey-explain-record"><summary>Explanation record at judgement</summary><div><strong>${esc(explainRecordSummary(j.explainRecord))}</strong><p>${esc(j.explainRecord.statement)}</p>${j.explainRecord.review?`<small>${esc(explainRecordReviewSummary(j.explainRecord))}</small>`:''}</div></details>`:''}${j.safetyEvents?.length?(()=>{const runtimeAudit=safetyInterruptionAudit(j.safetyEvents);return `<details class="journey-runtime-safety"><summary>Runtime safety interruptions</summary><div><strong>${runtimeAudit.total} recorded</strong><p>${esc(runtimeAudit.statement)}</p><small>${runtimeAudit.resumed} resumed · ${runtimeAudit.ended} ended · ${runtimeAudit.active} unresolved</small></div></details>`})():''}${j.safetyEnvelope?`<details class="journey-safety-envelope"><summary>Safety envelope at judgement</summary><div><strong>${esc(safetyEnvelopeSummary(j.safetyEnvelope))}</strong><p>${esc(j.safetyEnvelope.statement)}</p>${j.safetyAcknowledgement?`<small>Acknowledged by the person at ${esc(j.safetyAcknowledgement.acknowledgedAt)}.</small>`:`<small>No safety acknowledgement was required or recorded.</small>`}</div></details>`:''}${j.humanModelSnapshot?`<details class="journey-human-model-snapshot"><summary>Human Model evidence at judgement</summary><div><strong>${esc(humanModelDeliberationSnapshotSummary(j.humanModelSnapshot))}</strong><p>${esc(j.humanModelSnapshot.statement)}</p><small>Rejected evidence was preserved but excluded from the active evidence set.</small></div></details>`:''}${j.practiceContentSnapshot?(()=>{const provenance=assessPracticeContentProvenance(j.practiceContentSnapshot,CODEX);return `<details class="journey-practice-content"><summary>Practice content provenance</summary><div><strong>${esc(practiceContentSnapshotSummary(j.practiceContentSnapshot,provenance))}</strong><p>${esc(provenance.statement)}</p><small>${j.practiceContentSnapshot.phaseCount} phases · ${esc(j.practiceContentSnapshot.evidenceStatus)} evidence status</small></div></details>`})():''}${j.practiceDoseRevisionUse?`<details class="journey-dose-revision"><summary>Duration accountability</summary><div><strong>${esc(j.practiceDoseRevisionUse.durationMinutes)} min person-authorised duration</strong><p>${esc(j.practiceDoseRevisionUse.fit||'unknown')} fit · ${Math.round((j.practiceDoseRevisionUse.completionRatio||0)*100)}% complete</p><small>Base duration ${esc(j.practiceDoseRevisionUse.baseDurationMinutes)} min</small></div></details>`:''}${j.practiceContractOutcome?`<details class="journey-contract-outcome"><summary>Practice contract outcome</summary><div><strong>${esc(j.practiceContractOutcome.status.replaceAll('-',' '))}</strong><p>${esc(practiceContractOutcomeStatement(j.practiceContractOutcome))}</p><small>Expected: ${esc(j.practiceContractOutcome.expectedEffect)}</small><small>Effect ${esc(j.practiceContractOutcome.effect)} · Goal fit ${esc(j.practiceContractOutcome.goalFit)} · Burden ${esc(j.practiceContractOutcome.burden)}</small></div></details>`:''}${j.personChoice?.action==='choose-alternative'?`<small class="journey-choice">Person chose ${esc(j.practice.name)} instead of the original recommendation.${j.personChoice.reason?` Reason: ${esc(j.personChoice.reason)}`:''}</small>`:''}</div></article>`).join(''):`<div class="empty"><h2>No reviewed judgements yet.</h2><p class="muted">Complete and reflect on a practice to begin the archive.</p></div>`}</section><section class="personal-evidence-journey">${(()=>{const evidence=personalEvidenceOverview(state.outcomeLedger);return `<div class="section-heading"><div><p class="eyebrow">PERSONAL EVIDENCE</p><h3>${esc(evidence.statement)}</h3></div><span>${evidence.visible.length}</span></div>${evidence.visible.length?`<div class="personal-evidence-grid">${evidence.visible.map(item=>`<article><div><strong>${esc(item.practiceName)}</strong><span>${Math.round(item.helpRate*100)}%</span></div><p>${esc(item.statement)}</p><small>${item.directionalOutcomes} directional outcomes · ${esc(item.trajectory.replaceAll('-',' '))}</small></article>`).join('')}</div>`:`<p class="muted">A pattern appears only after at least three directional outcomes for the same Practice.</p>`}<small>This evidence is descriptive. Automatic judgement influence: 0.</small></section>`})()}</section><section class="outcome-ledger-journey">${(()=>{const audit=outcomeLedgerAudit(state.outcomeLedger);return `<div class="section-heading"><div><p class="eyebrow">OUTCOME LEDGER</p><h3>${esc(audit.statement)}</h3></div><span>${audit.total}</span></div>${(state.outcomeLedger||[]).length?`<div class="emotional-journal-list">${state.outcomeLedger.slice(0,12).map(item=>`<article><div><time>${new Date(item.recordedAt).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</time><strong>${esc(outcomeLedgerLabel(item.result))}</strong></div><p>${esc(item.practiceName)}</p>${item.note?`<small>${esc(item.note)}</small>`:''}</article>`).join('')}</div>`:`<p class="muted">Complete a Practice and reflect to begin the learning ledger.</p>`}<small>Human Model influence: 0 · Judgement influence: 0</small>`})()}</section><section class="emotional-journal-journey"><div class="section-heading"><div><p class="eyebrow">EMOTIONAL JOURNAL</p><h3>A private space to close the day.</h3></div><span>${emotionalAudit.total}</span></div><p class="muted">Write freely about what went well, what went badly, or anything still present. Entirely optional.</p><button class="action secondary" data-action="emotionalJournal">${emotionalJournalToday(state.emotionalJournalEntries)?'Continue today’s reflection':'Write today’s reflection'}</button>${emotionalEntries.length?`<div class="emotional-journal-list">${emotionalEntries.slice(0,12).map(entry=>`<article><div><time>${new Date(`${entry.entryDate}T12:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}</time><button data-emotional-journal-action="edit" data-emotional-journal-id="${esc(entry.id)}">Edit</button></div><p>${esc(emotionalJournalPreview(entry))}</p>${entry.followUp?`<div class="emotional-follow-up-status"><strong>${esc(emotionalJournalFollowUpLabel(entry.followUp.outcome))}</strong><span>${esc(entry.followUp.note||entry.followUp.statement)}</span></div>`:''}<small>Private reflection · judgement influence 0</small></article>`).join('')}</div>`:''}</section><section class="emotional-follow-up-summary"><div class="section-heading"><div><p class="eyebrow">REFLECTION FOLLOW-UP</p><h3>${esc(emotionalFollowUp.statement)}</h3></div><span>${emotionalFollowUp.reviewed}/${emotionalFollowUp.totalEntries}</span></div><div class="emotional-evolution-grid">${EMOTIONAL_JOURNAL_FOLLOW_UPS.map(outcome=>`<article><strong>${esc(emotionalJournalFollowUpLabel(outcome))}</strong><span>${emotionalFollowUp.counts[outcome]}</span></article>`).join('')}</div><small>Only your explicit follow-up is counted. No automated interpretation.</small><small>Judgement influence: 0 · Human Model influence: 0 · Safety influence: 0</small></section><section class="emotional-evolution"><div class="section-heading"><div><p class="eyebrow">PERSONAL EVOLUTION</p><h3>${esc(emotionalEvolution.statement)}</h3></div></div>${emotionalEvolution.ranked.length?`<div class="emotional-evolution-grid">${emotionalEvolution.ranked.map(item=>`<article><strong>${esc(emotionalJournalThemeLabel(item.theme))}</strong><span>${item.count}</span></article>`).join('')}</div><small>Only themes you selected yourself are counted. No text analysis.</small>`:`<p class="muted">Themes are optional and can be added while editing an entry.</p>`}<small>Judgement influence: 0 · Human Model influence: 0 · Safety influence: 0</small></section>${(()=>{const t=recentCheckInTrajectory(state.dailyCheckIns,7);return `<section class="checkin-trajectory"><p class="eyebrow">RECENT DAILY RHYTHM</p><h3>${t.days?`${t.days} recorded day${t.days===1?'':'s'}`:'Still forming'}</h3><p>${esc(t.statement)}</p>${t.dominantClaim?`<small>Most frequent declared priority: ${esc(t.dominantClaim)}. Descriptive only; no automatic judgement influence.</small>`:'<small>Complete daily check-ins to build continuity.</small>'}</section>`})()}${nav('journey')}`)}
function guide(){
  const sections=[
    ['overview','What Strategos is',`<p>Strategos is a deliberative companion. It helps you understand the present context, forms a judgement, proposes a Practice and learns from what actually happened.</p><p><strong>Strategos advises. You decide.</strong></p>`],
    ['today','How Today works',`<p>Today is where each daily cycle begins. Answer the current signals honestly and approximately. They are not tests and there is no ideal answer.</p><div class="guide-flow"><span>Today</span><i>→</i><span>Agora</span><i>→</i><span>Judgement</span><i>→</i><span>Practice</span><i>→</i><span>Reflection</span></div>`],
    ['graph','The Living Human Graph',`<p>The graph is not a score or diagnosis. It is a slowly changing model of the dimensions currently visible in your choices and reflections.</p><p>A stronger emphasis means that dimension currently carries more weight or clearer evidence. It does not mean that the other dimensions are unimportant.</p>`],
    ['judgement','How a judgement works',`<p>A judgement is Strategos’ best current recommendation, not an instruction. Read the proposed Practice, confidence, duration and the short explanation of why it fits today.</p><p>You may accept it, choose the nearest alternative, decide later or decline. None of these choices is treated as obedience or failure.</p>`],
    ['practice','Practices and interruption',`<p>A Practice is the action proposed for the available time and present context. During execution you may pause, resume or end early.</p><p>If the app closes, Strategos preserves the active flow. The next opening still starts in Today, where a Resume card lets you return deliberately.</p>`],
    ['reflection','Reflection and learning',`<p>Reflection records what actually happened. The three essential answers are effect, goal fit and burden. Additional context is optional.</p><p>Strategos learns cautiously from repeated, context-matched outcomes. A single result does not become a permanent rule.</p>`],
    ['understanding','Understanding and Journey',`<p><strong>Understanding</strong> contains accumulated meaning: patterns, outcomes, agency and audit. Detailed reasoning from the latest deliberation lives there.</p><p><strong>Journey</strong> is the chronological record of meaningful judgements and reflections. It shows how your decisions evolve over time.</p>`],
    ['privacy','Data and control',`<p>Your Strategos state is stored locally in this browser. Use Settings to export a private backup before changing device or clearing browser data.</p><p>You may correct inferred preferences, reject misleading patterns, decline recommendations and erase the local state.</p>`]
  ];
  const ordered=guideFocus==='overview'?sections:[...sections.filter(([id])=>id===guideFocus),...sections.filter(([id])=>id!==guideFocus)];
  shell(`${header('HOW TO USE STRATEGOS','<button class="icon-btn" aria-label="Close guide and return to Settings" data-action="settings">×</button>')}<section class="stack usage-guide"><div><p class="eyebrow">SIMPLE GUIDE</p><h2>Use Strategos without having to understand the system behind it.</h2><p class="muted">Open only the sections that are useful now.</p></div><div class="guide-principle"><strong>Understand first.</strong><span>Act deliberately.</span></div>${ordered.map(([id,title,body],index)=>`<details class="guide-section" data-guide-id="${id}" ${index===0?'open':''}><summary>${title}</summary><div>${body}</div></details>`).join('')}<button class="action secondary" data-action="settings">Back to Settings</button></section>${nav('settings')}`)
}

function eveningReflection(){
  const todayKey=localDayKey();
  const selected=emotionalJournalToday(state.emotionalJournalEntries,todayKey);
  const story=deriveDailyStory({stories:state.dailyStories,checkIns:state.dailyCheckIns,judgements:state.judgements,history:state.history,journalEntries:state.emotionalJournalEntries});
  const evening=buildEveningExperience({story,journalEntry:selected});
  if(!evening.ready&&!evening.complete)return route('today');
  shell(`${header('EVENING','<button class="icon-btn" aria-label="Close and return to Today" data-action="today">×</button>')}
    <section class="stack evening-reflection-screen">
      <div class="evening-reflection-heading"><p class="eyebrow">ONE MINUTE</p><h1>What mattered today?</h1><p class="muted">One honest sentence is enough. Writing is optional.</p></div>
      <label><span>Private reflection</span><textarea id="evening-reflection-text" rows="6" maxlength="1200" placeholder="What is worth remembering?">${esc(selected?.text||'')}</textarea></label>
      <div class="evening-reflection-actions">
        <button class="action primary" data-action="save-evening-reflection">${selected?'Save and close the day':'Save and close the day'}</button>
        <button class="text-btn" data-action="skip-evening-reflection">Close without writing</button>
      </div>
      <small>No score. No analysis of your words. Influence on judgement: 0.</small>
    </section>${nav('today')}`)
}

function emotionalJournal(){
  const todayKey=new Date().toISOString().slice(0,10);
  const selectedId=state.currentEmotionalJournalEntryId||null;
  const selected=selectedId
    ?state.emotionalJournalEntries.find(entry=>entry.id===selectedId)
    :emotionalJournalToday(state.emotionalJournalEntries,todayKey);
  shell(`${header('EMOTIONAL JOURNAL','<button class="icon-btn" aria-label="Close and return to Journey" data-action="journey">×</button>')}
    <section class="stack emotional-journal-editor">
      <div><p class="eyebrow">END-OF-DAY REFLECTION</p><h2>Write what is true for you.</h2><p class="muted">What went well, what went badly, or anything else. Skip it whenever you prefer.</p></div>
      <label><span>Private reflection</span><textarea id="emotional-journal-text" rows="12" placeholder="Write freely…">${esc(selected?.text||'')}</textarea></label>
      ${selected?`<section class="emotional-theme-picker"><p class="eyebrow">OPTIONAL THEMES</p><p class="muted">Choose only what feels true. Strategos will not infer themes from your writing.</p><div>${EMOTIONAL_JOURNAL_THEMES.map(theme=>`<button class="pill ${(selected.themes||[]).includes(theme)?'selected':''}" data-emotional-journal-action="theme" data-emotional-journal-id="${esc(selected.id)}" data-emotional-journal-theme="${esc(theme)}" aria-pressed="${(selected.themes||[]).includes(theme)?'true':'false'}">${esc(emotionalJournalThemeLabel(theme))}</button>`).join('')}</div></section><section class="emotional-follow-up-editor"><p class="eyebrow">HOW HAS THIS EVOLVED?</p><p class="muted">Review this only when it feels useful: Still present, Changed, Resolved, or Uncertain. Your answer does not change the Human Model.</p>${selected.followUp?`<div class="emotional-follow-up-current"><strong>${esc(emotionalJournalFollowUpLabel(selected.followUp.outcome))}</strong><p>${esc(selected.followUp.note||selected.followUp.statement)}</p><button data-emotional-journal-action="follow-up-reopen" data-emotional-journal-id="${esc(selected.id)}">Review again</button></div>`:`<label><span>Optional note</span><textarea id="emotional-follow-up-note" rows="3" placeholder="What changed, remained or resolved?"></textarea></label><div>${EMOTIONAL_JOURNAL_FOLLOW_UPS.map(outcome=>`<button class="pill" data-emotional-journal-action="follow-up" data-emotional-journal-id="${esc(selected.id)}" data-emotional-journal-outcome="${esc(outcome)}">${esc(emotionalJournalFollowUpLabel(outcome))}</button>`).join('')}</div>`}</section>`:''}
      <small>No score. No diagnosis. No automatic Human Model update. Influence on judgement: 0.</small>
      <div class="emotional-journal-actions">
        <button class="action primary" data-emotional-journal-action="save" data-emotional-journal-id="${esc(selected?.id||'')}">${selected?'Save changes':'Save reflection'}</button>
        ${selected?`<button class="action secondary" data-emotional-journal-action="delete" data-emotional-journal-id="${esc(selected.id)}">Delete entry</button>`:''}
        <button class="text-btn" data-action="journey">Skip for now</button>
      </div>
    </section>
    ${nav('journey')}`)
}
function settings(){
  const voice=state.settings.voice;
  const hapticsAvailable=supportsHaptics();
  const wakeAvailable=supportsWakeLock();
  shell(`${header('SETTINGS','<button class="icon-btn" aria-label="Close and return to Today" data-action="today">×</button>')}<section class="stack settings"><div><p class="eyebrow">EXPERIENCE</p><h2>Quiet by design.</h2></div>
    <div class="setting-block profile-settings"><p class="eyebrow">MY PROFILE</p><h3>${esc(profileSummary(state.profile))}</h3><p>Optional personal context used transparently by the Human Model and Practice guidance.</p><div class="profile-form"><label><span>Name</span><input id="settings-profile-name" value="${esc(state.profile?.name||'')}"/></label><label><span>Age</span><input id="settings-profile-age" type="number" min="13" max="120" value="${esc(state.profile?.age||'')}"/></label><label><span>Height (cm)</span><input id="settings-profile-height" type="number" min="100" max="230" value="${esc(state.profile?.heightCm||'')}"/></label><label><span>Weight (kg)</span><input id="settings-profile-weight" type="number" min="25" max="350" step="0.1" value="${esc(state.profile?.weightKg||'')}"/></label><label><span>Experience</span><select id="settings-profile-experience"><option value="">Not specified</option>${[['beginner','Beginning'],['intermediate','Some experience'],['advanced','Experienced']].map(([v,l])=>`<option value="${v}" ${state.profile?.experience===v?'selected':''}>${l}</option>`).join('')}</select></label><label class="profile-wide"><span>Relevant limitations or considerations</span><textarea id="settings-profile-limitations" rows="3">${esc(state.profile?.limitations||'')}</textarea></label></div><button class="action secondary" data-action="save-profile">Save profile</button></div>
    ${settingToggle('Sound','Soft cues at transitions and during the final five seconds.','sound',state.settings.sound)}
    ${settingChoice('Voice guidance','How much Strategos says during a practice.','voice',[['off','Off'],['minimal','Minimal'],['guided','Guided']],voice)}
    <div class="setting-block"><h3>Strategos voice</h3><p>Strategos uses the best available English system voice automatically.</p><button class="action secondary voice-preview" data-action="preview-voice">Preview voice</button></div>
    ${settingToggle('Haptics',hapticsAvailable?'Subtle physical feedback. Tap to test.':'Physical vibration is not available in this iPhone browser.','haptics',state.settings.haptics,{disabled:!hapticsAvailable,status:hapticsAvailable?'Available on this device':'Unavailable in this browser'})}
    ${settingToggle('Keep screen awake',wakeAvailable?'Prevents screen sleep during an active Practice.':'Screen Wake Lock is not available in this browser.','keepAwake',state.settings.keepAwake,{disabled:!wakeAvailable,status:wakeAvailable?(wakeLockStatus==='active'?'Active during the current Practice':'Activates when a Practice begins'):'Unavailable in this browser'})}
    <div class="setting-block guide-entry"><p class="eyebrow">GUIDANCE</p><h3>How to use Strategos</h3><p>A simple guide to the daily cycle, judgements, Practices, reflection and learning.</p><button class="action secondary" data-guide-section="overview">Open guide</button></div>
    ${settingsNotice?`<div class="data-notice" role="status"><strong>Data status</strong><p>${esc(settingsNotice)}</p></div>`:''}
    <div class="setting-block"><h3>Your data</h3><p>Stored locally in this browser. Export before switching devices or clearing browser storage.</p><div class="data-actions">${button('EXPORT STATE','export-state',true)}${button('IMPORT STATE','import-state',true)}</div><input id="state-import-file" type="file" accept="application/json,.json" hidden/></div>
    <div class="settings-section">${button('REPLAY ONBOARDING','replay-onboarding',true)}<button class="danger-btn" data-action="reset">Erase all Strategos data</button></div></section>${nav('settings')}`)
}
async function exportState(){
  try{
    const text=serializeStateExport(state);
    const blob=new Blob([text],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download=exportFilename();document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setNotice('State exported. Keep the file private.');
  }catch(_){setNotice('Strategos could not create the export file.');}
  route('settings');
}

async function importStateFile(file){
  if(!file){setNotice('No import file was selected.');return route('settings')}
  try{
    const result=validateStateImport(await file.text());
    if(!result.ok){setNotice(result.error);return route('settings')}
    const preview=createImportPreview(result.state,result.metadata);
    const summary=`Import the state for ${preview.profileName}? It contains ${preview.historyCount} completed practice record${preview.historyCount===1?'':'s'} and ${preview.judgementCount} judgement${preview.judgementCount===1?'':'s'}. Your current state will be backed up locally first.`;
    if(!confirm(summary)){setNotice('Import cancelled. Your current state was not changed.');return route('settings')}
    const backup=createLocalBackup();
    if(!backup.ok){setNotice(backup.error);return route('settings')}
    const saved=saveState(result.state);
    if(!saved.ok){setNotice(saved.error);return route('settings')}
    state=reconcileLoadedState(loadState());saveState(state);decision=null;setNotice('Strategos state imported and reconciled successfully.');
    return route('settings');
  }catch(_){setNotice('Strategos could not read the selected import file.');return route('settings')}
}

const settingToggle=(t,c,k,v,{disabled=false,status=''}={})=>`<div class="setting-row ${disabled?'setting-disabled':''}"><div><h3>${t}</h3><p>${c}</p>${status?`<small class="setting-status">${status}</small>`:''}</div><button class="switch ${v&&!disabled?'on':''}" type="button" role="switch" aria-label="${t}" aria-checked="${v&&!disabled}" data-setting-toggle="${k}" ${disabled?'disabled aria-disabled="true"':''}><span aria-hidden="true"></span></button></div>`;
const settingChoice=(t,c,k,o,v)=>`<div class="setting-block"><h3>${t}</h3><p>${c}</p><div class="segmented">${o.map(([x,l])=>`<button class="${v===x?'selected':''}" aria-pressed="${v===x}" data-setting-choice="${k}" data-value="${x}">${l}</button>`).join('')}</div></div>`;
const confidenceLabel=value=>value>=82?'Relatively Strong':value>=66?'Moderate':'Limited';const formatTime=s=>`${String(Math.floor(Math.max(0,s)/60)).padStart(2,'0')}:${String(Math.max(0,s)%60).padStart(2,'0')}`;const greeting=()=>new Date().getHours()<12?'Good morning':new Date().getHours()<18?'Good afternoon':'Good evening';
app.addEventListener('input',e=>{const target=e.target.closest('[data-reflection-draft]');if(!target||!state.current?.decision)return;const key=target.dataset.reflectionDraft;const currentDraft=restoreReflectionDraft(state,state.current)||createReflectionDraft({current:state.current});state.reflectionDraft=updateReflectionDraft(currentDraft,{[key]:target.value});persist()});
app.addEventListener('change',e=>{const target=e.target.closest('[data-reflection-draft]');if(!target||!state.current?.decision)return;const key=target.dataset.reflectionDraft;const currentDraft=restoreReflectionDraft(state,state.current)||createReflectionDraft({current:state.current});state.reflectionDraft=updateReflectionDraft(currentDraft,{[key]:target.value});persist();announceStatus(`${target.closest('label')?.firstChild?.textContent?.trim()||'Reflection'} saved.`)});
app.addEventListener('click',e=>{const navigation=e.target.closest('button[data-action="understanding"],button[data-action="today"],button[data-action="journey"],button[data-action="settings"]');if(!navigation)return;const destination=navigation.dataset.action;if(!['today','understanding','journey','settings'].includes(destination))return;e.preventDefault();e.stopImmediatePropagation();route(destination)});
app.addEventListener('click',e=>{
  const target=e.target instanceof Element?e.target.closest('button[data-key]'):null;
  if(!target)return;
  // Inline handler is the primary iOS path; this is a keyboard/accessibility fallback.
  if(typeof target.onclick==='function')return;
  e.preventDefault();
  e.stopImmediatePropagation();
  commitCheckinChoice(target);
},true);
app.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;if(t.dataset.key){return;}if(false){const k=t.dataset.key;context[k]=['sleep','energy','time'].includes(k)?Number(t.dataset.value):t.dataset.value;state.dailyCheckIns=upsertDailyCheckIn(state.dailyCheckIns,context);recordDailyStoryStage('check-in');persist();if(dailyContextComplete()){state.dailyCheckIns=upsertDailyCheckIn(state.dailyCheckIns,context,{source:'person-confirmed'});state.dailyStories=upsertDailyStory(state.dailyStories,{stage:'check-in',signals:{...context}});state.humanModel=updateHumanModel(state.humanModel,{profile:state.profile,context,source:'today-signals'});persist();announceStatus('Today is understood.');return route('today',{history:'replace'});}announceStatus(`${t.textContent.trim()} selected for ${k}.`);return route('checkin',{history:'replace'});}try{unlockAudio();}catch(error){console.warn('Audio unlock skipped.',error)}try{vibrate();}catch(error){console.warn('Haptics skipped.',error)}if(t.dataset.adaptationLevel){const level=t.dataset.adaptationLevel;if(!state.current?.execution)return;state.current=setPhaseAdaptationChoice(state.current,state.current.execution.phaseIndex,level);persist();const phases=state.current.adjusted,phase=phases?.[state.current.execution.phaseIndex],guidance=buildPhaseGuidance({phase,practice:state.current.decision?.practice,context}),decisionForGuidance=buildGuidanceDecision({guidance,experience:state.profile?.experience,context}),choice=resolveAdaptationChoice({guidance,recommendedLevel:decisionForGuidance.appliedLevel||decisionForGuidance.requestedLevel,selectedLevel:level});document.querySelectorAll('[data-adaptation-level]').forEach(button=>{const selected=button.dataset.adaptationLevel===choice.appliedLevel;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',selected?'true':'false')});const card=document.querySelector('.guidance-recommendation'),text=document.querySelector('#active-guidance-text');if(card){card.dataset.activeAdaptation=choice.appliedLevel||'none';const label=card.querySelector('span');if(label)label.textContent=adaptationChoiceSummary(choice).toUpperCase();const note=card.querySelector('small');if(note)note.textContent='Your choice overrides today’s suggested level for this phase only.'}if(text)text.textContent=choice.text||'';if(state.settings.voice==='guided'&&choice.text)speak(choice.text,'guided',true);announceStatus(`${adaptationChoiceSummary(choice)} selected.`);return}if(t.dataset.guideSection){guideFocus=t.dataset.guideSection;return route('guide')}if(t.dataset.reflection)return saveReflection(t.dataset.reflection);if(t.dataset.structuredReflection){const outcome=state.outcomeRecords.find(item=>item.id===state.current?.outcomeRecordId);if(!outcome){alert('No outcome record is available.');return}const structured=createStructuredReflection({outcomeRecord:outcome,effect:document.getElementById('reflection-effect')?.value||'right',goalFit:document.getElementById('reflection-goal')?.value||'partial',burden:document.getElementById('reflection-burden')?.value||'moderate',surprise:document.getElementById('reflection-surprise')?.value||'none',confidence:document.getElementById('reflection-confidence')?.value||'medium',note:document.getElementById('reflection-note')?.value||''});const attribution=createOutcomeAttribution({reflection:structured,source:document.getElementById('attribution-source')?.value||'unclear',causalConfidence:document.getElementById('attribution-confidence')?.value||'low',externalFactors:(document.getElementById('attribution-factors')?.value||'').split(',')});state.structuredReflections=[structured,...(state.structuredReflections||[])].slice(0,200);state.outcomeAttributions=[attribution,...(state.outcomeAttributions||[])].slice(0,200);state.current={...(state.current||{}),structuredReflectionId:structured.id,outcomeAttributionId:attribution.id};persist();return saveReflection(structured.effect)}if(t.dataset.insightFeedback){const id=t.dataset.insightId,value=t.dataset.insightFeedback;if(value==='disagree'){selectedInsightId=id;return route('correctUnderstanding')}recordInsightFeedback(id,value);return route('understanding')}if(t.dataset.fallbackAction){const action=t.dataset.fallbackAction;const currentId=state.current?.fallbackPlanId;let index=state.fallbackPlans.findIndex(item=>item.id===currentId);if(action==='create'){const commitment=state.commitments.find(item=>item.id===state.current?.commitmentId),friction=state.frictionPlans.find(item=>item.id===state.current?.frictionPlanId),original=(decision||state.current?.decision)?.practice;if(!commitment||!original)return;const scope=prompt('Fallback type: reduced-duration, reduced-intensity, reduced-scope, or alternative-practice','reduced-duration')||'reduced-duration';const ratio=Math.max(.1,Math.min(1,Number(prompt('What fraction of the original practice?','0.5'))||.5));const fallback={...original,id:`${original.id}-fallback`,name:`${original.name} — reduced`};const plan=createFallbackPlan({commitment,frictionPlan:friction,originalPractice:original,fallbackPractice:fallback,scope,reductionRatio:ratio,reason:friction?.description||''});state.fallbackPlans=[plan,...(state.fallbackPlans||[])].slice(0,200);state.current={...(state.current||{}),fallbackPlanId:plan.id};persist();return route('judgement')}if(index<0)return;if(action==='accept')state.fallbackPlans[index]=acceptFallback(state.fallbackPlans[index]);if(action==='decline')state.fallbackPlans[index]=declineFallback(state.fallbackPlans[index]);persist();return route('judgement')}if(t.dataset.frictionType){const commitment=state.commitments.find(item=>item.id===state.current?.commitmentId);if(!commitment)return;const frictionType=t.dataset.frictionType,description=prompt('What specifically could get in the way?')||'',response=prompt('What will you do when that happens?',suggestedResponse(frictionType))||suggestedResponse(frictionType),fallback=prompt('Optional fallback: what is the smallest acceptable version?')||'';const plan=createFrictionPlan({commitment,frictionType,description,response,fallback});state.frictionPlans=[plan,...(state.frictionPlans||[])].slice(0,200);state.current={...(state.current||{}),frictionPlanId:plan.id};persist();return route('judgement')}if(t.dataset.commitmentAction){const action=t.dataset.commitmentAction;if(action==='cancel'){const id=state.current?.commitmentId,index=state.commitments.findIndex(item=>item.id===id);if(index>=0)state.commitments[index]=cancelCommitment(state.commitments[index],{reason:'person-cancelled'});delete state.current.commitmentId;persist();return rerenderJudgementAt('#commitment-panel')}const base=decision||state.current?.decision,choice=base?.personChoice;if(!choice){alert('Record an active choice before creating a commitment.');return}let startMode=action==='later'?'later':'now',startAfterMinutes=0,reason='';if(startMode==='later'){startAfterMinutes=Math.max(1,Math.min(1440,Number(prompt('How many minutes from now?','60'))||60));reason=prompt('Optional: what will help you begin then?')||'';}const commitment=createCommitment({judgement:base,choice,startMode,startAfterMinutes,reason});state.commitments=[commitment,...(state.commitments||[])].slice(0,200);state.current={...(state.current||{}),commitmentId:commitment.id};persist();return rerenderJudgementAt('#commitment-start')}if(t.dataset.understandingView){const view=t.dataset.understandingView;document.querySelectorAll('[data-understanding-view]').forEach(button=>{const active=button.dataset.understandingView===view;button.classList.toggle('active',active);button.setAttribute('aria-pressed',active?'true':'false')});document.querySelectorAll('[data-understanding-group]').forEach(section=>section.classList.toggle('is-hidden',section.dataset.understandingGroup!==view));announceStatus(`${t.textContent.trim()} understanding view selected.`);return}if(t.dataset.doseRevisionAction){const action=t.dataset.doseRevisionAction,proposalId=t.dataset.doseRevisionId;const evidence=practiceDoseEvidenceCandidates(state.history);const proposals=buildPracticeDoseRevisionProposals(evidence,state.practiceDoseEvidenceReviews,state.practiceDoseRevisionDecisions);const proposal=proposals.find(item=>item.id===proposalId);if(!proposal)return;state.practiceDoseRevisionDecisions=applyPracticeDoseRevisionDecision(state.practiceDoseRevisionDecisions,{proposal,action});persist();return route('understanding')}if(t.dataset.doseEvidenceAction){const action=t.dataset.doseEvidenceAction,evidenceId=t.dataset.doseEvidenceId;state.practiceDoseEvidenceReviews=applyPracticeDoseEvidenceReview(state.practiceDoseEvidenceReviews,{evidenceId,action});persist();return route('understanding')}if(t.dataset.contractRevisionAction){const action=t.dataset.contractRevisionAction,proposalId=t.dataset.contractRevisionId;const calibrations=practiceContractCalibrationCandidates(state.history);const proposals=buildPracticeContractRevisionProposals(calibrations,state.practiceContractCalibrationReviews,state.practiceContractRevisionDecisions);const proposal=proposals.find(item=>item.id===proposalId);if(!proposal)return;state.practiceContractRevisionDecisions=applyPracticeContractRevisionDecision(state.practiceContractRevisionDecisions,{proposal,action});persist();return route('understanding')}if(t.dataset.contractCalibrationAction){const action=t.dataset.contractCalibrationAction,calibrationId=t.dataset.contractCalibrationId;state.practiceContractCalibrationReviews=applyPracticeContractCalibrationReview(state.practiceContractCalibrationReviews,{calibrationId,action});persist();return route('understanding')}if(t.dataset.transferAction){const transferId=t.dataset.transferId,note=prompt('Why should this pattern not generalise here?')||'';state.patternTransfers=rejectTransferRecord(state.patternTransfers,{transferId,note});persist();return route('understanding')}if(t.dataset.outcomePatternAction){const patternId=t.dataset.patternId,note=prompt('What makes this pattern misleading?')||'';state.outcomePatterns=rejectOutcomePattern(state.outcomePatterns,{patternId,note});persist();return route('understanding')}if(t.dataset.adaptationPatternAction){const action=t.dataset.adaptationPatternAction,patternId=t.dataset.adaptationPatternId;const rawPatterns=adaptationPatternCandidates(state.history);const reviewedPatterns=attachAdaptationReconfirmation(mergeAdaptationPatternReviews(rawPatterns,state.adaptationPatternReviews),state.history);const targetPattern=reviewedPatterns.find(pattern=>pattern.id===patternId);if(action==='confirm'&&targetPattern&&!canConfirmAdaptationPattern(targetPattern,state.history)){announceStatus(targetPattern.reconfirmation.statement);return}let note='';if(action==='reject')note=prompt('What makes this adaptation pattern misleading?')||'';state.adaptationPatternReviews=applyAdaptationPatternReview(state.adaptationPatternReviews,{patternId,action,note});persist();return route('understanding')}if(t.dataset.preferenceAction){const action=t.dataset.preferenceAction,preferenceId=t.dataset.preferenceId;let note='';if(action==='reject')note=prompt('What did Strategos misunderstand about this preference?')||'';state.preferenceModel=applyPreferenceCorrection(state.preferenceModel,{preferenceId,action,note});persist();return route('understanding')}if(t.dataset.choiceAction){const action=t.dataset.choiceAction,selectedPracticeId=t.dataset.choicePractice||null;if(action==='accept')return completePersonChoice({action,selectedPracticeId,reason:''});pendingChoice={action,selectedPracticeId};route('judgement',{history:'none',preserveScroll:true});requestAnimationFrame(()=>requestAnimationFrame(()=>document.querySelector('#choice-reason-panel')?.scrollIntoView({behavior:'smooth',block:'center'})));return}if(t.dataset.choiceReasonAction){if(t.dataset.choiceReasonAction==='cancel'){pendingChoice=null;return route('judgement',{history:'none',preserveScroll:true})}const reason=document.querySelector('#choice-reason')?.value.trim()||'';const choice=pendingChoice;pendingChoice=null;if(!choice)return route('judgement');return completePersonChoice({...choice,reason})}if(t.dataset.learningAction){const status=t.dataset.learningAction,advisor=t.dataset.learningAdvisor,learningId=t.dataset.learningId;let correction='';if(status==='rejected')correction=prompt('What did Strategos misunderstand? This correction will stop the learning from influencing future judgements.')||'';state.advisorMemories=updateLearningStatus(state.advisorMemories,{advisor,learningId,status,correction});state.understandingModel ||= {feedback:{},changes:[]};state.understandingModel.changes ||= [];state.understandingModel.changes.unshift({id:`learning-change-${Date.now()}`,at:new Date().toISOString(),title:status==='confirmed'?'Advisor learning confirmed':status==='rejected'?'Advisor learning corrected':'Advisor learning reopened',note:correction||`${advisor} learning is now ${status}.`});state.understandingModel.changes=state.understandingModel.changes.slice(0,50);if(status==='rejected'){const event=createCorrectionEvent({type:'learning-rejection',sourceId:learningId,note:correction||'Advisor learning rejected by the person.'});const impact=determineCorrectionImpact(state,event);state=applyCorrectionImpact(state,event,impact);}persist();return route('understanding')}if(t.dataset.emotionalJournalAction){const action=t.dataset.emotionalJournalAction,entryId=t.dataset.emotionalJournalId||null;if(action==='follow-up'){const outcome=t.dataset.emotionalJournalOutcome,note=document.querySelector('#emotional-follow-up-note')?.value||'';state.emotionalJournalEntries=state.emotionalJournalEntries.map(entry=>entry.id===entryId?applyEmotionalJournalFollowUp(entry,{outcome,note}):entry);persist();return route('emotionalJournal',{history:'none',preserveScroll:true})}if(action==='follow-up-reopen'){state.emotionalJournalEntries=state.emotionalJournalEntries.map(entry=>entry.id===entryId?reopenEmotionalJournalFollowUp(entry):entry);persist();return route('emotionalJournal',{history:'none',preserveScroll:true})}if(action==='theme'){const theme=t.dataset.emotionalJournalTheme;state.emotionalJournalEntries=state.emotionalJournalEntries.map(entry=>entry.id===entryId?toggleEmotionalJournalTheme(entry,theme):entry);persist();return route('emotionalJournal',{history:'none',preserveScroll:true})}if(action==='edit'){state.currentEmotionalJournalEntryId=entryId;persist();return route('emotionalJournal')}if(action==='save'){const text=document.querySelector('#emotional-journal-text')?.value||'';if(!text.trim()){settingsNotice='Write something before saving, or skip for now.';return route('emotionalJournal')}const existing=entryId?state.emotionalJournalEntries.find(entry=>entry.id===entryId):null;const entry=existing?updateEmotionalJournalEntry(existing,{text}):createEmotionalJournalEntry({text});state.emotionalJournalEntries=upsertEmotionalJournalEntry(state.emotionalJournalEntries,entry);state.dailyStories=closeDailyStory(state.dailyStories,{written:true});delete state.currentEmotionalJournalEntryId;persist();announceStatus('Private reflection saved.');return route('journey')}if(action==='delete'){state.emotionalJournalEntries=deleteEmotionalJournalEntry(state.emotionalJournalEntries,entryId);delete state.currentEmotionalJournalEntryId;persist();announceStatus('Private reflection deleted.');return route('journey')}}if(t.dataset.explainReviewAction){const action=t.dataset.explainReviewAction,judgementId=t.dataset.explainJudgementId,note=document.querySelector('#explain-review-note')?.value.trim()||'';const updateRecord=record=>applyExplainRecordReview(record,{action,note});state.judgements=(state.judgements||[]).map(item=>item.id===judgementId?{...item,explainRecord:updateRecord(item.explainRecord)}:item);if(state.current?.decision?.id===judgementId){state.current={...state.current,decision:{...state.current.decision,explainRecord:updateRecord(state.current.decision.explainRecord)}};decision=state.current.decision}state.history=(state.history||[]).map(entry=>entry?.decision?.id===judgementId?{...entry,decision:{...entry.decision,explainRecord:updateRecord(entry.decision.explainRecord)},explainRecord:updateRecord(entry.explainRecord||entry.decision?.explainRecord)}:entry);persist();return route('understanding')}if(t.dataset.runtimeSafetyAction){const action=t.dataset.runtimeSafetyAction;state.current.safetyEvents=Array.isArray(state.current?.safetyEvents)?state.current.safetyEvents:[];if(action==='raise'){if(!activeSafetyInterruption(state.current.safetyEvents)){const currentDecision=decision||state.current?.decision;state.current.safetyEvents=[createSafetyInterruption({judgementId:currentDecision?.id,practiceId:currentDecision?.practice?.id,phaseIndex:state.current?.execution?.phaseIndex||0}),...state.current.safetyEvents];state.current.execution=pauseExecution(state.current.execution);persist();playTone('pause',state.settings.sound);announceStatus('Practice paused for a safety concern.')}return runPhase(state.current.adjusted,{announce:false})}const active=activeSafetyInterruption(state.current.safetyEvents);if(!active)return;if(action==='resume'){state.current.safetyEvents=state.current.safetyEvents.map(item=>item.id===active.id?resolveSafetyInterruption(item,{action:'resume'}):item);state.current.execution=resumeExecution(state.current.execution);persist();announceStatus('Safety concern resolved. Practice resumed.');return runPhase(state.current.adjusted,{announce:true})}if(action==='end'){state.current.safetyEvents=state.current.safetyEvents.map(item=>item.id===active.id?resolveSafetyInterruption(item,{action:'end'}):item);persist();return abandonPractice('safety-concern')}}if(t.dataset.settingToggle){
  const k=t.dataset.settingToggle;
  if(k==='haptics'&&!supportsHaptics()){state.settings.haptics=false;settingsNotice='Physical haptics are not supported by this iPhone browser.';persist();return route('settings')}
  if(k==='keepAwake'&&!supportsWakeLock()){state.settings.keepAwake=false;settingsNotice='Screen Wake Lock is not supported by this browser.';persist();return route('settings')}
  state.settings[k]=!state.settings[k];persist();
  if(k==='haptics'&&state.settings.haptics)navigator.vibrate([18,35,18]);
  if(k==='keepAwake'){
    if(state.settings.keepAwake&&state.current?.execution?.status===EXECUTION_STATUS.ACTIVE)requestWakeLock();
    else if(!state.settings.keepAwake)releaseWakeLock();
  }
  return route('settings')
}if(t.dataset.beliefAction){state.beliefs=reviewBelief(reconcileBeliefs(state.beliefs,state.outcomeLedger),t.dataset.beliefId,{action:t.dataset.beliefAction});persist();return route('understanding')}if(t.dataset.safetyAction==='acknowledge'){const activeDecision=decision||state.current?.decision;const envelope=activeDecision?.safetyEnvelope||buildSafetyEnvelope({context:activeDecision?.context||context,decision:activeDecision});state.current={...(state.current||{}),safetyAcknowledgement:createSafetyAcknowledgement({envelope,judgementId:activeDecision?.id})};persist();return rerenderJudgementAt('#commitment-panel')}if(t.dataset.humanModelPromotionAction){const candidate=humanModelFactCandidates(state.humanModel).find(item=>item.id===t.dataset.humanModelPromotionId);if(candidate){state.humanModel=applyHumanModelFactPromotion(state.humanModel,{candidate,action:t.dataset.humanModelPromotionAction});persist()}return route('understanding')}if(t.dataset.humanModelAction){const action=t.dataset.humanModelAction,evidenceId=t.dataset.humanModelEvidenceId;if(action==='correct'){selectedHumanModelEvidenceId=evidenceId;return route('humanModelCorrection')}state.humanModel=applyHumanModelEvidenceReview(state.humanModel,{evidenceId,action});persist();return route('understanding')}if(t.dataset.settingChoice){state.settings[t.dataset.settingChoice]=t.dataset.value;persist();return route('settings')}const a=t.dataset.action;if(a==='checkin'||a==='focus-signals')return route('checkin');if(a==='begin'){const destination=resolveStartupDestination(state);return route(destination.route)}if(a==='onboarding-next'){onboardingStep=Math.min(2,onboardingStep+1);return route('onboarding')}if(a==='onboarding-complete'){state.profile=normaliseProfile({...state.profile,name:document.querySelector('#onboarding-name')?.value.trim()||onboardingDraft.name||state.profile?.name||'Friend'});state.humanModel=createHumanModel({profile:state.profile});state.onboardingVersion=ONBOARDING_VERSION;persist();return route('checkin')}if(a==='save-weekly-intention'){const review=buildWeeklyReview(state);const choice=document.querySelector('#weekly-intention-choice')?.value||'';const note=document.querySelector('#weekly-intention-note')?.value||'';const intention=createWeeklyIntention({weekId:review.id,choice,note});if(!intention){announceStatus('Choose a direction and add text when using a custom direction.');return}state.weeklyIntentions=upsertWeeklyIntention(state.weeklyIntentions,intention);persist();announceStatus('Weekly direction saved.');return route('journey')}if(a==='edit-weekly-intention'){state.weeklyIntentions=clearWeeklyIntention(state.weeklyIntentions,buildWeeklyReview(state).id);persist();return route('journey')}if(a==='clear-weekly-intention'){state.weeklyIntentions=clearWeeklyIntention(state.weeklyIntentions,buildWeeklyReview(state).id);persist();announceStatus('Weekly direction cleared.');return route('journey')}if(a==='preserve-weekly-review'){const review=buildWeeklyReview(state);state.weeklyReviews=preserveWeeklyReview(state.weeklyReviews,review);persist();announceStatus('Weekly review preserved.');return route('journey')}if(a==='eveningReflection')return route('eveningReflection');if(a==='save-evening-reflection'){const text=document.querySelector('#evening-reflection-text')?.value.trim()||'';if(!text){announceStatus('Write one sentence or close without writing.');return}const existing=emotionalJournalToday(state.emotionalJournalEntries,localDayKey());const entry=existing?updateEmotionalJournalEntry(existing,{text}):createEmotionalJournalEntry({text,entryDate:localDayKey()});state.emotionalJournalEntries=upsertEmotionalJournalEntry(state.emotionalJournalEntries,entry);state.dailyStories=closeDailyStory(state.dailyStories,{written:true});persist();announceStatus('Today is preserved.');return route('today')}if(a==='skip-evening-reflection'){state.dailyStories=closeDailyStory(state.dailyStories,{skipped:true});persist();announceStatus('Today is closed.');return route('today')}if(a==='morning-context')return route('checkin');if(a==='save-daily-context'){if(!dailyContextComplete()){announceStatus('Complete all six signals first.');return}state.dailyCheckIns=upsertDailyCheckIn(state.dailyCheckIns,context,{source:'person-confirmed'});state.dailyStories=upsertDailyStory(state.dailyStories,{stage:'check-in',signals:{...context}});state.humanModel=updateHumanModel(state.humanModel,{profile:state.profile,context,source:'today-signals'});persist();announceStatus('Today’s context is recorded.');return route('today')}if(a==='currentJudgement')return route('judgement');if(a==='reset-today-signals'){context=todaySignals([],new Date());state.dailyCheckIns=(state.dailyCheckIns||[]).filter(item=>item?.day!==localDayKey());persist();announceStatus('Today’s signals reset.');return route('today')}if(a==='continue-flow'){const destination=resolveContinuityDestination(state);return route(destination.route)}if(a==='consult'){const gate=evidenceGate({checkIns:state.dailyCheckIns,judgements:state.judgements});if(!gate.canDeliberate){context=gate.context.signals;announceStatus('Tell Strategos how you are arriving today first.');return route('checkin')}state.dailyCheckIns=upsertDailyCheckIn(state.dailyCheckIns,context,{source:'agora'});state.dailyStories=upsertDailyStory(state.dailyStories,{stage:'judgement',signals:{...context}});state.humanModel=updateHumanModel(state.humanModel,{profile:state.profile,context,source:'today-signals'});persist();return route('thinking')}if(a==='save-human-model-correction'){const note=document.querySelector('#human-model-correction-note')?.value.trim()||'';state.humanModel=applyHumanModelEvidenceReview(state.humanModel,{evidenceId:selectedHumanModelEvidenceId,action:'reject',note});selectedHumanModelEvidenceId=null;persist();return route('understanding')}if(a==='save-correction'){const note=document.querySelector('#correction-note')?.value.trim()||'';recordInsightFeedback(selectedInsightId,'disagree',note);selectedInsightId=null;return route('understanding');}if(a==='save-profile'){state.profile=normaliseProfile({name:document.querySelector('#settings-profile-name')?.value,age:document.querySelector('#settings-profile-age')?.value,heightCm:document.querySelector('#settings-profile-height')?.value,weightKg:document.querySelector('#settings-profile-weight')?.value,experience:document.querySelector('#settings-profile-experience')?.value,limitations:document.querySelector('#settings-profile-limitations')?.value});state.humanModel=normaliseHumanModel(state.humanModel,{profile:state.profile});persist();settingsNotice='Your profile was updated locally.';return route('settings')}if(a==='preview-voice')return previewVoice();if(a==='speak-judgement'){const d=decision||state.current?.decision;if(d)return speak(`Here is my current judgement. ${d.judgement} ${d.explain?.confidenceStatement||''}`, 'guided', true);}if(a==='commit'){const currentDecision=decision||state.current?.decision;if(!['accepted','overridden'].includes(currentDecision?.status)){alert('Record your choice before beginning the practice.');return}const activeSafetyEnvelope=currentDecision?.safetyEnvelope||buildSafetyEnvelope({context:currentDecision?.context||context,decision:currentDecision});const activeSafetyGate=safetyStartGate({envelope:activeSafetyEnvelope,acknowledgement:state.current?.safetyAcknowledgement,judgementId:currentDecision?.id});if(!activeSafetyGate.canStart){return rerenderJudgementAt('#commitment-panel')}const index=state.commitments.findIndex(item=>item.id===state.current?.commitmentId);if(index<0){alert('Create a voluntary start window before beginning.');return}const availability=commitmentAvailability(state.commitments[index]);if(!availability.canStart){alert(availability.reason);return}const friction=state.frictionPlans.find(item=>item.id===state.current?.frictionPlanId),frictionGate=canBeginWithFriction(state.commitments[index],friction);if(!frictionGate.canBegin){alert(frictionGate.reason);return}state.commitments[index]=markCommitmentStarted(state.commitments[index]);const fallbackIndex=state.fallbackPlans.findIndex(item=>item.id===state.current?.fallbackPlanId);if(fallbackIndex>=0&&state.fallbackPlans[fallbackIndex].status==='accepted'){state.fallbackPlans[fallbackIndex]=startFallback(state.fallbackPlans[fallbackIndex]);const fp=state.fallbackPlans[fallbackIndex],original=state.current?.decision?.practice;state.current={...(state.current||{}),usingFallback:true,originalPractice:original,decision:{...state.current.decision,practice:{...original,id:fp.fallbackPracticeId,name:`${original.name} — reduced`},mission:{...original,id:fp.fallbackPracticeId,name:`${original.name} — reduced`}}};decision=state.current.decision;}persist();return route('execute');}if(a==='pause')return togglePause();if(a==='next-phase')return advancePhase(1);if(a==='previous-phase')return advancePhase(-1);if(a==='resume-practice'){state.current.execution=resumeExecution(state.current.execution);persist();requestWakeLock();return runPhase(state.current.adjusted,{announce:true})}if(a==='end-interrupted'){practiceExitSource='interrupted';return route('practiceExit',{history:'none'})}if(a==='discard-interrupted'){practiceExitSource='interrupted';return route('practiceExit',{history:'none'})}if(a==='abandon'){practiceExitSource='active';return route('practiceExit',{history:'none'})}if(a==='continue-practice'){state.current.execution=resumeExecution(state.current.execution);persist();requestWakeLock();return runPhase(state.current.adjusted,{announce:true})}if(a==='record-practice-exit')return abandonPractice(practiceExitSource==='interrupted'?'interrupted-ended':'person-ended');if(a==='discard-practice-session')return discardPracticeSession(practiceExitSource==='interrupted'?'interrupted-discarded':'person-discarded');if(['today','understanding','journey','settings'].includes(a))return route(a);if(a==='export-state')return exportState();if(a==='import-state'){document.querySelector('#state-import-file')?.click();return}if(a==='replay-onboarding'){onboardingStep=0;onboardingDraft={...normaliseProfile(state.profile)};return route('onboarding')}if(a==='reset'){if(!confirm('Erase all Strategos data from this browser? A local backup will be kept.'))return;const result=resetState();if(!result.ok){setNotice(result.error);return route('settings')}state=reconcileLoadedState(loadState());context=todaySignals(state.dailyCheckIns);decision=null;settingsNotice='Strategos data was erased. A local recovery backup was retained.';onboardingStep=0;return route('splash')}});
app.addEventListener('change',e=>{if(e.target?.id==='state-import-file')importStateFile(e.target.files?.[0])});
document.addEventListener('visibilitychange',()=>{const active=state.current?.execution?.status===EXECUTION_STATUS.ACTIVE;if(document.visibilityState==='visible'&&active&&state.settings.keepAwake)requestWakeLock();else if(document.visibilityState!=='visible')releaseWakeLock()});try{
  window.history.replaceState({strategosRoute:'splash'},'',location.pathname+location.search);
  route('splash',{history:'none'});
}catch(error){
  console.error(error);
  shell(`<section class="stack center"><p class="eyebrow">STRATEGOS</p><h2>Unable to start.</h2><p class="muted">Refresh the page.</p></section>`)
}
