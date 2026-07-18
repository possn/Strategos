import { decide } from './core/engine.js';
import { loadState, saveState, resetState } from './core/storage.js';

const app = document.querySelector('#app');
let state = loadState();
let context = { sleep: 3, energy: 2, time: 15, challenge: 'body' };
let decision = null;
let timer = null;
let secondsLeft = 0;
let phaseIndex = 0;

const vibrate = (ms = 12) => navigator.vibrate?.(ms);
const esc = s => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function shell(content, cls = '') { app.innerHTML = `<main class="screen ${cls}">${content}</main>`; }
function deltaMark(size = 'large') { return `<svg class="delta ${size}" viewBox="0 0 140 140" role="img" aria-label="OneArete Delta"><circle class="ring" cx="70" cy="70" r="56"/><path class="glyph" d="M70 25 L112 108 M112 108 L28 108 M28 108 L63 39"/></svg>`; }
function button(label, action, secondary = false) { return `<button class="action ${secondary ? 'secondary':''}" data-action="${action}">${label}</button>`; }

function route(name) {
  clearInterval(timer); timer = null;
  ({ splash, onboarding, observe, thinking, mission, execute, reflect, journal, history }[name] || splash)();
  window.scrollTo(0,0);
}

function splash() {
  shell(`${deltaMark()}<div class="brand"><div class="eyebrow">ONEARETE</div><h1>STRATEGOS</h1><p>Know yourself.<br/>Improve deliberately.</p></div><button class="tap" data-action="begin">Tap to begin</button>`, 'splash');
}

function onboarding() {
  shell(`<header>${deltaMark('small')}<span>STRATEGOS</span></header><section class="stack"><p class="eyebrow">FIRST PRINCIPLE</p><h2>Who do you choose<br/>to become?</h2><p class="muted">Choose the identity that should guide your first decisions.</p><div class="choice-grid identity">${['Stronger','Wiser','More disciplined','More resilient','A better parent','A better partner'].map(x=>`<button class="choice" data-identity="${x}">${x}</button>`).join('')}</div></section>`);
}

function observe() {
  const name = state.profile?.name || '';
  shell(`<header>${deltaMark('small')}<span>STRATEGOS</span><button class="icon-btn" data-action="history" aria-label="History">⌁</button></header><section class="stack"><p class="eyebrow">OBSERVE</p><h2>${greeting()}${name ? `, ${esc(name)}`:''}.</h2><p class="muted">Four signals. Less than twenty seconds.</p>${question('How did you sleep?','sleep',[[4,'Excellent'],[3,'Good'],[2,'Fair'],[1,'Poor']])}${question('Energy','energy',[[3,'High'],[2,'Medium'],[1,'Low']])}${question('Time available','time',[[5,'5'],[15,'15'],[30,'30'],[60,'60+']])}${question('Today’s greatest challenge','challenge',[['body','Body'],['mind','Mind'],['focus','Focus'],['recovery','Recovery'],['family','Family'],['work','Work']])}${button('CONSULT STRATEGOS','consult')}</section>`);
}
function question(title,key,opts){return `<div class="question"><h3>${title}</h3><div class="choice-row">${opts.map(([v,l])=>`<button class="pill ${context[key]===v?'selected':''}" data-key="${key}" data-value="${v}">${l}${key==='time'?' min':''}</button>`).join('')}</div></div>`}

function thinking() {
  shell(`${deltaMark()}<div class="thinking-copy"><p class="eyebrow">STRATEGOS</p><h2>Evaluating today’s context.</h2><p id="thinking-line" class="muted">Reading constraints…</p></div>`, 'thinking');
  const lines=['Reading constraints…','Comparing possible missions…','Estimating long-term return…','Decision prepared.']; let i=0;
  const cycle=setInterval(()=>{ const el=document.querySelector('#thinking-line'); if(el) el.textContent=lines[++i]||lines.at(-1); },520);
  setTimeout(()=>{clearInterval(cycle); decision=decide(context,state.history); state.current={context,decision,startedAt:null};saveState(state);route('mission')},2300);
}

function mission() {
  decision ||= state.current?.decision || decide(context,state.history);
  const d=decision;
  shell(`<header>${deltaMark('small')}<span>STRATEGOS</span><button class="icon-btn" data-action="observe" aria-label="Back">×</button></header><section class="mission-hero"><p class="eyebrow">TODAY’S MISSION</p><h2>${d.mission.name}</h2><div class="mission-meta"><span>${d.duration} min</span><span>${d.mission.virtue}</span></div><div class="delta-score"><span>EXPECTED Δ</span><strong>+${d.delta.overall.toFixed(2)}</strong></div></section><section class="reasoning"><div class="section-title"><span>WHY THIS MISSION</span><span>${d.confidence}% confidence</span></div>${d.reasons.map(r=>`<p><i></i>${r}</p>`).join('')}<details><summary>What was also considered?</summary><p class="muted">${d.alternatives.join(' and ')} produced a lower expected return in today’s context.</p></details></section><div class="bottom-actions">${button('I COMMIT','commit')}<button class="text-btn" data-action="observe">Reassess context</button></div>`);
}

function execute() {
  const d=decision || state.current.decision; const phases=d.mission.phases; phaseIndex=0;
  state.current.startedAt = new Date().toISOString(); saveState(state);
  const total=d.duration*60; const sourceTotal=phases.reduce((a,p)=>a+p[1],0); const scale=total/sourceTotal;
  const adjusted=phases.map(p=>[p[0],Math.max(20,Math.round(p[1]*scale)),p[2]]); state.current.adjusted=adjusted;saveState(state);
  runPhase(adjusted);
}
function runPhase(phases){ const p=phases[phaseIndex]; if(!p){finishMission();return;} secondsLeft=p[1];
  shell(`<header><span class="eyebrow">MISSION IN PROGRESS</span><button class="icon-btn" data-action="abandon">×</button></header><section class="execution"><p class="phase-count">${phaseIndex+1} / ${phases.length}</p><h2>${p[0]}</h2><div class="clock" id="clock">${formatTime(secondsLeft)}</div><p>${p[2]}</p><div class="progress"><span id="phase-progress"></span></div></section><div class="bottom-actions"><button class="action secondary" data-action="next-phase">Next phase</button></div>`,'execute');
  timer=setInterval(()=>{secondsLeft--; const c=document.querySelector('#clock'); const bar=document.querySelector('#phase-progress'); if(c)c.textContent=formatTime(secondsLeft); if(bar)bar.style.width=`${100*(1-secondsLeft/p[1])}%`; if(secondsLeft<=0){clearInterval(timer);vibrate(35);phaseIndex++;runPhase(phases)}},1000)
}
function finishMission(){clearInterval(timer);route('reflect')}

function reflect() {
  const d=decision||state.current.decision;
  shell(`<header>${deltaMark('small')}<span>STRATEGOS</span></header><section class="stack center"><p class="eyebrow">REFLECT</p><h2>Was Strategos right?</h2><p class="muted">Your answer improves future decisions.</p><div class="reflection">${[['yes','Yes'],['partly','Partly'],['no','No']].map(([v,l])=>`<button class="choice" data-reflection="${v}">${l}</button>`).join('')}</div><div class="delta-score compact"><span>MISSION Δ</span><strong>+${d.delta.overall.toFixed(2)}</strong></div></section>`);
}

function journal(entry) {
  const d=entry.decision;
  shell(`<header>${deltaMark('small')}<span>STRATEGOS</span><button class="icon-btn" data-action="history">⌁</button></header><section class="stack"><p class="eyebrow">TODAY’S JOURNAL</p><h2>${journalTitle(entry.reflection)}</h2><p class="journal-copy">Today you chose <strong>${d.mission.virtue.toLowerCase()}</strong> through a ${d.mission.name.toLowerCase()} mission. ${entry.reflection==='yes'?'The decision matched your condition.':'Your response has been stored so Strategos can adjust.'}</p><div class="vector"><h3>Δ VECTOR</h3>${Object.entries(d.delta).filter(([k])=>k!=='overall').map(([k,v])=>`<div><span>${capitalize(k)}</span><strong>${v>=0?'+':''}${v.toFixed(2)}</strong></div>`).join('')}<div class="overall"><span>Overall</span><strong>+${d.delta.overall.toFixed(2)}</strong></div></div><blockquote>Every decision shapes who you become.</blockquote>${button('RETURN TOMORROW','observe')}<button class="text-btn" data-action="reset">Reset demo data</button></section>`);
}

function history() {
  shell(`<header>${deltaMark('small')}<span>STRATEGIC TIMELINE</span><button class="icon-btn" data-action="observe">×</button></header><section class="stack"><div class="total-delta"><span>LIFETIME Δ</span><strong>+${state.deltaTotal.toFixed(2)}</strong></div>${state.history.length?state.history.map(e=>`<article class="history-item"><time>${new Date(e.completedAt).toLocaleDateString(undefined,{day:'numeric',month:'short'})}</time><div><h3>${e.decision.mission.name}</h3><p>${e.reflection} · ${e.decision.duration} min</p></div><strong>+${e.decision.delta.overall.toFixed(2)}</strong></article>`).join(''):`<div class="empty"><h2>No decisions yet.</h2><p class="muted">Your strategic timeline begins with the first completed mission.</p></div>`}${button('TODAY','observe')}</section>`);
}

function saveReflection(value){const entry={...state.current,reflection:value,completed:true,completedAt:new Date().toISOString()};state.history.unshift(entry);state.deltaTotal=+(state.deltaTotal+entry.decision.delta.overall).toFixed(2);state.current=null;saveState(state);journal(entry)}
function formatTime(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function greeting(){const h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'}
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function journalTitle(r){return r==='yes'?'A sound decision.':r==='partly'?'A useful signal.':'A correction, not a failure.'}

app.addEventListener('click',e=>{
  const t=e.target.closest('button'); if(!t)return; vibrate();
  if(t.dataset.identity){state.profile={identity:t.dataset.identity,name:''};saveState(state);route('observe');return}
  if(t.dataset.key){const k=t.dataset.key;context[k]=['sleep','energy','time'].includes(k)?Number(t.dataset.value):t.dataset.value;route('observe');return}
  if(t.dataset.reflection){saveReflection(t.dataset.reflection);return}
  const a=t.dataset.action;
  if(a==='begin') route(state.profile?'observe':'onboarding');
  if(a==='consult') route('thinking');
  if(a==='commit') route('execute');
  if(a==='next-phase'){clearInterval(timer);phaseIndex++;runPhase(state.current.adjusted)}
  if(a==='abandon' && confirm('End this mission?')) route('observe');
  if(a==='history') route('history');
  if(a==='observe') route('observe');
  if(a==='reset' && confirm('Reset all Strategos data?')){resetState();state=loadState();route('splash')}
});

if ('serviceWorker' in navigator) {
  addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.error));
}

try {
  route('splash');
} catch (error) {
  console.error('Strategos failed to start', error);
  app.innerHTML = `<main class="screen boot-error"><section class="stack center"><p class="eyebrow">STRATEGOS</p><h2>Unable to start.</h2><p class="muted">Refresh the page. If the problem remains, clear this site’s cached data.</p></section></main>`;
}
