// Explicit, optional post-practice self-reports; not a health outcome or clinical score.
export const MINDFUL_FEEDBACK_LIMIT=20;
const outcomes=new Set(['helpful','not-helpful']);
export function normaliseMindfulFeedback(input){
 if(!Array.isArray(input))return [];
 const ids=new Set();
 return input.filter(item=>{
  if(!item||typeof item!=='object'||item.practice!=='mindfulness-90'||!outcomes.has(item.outcome)||typeof item.at!=='string')return false;
  const time=Date.parse(item.at);
  if(!Number.isFinite(time)||item.at.length>32||ids.has(item.at))return false;
  ids.add(item.at);return true;
 }).map(item=>({practice:'mindfulness-90',outcome:item.outcome,at:item.at}))
  .sort((a,b)=>b.at.localeCompare(a.at)).slice(0,MINDFUL_FEEDBACK_LIMIT);
}
export function recordMindfulFeedback(history,outcome,{now=new Date()}={}){
 if(!outcomes.has(outcome)||!Number.isFinite(now.getTime()))return normaliseMindfulFeedback(history);
 return normaliseMindfulFeedback([{practice:'mindfulness-90',outcome,at:now.toISOString()},...normaliseMindfulFeedback(history)]);
}
export function mindfulFeedbackPreference(input,{now=null}={}){
 // Historical preferences expire for recommendations; users can always start
 // another mindfulness session, and prior feedback remains visible/deletable.
 const cutoff=now instanceof Date&&Number.isFinite(now.getTime())?now.getTime()-30*86400000:null;
 const records=normaliseMindfulFeedback(input).filter(item=>cutoff===null||(Date.parse(item.at)>=cutoff&&Date.parse(item.at)<=now.getTime())).slice(0,3);
 // Two explicit negative reactions in the latest three sessions are enough to
 // offer an alternative, not to diagnose or permanently exclude mindfulness.
 const negative=records.filter(item=>item.outcome==='not-helpful').length;
 return {offerAlternative:records.length>=2&&negative>=2,observations:records.length};
}
