// A compact, fully bilingual orientation. Never display English copy inside Portuguese mode.
const COPY={
 pt:{
  eyebrow:'COMO USAR',title:'Mente sã em corpo são.',intro:'Disciplina para agir. Serenidade para escolher. Saúde para viver bem durante mais anos.',principle:'Uma pessoa. Um dia. Uma ação.',
  sections:[
   ['overview','O que é o Strategos','Um companheiro de filosofia prática, mindfulness e saúde ao longo da vida. Ajuda-te a refletir e a escolher um próximo passo, sem te substituir.'],
   ['mindfulness','Mindfulness','No ecrã Hoje, toca em “Mindfulness · Fazer uma pausa de 90 segundos”. Observa o corpo e a respiração natural, sem contagens obrigatórias. Podes parar quando quiseres.'],
   ['philosophy','Três tradições, um propósito','Estoicismo: distinguir o que depende de ti. Taoismo: agir com flexibilidade e sem forçar. Espírito espartano: disciplina, coragem e simplicidade, sem glorificar dor, privação ou excesso.'],
   ['health','Longevidade e qualidade','Sono, movimento, força, alimentação e relações merecem atenção consistente. O objetivo é preservar saúde, autonomia e qualidade de vida; nenhuma prática isolada demonstrou prolongar a vida humana.'],
   ['today','Como funciona o Hoje','Partilha apenas o contexto que quiseres. O Strategos propõe uma ação. Podes aceitá-la, trocá-la, adiar ou descansar. Mindfulness fica sempre acessível.'],
   ['journey','Percurso e aprendizagem','Revê reflexões e práticas ao longo dos dias. O feedback é opcional; uma resposta isolada não prova melhoria nem cria regras permanentes.'],
   ['privacy','Dados e controlo','Os registos ficam neste navegador. Podes exportar uma cópia ou eliminar os dados nas Definições. Não substitui cuidados médicos.']
  ],
  open:'Abrir mindfulness',back:'Voltar às Definições'
 },
 en:{
  eyebrow:'HOW IT WORKS',title:'A sound mind in a sound body.',intro:'Discipline to act. Calm to choose. Health to live well for longer.',principle:'One person. One day. One action.',
  sections:[
   ['overview','What is Strategos?','A companion for practical philosophy, mindfulness and lifelong health. It helps you reflect and choose a next step without taking away your agency.'],
   ['mindfulness','Mindfulness','On Today, tap “Mindfulness · Take a 90-second pause”. Notice your body and natural breathing without enforced counts. You can stop at any time.'],
   ['philosophy','Three traditions, one purpose','Stoicism: distinguish what is within your control. Taoism: adapt and avoid forcing. Spartan spirit: discipline, courage and simplicity—not pain, deprivation or excess.'],
   ['health','Longevity and quality of life','Sleep, movement, strength, nutrition and relationships deserve steady attention. The aim is to preserve health, independence and quality of life; no single practice here is proven to extend human lifespan.'],
   ['today','How Today works','Share only the context you wish to share. Strategos suggests one action. You may accept, change, defer or rest. Mindfulness stays accessible.'],
   ['journey','Journey and learning','Review reflections and practices over time. Feedback is optional; one answer does not prove improvement or create a permanent rule.'],
   ['privacy','Data and control','Records stay in this browser. You may export a copy or erase data in Settings. This is not a substitute for clinical care.']
  ],
  open:'Open mindfulness',back:'Back to Settings'
 }
};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderUsageGuide({language='en',focus='overview'}={}){
 const t=COPY[language==='pt'?'pt':'en'];
 const sections=focus==='overview'?t.sections:[...t.sections.filter(s=>s[0]===focus),...t.sections.filter(s=>s[0]!==focus)];
 return `<section class="stack usage-guide" lang="${language==='pt'?'pt-PT':'en'}"><div><p class="eyebrow">${esc(t.eyebrow)}</p><h1>${esc(t.title)}</h1><p class="muted">${esc(t.intro)}</p></div><div class="guide-principle"><strong>${esc(t.principle)}</strong></div>${sections.map(([id,title,description],index)=>`<details class="guide-section" data-guide-id="${id}" ${index===0?'open':''}><summary>${esc(title)}</summary><p>${esc(description)}</p>${id==='mindfulness'?`<button class="action secondary" data-action="open-mindfulness">${esc(t.open)}</button>`:id==='philosophy'?`<button class="action secondary" data-action="open-philosophy-practice">${esc(language==='pt'?'Praticar filosofia':'Practise philosophy')}</button>`:''}</details>`).join('')}<button class="action secondary" data-action="settings">${esc(t.back)}</button></section>`;
}
