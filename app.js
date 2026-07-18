'use strict';

const STORAGE_KEY = 'onearete.commander.v01';
const defaultState = {
  onboarded: false,
  name: 'Pedro',
  identity: 'Mais forte e disciplinado',
  context: { sleep: 7, energy: 3, time: 15, challenge: 'body' },
  delta: 0,
  history: [],
  activeMission: null
};

let state = loadState();
let timerId = null;
let remaining = 0;
let paused = false;

const app = document.querySelector('#app');

const missions = {
  strength: {
    type: 'Fortitude', title: 'Força Essencial', minutes: 15, delta: 0.7,
    reason: 'Dormiste o suficiente, tens energia funcional e 15 minutos disponíveis. Hoje, a força oferece o maior retorno.',
    phases: [
      ['Preparação', 60, 'Respira fundo. Alinha postura e intenção.'],
      ['Agachamentos', 120, 'Movimento lento. Joelhos estáveis.'],
      ['Flexões', 120, 'Corpo firme. Para antes de perder a técnica.'],
      ['Remada isométrica', 120, 'Puxa com as costas e mantém tensão.'],
      ['Prancha', 90, 'Respiração controlada. Corpo numa linha.'],
      ['Circuito final', 300, 'Repete os movimentos com precisão, não com pressa.'],
      ['Recuperação', 90, 'Caminha devagar e deixa a respiração normalizar.']
    ]
  },
  recovery: {
    type: 'Temperance', title: 'Recuperação Deliberada', minutes: 10, delta: 0.5,
    reason: 'O sono ou a energia estão baixos. Disciplina também é recusar esforço que hoje teria pouco retorno.',
    phases: [
      ['Respiração', 120, 'Inspira 4 segundos. Expira 6 segundos.'],
      ['Mobilidade', 240, 'Move coluna, ancas e ombros sem dor.'],
      ['Caminhada', 180, 'Passo confortável. Atenção ao corpo.'],
      ['Silêncio', 60, 'Não resolvas nada. Apenas observa.']
    ]
  },
  focus: {
    type: 'Discipline', title: 'Bloco de Foco', minutes: 15, delta: 0.6,
    reason: 'O principal obstáculo de hoje é mental. Um bloco protegido e curto tem maior retorno do que adicionar outra tarefa.',
    phases: [
      ['Definir', 60, 'Escolhe um resultado concreto para este bloco.'],
      ['Executar', 720, 'Uma tarefa. Sem notificações. Sem alternar.'],
      ['Fechar', 120, 'Regista o próximo passo e termina conscientemente.']
    ]
  },
  walk: {
    type: 'Vitality', title: 'Marcha Atenta', minutes: 15, delta: 0.5,
    reason: 'Energia moderada e pouco tempo favorecem movimento leve, luz natural e recuperação cognitiva.',
    phases: [
      ['Partir', 120, 'Caminha sem telefone na mão.'],
      ['Ritmo', 660, 'Passo vivo, respiração nasal quando possível.'],
      ['Regressar', 120, 'Abranda e escolhe a próxima ação do dia.']
    ]
  }
};

function loadState() {
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
  catch { return structuredClone(defaultState); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function symbol(cls='brand-mark') { return `<img class="${cls}" src="icons/delta.svg" alt="Símbolo Delta OneArete">`; }
function brand() { return `<div class="brand">${symbol()}<div class="brand-copy"><strong>COMMANDER</strong><span>BY ONEARETE</span></div></div>`; }
function progress(step, total=4) { return `<div class="progress">${Array.from({length: total},(_,i)=>`<span class="${i<step?'active':''}"></span>`).join('')}</div>`; }
function option(label, value, selected, small='') { return `<button class="option ${selected===value?'selected':''}" data-value="${value}"><strong>${label}</strong>${small?`<small>${small}</small>`:''}</button>`; }

function renderWelcome() {
  app.innerHTML = `<main class="screen fade-in">${brand()}<section class="hero"><div class="eyebrow">Areté começa numa decisão</div><h1>Em quem te vais tornar hoje?</h1><p>Cada decisão molda o teu corpo, a tua mente e o teu carácter.</p><div class="quote">O Commander não decide por ti. Torna clara a decisão que merece o teu compromisso.</div></section><div class="actions"><button class="primary bronze" id="begin">Begin</button></div></main>`;
  document.querySelector('#begin').onclick = () => renderOnboarding(1);
}

let draft = { name: state.name, identity: state.identity, sleep: 7, energy: 3, time: 15, challenge: 'body' };
function renderOnboarding(step) {
  const screens = {
    1: `<div class="question"><div class="eyebrow">Identidade</div><h2>Como te devemos chamar?</h2><p>Sem perfis extensos. Apenas o necessário para começar.</p></div><input id="name" value="${escapeHtml(draft.name)}" maxlength="30" style="width:100%;padding:18px;border-radius:16px;border:1px solid var(--line);background:rgba(244,240,232,.06);color:var(--marble);font-size:1.1rem;outline:none">`,
    2: `<div class="question"><div class="eyebrow">Telos</div><h2>Em quem escolheste tornar-te?</h2><p>Não é um objetivo. É a identidade que deve orientar as decisões.</p></div><div class="options">${option('Mais forte e disciplinado','Mais forte e disciplinado',draft.identity)}${option('Mais sábio e focado','Mais sábio e focado',draft.identity)}${option('Mais saudável e resiliente','Mais saudável e resiliente',draft.identity)}${option('Melhor líder e cuidador','Melhor líder e cuidador',draft.identity)}</div>`,
    3: `<div class="question"><div class="eyebrow">Contexto</div><h2>Quanto tempo podes investir agora?</h2><p>O Commander adapta a missão ao recurso real, não ao plano ideal.</p></div><div class="options two">${[5,10,15,30].map(x=>option(`${x} min`,x,draft.time)).join('')}</div>`,
    4: `<div class="question"><div class="eyebrow">Primeiro sinal</div><h2>Como está a tua energia?</h2><p>Uma leitura honesta vale mais do que motivação artificial.</p></div><div class="options">${option('Baixa',1,draft.energy,'Preciso de recuperar')}${option('Moderada',3,draft.energy,'Consigo agir')}${option('Alta',5,draft.energy,'Estou pronto para esforço')}</div>`
  };
  app.innerHTML = `<main class="screen fade-in">${brand()}${progress(step)}${screens[step]}<div class="actions"><button class="primary" id="next">${step===4?'Consultar o Commander':'Continuar'}</button>${step>1?'<button class="link-button" id="back">Voltar</button>':''}</div></main>`;
  if(step===1) document.querySelector('#name').addEventListener('input', e => draft.name=e.target.value.trim() || 'Tu');
  document.querySelectorAll('.option').forEach(btn=>btn.onclick=()=>{ const raw=btn.dataset.value; const value=/^\d+$/.test(raw)?Number(raw):raw; if(step===2) draft.identity=value; if(step===3) draft.time=value; if(step===4) draft.energy=value; renderOnboarding(step); });
  document.querySelector('#next').onclick=()=>{
    if(step<4) renderOnboarding(step+1);
    else { state={...state,onboarded:true,name:draft.name,identity:draft.identity,context:{...state.context,time:draft.time,energy:draft.energy}}; saveState(); renderCheckIn(); }
  };
  const back=document.querySelector('#back'); if(back) back.onclick=()=>renderOnboarding(step-1);
}

function renderCheckIn() {
  const c = state.context;
  app.innerHTML = `<main class="screen fade-in"><div class="topbar">${brand()}<button class="icon-button" id="history" aria-label="Histórico">⌁</button></div><div class="question"><div class="eyebrow">Observe</div><h2>Bom dia, ${escapeHtml(state.name)}.</h2><p>Três sinais. Menos de dez segundos.</p></div><div class="question"><strong>Sono</strong><div class="options two" style="margin-top:10px">${[5,6,7,8].map(x=>option(`${x}${x===5?'h ou menos':'h'}`,x,c.sleep)).join('')}</div></div><div class="question"><strong>Energia</strong><div class="options two" style="margin-top:10px">${[1,3,5].map(x=>option(x===1?'Baixa':x===3?'Moderada':'Alta',x,c.energy)).join('')}</div></div><div class="question"><strong>Maior desafio</strong><div class="options two" style="margin-top:10px">${option('Corpo','body',c.challenge)}${option('Foco','focus',c.challenge)}${option('Recuperação','recovery',c.challenge)}${option('Disciplina','discipline',c.challenge)}</div></div><div class="actions"><button class="primary bronze" id="consult">Consultar o Commander</button></div></main>`;
  const groups = document.querySelectorAll('.question');
  groups[1].querySelectorAll('.option').forEach(b=>b.onclick=()=>{state.context.sleep=Number(b.dataset.value);saveState();renderCheckIn();});
  groups[2].querySelectorAll('.option').forEach(b=>b.onclick=()=>{state.context.energy=Number(b.dataset.value);saveState();renderCheckIn();});
  groups[3].querySelectorAll('.option').forEach(b=>b.onclick=()=>{state.context.challenge=b.dataset.value;saveState();renderCheckIn();});
  document.querySelector('#consult').onclick=()=>{state.activeMission=chooseMission();saveState();renderMission();};
  document.querySelector('#history').onclick=renderHistory;
}

function chooseMission() {
  const c=state.context;
  if(c.sleep<=5 || c.energy===1 || c.challenge==='recovery') return 'recovery';
  if(c.challenge==='focus') return 'focus';
  if(c.challenge==='body' && c.energy>=3 && c.time>=10) return 'strength';
  return 'walk';
}

function renderMission() {
  const m=missions[state.activeMission || chooseMission()];
  app.innerHTML=`<main class="screen fade-in"><div class="topbar">${brand()}<button class="icon-button" id="close">×</button></div><div class="delta-card"><div class="delta-label">Δ Today</div><div class="delta-value">+0.00</div></div><section class="mission-card"><div class="mission-type">Today's Mission · ${m.type}</div><div class="mission-title">${m.title}</div><div class="mission-meta">${m.minutes} minutos</div><div class="reason"><strong>Porque esta decisão?</strong>${m.reason}</div></section><div class="actions"><button class="primary bronze" id="commit">I Commit</button><button class="secondary" id="recheck">Reavaliar contexto</button></div></main>`;
  document.querySelector('#commit').onclick=startMission;
  document.querySelector('#recheck').onclick=renderCheckIn;
  document.querySelector('#close').onclick=renderCheckIn;
}

function startMission() {
  const m=missions[state.activeMission];
  const total=m.phases.reduce((sum,p)=>sum+p[1],0);
  remaining=total; paused=false;
  renderExecution();
  timerId=setInterval(()=>{if(!paused){remaining--;if(remaining<=0){clearInterval(timerId);renderReflection();}else updateTimer();}},1000);
}
function currentPhase() {
  const phases=missions[state.activeMission].phases;
  const total=phases.reduce((s,p)=>s+p[1],0); let elapsed=total-remaining; let acc=0;
  for(const p of phases){acc+=p[1];if(elapsed<acc)return p;} return phases.at(-1);
}
function renderExecution() {
  const phase=currentPhase();
  app.innerHTML=`<main class="screen fade-in"><div class="topbar">${brand()}<button class="icon-button" id="exit">×</button></div><section class="timer-wrap"><div class="phase" id="phase">${phase[0]}</div><div class="timer" id="timer">${formatTime(remaining)}</div><div class="instruction" id="instruction">${phase[2]}</div></section><div class="timer-actions"><button class="secondary" id="pause">Pausar</button><button class="primary" id="finish">Concluir</button></div></main>`;
  document.querySelector('#pause').onclick=()=>{paused=!paused;document.querySelector('#pause').textContent=paused?'Continuar':'Pausar';};
  document.querySelector('#finish').onclick=()=>{clearInterval(timerId);renderReflection();};
  document.querySelector('#exit').onclick=()=>{clearInterval(timerId);renderMission();};
}
function updateTimer(){ const t=document.querySelector('#timer');if(!t)return;const p=currentPhase();t.textContent=formatTime(remaining);document.querySelector('#phase').textContent=p[0];document.querySelector('#instruction').textContent=p[2]; }
function renderReflection(){
  app.innerHTML=`<main class="screen fade-in">${brand()}<section class="reflection"><div class="eyebrow">Reflect</div><h1 style="font-size:2.7rem">Valeu a pena?</h1><p>Uma resposta honesta ajuda o Commander a aprender.</p><div class="options"><button class="option center" data-feel="better"><strong>Melhor</strong></button><button class="option center" data-feel="same"><strong>Igual</strong></button><button class="option center" data-feel="worse"><strong>Pior</strong></button></div></section></main>`;
  document.querySelectorAll('[data-feel]').forEach(b=>b.onclick=()=>completeMission(b.dataset.feel));
}
function completeMission(feeling){
  const m=missions[state.activeMission];
  const gain=feeling==='worse'?Math.max(.2,m.delta-.3):feeling==='same'?m.delta-.1:m.delta;
  state.delta=Number((state.delta+gain).toFixed(1));
  state.history.unshift({date:new Date().toISOString(),title:m.title,type:m.type,gain,feeling});
  state.history=state.history.slice(0,30); saveState();
  app.innerHTML=`<main class="screen fade-in">${brand()}<section class="complete">${symbol('complete-symbol')}<div class="eyebrow">Mission Complete</div><h1 style="font-size:2.8rem">Good.<br>Continue.</h1><div class="delta-gain">Δ +${gain.toFixed(1)}</div><p>A excelência não é um momento. É a direção das decisões repetidas.</p></section><div class="actions"><button class="primary" id="done">Terminar</button></div></main>`;
  document.querySelector('#done').onclick=()=>{state.activeMission=null;saveState();renderHome();};
}
function renderHome(){
  const today=state.history.find(x=>new Date(x.date).toDateString()===new Date().toDateString());
  app.innerHTML=`<main class="screen fade-in"><div class="topbar">${brand()}<button class="icon-button" id="history">⌁</button></div><div class="delta-card"><div class="delta-label">Δ Overall</div><div class="delta-value">+${state.delta.toFixed(1)}</div></div><section class="mission-card"><div class="mission-type">${today?'Today':'Ready'}</div><div class="mission-title">${today?'Missão cumprida':'Consultar o Commander'}</div><div class="mission-meta">${today?today.title:'A próxima decisão começa com contexto.'}</div><div class="reason"><strong>${today?'Reflexão':'Identidade escolhida'}</strong>${today?'Aparece amanhã. A consistência precisa de espaço.':escapeHtml(state.identity)}</div></section><div class="actions"><button class="primary bronze" id="action">${today?'Nova consulta':'Começar'}</button></div></main>`;
  document.querySelector('#action').onclick=renderCheckIn; document.querySelector('#history').onclick=renderHistory;
}
function renderHistory(){
  const items=state.history.length?state.history.map(x=>`<div class="history-item"><div><strong>${escapeHtml(x.title)}</strong><small>${new Date(x.date).toLocaleDateString('pt-PT')} · ${x.type}</small></div><div class="badge">Δ +${Number(x.gain).toFixed(1)}</div></div>`).join(''):'<p>Ainda não existem missões concluídas.</p>';
  app.innerHTML=`<main class="screen fade-in"><div class="topbar">${brand()}<button class="icon-button" id="close">×</button></div><div class="eyebrow">Trajetória</div><h2>Decisões anteriores</h2><div class="history">${items}</div><div class="actions"><button class="secondary" id="reset">Reiniciar demonstração</button></div></main>`;
  document.querySelector('#close').onclick=renderHome;
  document.querySelector('#reset').onclick=()=>{if(confirm('Apagar os dados locais desta demonstração?')){localStorage.removeItem(STORAGE_KEY);state=structuredClone(defaultState);location.reload();}};
}
function formatTime(sec){return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
state.onboarded ? renderHome() : renderWelcome();
