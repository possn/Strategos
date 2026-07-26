const VALID_LEVELS=new Set(['regression','technique','progression']);
const SUPPORTIVE_FITS=new Set(['better','right']);
const MAX_AGE_DAYS=180;
const MIN_OBSERVATIONS=3;

export function deriveAdaptationPatterns(history=[],now=Date.now()){
  const cutoff=now-MAX_AGE_DAYS*86400000;
  const groups=new Map();

  for(const entry of history||[]){
    const accountability=entry?.adaptationAccountability;
    const at=Date.parse(accountability?.at||entry?.completedAt||'');
    if(!Number.isFinite(at)||at<cutoff)continue;
    if(!SUPPORTIVE_FITS.has(accountability?.fit))continue;

    const practiceId=entry?.decision?.practice?.id||entry?.outcomeRecord?.executedPracticeId||null;
    if(!practiceId)continue;

    for(const choice of accountability?.choices||[]){
      if(!VALID_LEVELS.has(choice?.level))continue;
      const phaseName=String(choice.phaseName||`Phase ${Number(choice.phaseIndex)+1}`);
      const key=[practiceId,phaseName,choice.level].join('|');
      const current=groups.get(key)||{
        id:`adaptation-pattern-${slug(key)}`,
        key,
        practiceId,
        phaseName,
        level:choice.level,
        observations:[],
        supportive:0,
        better:0,
        right:0,
        firstObservedAt:null,
        lastObservedAt:null,
        status:'insufficient',
        influence:0
      };
      current.observations.push({
        historyId:entry.id||entry.judgementId||`${practiceId}-${at}`,
        at:new Date(at).toISOString(),
        fit:accountability.fit
      });
      current.supportive+=1;
      current.better+=accountability.fit==='better'?1:0;
      current.right+=accountability.fit==='right'?1:0;
      current.firstObservedAt=current.firstObservedAt&&Date.parse(current.firstObservedAt)<at
        ?current.firstObservedAt:new Date(at).toISOString();
      current.lastObservedAt=current.lastObservedAt&&Date.parse(current.lastObservedAt)>at
        ?current.lastObservedAt:new Date(at).toISOString();
      groups.set(key,current);
    }
  }

  return [...groups.values()]
    .map(finalisePattern)
    .sort((a,b)=>Date.parse(b.lastObservedAt||0)-Date.parse(a.lastObservedAt||0));
}

export function adaptationPatternCandidates(history=[],now=Date.now()){
  return deriveAdaptationPatterns(history,now).filter(pattern=>pattern.status==='candidate');
}

export function adaptationPatternSummary(pattern){
  if(!pattern)return 'No adaptation pattern.';
  const label=pattern.level==='regression'?'easier'
    :pattern.level==='progression'?'harder':'standard';
  return `${label} version selected in ${pattern.phaseName} across ${pattern.supportive} comparable Practices.`;
}

export function adaptationPatternAudit(history=[],now=Date.now()){
  const patterns=deriveAdaptationPatterns(history,now);
  return {
    total:patterns.length,
    candidate:patterns.filter(item=>item.status==='candidate').length,
    insufficient:patterns.filter(item=>item.status==='insufficient').length,
    influential:0,
    statement:patterns.some(item=>item.status==='candidate')
      ?'Repeated adaptation choices are visible for review but do not yet influence judgement.'
      :'No repeated adaptation choice has enough comparable evidence yet.'
  };
}

function finalisePattern(pattern){
  const uniqueSessions=new Set(pattern.observations.map(item=>item.historyId)).size;
  const status=uniqueSessions>=MIN_OBSERVATIONS?'candidate':'insufficient';
  return {
    ...pattern,
    uniqueSessions,
    status,
    influence:0,
    eligibleForJudgementInfluence:false,
    evidenceBoundary:`Minimum ${MIN_OBSERVATIONS} supportive observations within ${MAX_AGE_DAYS} days.`
  };
}

function slug(value){
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}


/* v0.18.1 — review governance consolidated to avoid a new runtime module dependency */
const REVIEW_ACTIONS=new Set(['confirm','reject','reopen']);

export function applyAdaptationPatternReview(reviews=[],{
  patternId,
  action,
  note='',
  at=new Date().toISOString()
}={}){
  if(!patternId||!REVIEW_ACTIONS.has(action))return [...(reviews||[])];

  const status=action==='confirm'
    ?'confirmed'
    :action==='reject'
      ?'rejected'
      :'candidate';

  const previous=adaptationPatternReviewFor(reviews,patternId);
  const next={
    patternId,
    status,
    note:String(note||'').trim(),
    reviewedAt:at,
    source:'person',
    judgementInfluence:0,
    revalidationRequired:action==='reopen'
      ?Boolean(previous&&['confirmed','rejected'].includes(previous.status))
      :false
  };

  return [
    next,
    ...(reviews||[]).filter(item=>item?.patternId!==patternId)
  ].slice(0,200);
}

export function adaptationPatternReviewFor(reviews=[],patternId){
  return (reviews||[]).find(item=>item?.patternId===patternId)||null;
}

export function mergeAdaptationPatternReviews(patterns=[],reviews=[]){
  return (patterns||[]).map(pattern=>{
    const review=adaptationPatternReviewFor(reviews,pattern.id);
    return {
      ...pattern,
      review,
      reviewStatus:review?.status||pattern.status,
      revalidationRequired:Boolean(review?.revalidationRequired),
      personConfirmed:review?.status==='confirmed',
      personRejected:review?.status==='rejected',
      influence:0,
      eligibleForJudgementInfluence:false
    };
  });
}

export function adaptationPatternReviewAudit(patterns=[],reviews=[]){
  const merged=mergeAdaptationPatternReviews(patterns,reviews);
  return {
    candidate:merged.filter(item=>item.reviewStatus==='candidate').length,
    confirmed:merged.filter(item=>item.reviewStatus==='confirmed').length,
    rejected:merged.filter(item=>item.reviewStatus==='rejected').length,
    influential:0,
    statement:'Review changes accountability status only. Adaptation patterns still have no judgement influence.'
  };
}

export function adaptationPatternReviewSummary(pattern){
  if(!pattern)return 'No review available.';
  if(pattern.reviewStatus==='confirmed'){
    return 'Confirmed by you as a recurring in-session choice.';
  }
  if(pattern.reviewStatus==='rejected'){
    return pattern.review?.note
      ?`Rejected by you: ${pattern.review.note}`
      :'Rejected by you as a misleading pattern.';
  }
  return 'Awaiting your review.';
}

export function reconcileAdaptationPatternReviews(reviews=[],patterns=[]){
  const known=new Set((patterns||[]).map(item=>item.id));
  const seen=new Set();
  return (reviews||[]).filter(item=>{
    if(!item?.patternId||seen.has(item.patternId))return false;
    seen.add(item.patternId);
    return known.has(item.patternId);
  }).map(item=>({
    patternId:item.patternId,
    status:['candidate','confirmed','rejected'].includes(item.status)?item.status:'candidate',
    note:String(item.note||''),
    reviewedAt:item.reviewedAt||null,
    source:'person',
    judgementInfluence:0,
    revalidationRequired:Boolean(item.revalidationRequired)
  }));
}


/* v0.18.3 — confirmed patterns may shape only the initial in-Practice guidance level */
export function resolveConfirmedAdaptationDefault({
  history=[],
  reviews=[],
  practiceId=null,
  phaseName='',
  availableLevels=[],
  contextRecommendedLevel='technique',
  now=Date.now()
}={}){
  if(!practiceId||!phaseName)return emptyDefault();

  const merged=mergeAdaptationPatternReviews(
    adaptationPatternCandidates(history,now),
    reviews
  ).filter(pattern=>
    pattern.reviewStatus==='confirmed' &&
    pattern.practiceId===practiceId &&
    pattern.phaseName===phaseName &&
    availableLevels.includes(pattern.level)
  );

  if(!merged.length)return emptyDefault();

  const levels=[...new Set(merged.map(pattern=>pattern.level))];
  if(levels.length!==1){
    return {
      ...emptyDefault(),
      conflict:true,
      reason:'Conflicting confirmed adaptation patterns require person review.'
    };
  }

  const pattern=[...merged].sort((a,b)=>{
    if(b.supportive!==a.supportive)return b.supportive-a.supportive;
    return Date.parse(b.lastObservedAt||0)-Date.parse(a.lastObservedAt||0);
  })[0];
  const health=assessConfirmedDefaultHealth(history,pattern.id);

  if(health.suspended){
    return {
      ...emptyDefault(),
      suspended:true,
      pattern,
      health,
      reason:health.reason
    };
  }

  if(contextRecommendedLevel==='regression'&&pattern.level==='progression'){
    return {
      ...emptyDefault(),
      safetyBlocked:true,
      pattern,
      reason:'Today’s safety signals take precedence over the confirmed harder pattern.'
    };
  }

  return {
    level:pattern.level,
    source:'confirmed-pattern',
    pattern,
    applied:true,
    conflict:false,
    safetyBlocked:false,
    suspended:false,
    health,
    reason:`Based on a choice you confirmed across ${pattern.uniqueSessions} comparable Practices.`
  };
}

export function confirmedAdaptationDefaultSummary(result){
  if(!result?.applied)return result?.reason||'No confirmed adaptation default applies.';
  const label=result.level==='regression'?'Easier'
    :result.level==='progression'?'Harder':'Standard';
  return `${label} is the starting version because you confirmed this recurring choice. You can change it for this phase.`;
}

function emptyDefault(){
  return {
    level:null,
    source:null,
    pattern:null,
    applied:false,
    conflict:false,
    safetyBlocked:false,
    suspended:false,
    health:null,
    reason:null
  };
}


/* v0.18.4 — confirmed-default outcome accountability */
export function confirmedDefaultOutcomeHistory(history=[],patternId,limit=3){
  if(!patternId)return [];
  return (history||[])
    .flatMap(entry=>{
      const accountability=entry?.adaptationAccountability;
      return (accountability?.choices||[])
        .filter(choice=>choice?.source==='confirmed-pattern'&&choice?.patternId===patternId)
        .map(choice=>({
          historyId:entry.id||entry.judgementId||null,
          at:accountability?.at||entry.completedAt||null,
          fit:accountability?.fit||'unknown',
          reflection:accountability?.reflectionValue||entry.reflection||'unknown',
          phaseName:choice.phaseName,
          level:choice.level
        }));
    })
    .filter(item=>Number.isFinite(Date.parse(item.at||'')))
    .sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))
    .slice(0,Math.max(1,limit));
}

export function assessConfirmedDefaultHealth(history=[],patternId){
  const recent=confirmedDefaultOutcomeHistory(history,patternId,3);
  const consecutiveWorse=recent.filter((item,index)=>index<2&&item.fit==='worse').length===2;
  const worseCount=recent.filter(item=>item.fit==='worse').length;
  const suspended=consecutiveWorse||worseCount>=2;

  return {
    patternId,
    recent,
    uses:recent.length,
    worseCount,
    suspended,
    status:suspended?'review-required':recent.length?'observed':'untested',
    reason:suspended
      ?'This confirmed default is paused because recent comparable uses were assessed as worse than the suggested level.'
      :recent.length
        ?'Recent outcomes do not require this confirmed default to be paused.'
        :'This confirmed default has not yet been evaluated in use.'
  };
}

export function recordConfirmedAdaptationDefault(current,{
  phaseIndex,
  phaseName,
  level,
  patternId,
  appliedAt=new Date().toISOString()
}={}){
  if(!current||!Number.isInteger(Number(phaseIndex))||!patternId)return current;
  const defaults={...(current.confirmedAdaptationDefaults||{})};
  const key=String(Number(phaseIndex));
  if(defaults[key]?.patternId===patternId&&defaults[key]?.level===level)return current;
  defaults[key]={
    phaseIndex:Number(phaseIndex),
    phaseName:String(phaseName||`Phase ${Number(phaseIndex)+1}`),
    level,
    patternId,
    appliedAt,
    source:'confirmed-pattern'
  };
  return {...current,confirmedAdaptationDefaults:defaults};
}


/* v0.18.6 — visible review state for suspended confirmed defaults */
export function attachConfirmedDefaultHealth(patterns=[],history=[]){
  return (patterns||[]).map(pattern=>{
    const health=pattern.reviewStatus==='confirmed'
      ?assessConfirmedDefaultHealth(history,pattern.id)
      :null;
    return {
      ...pattern,
      confirmedDefaultHealth:health,
      effectiveStatus:health?.suspended?'review-required':pattern.reviewStatus
    };
  });
}

export function confirmedDefaultHealthSummary(pattern){
  const health=pattern?.confirmedDefaultHealth;
  if(!health)return 'This pattern has not been used as a confirmed default.';
  if(health.suspended){
    return `${health.worseCount} of the recent comparable uses were assessed as worse. Automatic use is paused.`;
  }
  if(health.status==='untested'){
    return 'Confirmed, but not yet evaluated as an automatic starting version.';
  }
  return `${health.uses} recent automatic use${health.uses===1?'':'s'} reviewed; no pause is required.`;
}

export function confirmedDefaultRecentOutcomes(pattern){
  return (pattern?.confirmedDefaultHealth?.recent||[]).map(item=>({
    ...item,
    label:item.fit==='better'?'Better than suggested'
      :item.fit==='right'?'About right'
        :item.fit==='worse'?'Worse than suggested'
          :'Not assessed'
  }));
}


/* v0.18.8 — adaptation accountability audit trace */
export function buildAdaptationAuditTrace({
  history=[],
  reviews=[],
  now=Date.now()
}={}){
  const raw=adaptationPatternCandidates(history,now);
  const reviewed=mergeAdaptationPatternReviews(raw,reviews);
  const governed=attachConfirmedDefaultHealth(reviewed,history);

  return governed.map(pattern=>{
    const review=pattern.review||null;
    const automaticUses=confirmedDefaultOutcomeHistory(history,pattern.id,12);
    const events=[
      {
        type:'candidate-formed',
        at:pattern.lastObservedAt,
        title:'Candidate formed',
        detail:`${pattern.uniqueSessions} supportive comparable sessions.`
      },
      ...(review?[{
        type:`person-${review.status}`,
        at:review.reviewedAt,
        title:review.status==='confirmed'?'Confirmed by person':review.status==='rejected'?'Rejected by person':'Returned to candidate',
        detail:review.note||'Person review recorded.'
      }]:[]),
      ...automaticUses.map(use=>({
        type:'automatic-use',
        at:use.at,
        title:'Confirmed default used',
        detail:`${use.phaseName}: ${use.level}; fit ${use.fit}.`
      })),
      ...(pattern.confirmedDefaultHealth?.suspended?[{
        type:'automatic-pause',
        at:pattern.confirmedDefaultHealth.recent?.[0]?.at||pattern.lastObservedAt,
        title:'Automatic use paused',
        detail:pattern.confirmedDefaultHealth.reason
      }]:[])
    ]
      .filter(event=>Number.isFinite(Date.parse(event.at||'')))
      .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));

    return {
      patternId:pattern.id,
      practiceId:pattern.practiceId,
      phaseName:pattern.phaseName,
      level:pattern.level,
      reviewStatus:pattern.reviewStatus,
      effectiveStatus:pattern.effectiveStatus,
      currentInfluence:pattern.confirmedDefaultHealth?.suspended?'paused in Practice':'bounded to same Practice phase',
      judgementInfluence:0,
      events
    };
  }).sort((a,b)=>{
    const aAt=a.events.at(-1)?.at||'';
    const bAt=b.events.at(-1)?.at||'';
    return Date.parse(bAt||0)-Date.parse(aAt||0);
  });
}

export function adaptationAuditTraceSummary(trace=[]){
  const paused=(trace||[]).filter(item=>item.effectiveStatus==='review-required').length;
  const confirmed=(trace||[]).filter(item=>item.reviewStatus==='confirmed').length;
  return {
    total:(trace||[]).length,
    confirmed,
    paused,
    judgementInfluence:0,
    statement:(trace||[]).length
      ?`${trace.length} adaptation lineage${trace.length===1?'':'s'} preserved; ${paused} paused; none influence judgement selection.`
      :'No adaptation lineage exists yet.'
  };
}


/* v0.18.9 — fresh evidence is required after a pattern is reopened */
export function adaptationReconfirmationGate(pattern,history=[],minimum=2){
  if(!pattern?.revalidationRequired){
    return {
      required:false,
      eligible:true,
      supportiveAfterReview:0,
      minimum,
      remaining:0,
      statement:'No fresh-evidence gate applies.'
    };
  }

  const since=Date.parse(pattern.review?.reviewedAt||'');
  if(!Number.isFinite(since)){
    return {
      required:true,
      eligible:false,
      supportiveAfterReview:0,
      minimum,
      remaining:minimum,
      statement:`${minimum} new supportive uses are required before reconfirmation.`
    };
  }

  const supportiveAfterReview=(history||[]).filter(entry=>{
    const accountability=entry?.adaptationAccountability;
    const at=Date.parse(accountability?.at||entry?.completedAt||'');
    const practiceId=entry?.decision?.practice?.id||entry?.outcomeRecord?.executedPracticeId||null;
    if(!Number.isFinite(at)||at<=since||practiceId!==pattern.practiceId)return false;
    if(!SUPPORTIVE_FITS.has(accountability?.fit))return false;
    return (accountability?.choices||[]).some(choice=>
      choice?.source==='person' &&
      choice?.phaseName===pattern.phaseName &&
      choice?.level===pattern.level
    );
  }).length;

  const eligible=supportiveAfterReview>=minimum;
  const remaining=Math.max(0,minimum-supportiveAfterReview);
  return {
    required:true,
    eligible,
    supportiveAfterReview,
    minimum,
    remaining,
    statement:eligible
      ?`${supportiveAfterReview} new supportive uses allow reconfirmation.`
      :`${remaining} more supportive ${remaining===1?'use is':'uses are'} required before reconfirmation.`
  };
}

export function attachAdaptationReconfirmation(patterns=[],history=[]){
  return (patterns||[]).map(pattern=>({
    ...pattern,
    reconfirmation:adaptationReconfirmationGate(pattern,history)
  }));
}

export function canConfirmAdaptationPattern(pattern,history=[]){
  return adaptationReconfirmationGate(pattern,history).eligible;
}
