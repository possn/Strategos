export const EMOTIONAL_JOURNAL_VERSION=1;

export function createEmotionalJournalEntry({
  text='',
  entryDate=new Date().toISOString().slice(0,10),
  at=new Date().toISOString()
}={}){
  const content=String(text||'').trim();
  if(!content)return null;
  return {
    id:`emotional-journal-${entryDate}-${Date.parse(at)||Date.now()}`,
    version:EMOTIONAL_JOURNAL_VERSION,
    entryDate,
    text:content,
    createdAt:at,
    updatedAt:at,
    source:'person',
    status:'private-reflection',
    judgementInfluence:0,
    humanModelInfluence:0,
    safetyInfluence:0,
    statement:'A voluntary free-writing reflection preserved by the person.'
  };
}

export function updateEmotionalJournalEntry(entry,{
  text,
  at=new Date().toISOString()
}={}){
  if(!entry)return null;
  const content=String(text??entry.text??'').trim();
  if(!content)return entry;
  return {...entry,text:content,updatedAt:at};
}

export function deleteEmotionalJournalEntry(entries=[],entryId){
  return (entries||[]).filter(entry=>entry?.id!==entryId);
}

export function upsertEmotionalJournalEntry(entries=[],entry){
  if(!entry)return [...(entries||[])];
  const index=(entries||[]).findIndex(item=>item?.id===entry.id);
  if(index<0)return [entry,...(entries||[])];
  return (entries||[]).map(item=>item?.id===entry.id?entry:item);
}

export function emotionalJournalEntries(entries=[]){
  return [...(entries||[])].filter(Boolean).sort((a,b)=>
    Date.parse(b.updatedAt||b.createdAt||0)-Date.parse(a.updatedAt||a.createdAt||0)
  );
}

export function emotionalJournalToday(entries=[],date=new Date().toISOString().slice(0,10)){
  return emotionalJournalEntries(entries).find(entry=>entry.entryDate===date)||null;
}

export function emotionalJournalAudit(entries=[]){
  const list=emotionalJournalEntries(entries);
  return {
    total:list.length,
    latestAt:list[0]?.updatedAt||null,
    judgementInfluence:0,
    humanModelInfluence:0,
    safetyInfluence:0,
    statement:list.length
      ?'Voluntary emotional reflections are preserved privately and remain non-influential.'
      :'No emotional journal entry has been written.'
  };
}

export function emotionalJournalPreview(entry,maxLength=150){
  const text=String(entry?.text||'').replace(/\s+/g,' ').trim();
  if(text.length<=maxLength)return text;
  return `${text.slice(0,Math.max(0,maxLength-1)).trim()}…`;
}

export const EMOTIONAL_JOURNAL_THEMES=['body','mind','recovery','relationships','purpose','work','gratitude','difficulty'];

export function setEmotionalJournalThemes(entry,themes=[],at=new Date().toISOString()){
  if(!entry)return null;
  const selected=[...new Set((themes||[]).filter(theme=>EMOTIONAL_JOURNAL_THEMES.includes(theme)))];
  return {...entry,themes:selected,themesUpdatedAt:at,themeSource:'person',judgementInfluence:0,humanModelInfluence:0,safetyInfluence:0};
}
export function toggleEmotionalJournalTheme(entry,theme,at=new Date().toISOString()){
  if(!entry||!EMOTIONAL_JOURNAL_THEMES.includes(theme))return entry||null;
  const current=new Set(entry.themes||[]);
  current.has(theme)?current.delete(theme):current.add(theme);
  return setEmotionalJournalThemes(entry,[...current],at);
}
export function emotionalJournalEvolution(entries=[]){
  const list=emotionalJournalEntries(entries);
  const counts=Object.fromEntries(EMOTIONAL_JOURNAL_THEMES.map(theme=>[theme,0]));
  for(const entry of list)for(const theme of entry.themes||[])if(theme in counts)counts[theme]+=1;
  const ranked=Object.entries(counts).filter(([,count])=>count>0).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([theme,count])=>({theme,count}));
  return {totalEntries:list.length,themedEntries:list.filter(entry=>(entry.themes||[]).length).length,counts,ranked,judgementInfluence:0,humanModelInfluence:0,safetyInfluence:0,statement:ranked.length?'Your self-selected themes show what you chose to preserve over time.':'No personal themes have been selected yet.'};
}
export function emotionalJournalThemeLabel(theme){
  return ({body:'Body',mind:'Mind',recovery:'Recovery',relationships:'Relationships',purpose:'Purpose',work:'Work',gratitude:'Gratitude',difficulty:'Difficulty'})[theme]||theme;
}


export const EMOTIONAL_JOURNAL_FOLLOW_UPS=['still-present','changed','resolved','uncertain'];

export function applyEmotionalJournalFollowUp(entry,{outcome,note='',at=new Date().toISOString()}={}){
  if(!entry||!EMOTIONAL_JOURNAL_FOLLOW_UPS.includes(outcome))return entry||null;
  return {...entry,followUp:{
    outcome,
    note:String(note||'').trim(),
    recordedAt:at,
    source:'person',
    judgementInfluence:0,
    humanModelInfluence:0,
    safetyInfluence:0,
    statement:outcome==='still-present'
      ?'The person reported that this remains emotionally present.'
      :outcome==='changed'
        ?'The person reported that their relationship to this reflection has changed.'
        :outcome==='resolved'
          ?'The person reported that this no longer feels unresolved.'
          :'The person preserved uncertainty about how this has evolved.'
  }};
}
export function reopenEmotionalJournalFollowUp(entry){
  if(!entry)return null;
  const next={...entry};delete next.followUp;return next;
}
export function emotionalJournalFollowUpAudit(entries=[]){
  const list=emotionalJournalEntries(entries);
  const followed=list.filter(entry=>entry.followUp);
  const counts=Object.fromEntries(EMOTIONAL_JOURNAL_FOLLOW_UPS.map(outcome=>[outcome,0]));
  for(const entry of followed)if(entry.followUp?.outcome in counts)counts[entry.followUp.outcome]+=1;
  return {
    totalEntries:list.length,
    reviewed:followed.length,
    awaiting:list.length-followed.length,
    counts,
    judgementInfluence:0,
    humanModelInfluence:0,
    safetyInfluence:0,
    statement:followed.length
      ?'Your explicit follow-ups show how you say earlier reflections have evolved.'
      :'No earlier reflection has been reviewed yet.'
  };
}
export function emotionalJournalFollowUpLabel(outcome){
  return ({'still-present':'Still present',changed:'Changed',resolved:'Resolved',uncertain:'Uncertain'})[outcome]||outcome;
}
