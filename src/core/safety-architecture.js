export const SAFETY_ARCHITECTURE_VERSION=1;

export function buildSafetyEnvelope({context={},decision=null}={}){
  const blockedPractices=[...(decision?.agora?.blockedPractices||[])].map(item=>({
    practiceId:item.practiceId,
    reason:item.reason,
    source:item.source||'unknown',
    matchedContraindications:[...(item.matchedContraindications||[])]
  }));
  const advisorRisks=(decision?.advisors||[]).flatMap(advisor=>
    (advisor.riskFlags||[]).map(risk=>({
      advisor:advisor.advisor,
      domain:risk.domain||'unknown',
      severity:risk.severity||'unknown',
      description:risk.description||advisor.reason||'Risk identified.',
      reversibility:risk.reversibility||'unknown'
    }))
  );
  const criticalRisks=advisorRisks.filter(item=>item.severity==='critical');
  const difficultToReverse=advisorRisks.filter(item=>item.reversibility==='difficult');
  const cautions=[...(decision?.agora?.cautions||[])].map(item=>({
    advisor:item.advisor,
    position:item.position,
    reason:item.reason
  }));
  const status=criticalRisks.length||blockedPractices.length?'constrained':cautions.length||advisorRisks.length?'caution':'clear';
  return {
    version:SAFETY_ARCHITECTURE_VERSION,
    createdAt:new Date().toISOString(),
    status,
    contextSnapshot:{soreness:context.soreness??null,energy:context.energy??null,emotionalLoad:context.emotionalLoad??null,time:context.time??null},
    blockedPractices,advisorRisks,criticalRisks,difficultToReverse,cautions,
    operatingBoundary:{behaviourChange:0,rankingChange:0,confidenceChange:0,durationChange:0,executionChange:0},
    statement:status==='constrained'?'Existing safeguards constrain the current deliberation.':status==='caution'?'Existing caution signals are visible, but no additional safety action is introduced.':'No existing critical risk or declared contraindication is active.'
  };
}

export function safetyEnvelopeAudit(envelope){
  if(!envelope)return {status:'missing',blocked:0,critical:0,difficultToReverse:0,cautions:0,statement:'No safety envelope is available.'};
  return {
    status:envelope.status,
    blocked:envelope.blockedPractices?.length||0,
    critical:envelope.criticalRisks?.length||0,
    difficultToReverse:envelope.difficultToReverse?.length||0,
    cautions:envelope.cautions?.length||0,
    statement:envelope.statement
  };
}

export function safetyEnvelopeSummary(envelope){
  const audit=safetyEnvelopeAudit(envelope);
  return `${audit.status} · ${audit.blocked} blocked · ${audit.critical} critical · ${audit.cautions} cautions`;
}


export function safetyAcknowledgementRequirement(envelope){
  if(!envelope)return {required:false,reason:'No safety envelope is available.',status:'missing'};
  return {
    required:envelope.status==='constrained',
    reason:envelope.status==='constrained'
      ?'The current judgement contains an active safety constraint that must be acknowledged before Practice begins.'
      :'No additional safety acknowledgement is required.',
    status:envelope.status
  };
}

export function createSafetyAcknowledgement({envelope,judgementId,at=new Date().toISOString()}={}){
  const requirement=safetyAcknowledgementRequirement(envelope);
  if(!requirement.required)return null;
  return {
    id:`safety-acknowledgement-${judgementId||'unknown'}-${Date.parse(at)||Date.now()}`,
    judgementId:judgementId||null,
    envelopeVersion:envelope?.version||null,
    envelopeCreatedAt:envelope?.createdAt||null,
    status:'acknowledged',
    acknowledgedAt:at,
    source:'person',
    statement:'The person acknowledged the current safety boundary before beginning the Practice.'
  };
}

export function safetyAcknowledgementValid(acknowledgement,{envelope,judgementId}={}){
  if(!acknowledgement)return false;
  return acknowledgement.status==='acknowledged'
    && acknowledgement.judgementId===(judgementId||null)
    && acknowledgement.envelopeCreatedAt===(envelope?.createdAt||null);
}

export function safetyStartGate({envelope,acknowledgement,judgementId}={}){
  const requirement=safetyAcknowledgementRequirement(envelope);
  if(!requirement.required)return {canStart:true,required:false,reason:'No additional safety acknowledgement is required.'};
  const valid=safetyAcknowledgementValid(acknowledgement,{envelope,judgementId});
  return {
    canStart:valid,
    required:true,
    reason:valid
      ?'The active safety constraint has been acknowledged.'
      :'Acknowledge the active safety constraint before beginning this Practice.'
  };
}


export function createSafetyInterruption({
  judgementId,
  practiceId,
  phaseIndex=0,
  reason='person-concern',
  note='',
  at=new Date().toISOString()
}={}){
  return {
    id:`safety-interruption-${judgementId||'unknown'}-${Date.parse(at)||Date.now()}`,
    judgementId:judgementId||null,
    practiceId:practiceId||null,
    phaseIndex:Number(phaseIndex)||0,
    reason,
    note:String(note||'').trim(),
    status:'active',
    createdAt:at,
    resolvedAt:null,
    resolution:null,
    source:'person',
    statement:'The person raised a safety concern during Practice. Execution was paused immediately.'
  };
}

export function resolveSafetyInterruption(interruption,{action,note='',at=new Date().toISOString()}={}){
  if(!interruption||interruption.status!=='active')return interruption||null;
  if(!['resume','end'].includes(action))return interruption;
  return {
    ...interruption,
    status:'resolved',
    resolution:action,
    resolutionNote:String(note||'').trim(),
    resolvedAt:at,
    statement:action==='resume'
      ?'The person reassessed the situation and explicitly chose to resume.'
      :'The person chose to end the Practice after the safety concern.'
  };
}

export function activeSafetyInterruption(events=[]){
  return [...(events||[])].find(item=>item?.status==='active')||null;
}

export function safetyRuntimeGate(events=[]){
  const active=activeSafetyInterruption(events);
  return {
    canRun:!active,
    active,
    reason:active
      ?'Practice remains paused until the safety concern is explicitly resolved.'
      :'No active runtime safety interruption is present.'
  };
}

export function safetyInterruptionAudit(events=[]){
  const list=[...(events||[])];
  return {
    total:list.length,
    active:list.filter(item=>item.status==='active').length,
    resumed:list.filter(item=>item.status==='resolved'&&item.resolution==='resume').length,
    ended:list.filter(item=>item.status==='resolved'&&item.resolution==='end').length,
    statement:list.length
      ?'Runtime safety interruptions remain preserved with the Practice record.'
      :'No runtime safety interruption has been recorded.'
  };
}
