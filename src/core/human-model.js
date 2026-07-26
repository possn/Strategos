const nowIso=()=>new Date().toISOString();

export const HUMAN_MODEL_VERSION=1;
export const HUMAN_MODEL_DIMENSIONS=['identity','body','recovery','mind','agency','purpose','relationships','context'];

export function createHumanModel({profile=null,at=nowIso()}={}){
  const model={
    version:HUMAN_MODEL_VERSION,
    createdAt:at,
    updatedAt:at,
    facts:[],
    observations:[],
    unknowns:[],
    corrections:[],
    promotions:[],
    influence:{judgement:0,practiceSelection:0,safety:0}
  };
  if(profile?.name){
    model.facts.push(fact({
      key:'identity.preferredName',
      value:profile.name,
      dimension:'identity',
      source:'person',
      confidence:'confirmed',
      observedAt:at
    }));
  }
  return refreshHumanModel(model,{at});
}

export function updateHumanModel(model,{profile=null,context=null,source='current-signals',at=nowIso()}={}){
  const next=normaliseHumanModel(model,{profile,at});
  if(profile?.name){
    upsertFact(next,fact({
      key:'identity.preferredName',
      value:profile.name,
      dimension:'identity',
      source:'person',
      confidence:'confirmed',
      observedAt:at
    }));
  }
  if(context){
    const observations=[
      ['recovery.sleepSignal',Number(context.sleep),'recovery'],
      ['body.energySignal',Number(context.energy),'body'],
      ['context.availableMinutes',Number(context.time),'context'],
      ['context.currentClaim',String(context.challenge||'unknown'),'context'],
      ['body.sorenessSignal',String(context.soreness||'unknown'),'body'],
      ['mind.emotionalLoadSignal',String(context.emotionalLoad||'unknown'),'mind']
    ];
    for(const [key,value,dimension] of observations){
      next.observations.unshift({
        id:`human-observation-${slug(key)}-${Date.parse(at)||Date.now()}`,
        key,value,dimension,source,confidence:'reported',observedAt:at,status:'current'
      });
    }
    next.observations=dedupeObservations(next.observations).slice(0,120);
  }
  return refreshHumanModel(next,{at});
}

export function normaliseHumanModel(model,{profile=null,at=nowIso()}={}){
  const base=model&&typeof model==='object'?structuredCloneSafe(model):createHumanModel({profile,at});
  base.version=HUMAN_MODEL_VERSION;
  base.createdAt=base.createdAt||at;
  base.updatedAt=base.updatedAt||at;
  base.facts=Array.isArray(base.facts)?base.facts:[];
  base.observations=Array.isArray(base.observations)?base.observations:[];
  base.unknowns=Array.isArray(base.unknowns)?base.unknowns:[];
  base.corrections=Array.isArray(base.corrections)?base.corrections:[];
  base.promotions=Array.isArray(base.promotions)?base.promotions:[];
  base.influence={judgement:0,practiceSelection:0,safety:0};
  return base;
}

export function humanModelSnapshot(model,{at=nowIso()}={}){
  const next=refreshHumanModel(normaliseHumanModel(model,{at}),{at});
  return {
    version:next.version,
    updatedAt:next.updatedAt,
    facts:next.facts.map(item=>({...item})),
    currentObservations:latestByKey(next.observations).map(item=>({...item})),
    unknowns:next.unknowns.map(item=>({...item})),
    coverage:{...next.coverage},
    influence:{...next.influence}
  };
}

export function humanModelAudit(model){
  const next=refreshHumanModel(normaliseHumanModel(model),{at:model?.updatedAt||nowIso()});
  const latest=latestByKey(next.observations);
  return {
    version:next.version,
    facts:next.facts.length,
    observations:next.observations.length,
    currentObservations:latest.length,
    confirmed:next.facts.filter(item=>item.confidence==='confirmed').length,
    reported:latest.filter(item=>item.confidence==='reported').length,
    inferred:next.facts.filter(item=>item.confidence==='inferred').length,
    unknowns:next.unknowns.length,
    dimensionsCovered:next.coverage.covered,
    dimensionsTotal:next.coverage.total,
    judgementInfluence:0,
    practiceSelectionInfluence:0,
    safetyInfluence:0,
    statement:'The Human Model is visible and versioned, but does not yet influence judgements, Practice selection or safety.'
  };
}

export function humanModelSummary(model){
  const audit=humanModelAudit(model);
  return `${audit.dimensionsCovered}/${audit.dimensionsTotal} dimensions visible · ${audit.confirmed} confirmed facts · ${audit.currentObservations} current observations`;
}

export function humanModelDimensionSummary(model){
  const next=refreshHumanModel(normaliseHumanModel(model));
  const current=latestByKey(next.observations);
  return HUMAN_MODEL_DIMENSIONS.map(dimension=>{
    const facts=next.facts.filter(item=>item.dimension===dimension);
    const observations=current.filter(item=>item.dimension===dimension);
    return {
      dimension,
      facts,
      observations,
      status:facts.length||observations.length?'visible':'unknown',
      evidenceCount:facts.length+observations.length
    };
  });
}

function refreshHumanModel(model,{at=nowIso()}={}){
  model.updatedAt=at;
  const current=latestByKey(model.observations);
  const covered=HUMAN_MODEL_DIMENSIONS.filter(dimension=>
    model.facts.some(item=>item.dimension===dimension)||
    current.some(item=>item.dimension===dimension)
  ).length;
  model.coverage={covered,total:HUMAN_MODEL_DIMENSIONS.length};
  model.unknowns=HUMAN_MODEL_DIMENSIONS
    .filter(dimension=>!model.facts.some(item=>item.dimension===dimension)&&!current.some(item=>item.dimension===dimension))
    .map(dimension=>({dimension,status:'unknown',statement:`Strategos does not yet have direct information about ${dimension}.`}));
  model.influence={judgement:0,practiceSelection:0,safety:0};
  return model;
}

function fact({key,value,dimension,source,confidence,observedAt}){
  return {
    id:`human-fact-${slug(key)}`,
    key,value,dimension,source,confidence,observedAt,updatedAt:observedAt,status:'active'
  };
}

function upsertFact(model,item){
  model.facts=[item,...model.facts.filter(existing=>existing.key!==item.key)];
}

function latestByKey(items=[]){
  const sorted=[...(items||[])].sort((a,b)=>Date.parse(b.observedAt||0)-Date.parse(a.observedAt||0));
  const seen=new Set();
  return sorted.filter(item=>{
    if(!item?.key||seen.has(item.key))return false;
    seen.add(item.key);
    return true;
  });
}

function dedupeObservations(items=[]){
  const seen=new Set();
  return items.filter(item=>{
    const id=item?.id||`${item?.key}|${item?.observedAt}`;
    if(seen.has(id))return false;
    seen.add(id);
    return true;
  });
}

function slug(value){
  return String(value||'unknown').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function structuredCloneSafe(value){
  return typeof structuredClone==='function'?structuredClone(value):JSON.parse(JSON.stringify(value));
}


/* v0.22.0 Phase 2 — explicit person review of Human Model evidence */
export function applyHumanModelEvidenceReview(model,{
  evidenceId,
  action,
  note='',
  at=nowIso()
}={}){
  const next=normaliseHumanModel(model,{at});
  if(!evidenceId||!['confirm','reject','reopen'].includes(action))return next;

  const target=findEvidence(next,evidenceId);
  if(!target)return next;

  const status=action==='confirm'?'confirmed':action==='reject'?'rejected':'reported';
  target.reviewStatus=status;
  target.reviewedAt=at;
  target.reviewSource='person';

  next.corrections=[
    {
      id:`human-model-review-${slug(evidenceId)}-${Date.parse(at)||Date.now()}`,
      evidenceId,
      key:target.key,
      action,
      note:String(note||'').trim(),
      at,
      source:'person',
      judgementInfluence:0,
      practiceSelectionInfluence:0,
      safetyInfluence:0
    },
    ...next.corrections.filter(item=>item.evidenceId!==evidenceId)
  ].slice(0,200);

  return refreshHumanModel(next,{at});
}

export function humanModelEvidenceReviewFor(model,evidenceId){
  const next=normaliseHumanModel(model);
  const target=findEvidence(next,evidenceId);
  if(!target)return null;
  return {
    evidenceId,
    key:target.key,
    status:target.reviewStatus||target.confidence||'reported',
    reviewedAt:target.reviewedAt||null,
    source:target.reviewSource||target.source||'unknown'
  };
}

export function reconcileHumanModelReviews(model,{at=nowIso()}={}){
  const next=normaliseHumanModel(model,{at});
  const known=new Set([
    ...next.facts.map(item=>item.id),
    ...next.observations.map(item=>item.id)
  ]);
  const seen=new Set();
  next.corrections=next.corrections.filter(item=>{
    if(!item?.evidenceId||!known.has(item.evidenceId)||seen.has(item.evidenceId))return false;
    seen.add(item.evidenceId);
    return true;
  }).map(item=>({
    id:item.id||`human-model-review-${slug(item.evidenceId)}`,
    evidenceId:item.evidenceId,
    key:item.key||findEvidence(next,item.evidenceId)?.key||'unknown',
    action:['confirm','reject','reopen'].includes(item.action)?item.action:'reopen',
    note:String(item.note||''),
    at:item.at||at,
    source:'person',
    judgementInfluence:0,
    practiceSelectionInfluence:0,
    safetyInfluence:0
  }));

  for(const item of [...next.facts,...next.observations]){
    const review=next.corrections.find(entry=>entry.evidenceId===item.id);
    if(!review)continue;
    item.reviewStatus=review.action==='confirm'?'confirmed':review.action==='reject'?'rejected':'reported';
    item.reviewedAt=review.at;
    item.reviewSource='person';
  }
  return refreshHumanModel(next,{at});
}

export function humanModelReviewAudit(model){
  const next=reconcileHumanModelReviews(model);
  const evidence=[...next.facts,...latestByKey(next.observations)];
  return {
    candidate:evidence.filter(item=>!item.reviewStatus||item.reviewStatus==='reported').length,
    confirmed:evidence.filter(item=>item.reviewStatus==='confirmed').length,
    rejected:evidence.filter(item=>item.reviewStatus==='rejected').length,
    corrections:next.corrections.length,
    judgementInfluence:0,
    practiceSelectionInfluence:0,
    safetyInfluence:0,
    statement:'Person review changes evidence status only. It does not yet influence judgements, Practice selection or safety.'
  };
}

export function humanModelEvidenceSummary(item){
  if(!item)return 'Evidence unavailable.';
  const status=item.reviewStatus||item.confidence||'reported';
  if(status==='confirmed')return 'Confirmed by you as an accurate record of what was reported.';
  if(status==='rejected')return 'Rejected by you as inaccurate or misleading.';
  return 'Awaiting your review.';
}

function findEvidence(model,evidenceId){
  return [...(model.facts||[]),...(model.observations||[])].find(item=>item.id===evidenceId)||null;
}


/* v0.22.0 Phase 3 — deliberation evidence boundary */
export function buildHumanModelDeliberationSnapshot(model,{at=nowIso()}={}){
  const next=reconcileHumanModelReviews(normaliseHumanModel(model,{at}),{at});
  const currentObservations=latestByKey(next.observations);
  const confirmedFacts=next.facts.filter(item=>(item.reviewStatus||item.confidence)==='confirmed');
  const confirmedObservations=currentObservations.filter(item=>item.reviewStatus==='confirmed');
  const reportedObservations=currentObservations.filter(item=>!item.reviewStatus||item.reviewStatus==='reported');
  const rejectedEvidence=[...next.facts,...currentObservations].filter(item=>item.reviewStatus==='rejected');

  return {
    version:next.version,
    createdAt:at,
    confirmedFacts:confirmedFacts.map(copyEvidence),
    confirmedObservations:confirmedObservations.map(copyEvidence),
    reportedObservations:reportedObservations.map(copyEvidence),
    rejectedEvidence:rejectedEvidence.map(copyEvidence),
    unknowns:next.unknowns.map(item=>({...item})),
    evidenceBoundary:{
      activeEvidenceCount:confirmedFacts.length+confirmedObservations.length+reportedObservations.length,
      confirmedCount:confirmedFacts.length+confirmedObservations.length,
      reportedCount:reportedObservations.length,
      rejectedCount:rejectedEvidence.length,
      rejectedInfluence:0,
      judgementInfluence:0,
      practiceSelectionInfluence:0,
      safetyInfluence:0
    },
    statement:'The deliberation snapshot preserves what was visible at decision time. Rejected evidence is recorded but excluded from the active evidence set.'
  };
}

export function humanModelDeliberationEvidence(snapshot){
  if(!snapshot)return [];
  return [
    ...(snapshot.confirmedFacts||[]).map(item=>({...item,evidenceClass:'confirmed-fact'})),
    ...(snapshot.confirmedObservations||[]).map(item=>({...item,evidenceClass:'confirmed-observation'})),
    ...(snapshot.reportedObservations||[]).map(item=>({...item,evidenceClass:'reported-observation'}))
  ];
}

export function humanModelDeliberationSnapshotAudit(snapshot){
  if(!snapshot)return {
    status:'missing',
    activeEvidenceCount:0,
    confirmedCount:0,
    reportedCount:0,
    rejectedCount:0,
    judgementInfluence:0,
    statement:'No Human Model deliberation snapshot is available.'
  };
  const boundary=snapshot.evidenceBoundary||{};
  return {
    status:'preserved',
    activeEvidenceCount:Number(boundary.activeEvidenceCount)||0,
    confirmedCount:Number(boundary.confirmedCount)||0,
    reportedCount:Number(boundary.reportedCount)||0,
    rejectedCount:Number(boundary.rejectedCount)||0,
    judgementInfluence:0,
    practiceSelectionInfluence:0,
    safetyInfluence:0,
    statement:'The evidence boundary is preserved for accountability. Human Model evidence remains non-influential in Phase 3.'
  };
}

export function humanModelDeliberationSnapshotSummary(snapshot){
  const audit=humanModelDeliberationSnapshotAudit(snapshot);
  return `${audit.activeEvidenceCount} active · ${audit.confirmedCount} confirmed · ${audit.reportedCount} reported · ${audit.rejectedCount} rejected`;
}

function copyEvidence(item){
  return {
    id:item.id,
    key:item.key,
    value:item.value,
    dimension:item.dimension,
    source:item.source,
    confidence:item.confidence,
    reviewStatus:item.reviewStatus||null,
    observedAt:item.observedAt||item.updatedAt||null,
    reviewedAt:item.reviewedAt||null
  };
}


/* v0.22.0 Phase 4 — person-authorised promotion from repeated observations to stable facts */
export function humanModelFactCandidates(model,{now=Date.now(),windowDays=180,minEvidence=3}={}){
  const next=reconcileHumanModelReviews(normaliseHumanModel(model));
  const cutoff=now-windowDays*86400000;
  const groups=new Map();
  for(const item of next.observations){
    if(Date.parse(item.observedAt||0)<cutoff||item.reviewStatus!=='confirmed')continue;
    const groupKey=`${item.key}|${stableValue(item.value)}`;
    const list=groups.get(groupKey)||[];list.push(item);groups.set(groupKey,list);
  }
  return [...groups.entries()].filter(([,items])=>items.length>=minEvidence).map(([groupKey,items])=>{
    const ordered=[...items].sort((a,b)=>Date.parse(a.observedAt||0)-Date.parse(b.observedAt||0));
    const latest=ordered[ordered.length-1],id=`human-fact-candidate-${slug(groupKey)}`;
    const review=(next.promotions||[]).find(item=>item.candidateId===id);
    return {id,key:latest.key,value:latest.value,dimension:latest.dimension,evidenceIds:items.map(item=>item.id),evidenceCount:items.length,firstObservedAt:ordered[0].observedAt,lastObservedAt:latest.observedAt,status:review?.status||'candidate',decidedAt:review?.decidedAt||null,note:review?.note||'',judgementInfluence:0,practiceSelectionInfluence:0,safetyInfluence:0,statement:`${items.length} confirmed observations support a possible stable fact.`};
  }).sort((a,b)=>Date.parse(b.lastObservedAt||0)-Date.parse(a.lastObservedAt||0));
}

export function applyHumanModelFactPromotion(model,{candidate,action,note='',at=nowIso()}={}){
  const next=normaliseHumanModel(model,{at});next.promotions=Array.isArray(next.promotions)?next.promotions:[];
  if(!candidate?.id||!['promote','reject','reopen'].includes(action))return next;
  const status=action==='promote'?'promoted':action==='reject'?'rejected':'candidate';
  const record={candidateId:candidate.id,key:candidate.key,value:candidate.value,dimension:candidate.dimension,evidenceIds:[...(candidate.evidenceIds||[])],evidenceCount:Number(candidate.evidenceCount)||0,status,note:String(note||''),decidedAt:at,source:'person',judgementInfluence:0,practiceSelectionInfluence:0,safetyInfluence:0};
  next.promotions=[record,...next.promotions.filter(item=>item.candidateId!==candidate.id)].slice(0,200);
  if(status==='promoted')upsertFact(next,{id:`human-fact-promoted-${slug(candidate.key)}-${slug(stableValue(candidate.value))}`,key:candidate.key,value:candidate.value,dimension:candidate.dimension,source:'person-promoted',confidence:'confirmed',observedAt:candidate.lastObservedAt||at,updatedAt:at,status:'active',promotionId:candidate.id,evidenceIds:[...(candidate.evidenceIds||[])],evidenceCount:Number(candidate.evidenceCount)||0});
  else next.facts=next.facts.filter(item=>item.promotionId!==candidate.id);
  return refreshHumanModel(next,{at});
}

export function reconcileHumanModelFactPromotions(model,{now=Date.now(),at=nowIso()}={}){
  const next=normaliseHumanModel(model,{at});next.promotions=Array.isArray(next.promotions)?next.promotions:[];
  const candidates=humanModelFactCandidates({...next,promotions:[]},{now}),byId=new Map(candidates.map(item=>[item.id,item])),seen=new Set();
  next.promotions=next.promotions.filter(item=>item?.candidateId&&!seen.has(item.candidateId)&&byId.has(item.candidateId)&&(seen.add(item.candidateId)||true)).map(item=>({...item,status:['candidate','promoted','rejected'].includes(item.status)?item.status:'candidate',source:'person',judgementInfluence:0,practiceSelectionInfluence:0,safetyInfluence:0}));
  const valid=new Set(next.promotions.filter(item=>item.status==='promoted').map(item=>item.candidateId));
  next.facts=next.facts.filter(item=>!item.promotionId||valid.has(item.promotionId));
  for(const promotion of next.promotions.filter(item=>item.status==='promoted')){
    const candidate=byId.get(promotion.candidateId);if(!candidate)continue;
    upsertFact(next,{id:`human-fact-promoted-${slug(candidate.key)}-${slug(stableValue(candidate.value))}`,key:candidate.key,value:candidate.value,dimension:candidate.dimension,source:'person-promoted',confidence:'confirmed',observedAt:candidate.lastObservedAt||at,updatedAt:promotion.decidedAt||at,status:'active',promotionId:candidate.id,evidenceIds:[...(candidate.evidenceIds||[])],evidenceCount:Number(candidate.evidenceCount)||0});
  }
  return refreshHumanModel(next,{at});
}

export function humanModelFactPromotionAudit(model,{now=Date.now()}={}){
  const next=reconcileHumanModelFactPromotions(model,{now}),candidates=humanModelFactCandidates(next,{now});
  return {candidate:candidates.filter(item=>item.status==='candidate').length,promoted:candidates.filter(item=>item.status==='promoted').length,rejected:candidates.filter(item=>item.status==='rejected').length,total:candidates.length,judgementInfluence:0,practiceSelectionInfluence:0,safetyInfluence:0,statement:'Repeated confirmed observations may propose a stable fact. Only the person may promote it, and promotion remains non-influential in Phase 4.'};
}

export function humanModelFactCandidateSummary(candidate){
  if(!candidate)return 'Candidate unavailable.';
  if(candidate.status==='promoted')return `Promoted by you from ${candidate.evidenceCount} confirmed observations.`;
  if(candidate.status==='rejected')return `Rejected by you after ${candidate.evidenceCount} confirmed observations.`;
  return `${candidate.evidenceCount} confirmed observations support this candidate.`;
}
function stableValue(value){return typeof value==='string'?value.trim().toLowerCase():JSON.stringify(value)}
