const ACTIVE_PATTERN_STATUSES=new Set(['emerging','stable']);

export function createOutcomeEpisode({
  historyEntry,
  structuredReflection=null,
  attribution=null,
  learningSignal=null
}={}){
  if(!historyEntry?.judgementId&&!historyEntry?.decision?.id)
    throw new Error('A historical judgement is required.');

  const judgementId=historyEntry.judgementId||historyEntry.decision.id;
  const practiceId=
    historyEntry.fallbackOutcome?.executedPracticeId||
    historyEntry.outcomeRecord?.completedPracticeId||
    historyEntry.outcomeRecord?.startedPracticeId||
    historyEntry.decision?.practice?.id||
    null;

  return {
    id:`episode-${judgementId}`,
    judgementId,
    practiceId,
    domain:historyEntry.decision?.domain||historyEntry.decision?.practice?.domain||'unknown',
    contextKey:contextKey(historyEntry.context||{}),
    effect:structuredReflection?.effect||historyEntry.reflection||'unknown',
    goalFit:structuredReflection?.goalFit||'unknown',
    burden:structuredReflection?.burden||'unknown',
    causalSource:attribution?.source||'unclear',
    causalConfidence:attribution?.causalConfidence||'low',
    eligible:Boolean(learningSignal?.eligible),
    learningWeight:Number(learningSignal?.weight||0),
    reflectedAt:
      structuredReflection?.createdAt||
      historyEntry.completedAt||
      historyEntry.abandonedAt||
      new Date().toISOString()
  };
}

export function upsertOutcomePattern(patterns=[],episode){
  if(!episode?.practiceId)return [...patterns];

  const next=[...(patterns||[])];
  const index=next.findIndex(item=>
    ACTIVE_PATTERN_STATUSES.has(item.status)&&
    item.practiceId===episode.practiceId&&
    item.contextKey===episode.contextKey
  );

  if(index<0){
    return [{
      id:makeId('pattern'),
      practiceId:episode.practiceId,
      domain:episode.domain,
      contextKey:episode.contextKey,
      status:'emerging',
      episodeIds:[episode.id],
      observations:1,
      eligibleObservations:episode.eligible?1:0,
      positive:episode.effect==='better'?1:0,
      neutral:episode.effect==='right'?1:0,
      negative:episode.effect==='worse'?1:0,
      meanLearningWeight:episode.learningWeight,
      causalStrength:causalStrength(episode),
      contradictions:0,
      firstObservedAt:episode.reflectedAt,
      lastObservedAt:episode.reflectedAt
    },...next].slice(0,100);
  }

  const current={...next[index]};
  if(current.episodeIds.includes(episode.id))return next;

  const previousObservations=Number(current.observations||0);
  const newObservations=previousObservations+1;

  current.episodeIds=[episode.id,...current.episodeIds].slice(0,40);
  current.observations=newObservations;
  current.eligibleObservations=Number(current.eligibleObservations||0)+(episode.eligible?1:0);
  current.positive=Number(current.positive||0)+(episode.effect==='better'?1:0);
  current.neutral=Number(current.neutral||0)+(episode.effect==='right'?1:0);
  current.negative=Number(current.negative||0)+(episode.effect==='worse'?1:0);
  current.meanLearningWeight=+(
    (Number(current.meanLearningWeight||0)*previousObservations+episode.learningWeight)/newObservations
  ).toFixed(3);
  current.causalStrength=+(
    (Number(current.causalStrength||0)*previousObservations+causalStrength(episode))/newObservations
  ).toFixed(3);
  current.contradictions=countContradictions(current);
  current.lastObservedAt=episode.reflectedAt;
  current.status=evaluateOutcomePattern(current);

  next[index]=current;
  return next;
}

export function evaluateOutcomePattern(pattern){
  if(pattern.status==='rejected')return 'rejected';

  const observations=Number(pattern.observations||0);
  const eligibleRatio=observations?Number(pattern.eligibleObservations||0)/observations:0;
  const contradictionRatio=observations?Number(pattern.contradictions||0)/observations:0;

  if(
    observations>=4&&
    eligibleRatio>=.65&&
    Number(pattern.causalStrength||0)>=.5&&
    contradictionRatio<=.35
  )return 'stable';

  return 'emerging';
}

export function patternInfluence(pattern){
  if(!pattern||pattern.status==='rejected')return {
    applies:false,
    weight:0,
    reason:'Rejected pattern cannot influence judgement.'
  };

  const observations=Math.max(1,Number(pattern.observations||1));
  const eligibleRatio=Number(pattern.eligibleObservations||0)/observations;
  const consistency=Math.max(
    Number(pattern.positive||0),
    Number(pattern.neutral||0),
    Number(pattern.negative||0)
  )/observations;

  const base=pattern.status==='stable'?.22:.08;
  const weight=Math.min(
    .25,
    base*
    Math.max(.35,eligibleRatio)*
    Math.max(.4,consistency)*
    Math.max(.3,Number(pattern.causalStrength||0))
  );

  return {
    applies:weight>=.025,
    weight:+weight.toFixed(3),
    reason:pattern.status==='stable'
      ?'Repeated, causally supported outcomes form a bounded stable pattern.'
      :'Emerging outcome pattern applies with reduced influence.'
  };
}

export function rejectOutcomePattern(patterns,{
  patternId,
  note='',
  at=new Date().toISOString()
}={}){
  return (patterns||[]).map(item=>
    item.id===patternId
      ?{
        ...item,
        status:'rejected',
        rejectedAt:at,
        rejectionNote:String(note||'Rejected by the person.').trim()
      }
      :item
  );
}

export function reconcileOutcomePatterns(state){
  const next=clone(state||{});
  const episodeIds=new Set((next.outcomeEpisodes||[]).map(item=>item.id));

  next.outcomePatterns=[...(next.outcomePatterns||[])].filter(item=>
    item?.id&&item?.practiceId
  ).map(item=>({
    ...item,
    episodeIds:(item.episodeIds||[]).filter(id=>episodeIds.has(id))
  }));

  const seen=new Set();
  next.outcomePatterns=next.outcomePatterns.filter(item=>{
    const key=`${item.practiceId}|${item.contextKey}|${item.status}`;
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  }).slice(0,100);

  return next;
}

export function outcomePatternSummary(pattern){
  if(!pattern)return 'No longitudinal pattern exists.';
  return `${pattern.observations} observations · ${pattern.eligibleObservations} eligible · ${pattern.status} · causal strength ${Math.round(Number(pattern.causalStrength||0)*100)}%`;
}

function causalStrength(episode){
  const source={
    practice:1,
    mixed:.7,
    time:.4,
    external:.25,
    unclear:.3
  }[episode.causalSource]??.3;
  const confidence={low:.5,medium:.75,high:1}[episode.causalConfidence]??.5;
  return +(source*confidence).toFixed(3);
}

function countContradictions(pattern){
  const counts=[
    Number(pattern.positive||0),
    Number(pattern.neutral||0),
    Number(pattern.negative||0)
  ].sort((a,b)=>b-a);
  return counts[1]+counts[2];
}

function contextKey(context){
  return [
    context.challenge||'unknown',
    context.soreness||'unknown',
    context.emotionalLoad||'unknown'
  ].join('|');
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
