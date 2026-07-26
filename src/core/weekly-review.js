import { dailyStoryTimeline } from './daily-story.js?v=0476p1';

export const WEEKLY_REVIEW_MINIMUM_DAYS = 3;

function dayKey(value){
  const date=value instanceof Date?value:new Date(value);
  if(Number.isNaN(date.getTime()))return null;
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

export function weeklyWindow(now=new Date()){
  const end=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const start=new Date(end);
  start.setDate(start.getDate()-6);
  return {start:dayKey(start),end:dayKey(end),id:`week-${dayKey(start)}-${dayKey(end)}`};
}

export function buildWeeklyReview(state={},now=new Date()){
  const window=weeklyWindow(now);
  const stories=dailyStoryTimeline(state,30).filter(item=>item.day>=window.start&&item.day<=window.end).sort((a,b)=>a.day.localeCompare(b.day));
  const recordedDays=stories.filter(item=>item.stage!=='opened').length;
  const completedDays=stories.filter(item=>item.stage==='complete').length;
  const practiceDays=stories.filter(item=>['reflection','complete'].includes(item.stage)).length;
  const outcomes=(state.outcomeLedger||[]).filter(item=>String(item?.recordedAt||'').slice(0,10)>=window.start&&String(item?.recordedAt||'').slice(0,10)<=window.end);
  const directional=outcomes.filter(item=>['helped','helped-partly','did-not-help'].includes(item?.result));
  const favourable=directional.filter(item=>['helped','helped-partly'].includes(item.result)).length;
  const checkIns=(state.dailyCheckIns||[]).filter(item=>item?.day>=window.start&&item?.day<=window.end);
  const priorities={};
  for(const item of checkIns){const priority=item?.signals?.challenge;if(priority)priorities[priority]=(priorities[priority]||0)+1;}
  const dominantPriority=Object.entries(priorities).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0]?.[0]||null;
  const ready=recordedDays>=WEEKLY_REVIEW_MINIMUM_DAYS;
  const headline=!ready?'Your week is still forming.':practiceDays===0?'You preserved context this week.':completedDays>=5?'A consistent week of deliberate practice.':completedDays>=3?'A week with meaningful continuity.':'A week with several deliberate steps.';
  const carry=dominantPriority?`The most frequent declared priority was ${dominantPriority}.`:'No single declared priority dominated the week.';
  const evidence=directional.length?`${favourable} of ${directional.length} directional outcomes were favourable or partly favourable.`:'No directional outcome pattern was available this week.';
  return {id:window.id,...window,ready,recordedDays,completedDays,practiceDays,directionalOutcomes:directional.length,favourableOutcomes:favourable,dominantPriority,headline,carry,evidence,statement:ready?'This review describes the last seven calendar days. It does not score the person or infer causality.':`Record at least ${WEEKLY_REVIEW_MINIMUM_DAYS} days to form a weekly review.`};
}

export function preserveWeeklyReview(reviews=[],review={},now=new Date()){
  if(!review?.ready)return [...(reviews||[])];
  const snapshot={...review,preservedAt:now.toISOString(),status:'preserved'};
  return [snapshot,...(reviews||[]).filter(item=>item?.id!==review.id)].sort((a,b)=>String(b.end).localeCompare(String(a.end))).slice(0,104);
}

export function weeklyReviewForWindow(reviews=[],id=''){
  return (reviews||[]).find(item=>item?.id===id)||null;
}
