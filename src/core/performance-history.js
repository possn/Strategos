// Optional, locally stored self-reports. Not clinical measurements or a health score.
export const PERFORMANCE_HISTORY_LIMIT=12;
const validAnswers=a=>Array.isArray(a)&&a.length===5&&a.every((n,i)=>Number.isInteger(n)&&n>=0&&n<(i===0?4:3));
export function normalisePerformanceHistory(input){
 if(!Array.isArray(input))return [];
 const seen=new Set();
 return input.filter(item=>{
  if(!item||typeof item!=='object'||!validAnswers(item.answers)||item.answers[4]!==0)return false;
  if(typeof item.date!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(item.date)||Number.isNaN(Date.parse(item.date+'T12:00:00Z'))||seen.has(item.date))return false;
  seen.add(item.date);return true;
 }).map(item=>({date:item.date,answers:[...item.answers]})).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,PERFORMANCE_HISTORY_LIMIT);
}
export function recordPerformanceCheck(history,answers,{date=new Date()}={}){
 if(!validAnswers(answers)||answers[4]!==0)return normalisePerformanceHistory(history);
 const key=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
 return normalisePerformanceHistory([{date:key,answers:[...answers]},...normalisePerformanceHistory(history).filter(item=>item.date!==key)]);
}
export function performanceHistorySummary(input,language='pt'){
 const pt=language==='pt',items=normalisePerformanceHistory(input);
 if(!items.length)return pt?'Ainda sem registos guardados.':'No saved check-ins yet.';
 const last=items[0],count=items.length;
 return pt?`${count} registo${count===1?'':'s'} guardado${count===1?'':'s'}. Último: ${last.date}. Compara hábitos, não diagnósticos.`:`${count} saved check-in${count===1?'':'s'}. Latest: ${last.date}. Compare habits, not diagnoses.`;
}
export function performanceHistoryComparison(input,answers,language='pt'){
 const items=normalisePerformanceHistory(input);
 if(!items.length||!validAnswers(answers)||answers[4]!==0)return '';
 const previous=items[0].answers;
 const pt=language==='pt';
 const names=pt?['Prioridade','Sono','Atividade','Stress']:['Priority','Sleep','Activity','Stress'];
 const changed=[0,1,2,3].filter(i=>previous[i]!==answers[i]).map(i=>names[i]);
 if(!changed.length)return pt?'As respostas mantiveram-se iguais às do último registo.':'Your answers match the last saved check-in.';
 return pt?`Mudaram estas respostas: ${changed.join(', ')}. Isto não demonstra melhoria clínica.`:`Changed answers: ${changed.join(', ')}. This does not establish clinical improvement.`;
}
