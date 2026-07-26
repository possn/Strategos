import { localDayKey } from './daily-signals.js?v=0476p1';

export function buildEveningExperience({story=null,journalEntry=null,now=new Date()}={}){
  const day=localDayKey(now);
  const ready=Boolean(story&&['reflection','complete'].includes(story.stage));
  const complete=Boolean(story?.stage==='complete'||story?.eveningClosed||journalEntry);
  return {
    day,ready,complete,
    eyebrow:complete?'DAY CLOSED':'ONE MINUTE',
    title:complete?'Today is preserved.':'What mattered today?',
    prompt:'One honest sentence is enough.',
    primaryAction:complete?'journey':'eveningReflection',
    primaryLabel:complete?'Open today in Journey':'Close the day',
    statement:complete?'The day is closed without a score or judgement.':ready?'Practice has been reflected. You may now preserve what mattered, or close the day without writing.':'The evening reflection becomes available after the Practice reflection.'
  };
}

export function closeDailyStory(stories=[],{day=localDayKey(),written=false,skipped=false,at=new Date().toISOString()}={}){
  const existing=(stories||[]).find(item=>item?.day===day)||{id:`day-${day}`,day,openedAt:at};
  const next={...existing,stage:'complete',eveningClosed:true,eveningReflection:Boolean(written),eveningReflectionSkipped:Boolean(skipped),closedAt:at,updatedAt:at};
  return [next,...(stories||[]).filter(item=>item?.day!==day)].sort((a,b)=>String(b.day).localeCompare(String(a.day))).slice(0,1000);
}
