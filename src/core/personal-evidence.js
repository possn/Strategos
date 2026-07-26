import { outcomeLedgerLearningGate } from './outcome-ledger.js?v=0476p1';

export const PERSONAL_EVIDENCE_MINIMUM = 3;

export function buildPersonalEvidence(entries=[]){
  const valid=(entries||[]).filter(entry=>outcomeLedgerLearningGate(entry).eligible);
  const groups=new Map();
  valid.forEach(entry=>{
    const key=entry.practiceId||entry.practiceName||'unknown-practice';
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(entry);
  });
  return [...groups.entries()].map(([practiceId,items])=>summarisePractice(practiceId,items))
    .sort((a,b)=>b.directionalOutcomes-a.directionalOutcomes||b.helpRate-a.helpRate);
}

export function summarisePractice(practiceId,entries=[]){
  const items=[...(entries||[])].sort((a,b)=>new Date(a.recordedAt)-new Date(b.recordedAt));
  const counts={yes:0,partly:0,no:0};
  items.forEach(item=>{if(counts[item.result]!=null)counts[item.result]++});
  const total=items.length;
  const weighted=counts.yes+(counts.partly*.5);
  const helpRate=total?weighted/total:0;
  const evidenceLevel=personalEvidenceLevel(total);
  const recent=items.slice(-3);
  const earlier=items.slice(0,-3);
  const recentRate=rate(recent);
  const earlierRate=rate(earlier);
  const trajectory=earlier.length>=3
    ?recentRate>earlierRate+.15?'improving':recentRate<earlierRate-.15?'declining':'stable'
    :'not-enough-history';
  return {
    practiceId,
    practiceName:items.at(-1)?.practiceName||practiceId,
    directionalOutcomes:total,
    counts,
    helpRate,
    evidenceLevel,
    trajectory,
    firstObservedAt:items[0]?.recordedAt||null,
    lastObservedAt:items.at(-1)?.recordedAt||null,
    statement:personalEvidenceStatement({total,helpRate,evidenceLevel,trajectory}),
    automaticInfluence:0,
    provenance:'person-reported-outcomes-with-frozen-context'
  };
}

export function personalEvidenceLevel(count){
  if(count<PERSONAL_EVIDENCE_MINIMUM)return 'insufficient';
  if(count<5)return 'exploratory';
  if(count<8)return 'emerging';
  return 'established';
}

export function personalEvidenceStatement(summary){
  const {total=0,helpRate=0,evidenceLevel='insufficient',trajectory='not-enough-history'}=summary||{};
  if(total<PERSONAL_EVIDENCE_MINIMUM)return `${total} directional outcome${total===1?'':'s'} recorded. At least ${PERSONAL_EVIDENCE_MINIMUM} are needed before showing a personal pattern.`;
  const percent=Math.round(helpRate*100);
  const trend=trajectory==='improving'?' Recent outcomes are improving.':trajectory==='declining'?' Recent outcomes are less favourable.':trajectory==='stable'?' Recent outcomes are broadly stable.':'';
  return `${percent}% weighted helpfulness across ${total} person-reported outcomes. Evidence is ${evidenceLevel}.${trend}`;
}

export function personalEvidenceOverview(entries=[]){
  const summaries=buildPersonalEvidence(entries);
  const visible=summaries.filter(item=>item.evidenceLevel!=='insufficient');
  const totalDirectional=summaries.reduce((sum,item)=>sum+item.directionalOutcomes,0);
  const strongest=[...visible].sort((a,b)=>b.helpRate-a.helpRate||b.directionalOutcomes-a.directionalOutcomes)[0]||null;
  return {
    summaries,
    visible,
    totalDirectional,
    strongest,
    statement:visible.length
      ?`${visible.length} personal evidence pattern${visible.length===1?' is':'s are'} visible from ${totalDirectional} directional outcomes.`
      :`${totalDirectional} directional outcome${totalDirectional===1?' is':'s are'} available. More repeated experience is needed before a pattern is shown.`,
    modelInfluence:0,
    judgementInfluence:0
  };
}

function rate(items=[]){
  if(!items.length)return 0;
  return items.reduce((sum,item)=>sum+(item.result==='yes'?1:item.result==='partly'?.5:0),0)/items.length;
}
