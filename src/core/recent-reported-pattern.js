import {localDayKey,declaredDailySignals,todaySignals} from './daily-signals.js?v=pathways1';
// Conservative longitudinal pattern: at least three different explicitly reported
// days in the past seven, with at least two matching reports. Does not score health,
// fill missing days, or infer causality. Today's report always takes precedence.
export function recentReportedPattern(checkIns=[],now=new Date()){
 const days=new Set();
 for(let offset=0;offset<7;offset++)days.add(localDayKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()-offset)));
 const seen=new Set(),records=[];
 for(const item of Array.isArray(checkIns)?checkIns:[]){
  if(!item||!days.has(item.day)||seen.has(item.day))continue;
  seen.add(item.day);records.push(declaredDailySignals(item.signals));
 }
 if(records.length<3)return null;
 const count=(test)=>records.filter(test).length;
 // A repeated state is an observation, not a diagnosis or proof of worsening.
 const candidates=[
  {kind:'recovery',signal:'sleep',count:count(s=>s.sleep!==undefined&&s.sleep<=2)},
  {kind:'recovery',signal:'energy',count:count(s=>s.energy===1)},
  {kind:'stress',signal:'emotionalLoad',count:count(s=>s.emotionalLoad==='heavy')},
  {kind:'reflection',signal:'challenge',count:count(s=>['mind','focus','work','family'].includes(s.challenge))}
 ];
 const winner=candidates.find(x=>x.count>=2);
 return winner?{...winner,observedDays:records.length,windowDays:7}:null;
}
export function longitudinalReason(pattern,language='pt'){
 if(!pattern)return '';
 const pt=language==='pt';
 const labels=pt?{sleep:'sono insuficiente',energy:'energia baixa',emotionalLoad:'stress elevado',challenge:'desafios mentais ou relacionais'}:{sleep:'short sleep',energy:'low energy',emotionalLoad:'high stress',challenge:'mental or relational challenges'};
 return pt?`Nos últimos 7 dias referiste ${labels[pattern.signal]} em ${pattern.count} dias. É apenas um padrão de respostas.`:`You reported ${labels[pattern.signal]} on ${pattern.count} days in the past week. This is only a self-report pattern.`;
}
