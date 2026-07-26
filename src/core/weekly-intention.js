export const WEEKLY_INTENTION_OPTIONS = Object.freeze([
  ['consistency','Protect consistency'],
  ['recovery','Protect recovery'],
  ['strength','Build strength'],
  ['focus','Protect focus'],
  ['relationships','Make room for relationships'],
  ['custom','Write my own direction']
]);

function clean(value,max=180){return String(value||'').trim().replace(/\s+/g,' ').slice(0,max)}

export function weeklyIntentionLabel(value=''){
  return WEEKLY_INTENTION_OPTIONS.find(([id])=>id===value)?.[1]||'Personal direction';
}

export function createWeeklyIntention({weekId='',choice='',note='',now=new Date()}={}){
  const valid=WEEKLY_INTENTION_OPTIONS.some(([id])=>id===choice);
  if(!weekId||!valid)return null;
  const custom=choice==='custom'?clean(note):'';
  if(choice==='custom'&&!custom)return null;
  return {
    id:`intention-${weekId}`,
    weekId,
    choice,
    label:choice==='custom'?custom:weeklyIntentionLabel(choice),
    note:choice==='custom'?'':clean(note),
    createdAt:now.toISOString(),
    source:'person-selected',
    judgementInfluence:0,
    humanModelInfluence:0,
    statement:'This direction was selected by the person. It does not automatically alter judgements or Practices.'
  };
}

export function upsertWeeklyIntention(items=[],intention=null){
  if(!intention)return [...(items||[])];
  return [intention,...(items||[]).filter(item=>item?.weekId!==intention.weekId)]
    .sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,104);
}

export function weeklyIntentionForWeek(items=[],weekId=''){
  return (items||[]).find(item=>item?.weekId===weekId)||null;
}

export function clearWeeklyIntention(items=[],weekId=''){
  return (items||[]).filter(item=>item?.weekId!==weekId);
}
