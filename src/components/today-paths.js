import {interfaceText} from '../core/interface-language.js?v=forms1';
export function renderTodayPaths({busy=false,language='pt',eyebrow=null,nextStep=null}={}){
  const t=text=>interfaceText(text,language);
  return `<section class="today-paths" lang="${language==='pt'?'pt-PT':'en'}" aria-labelledby="today-paths-title">
    <p class="eyebrow">${eyebrow?String(eyebrow).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char])):t('SAÚDE AO LONGO DA VIDA')}</p>
    <h2 id="today-paths-title">${t('Cuida do que importa.')}</h2>
    <button class="text-btn today-mindfulness-link" data-action="open-mindfulness">${language==='pt'?'Mindfulness · Fazer uma pausa de 90 segundos':'Mindfulness · Take a 90-second pause'}</button>
    <div class="today-path-list">
      <button class="today-path" data-daily-priority="sleep" ${busy?'disabled':''}><span><strong>${t('Sono')}</strong><small>${t('Preparar espaço para descansar.')}</small></span><span aria-hidden="true">↗</span></button>
      <button class="today-path" data-daily-priority="nutrition" ${busy?'disabled':''}><span><strong>${t('Alimentação')}</strong><small>${t('Tornar uma refeição mais fácil.')}</small></span><span aria-hidden="true">↗</span></button>
      <button class="today-path" data-action="${nextStep?.action==='journey'?'journey':'open-mindfulness'}"><span><strong>${t(nextStep?.title||(language==='pt'?'Mindfulness':'Mindfulness'))}</strong><small>${t(nextStep?.description||(language==='pt'?'Uma pausa consciente de 90 segundos.':'A 90-second mindful pause.'))}</small></span><span aria-hidden="true">↗</span></button>
    </div>
    ${busy?`<p class="muted">${t('As prioridades podem mudar depois de encerrares a prática em curso.')}</p>`:''}
  </section>`;
}
