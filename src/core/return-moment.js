// Quiet, factual continuity based only on explicitly recorded activity.
// No streak, score, notification, diagnosis or artificial reward.
const dayKey=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
function recentDays(now){
 const result=new Set();
 for(let n=0;n<7;n++){const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-n);result.add(dayKey(d))}
 return result;
}
export function recentActivityDays(state={},now=new Date()){
 const days=recentDays(now),recorded=new Set();
 const add=v=>{if(typeof v==='string'){const key=v.slice(0,10);if(days.has(key))recorded.add(key)}};
 // Counting check-in, a dated practice or a journal entry—not mere app opens.
 for(const item of state.dailyCheckIns||[])add(item?.day);
 for(const item of state.history||[])add(item?.completedAt||item?.createdAt);
 for(const item of state.emotionalJournalEntries||[])add(item?.entryDate);
 return recorded.size;
}
export function returnMoment(state={},language='pt',now=new Date()){
 const pt=language!=='en',days=recentActivityDays(state,now);
 const eyebrow=days===0?(pt?'UM PASSO DE CADA VEZ':'ONE STEP AT A TIME'):
   (pt?`${days} ${days===1?'DIA COM REGISTOS':'DIAS COM REGISTOS'} EM 7`:`${days} OF 7 DAYS WITH RECORDS`);
 const journey=days===0?(pt?'Ainda não há registos recentes. Começa quando fizer sentido.':'No recent records yet. Begin when it feels useful.'):
   (pt?`Nos últimos 7 dias registaste atividade em ${days} ${days===1?'dia':'dias'}. Não precisas de manter uma sequência.`:`You recorded activity on ${days} of the past 7 days. You do not need to maintain a streak.`);
 return {days,eyebrow,journey};
}
