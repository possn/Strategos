import { expireStaleLearnings,normalizeAdvisorMemories,buildMonthlyCouncil } from './advisor-memory.js?v=0476p1';
import { assessJudgementValidity,JUDGEMENT_VALIDITY } from './judgement-stability.js?v=0476p1';

const CLOSED_JUDGEMENT_STATUSES=new Set(['reviewed','abandoned']);
const CLOSED_VALIDITY_STATUSES=new Set([
  JUDGEMENT_VALIDITY.CLOSED,
  JUDGEMENT_VALIDITY.SUPERSEDED
]);

export function reconcileLongitudinalState(input,now=Date.now()){
  const state=clone(input||{});
  const report={
    duplicateJudgementsRemoved:0,
    duplicateHistoryRemoved:0,
    historyLinksRepaired:0,
    judgementStatusesRepaired:0,
    staleCurrentCleared:false,
    staleLearningsExpired:0
  };

  state.judgements=dedupeById(state.judgements||[],report,'duplicateJudgementsRemoved');
  state.history=dedupeHistory(state.history||[],report);

  const historyByJudgement=new Map();
  for(const entry of state.history){
    const id=entry?.decision?.id||entry?.judgementId;
    if(!id)continue;
    if(!entry.judgementId){
      entry.judgementId=id;
      report.historyLinksRepaired+=1;
    }
    if(!historyByJudgement.has(id))historyByJudgement.set(id,entry);
  }

  for(const judgement of state.judgements){
    const historyEntry=historyByJudgement.get(judgement.id);
    if(historyEntry&&judgement.status!=='reviewed'){
      judgement.status='reviewed';
      judgement.reflection=historyEntry.reflection||judgement.reflection||null;
      judgement.validity={
        ...(judgement.validity||{}),
        status:JUDGEMENT_VALIDITY.CLOSED,
        closedAt:historyEntry.completedAt||judgement.validity?.closedAt||new Date(now).toISOString()
      };
      report.judgementStatusesRepaired+=1;
    }
    if(CLOSED_JUDGEMENT_STATUSES.has(judgement.status)&&!CLOSED_VALIDITY_STATUSES.has(judgement.validity?.status)){
      judgement.validity={
        ...(judgement.validity||{}),
        status:JUDGEMENT_VALIDITY.CLOSED,
        closedAt:judgement.validity?.closedAt||new Date(now).toISOString()
      };
      report.judgementStatusesRepaired+=1;
    }
  }

  if(state.current?.decision){
    const currentId=state.current.decision.id;
    const canonical=state.judgements.find(item=>item.id===currentId);
    const currentValidity=canonical
      ?assessJudgementValidity(canonical,state.current.context||canonical.context||{},now)
      :state.current.decision.validity;

    const closed=canonical&&(
      CLOSED_JUDGEMENT_STATUSES.has(canonical.status)||
      CLOSED_VALIDITY_STATUSES.has(currentValidity?.status)
    );
    const impossible=!currentId||!canonical;
    if(closed||impossible){
      state.current=null;
      report.staleCurrentCleared=true;
    }else{
      canonical.validity=currentValidity;
      state.current.decision={...canonical};
    }
  }

  const before=countLearningStatus(state.advisorMemories,'expired');
  state.advisorMemories=expireStaleLearnings(normalizeAdvisorMemories(state.advisorMemories||{}),now);
  const after=countLearningStatus(state.advisorMemories,'expired');
  report.staleLearningsExpired=Math.max(0,after-before);

  state.deltaTotal=calculateDeltaTotal(state.history);
  state.integrity={
    ...(state.integrity||{}),
    lastReconciledAt:new Date(now).toISOString(),
    lastReport:report
  };
  return {state,report};
}

export function createMonthlyCouncilSnapshot(state,now=new Date()){
  const council=buildMonthlyCouncil(state.advisorMemories||{},state.history||[]);
  const monthKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  return {
    id:`council-${monthKey}`,
    monthKey,
    month:council.month,
    createdAt:now.toISOString(),
    summary:council.summary,
    completed:council.completed,
    confirmed:council.confirmed,
    candidates:council.candidates,
    voices:council.voices,
    strongest:council.strongest,
    weakest:council.weakest,
    status:'snapshot'
  };
}

export function upsertMonthlyCouncilReport(reports=[],state,now=new Date()){
  const snapshot=createMonthlyCouncilSnapshot(state,now);
  const next=[...(reports||[])];
  const index=next.findIndex(report=>report.monthKey===snapshot.monthKey);
  if(index>=0)next[index]=snapshot;
  else next.unshift(snapshot);
  return next
    .sort((a,b)=>String(b.monthKey).localeCompare(String(a.monthKey)))
    .slice(0,24);
}

export function journeyRecords(state){
  const historyById=new Map((state.history||[]).map(entry=>[
    entry.judgementId||entry.decision?.id,
    entry
  ]));
  return (state.judgements||[])
    .filter(judgement=>judgement.status==='reviewed')
    .map(judgement=>{
      const history=historyById.get(judgement.id);
      return {
        ...judgement,
        reflection:history?.reflection||judgement.reflection||null,
        completedAt:history?.completedAt||judgement.validity?.closedAt||judgement.createdAt,
        historyLinked:Boolean(history),
        adaptationAccountability:history?.adaptationAccountability||null,
        practiceContract:history?.practiceContract||null,
        practiceContractOutcome:history?.practiceContractOutcome||null,
        completionRatio:Number.isFinite(Number(history?.completionRatio))?Number(history.completionRatio):history?.completed?1:null,
        personChoice:history?.decision?.personChoice||judgement.personChoice||null
      };
    })
    .sort((a,b)=>new Date(b.completedAt)-new Date(a.completedAt));
}

export function calculateDeltaTotal(history=[]){
  return +history.reduce((sum,entry)=>{
    const value=Number(entry?.decision?.delta?.overall||0);
    return sum+(Number.isFinite(value)?value:0);
  },0).toFixed(2);
}

function dedupeById(items,report,key){
  const seen=new Set();
  return items.filter(item=>{
    const id=item?.id;
    if(!id)return true;
    if(seen.has(id)){
      report[key]+=1;
      return false;
    }
    seen.add(id);
    return true;
  });
}

function dedupeHistory(items,report){
  const seen=new Set();
  return items.filter(entry=>{
    const key=entry?.judgementId||entry?.decision?.id||[
      entry?.completedAt,
      entry?.decision?.practice?.id,
      entry?.reflection
    ].join('|');
    if(seen.has(key)){
      report.duplicateHistoryRemoved+=1;
      return false;
    }
    seen.add(key);
    return true;
  });
}

function countLearningStatus(memories,status){
  return Object.values(memories||{}).reduce(
    (sum,memory)=>sum+(memory.notes||[]).filter(note=>note.status===status).length,
    0
  );
}

function clone(value){
  if(typeof structuredClone==='function')return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}
