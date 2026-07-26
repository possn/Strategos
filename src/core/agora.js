import { applyAdvisorMemory } from './advisor-memory.js?v=0476p1';
import * as PracticeLibrary from '../data/codex.js?v=0476p1';
const CODEX=PracticeLibrary.CODEX||[];
const assessPracticeEligibility=PracticeLibrary.assessPracticeEligibility||((practice,context={})=>{const blocked=practice?.id==='strength'&&context.soreness==='significant';return {practiceId:practice?.id||'unknown',status:blocked?'blocked':'eligible',reasons:[blocked?'Significant soreness makes strength loading inappropriate until reassessment.':'No declared contextual conflict is visible.'],matchedContraindications:blocked?['significant-soreness']:[],selectionInfluence:0};});
import { evidenceItem, assessEvidenceDiversity, detectContradictions } from './evidence-integrity.js?v=0476p1';
import { buildDeliberationTrace,buildMinorityReports,summarizeMinorityReports } from './deliberation-trace.js?v=0476p1';
import { applyLongitudinalAdjustments,longitudinalConfidenceAdjustment,verifyLongitudinalEvidence } from './longitudinal-evidence.js?v=0476p1';
import { applyCalibrationToConfidence,verifyCalibrationEvidence } from './calibration-governance.js?v=0476p1';
const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n));

export function conveneAgora(context, understanding, history=[], advisorMemories={}, longitudinalEvidence=null, calibrationEvidence=null){
  const raw=[bodyAdvisor(context,understanding,history),recoveryAdvisor(context,understanding),mindAdvisor(context,understanding),agencyAdvisor(context,understanding),purposeAdvisor(context),relationshipsAdvisor(context)];
  const advisors=raw.map(a=>applyAdvisorMemory(a,advisorMemories[a.advisor]));
  let totals=Object.fromEntries(CODEX.map(practice=>[practice.id,0]));
  for(const advisor of advisors){
    for(const [id,value] of Object.entries(advisor.scores)) totals[id]=(totals[id]||0)+value*advisor.weight;
  }
  const longitudinalVerification=verifyLongitudinalEvidence(longitudinalEvidence);
  if(longitudinalVerification.valid)totals=applyLongitudinalAdjustments(totals,longitudinalEvidence);
  const eligibilityAssessments=CODEX.map(practice=>({
    practice,
    assessment:assessPracticeEligibility(practice,context)
  }));
  const blocked=eligibilityAssessments
    .filter(item=>item.assessment.status==='blocked')
    .map(item=>({
      practiceId:item.practice.id,
      reason:item.assessment.reasons[0],
      source:'canonical-practice-eligibility',
      matchedContraindications:item.assessment.matchedContraindications
    }));
  const ranked=Object.entries(totals)
    .filter(([id])=>!blocked.some(item=>item.practiceId===id))
    .sort((a,b)=>b[1]-a[1]);
  const winner=CODEX.find(item=>item.id===ranked[0][0]);
  const duration=[...winner.durationOptions].reverse().find(d=>d<=context.time)||winner.durationOptions[0];
  const margin=ranked.length>1?ranked[0][1]-ranked[1][1]:0;
  const contradictions=understanding.contradictions||detectContradictions(context,understanding,history);
  const evidenceDiversity=assessEvidenceDiversity(advisors);
  const criticalConcern=advisors.find(a=>a.riskFlags?.some(r=>r.severity==='critical'));
  const diversityPenalty=evidenceDiversity.level==='Narrow'?.08:evidenceDiversity.level==='Mixed'?.03:0;
  const contradictionPenalty=Math.min(.12,contradictions.reduce((sum,x)=>sum+(x.severity==='high'?.06:.03),0));
  const longitudinalConfidence=longitudinalVerification.valid?longitudinalConfidenceAdjustment(longitudinalEvidence):0;
  const baseConfidence=Math.round(clamp(.56+margin*.10+understanding.confidence/520-(criticalConcern?.12:0)-diversityPenalty-contradictionPenalty+longitudinalConfidence,.45,.90)*100);
  const calibrationVerification=verifyCalibrationEvidence(calibrationEvidence);
  const calibratedConfidence=applyCalibrationToConfidence(baseConfidence,calibrationEvidence);
  const confidence=calibratedConfidence.confidence;
  const delta=scaleDelta(winner.baseDelta,duration/15);
  const supporting=advisors.filter(a=>(a.scores[winner.id]||0)>.45).sort((a,b)=>(b.scores[winner.id]||0)-(a.scores[winner.id]||0));
  const cautioning=advisors.filter(a=>['Caution','Oppose'].includes(a.position));
  const strongestCaution=[...cautioning].sort((a,b)=>riskStrength(b)-riskStrength(a))[0]||null;
  const agora={
    agreements:supporting.map(a=>({advisor:a.advisor,position:a.position,reason:a.reason})),
    cautions:cautioning.map(a=>({advisor:a.advisor,position:a.position,reason:a.reason,riskFlags:a.riskFlags||[]})),
    strongestCaution:strongestCaution?{advisor:strongestCaution.advisor,reason:strongestCaution.reason,riskFlags:strongestCaution.riskFlags||[]}:null,
    blockedPractices:blocked,
    eligibilityTrace:eligibilityAssessments.map(item=>({
      practiceId:item.practice.id,
      status:item.assessment.status,
      reasons:item.assessment.reasons,
      matchedContraindications:item.assessment.matchedContraindications,
      selectionEffect:item.assessment.status==='blocked'?'excluded':'none'
    })),
    eligibilityGovernance:'Only explicit blocked status excludes a Practice. Caution does not change ranking.',
    riskAsymmetries:advisors.flatMap(a=>(a.riskFlags||[]).filter(r=>r.severity==='critical'||r.reversibility==='difficult')),
    contradictions,
    evidenceDiversity,
    synthesisReadiness:criticalConcern && !blocked.length?'not-safe-to-proceed':contradictions.some(x=>x.severity==='high')?'ready-with-constraints':'ready-with-constraints'
  };
  const result={
    id:makeId('judgement'),createdAt:new Date().toISOString(),understanding,advisors,agora,
    practice:winner,mission:winner,duration,confidence,confidenceLevel:confidenceLabel(confidence),unknowns:understanding.unknowns,contradictions,evidenceDiversity,longitudinalEvidence:longitudinalVerification.valid?longitudinalEvidence:null,longitudinalVerification,calibrationEvidence:calibrationVerification.valid?calibrationEvidence:null,calibrationVerification,baseConfidence,confidenceCalibration:calibratedConfidence,
    judgement:judgementText(winner.id,duration,context),explanation:supporting.slice(0,3).map(a=>a.reason),reasons:supporting.slice(0,3).map(a=>a.reason),
    alternatives:ranked.slice(1,3).map(([id])=>CODEX.find(x=>x.id===id).name),delta,scores:totals,intention:intention(winner.id),status:'current'
  };
  result.minorityReports=buildMinorityReports(advisors,winner.id,agora);
  result.agora.minoritySummary=summarizeMinorityReports(result.minorityReports);
  result.deliberationTrace=buildDeliberationTrace({context,understanding,advisors,agora,decision:result});
  return result;
}

function opinion(name,position,confidence,reason,scores,weight=1,unknowns=[],riskFlags=[],evidence=[]){return {advisor:name,position,confidence,reason,scores,weight,unknowns,riskFlags,evidence};}
function bodyAdvisor(c,u,h){
  const recent=h.slice(0,2).some(x=>(x.decision?.practice||x.decision?.mission)?.id==='strength'&&x.completed);
  if(c.soreness==='significant') return opinion('Body','Oppose',92,'Significant soreness makes additional strength loading inappropriate until the physical state is reassessed.',{strength:-1.5,recovery:1.15,walk:.18,focus:.12,connection:.18},1.2,[],[{domain:'physical',severity:'critical',description:'Significant soreness with proposed strength loading.',reversibility:'difficult'}],[evidenceItem('current_signal','The person reported significant soreness.',{source:'Today signals',reliability:'high'}),evidenceItem('deterministic_rule','Significant soreness blocks additional strength loading.',{source:'Strategos safety policy',reliability:'high'})]);
  const mild=c.soreness==='mild';
  return opinion('Body',mild?'Caution':u.energy>.58?'Support':'Caution',Math.round((.55+u.energy*.35)*100),mild?'Mild soreness reduces the value of high-load work today.':u.energy>.58?'Your reported energy supports productive physical work.':'Your body may benefit more from a lower-cost practice today.',{strength:.35+u.energy*.65-(recent?.2:0)-(mild?.42:0),recovery:.35+(1-u.energy)*.5+(mild?.28:0),walk:.45+(mild?.12:0),focus:.2,connection:.1},1.1,recent?['Residual fatigue from recent strength work.']:[],mild?[{domain:'physical',severity:'moderate',description:'Mild soreness increases load sensitivity.',reversibility:'easy'}]:[],[evidenceItem('current_signal','Current energy and soreness signals.',{source:'Today signals',reliability:'moderate'}),...(recent?[evidenceItem('person_history','Recent reflected strength practice.',{source:'Journey history',reliability:'limited'})]:[])]);
}
function recoveryAdvisor(c,u){
  const emotional=c.emotionalLoad==='heavy'?.3:c.emotionalLoad==='light'?-.08:0;
  const soreness=c.soreness==='significant'?.45:c.soreness==='mild'?.16:0;
  const need=clamp((1-u.sleep)*.55+(1-u.energy)*.45+emotional+soreness);
  return opinion('Recovery',need>.48?'Caution':'Support',Math.round((.58+Math.abs(need-.5)*.5)*100),need>.48?'Recovery deserves greater weight than intensity today.':'Current sleep, energy and emotional load do not strongly constrain action.',{recovery:.25+need*.8,walk:.35+need*.25,strength:.7-need*.8,focus:.45-need*.35,connection:.28+emotional*.5},1.15,[],[],[evidenceItem('current_signal','Sleep, energy, soreness and emotional load.',{source:'Today signals',reliability:'moderate'})]);
}
function mindAdvisor(c,u){
  const focus=c.challenge==='focus'||c.challenge==='work';
  const heavy=c.emotionalLoad==='heavy';
  return opinion('Mind',heavy?'Caution':focus?'Support':'Neutral',heavy?82:focus?84:66,heavy?'High emotional load reduces the value of another cognitively demanding task.':focus?'Your principal challenge requires protected attention.':'There is no strong cognitive constraint in the signals provided.',{focus:heavy?.12:focus?.95:.35,walk:heavy?.62:c.challenge==='mind'?.7:.35,recovery:heavy?.82:.3,strength:heavy?.08:.3,connection:heavy?.68:.25},1,[],heavy?[{domain:'psychological',severity:'moderate',description:'Heavy emotional load may reduce cognitive capacity and increase burden.',reversibility:'easy'}]:[],[evidenceItem('current_signal','Current challenge and emotional load.',{source:'Today signals',reliability:'moderate'})]);
}
function agencyAdvisor(c,u){const heavy=c.emotionalLoad==='heavy';return opinion('Agency',heavy?'Caution':'Support',72,heavy?'The next action should remain deliberately small so it does not become another obligation.':`A ${c.time}-minute commitment is realistic enough to preserve follow-through.`,{strength:heavy?.08:c.time>=15?.6:.1,recovery:heavy?.82:.55,focus:heavy?.18:c.time>=15?.62:.2,walk:.65,connection:heavy?.7:.55},.9,[],[],[evidenceItem('current_signal','Available time and emotional load.',{source:'Today signals',reliability:'moderate'})])}
function purposeAdvisor(c){const work=c.challenge==='work'||c.challenge==='focus',heavy=c.emotionalLoad==='heavy';return opinion('Purpose',work&&!heavy?'Support':'Neutral',70,work&&!heavy?'Finishing one meaningful task is aligned with today’s stated priority.':heavy?'Purpose does not require adding a demanding task when current burden is already high.':'No single purpose claim dominates today.',{focus:work&&!heavy?.85:.22,connection:c.challenge==='family'?.7:.25,strength:.3,recovery:heavy?.62:.3,walk:.3},.85,[],[],[evidenceItem('current_signal','Person-stated priority and emotional load.',{source:'Today signals',reliability:'moderate'})])}
function relationshipsAdvisor(c){const relational=c.challenge==='family',heavy=c.emotionalLoad==='heavy';return opinion('Relationships',relational||heavy?'Support':'Neutral',relational?88:heavy?76:61,relational?'The most important pressure today is relational, not physical.':heavy?'Connection may provide support without adding another performance demand.':'No relevant relational conflict was identified.',{connection:relational?1:heavy?.72:.2,recovery:heavy?.55:.25,walk:.3,focus:heavy?.08:.2,strength:heavy?.04:.15},1,[],[],[evidenceItem('current_signal','Relational priority and emotional load.',{source:'Today signals',reliability:'moderate'})])}
function judgementText(id,d,c){if(c.soreness==='significant'&&id==='recovery')return `A ${d}-minute recovery practice is the safest useful direction while significant soreness is present.`;return {strength:`A ${d}-minute strength practice offers the best current balance of adaptation and continuity.`,recovery:`A ${d}-minute recovery practice appears to offer the highest return today.`,focus:`A protected ${d}-minute focus practice is my best current judgement.`,walk:`A ${d}-minute walk appears to create useful energy without unnecessary cost.`,connection:`A deliberate ${d}-minute act of connection appears more valuable than another performance task today.`}[id]}
function intention(id){return {strength:'Build strength deliberately.',recovery:'Recover without losing momentum.',focus:'Protect attention. Finish what matters.',walk:'Create energy, not fatigue.',connection:'Be fully present with someone who matters.'}[id]}
function scaleDelta(delta,factor){const out={};for(const [k,v] of Object.entries(delta))out[k]=+(v*Math.min(1.4,Math.max(.5,factor))).toFixed(2);out.overall=+Object.values(out).reduce((a,b)=>a+b,0).toFixed(2);return out}
function confidenceLabel(value){return value>=82?'Relatively Strong':value>=66?'Moderate':'Limited'}
function riskStrength(advisor){return (advisor.riskFlags||[]).reduce((max,r)=>Math.max(max,r.severity==='critical'?3:r.severity==='high'?2:r.severity==='moderate'?1:0),0)}
function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
