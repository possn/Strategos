import { buildPersonalEvidence, PERSONAL_EVIDENCE_MINIMUM } from './personal-evidence.js?v=0476p1';

export const BELIEF_STATUSES=['proposed','confirmed','rejected','retired'];

export function buildBeliefProposals(outcomeLedger=[],beliefs=[]){
  const existing=new Map((beliefs||[]).map(item=>[item.key,item]));
  return buildPersonalEvidence(outcomeLedger)
    .filter(item=>item.directionalOutcomes>=PERSONAL_EVIDENCE_MINIMUM)
    .map(summary=>{
      const key=`practice-helpfulness:${summary.practiceId}`;
      const prior=existing.get(key);
      return {
        id:prior?.id||makeId('belief'),
        key,
        type:'practice-helpfulness',
        subjectId:summary.practiceId,
        subjectName:summary.practiceName,
        statement:beliefStatement(summary),
        confidence:beliefConfidence(summary),
        evidenceLevel:summary.evidenceLevel,
        supportingEvidence:summary.directionalOutcomes,
        contradictions:summary.counts.no,
        helpRate:summary.helpRate,
        firstObservedAt:summary.firstObservedAt,
        lastObservedAt:summary.lastObservedAt,
        status:prior?.status||'proposed',
        personReviewedAt:prior?.personReviewedAt||null,
        reviewNote:prior?.reviewNote||'',
        source:'repeated-person-reported-outcomes',
        automaticHumanModelInfluence:0,
        automaticJudgementInfluence:0,
        automaticPracticeSelectionInfluence:0
      };
    });
}

export function reconcileBeliefs(beliefs=[],outcomeLedger=[]){
  const proposals=buildBeliefProposals(outcomeLedger,beliefs);
  const keys=new Set(proposals.map(item=>item.key));
  const retained=(beliefs||[]).filter(item=>!keys.has(item.key));
  return [...proposals,...retained].slice(0,200);
}

export function reviewBelief(beliefs=[],beliefId,{action,note='',at=new Date().toISOString()}={}){
  if(!['confirm','reject','reopen','retire'].includes(action))return [...beliefs];
  return (beliefs||[]).map(item=>item.id!==beliefId?item:{
    ...item,
    status:action==='confirm'?'confirmed':action==='reject'?'rejected':action==='retire'?'retired':'proposed',
    personReviewedAt:at,
    reviewNote:String(note||'').trim()
  });
}

export function beliefAudit(beliefs=[]){
  const counts=Object.fromEntries(BELIEF_STATUSES.map(status=>[status,0]));
  (beliefs||[]).forEach(item=>{if(counts[item.status]!=null)counts[item.status]++});
  return {
    total:(beliefs||[]).length,
    counts,
    statement:(beliefs||[]).length
      ?`${counts.confirmed} confirmed, ${counts.proposed} awaiting review, ${counts.rejected} rejected.`
      :'No belief candidate has enough repeated evidence yet.'
  };
}

export function beliefStatement(summary){
  const percent=Math.round((summary?.helpRate||0)*100);
  return `${summary.practiceName} has ${percent}% weighted helpfulness across ${summary.directionalOutcomes} person-reported outcomes.`;
}

export function beliefConfidence(summary){
  const n=summary?.directionalOutcomes||0;
  const maturity=n<5?.35:n<8?.55:.7;
  const consistency=Math.abs((summary?.helpRate||0)-.5)*.6;
  return Math.min(.9,Number((maturity+consistency).toFixed(2)));
}

function makeId(prefix){return globalThis.crypto?.randomUUID?`${prefix}-${crypto.randomUUID()}`:`${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`}
