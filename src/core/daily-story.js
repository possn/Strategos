import { localDayKey, normaliseDailySignals } from './daily-signals.js?v=0476p1';

export const DAILY_STORY_STAGES=['opened','check-in','judgement','practice','reflection','complete'];

export function dayNumber(startedAt,now=new Date()){
  const start=startedAt?new Date(startedAt):null;
  if(!start||Number.isNaN(start.getTime()))return 1;
  const a=new Date(start.getFullYear(),start.getMonth(),start.getDate());
  const b=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  return Math.max(1,Math.floor((b-a)/86400000)+1);
}

export function upsertDailyStory(stories=[],patch={},now=new Date()){
  const day=patch.day||localDayKey(now);
  const existing=(stories||[]).find(item=>item?.day===day)||{id:`day-${day}`,day,openedAt:now.toISOString(),stage:'opened'};
  const next={...existing,...patch,day,id:existing.id,updatedAt:now.toISOString()};
  return [next,...(stories||[]).filter(item=>item?.day!==day)].sort((a,b)=>String(b.day).localeCompare(String(a.day))).slice(0,1000);
}

export function deriveDailyStory({stories=[],checkIns=[],judgements=[],history=[],journalEntries=[]}={},now=new Date()){
  const day=localDayKey(now);
  const base=(stories||[]).find(item=>item?.day===day)||{id:`day-${day}`,day,stage:'opened'};
  const checkIn=(checkIns||[]).find(item=>item?.day===day)||null;
  const judgement=(judgements||[]).find(item=>String(item?.createdAt||'').slice(0,10)===day)||null;
  const completed=(history||[]).find(item=>String(item?.completedAt||item?.createdAt||'').slice(0,10)===day)||null;
  const journal=(journalEntries||[]).find(item=>item?.entryDate===day)||null;
  let stage='opened';
  if(checkIn)stage='check-in';
  if(judgement)stage='judgement';
  if(judgement?.status==='in-practice')stage='practice';
  if(completed)stage='reflection';
  if(completed&&(journal||base.eveningClosed))stage='complete';
  const signals=checkIn?normaliseDailySignals(checkIn.signals):null;
  return {...base,day,stage,signals,judgement:judgement?{id:judgement.id,statement:judgement.judgement,practiceName:judgement.practice?.name||null,confidence:judgement.confidence}:base.judgement||null,practice:completed?{name:completed.decision?.practice?.name||null,reflection:completed.reflection||null,completedAt:completed.completedAt}:base.practice||null,eveningReflection:Boolean(journal||base.eveningReflection),eveningClosed:Boolean(base.eveningClosed),eveningReflectionSkipped:Boolean(base.eveningReflectionSkipped),closedAt:base.closedAt||null};
}

export function dailyStorySummary(story){
  if(!story)return 'Today is ready to begin.';
  const labels={opened:'Ready to begin', 'check-in':'Context recorded', judgement:'Judgement formed', practice:'Practice in progress', reflection:'Practice reflected', complete:'Day complete'};
  return labels[story.stage]||labels.opened;
}

export function dailyStoryTimeline(state={},limit=14){
  const days=new Set([...(state.dailyStories||[]).map(x=>x?.day),...(state.dailyCheckIns||[]).map(x=>x?.day),...(state.history||[]).map(x=>String(x?.completedAt||x?.createdAt||'').slice(0,10)),...(state.emotionalJournalEntries||[]).map(x=>x?.entryDate)].filter(Boolean));
  return [...days].sort((a,b)=>b.localeCompare(a)).slice(0,limit).map(day=>deriveDailyStory({stories:state.dailyStories,checkIns:state.dailyCheckIns,judgements:state.judgements,history:state.history,journalEntries:state.emotionalJournalEntries},new Date(`${day}T12:00:00`)));
}
