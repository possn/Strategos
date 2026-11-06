// Prefer installed higher-quality system voices without crossing the chosen language.
// Voice quality and availability depend on the operating system/browser.
export function selectVoice(voices=[],language='en'){
 const pt=language==='pt'||language==='pt-PT';
 const matching=voices.filter(voice=>(pt?/^pt(?:[-_]|$)/i:/^en(?:[-_]|$)/i).test(voice.lang||''));
 const preferred=pt?matching.filter(v=>/^pt[-_]PT$/i.test(v.lang)):matching;
 const pool=preferred.length?preferred:matching;
 const quality=v=>/premium|enhanced|natural|neural/i.test(v.name||'')?3:/siri|daniel|samantha|catarina|joana/i.test(v.name||'')?2:1;
 return [...pool].sort((a,b)=>quality(b)-quality(a))[0]||null;
}
