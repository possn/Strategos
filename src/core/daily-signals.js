export const DAILY_SIGNAL_DEFAULTS={sleep:3,energy:2,time:15,challenge:'body',soreness:'none',emotionalLoad:'usual'};

export function localDayKey(value=new Date()){
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime()))return '';
  const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

export function normaliseDailySignals(input={}){
  const source=input&&typeof input==='object'?input:{};
  return {
    sleep:[1,2,3,4].includes(Number(source.sleep))?Number(source.sleep):DAILY_SIGNAL_DEFAULTS.sleep,
    energy:[1,2,3].includes(Number(source.energy))?Number(source.energy):DAILY_SIGNAL_DEFAULTS.energy,
    time:[5,15,30,60].includes(Number(source.time))?Number(source.time):DAILY_SIGNAL_DEFAULTS.time,
    challenge:['body','mind','focus','recovery','family','work'].includes(source.challenge)?source.challenge:DAILY_SIGNAL_DEFAULTS.challenge,
    soreness:['none','mild','significant'].includes(source.soreness)?source.soreness:DAILY_SIGNAL_DEFAULTS.soreness,
    emotionalLoad:['light','usual','heavy'].includes(source.emotionalLoad)?source.emotionalLoad:DAILY_SIGNAL_DEFAULTS.emotionalLoad
  };
}

// Preserve absence: defaults are useful for presentation, never as reported evidence.
export function declaredDailySignals(input={}){
  const source=input&&typeof input==='object'?input:{};
  const allowed={sleep:[1,2,3,4],energy:[1,2,3],time:[5,15,30,60],challenge:['body','mind','focus','recovery','family','work'],soreness:['none','mild','significant'],emotionalLoad:['light','usual','heavy']};
  return Object.fromEntries(Object.entries(allowed).flatMap(([key,values])=>{
    const raw=source[key];
    if(raw===null||raw===undefined||raw===''||typeof raw==='boolean')return [];
    const value=['sleep','energy','time'].includes(key)?Number(raw):raw;
    return values.includes(value)?[[key,value]]:[];
  }));
}

export function todaySignals(checkIns=[],now=new Date()){
  const day=localDayKey(now);
  const record=(checkIns||[]).find(item=>item?.day===day);
  return record?declaredDailySignals(record.signals):{};
}

export function upsertDailyCheckIn(checkIns=[],signals,{now=new Date(),source='today'}={}){
  const day=localDayKey(now),at=now.toISOString(),normalised=declaredDailySignals(signals);
  const existing=(checkIns||[]).find(item=>item?.day===day);
  const record={id:existing?.id||`checkin-${day}`,day,signals:normalised,createdAt:existing?.createdAt||at,updatedAt:at,source};
  return [record,...(checkIns||[]).filter(item=>item?.day!==day)].slice(0,400);
}

export function dailyCheckInForDay(checkIns=[],day){
  return (checkIns||[]).find(item=>item?.day===day)||null;
}

export function dailyCheckInSummary(record){
  if(!record)return 'Today’s signals have not been saved yet.';
  const declared=declaredDailySignals(record.signals);
  const count=Object.keys(declared).length;
  if(count<6)return `${count}/6 signals reported. Today’s context is incomplete.`;
  const s=declared;
  return `Sleep ${s.sleep}/4 · Energy ${s.energy}/3 · ${s.time} min · ${s.challenge}`;
}
