import { localDayKey, dailyCheckInForDay } from './daily-signals.js?v=0476p1';

export const REQUIRED_DAILY_SIGNALS=['sleep','energy','time','challenge','soreness','emotionalLoad'];

export function dailyContextEvidence(checkIns=[],now=new Date()){
  const day=localDayKey(now);
  const record=dailyCheckInForDay(checkIns,day);
  const signals=record?.signals&&typeof record.signals==='object'?record.signals:{};
  const present=REQUIRED_DAILY_SIGNALS.filter(key=>signals[key]!==undefined&&signals[key]!==null&&signals[key]!=='');
  return {
    day,
    record:record||null,
    signals:record?{...signals}:{},
    completed:present.length,
    required:REQUIRED_DAILY_SIGNALS.length,
    sufficient:Boolean(record)&&present.length===REQUIRED_DAILY_SIGNALS.length,
    missing:REQUIRED_DAILY_SIGNALS.filter(key=>!present.includes(key)),
    source:record?.source||null
  };
}

export function currentDayJudgement(judgements=[],now=new Date()){
  const day=localDayKey(now);
  return (judgements||[]).find(item=>String(item?.createdAt||'').slice(0,10)===day&&!['reviewed','abandoned','superseded'].includes(item?.status))||null;
}

export function evidenceGate({checkIns=[],judgements=[],now=new Date()}={}){
  const context=dailyContextEvidence(checkIns,now);
  const judgement=context.sufficient?currentDayJudgement(judgements,now):null;
  return {
    day:context.day,
    context,
    judgement,
    canDeliberate:context.sufficient,
    canExplain:Boolean(judgement),
    statement:context.sufficient?'Current-day evidence is sufficient for deliberation.':'Current-day evidence is insufficient. Strategos must ask before deliberating.'
  };
}
