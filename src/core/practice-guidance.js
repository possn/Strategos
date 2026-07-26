export function buildPhaseGuidance({
  phase,
  practice=null,
  context={}
}={}){
  const raw=Array.isArray(phase?.[3])?phase[3]:[];
  const parsed=parseGuidance(raw);
  const normalisedContext=normalisePracticeContext(context);

  const cautions=[
    ...parsed.cautions,
    ...contextCautions(normalisedContext,practice)
  ];

  return {
    technique:parsed.technique,
    regression:parsed.regression,
    progression:parsed.progression,
    cautions:unique(cautions),
    stopSignals:buildStopSignals(practice,normalisedContext),
    voiceCue:buildVoiceCue(phase,parsed),
    context:normalisedContext,
    hasDetail:Boolean(
      parsed.technique.length||
      parsed.regression.length||
      parsed.progression.length||
      cautions.length
    )
  };
}

export function parseGuidance(lines=[]){
  const result={
    technique:[],
    regression:[],
    progression:[],
    cautions:[]
  };

  for(const raw of lines||[]){
    const line=String(raw||'').trim();
    if(!line)continue;

    const match=line.match(/^(technique|regression|progression|caution|safety)\s*:\s*(.+)$/i);
    if(!match){
      result.technique.push(line);
      continue;
    }

    const [,kind,text]=match;
    const key=kind.toLowerCase();
    if(key==='technique')result.technique.push(text);
    else if(key==='regression')result.regression.push(text);
    else if(key==='progression')result.progression.push(text);
    else result.cautions.push(text);
  }

  return result;
}

export function normalisePracticeContext(context={}){
  const energy=normaliseEnergy(context.energy);
  const soreness=normaliseSoreness(context.soreness);
  const emotionalLoad=normaliseEmotionalLoad(context.emotionalLoad);

  return {
    ...context,
    energy,
    soreness,
    emotionalLoad,
    source:{
      energy:context.energy,
      soreness:context.soreness,
      emotionalLoad:context.emotionalLoad
    }
  };
}

export function selectGuidanceLevel({
  experience='unknown',
  soreness='none',
  energy='steady'
}={}){
  const context=normalisePracticeContext({soreness,energy});
  if(context.soreness==='high')return 'regression';
  if(context.energy==='low')return 'regression';
  if(['advanced','experienced'].includes(String(experience).toLowerCase()))return 'progression';
  return 'technique';
}

export function buildGuidanceDecision({
  guidance,
  experience='unknown',
  context={}
}={}){
  const normalisedContext=normalisePracticeContext(context);
  const requestedLevel=selectGuidanceLevel({
    experience,
    soreness:normalisedContext.soreness,
    energy:normalisedContext.energy
  });
  const recommendation=guidanceRecommendation(guidance,requestedLevel);
  const reasons=[];

  if(normalisedContext.soreness==='high')reasons.push('significant soreness');
  if(normalisedContext.energy==='low')reasons.push('low energy');
  if(
    requestedLevel==='progression' &&
    !reasons.length
  )reasons.push('your recorded experience');
  if(!reasons.length)reasons.push('today’s current signals');

  return {
    requestedLevel,
    appliedLevel:recommendation?.level||null,
    recommendation,
    adapted:requestedLevel!=='technique',
    reason:`Based on ${joinReasons(reasons)}.`,
    context:normalisedContext
  };
}

export function guidanceRecommendation(guidance,level='technique'){
  if(!guidance)return null;
  const preferred=guidance[level]||[];
  if(preferred.length)return {level,text:preferred[0]};
  if(guidance.technique?.length)return {level:'technique',text:guidance.technique[0]};
  return null;
}

export function shouldShowSafetyPanel(guidance){
  return Boolean(guidance?.cautions?.length||guidance?.stopSignals?.length);
}

export function buildStopSignals(practice,context={}){
  const normalisedContext=normalisePracticeContext(context);
  const signals=[
    'Stop if you feel sharp pain, dizziness or loss of control.'
  ];

  const id=String(practice?.id||'').toLowerCase();
  const name=String(practice?.name||'').toLowerCase();
  const movement=/strength|mobility|movement|walk|run|body|push|squat|plank/.test(`${id} ${name}`);

  if(movement&&normalisedContext.soreness==='high'){
    signals.push('Choose a smaller range of motion or end the Practice if soreness worsens.');
  }

  if(normalisedContext.emotionalLoad==='heavy'){
    signals.push('Reduce intensity if the Practice increases distress rather than steadiness.');
  }

  return unique(signals);
}

function buildVoiceCue(phase,parsed){
  const name=String(phase?.[0]||'Current phase');
  const summary=String(phase?.[2]||'');
  const technique=parsed.technique[0]||'';
  return [name,summary,technique].filter(Boolean).join('. ');
}

function contextCautions(context,practice){
  const cautions=[];
  if(context.soreness==='high')cautions.push('Use the least demanding valid version today.');
  if(context.energy==='low')cautions.push('Keep the pace conversational and stop before form deteriorates.');
  if(practice?.domain==='Recovery')cautions.push('This Practice should feel restorative, not effortful.');
  return cautions;
}

function normaliseEnergy(value){
  if(value===1||value==='1')return 'low';
  if(value===2||value==='2')return 'steady';
  if(value===3||value==='3')return 'high';
  const text=String(value??'steady').toLowerCase();
  if(['low','depleted','poor'].includes(text))return 'low';
  if(['high','strong'].includes(text))return 'high';
  return 'steady';
}

function normaliseSoreness(value){
  const text=String(value??'none').toLowerCase();
  if(['significant','high','severe'].includes(text))return 'high';
  if(['mild','moderate'].includes(text))return 'mild';
  return 'none';
}

function normaliseEmotionalLoad(value){
  const text=String(value??'usual').toLowerCase();
  if(['heavy','high'].includes(text))return 'heavy';
  if(['light','low'].includes(text))return 'light';
  return 'usual';
}

function joinReasons(reasons){
  if(reasons.length<=1)return reasons[0]||'today’s current signals';
  if(reasons.length===2)return `${reasons[0]} and ${reasons[1]}`;
  return `${reasons.slice(0,-1).join(', ')}, and ${reasons.at(-1)}`;
}

function unique(items){
  return [...new Set((items||[]).filter(Boolean))];
}
