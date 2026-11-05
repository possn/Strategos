export function selectVoice(voices=[],language='en'){
 const pt=language==='pt'||language==='pt-PT';
 const matching=voices.filter(voice=>(pt?/^pt(?:[-_]|$)/i:/^en(?:[-_]|$)/i).test(voice.lang||''));
 if(pt)return matching.find(voice=>/^pt[-_]PT$/i.test(voice.lang))||matching[0]||null;
 return matching.find(voice=>/Daniel|Samantha/i.test(voice.name||''))||matching.find(voice=>/^en[-_](GB|US)$/i.test(voice.lang))||matching[0]||null;
}
