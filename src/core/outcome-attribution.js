export const ATTRIBUTION_SOURCES=['practice','external','time','mixed','unclear'];
export const CAUSAL_CONFIDENCE=['low','medium','high'];

export function createOutcomeAttribution({
  reflection,
  source='unclear',
  causalConfidence='low',
  externalFactors=[],
  note='',
  at=new Date().toISOString()
}={}){
  if(!reflection?.id)throw new Error('A structured reflection is required.');
  if(!ATTRIBUTION_SOURCES.includes(source))throw new Error('Unsupported attribution source.');
  if(!CAUSAL_CONFIDENCE.includes(causalConfidence))throw new Error('Unsupported causal confidence.');

  return {
    id:makeId('attribution'),
    reflectionId:reflection.id,
    outcomeRecordId:reflection.outcomeRecordId,
    judgementId:reflection.judgementId,
    source,
    causalConfidence,
    externalFactors:[...(externalFactors||[])].map(item=>String(item).trim()).filter(Boolean).slice(0,8),
    note:String(note||'').trim(),
    createdAt:at,
    status:'recorded',
    integrity:'person-attributed'
  };
}

export function attributionLearningAdjustment(attribution){
  if(!attribution)return {
    multiplier:.5,
    reason:'No causal attribution was recorded.'
  };

  const sourceWeight={
    practice:1,
    mixed:.7,
    time:.45,
    external:.25,
    unclear:.35
  }[attribution.source] ?? .35;

  const confidenceWeight={
    low:.55,
    medium:.8,
    high:1
  }[attribution.causalConfidence] ?? .55;

  const externalPenalty=Math.min(.2,(attribution.externalFactors||[]).length*.04);
  const multiplier=Math.max(.15,Math.min(1,sourceWeight*confidenceWeight-externalPenalty));

  return {
    multiplier:+multiplier.toFixed(3),
    reason:attribution.source==='practice'
      ?'The person attributed the outcome primarily to the practice.'
      :attribution.source==='mixed'
        ?'The outcome was attributed to both the practice and external factors.'
        :`The outcome was not attributed primarily to the practice (${attribution.source}).`
  };
}

export function calibrateLearningWithAttribution(signal,attribution){
  if(!signal?.eligible)return {
    eligible:false,
    weight:0,
    reason:signal?.reason||'Base learning signal is not eligible.'
  };

  const adjustment=attributionLearningAdjustment(attribution);
  const weight=Number(signal.weight||0)*adjustment.multiplier;

  return {
    eligible:weight>=.1,
    weight:+Math.max(0,Math.min(1,weight)).toFixed(3),
    reason:`${signal.reason} ${adjustment.reason}`
  };
}

export function attributionContradiction(reflection,attribution){
  if(!reflection||!attribution)return {present:false,reasons:[]};

  const reasons=[];

  if(reflection.surprise==='material'&&attribution.source==='practice'&&attribution.causalConfidence==='high')
    reasons.push('Material surprise conflicts with high-confidence direct attribution.');

  if((attribution.source==='external'||attribution.source==='time')&&attribution.externalFactors.length===0)
    reasons.push('External attribution has no named external factor.');

  if(attribution.source==='unclear'&&attribution.causalConfidence==='high')
    reasons.push('High causal confidence conflicts with unclear attribution.');

  return {
    present:reasons.length>0,
    severity:reasons.length>=2?'high':'moderate',
    reasons
  };
}

export function reconcileOutcomeAttributions(state){
  const next=clone(state||{});
  const reflectionIds=new Set((next.structuredReflections||[]).map(item=>item.id));

  next.outcomeAttributions=[...(next.outcomeAttributions||[])].filter(item=>
    item?.id&&item?.reflectionId&&reflectionIds.has(item.reflectionId)
  );

  const seen=new Set();
  next.outcomeAttributions=next.outcomeAttributions.filter(item=>{
    if(seen.has(item.id))return false;
    seen.add(item.id);
    return true;
  }).slice(0,200);

  return next;
}

export function attributionSummary(attribution){
  if(!attribution)return 'No outcome attribution exists.';
  const external=attribution.externalFactors.length
    ?` · factors: ${attribution.externalFactors.join(', ')}`
    :'';
  return `${attribution.source} · causal confidence ${attribution.causalConfidence}${external}`;
}

function clone(value){
  return typeof structuredClone==='function'
    ?structuredClone(value)
    :JSON.parse(JSON.stringify(value));
}

function makeId(prefix){
  return globalThis.crypto?.randomUUID
    ?`${prefix}-${crypto.randomUUID()}`
    :`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
