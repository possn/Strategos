// Original, short practices inspired by philosophical traditions.
// These are not historical quotations, health measurements or clinical interventions.
const PRACTICES={
 pt:{
  eyebrow:'FILOSOFIA EM AÇÃO',title:'Uma ideia. Uma ação.',intro:'Escolhe uma tradição. Experimenta um gesto simples no dia de hoje, sem pontuação nem obrigação.',
  ready:'O que podes praticar agora?',done:'A prática termina aqui. O que conta é a escolha, não uma sequência de dias.',try:'Praticar',finish:'Concluir esta pausa',again:'Escolher outra prática',back:'Voltar a Hoje',
  caution:'Reflexão educativa, não terapia ou treino físico prescrito. Disciplina não exige dor, privação ou ignorar limites.',
  stoic:{name:'Estoicismo',label:'Clareza',question:'O que depende realmente de ti neste momento?',action:'Distingue um facto de uma interpretação. Escolhe apenas uma resposta que esteja sob o teu controlo.',reflection:'Aceitar o que não controlas também é uma escolha.'},
  tao:{name:'Taoismo',label:'Equilíbrio',question:'Onde estás a tentar forçar o que precisa de espaço?',action:'Afrouxa uma exigência. Escolhe o passo mais pequeno que respeita a situação, sem desistir do essencial.',reflection:'Flexibilidade não é passividade; é agir com menos resistência desnecessária.'},
  spartan:{name:'Espírito espartano',label:'Disciplina',question:'Que compromisso pequeno consegues cumprir com integridade?',action:'Escolhe uma tarefa apropriada às tuas capacidades. Dá-lhe dois minutos de atenção íntegra, sem procurar desconforto.',reflection:'A disciplina útil é consistente, prudente e sustentável — não um teste de sofrimento.'}
 },
 en:{
  eyebrow:'PHILOSOPHY IN ACTION',title:'One idea. One action.',intro:'Choose a tradition. Try one simple action today, with no score or obligation.',
  ready:'What can you practise now?',done:'The practice ends here. What matters is the choice, not a streak.',try:'Practise',finish:'Finish this pause',again:'Choose another practice',back:'Back to Today',
  caution:'Educational reflection, not therapy or prescribed exercise. Discipline does not require pain, deprivation or ignoring your limits.',
  stoic:{name:'Stoicism',label:'Clarity',question:'What is actually within your control right now?',action:'Separate one fact from your interpretation. Choose one response that is yours to make.',reflection:'Accepting what you cannot control is also a choice.'},
  tao:{name:'Taoism',label:'Balance',question:'Where are you forcing something that needs more room?',action:'Release one unnecessary demand. Choose the smallest step that fits this situation without abandoning what matters.',reflection:'Flexibility is not passivity; it is acting without unnecessary resistance.'},
  spartan:{name:'Spartan spirit',label:'Discipline',question:'What small commitment can you keep with integrity?',action:'Pick a task suited to your abilities. Give it two minutes of full attention, without seeking discomfort.',reflection:'Useful discipline is consistent, prudent and sustainable—not a test of suffering.'}
 }
};
const KEY=['stoic','tao','spartan'];
export function philosophyPracticeForDay(day=new Date()){
 const d=day instanceof Date?day:new Date(day);
 if(!Number.isFinite(d.getTime()))return 'stoic';
 const anchor=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());
 return KEY[Math.floor(anchor/86400000)%KEY.length];
}
export const philosophyPracticeCopy=(language='pt')=>PRACTICES[language==='en'?'en':'pt'];
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderPhilosophyPractice({language='pt',tradition='stoic',stage='ready'}={}){
 const pt=language!=='en',t=philosophyPracticeCopy(language),key=KEY.includes(tradition)?tradition:'stoic',p=t[key];
 const complete=stage==='finished',started=stage==='started'||complete;
 return `<section class="stack philosophy-practice" lang="${pt?'pt-PT':'en'}">
  <div><p class="eyebrow">${esc(t.eyebrow)}</p><h1>${esc(t.title)}</h1><p class="muted">${esc(t.intro)}</p></div>
  <div class="philosophy-choices" role="group" aria-label="${esc(t.ready)}">${KEY.map(k=>`<button class="philosophy-choice ${k===key?'selected':''}" aria-pressed="${k===key}" data-philosophy-choice="${k}">${esc(t[k].name)}</button>`).join('')}</div>
  <article class="philosophy-action">
   <p class="eyebrow">${esc(p.label)}</p><h2>${esc(p.question)}</h2>
   ${started?`<p class="philosophy-action-step">${esc(p.action)}</p>`:''}
   ${complete?`<p class="muted">${esc(p.reflection)}</p><p class="muted">${esc(t.done)}</p>`:''}
  </article>
  ${!complete?`<button class="action" data-philosophy-action="${started?'finish':'start'}">${esc(started?t.finish:t.try)}</button>`:`<button class="action secondary" data-philosophy-action="again">${esc(t.again)}</button>`}
  <p class="muted philosophy-caution">${esc(t.caution)}</p>
  <button class="text-btn" data-action="today">${esc(t.back)}</button>
 </section>`;
}
