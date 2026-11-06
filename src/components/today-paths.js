import {interfaceText} from '../core/interface-language.js?v=forms1';
export function renderTodayPaths({busy=false,language='pt'}={}){
  const t=text=>interfaceText(text,language);
  return `<section class="today-paths" lang="${language==='pt'?'pt-PT':'en'}" aria-labelledby="today-paths-title">
    <p class="eyebrow">${t('SAÚDE AO LONGO DA VIDA')}</p>
    <h2 id="today-paths-title">${t('Cuida do que importa.')}</h2>
    <div class="today-path-list">
      <button class="today-path" data-daily-priority="sleep" ${busy?'disabled':''}><span><strong>${t('Sono')}</strong><small>${t('Preparar espaço para descansar.')}</small></span><span aria-hidden="true">↗</span></button>
      <button class="today-path" data-daily-priority="nutrition" ${busy?'disabled':''}><span><strong>${t('Alimentação')}</strong><small>${t('Tornar uma refeição mais fácil.')}</small></span><span aria-hidden="true">↗</span></button>
      <button class="today-path" data-action="open-performance"><span><strong>${language==='pt'?'Energia e foco':'Energy and focus'}</strong><small>${language==='pt'?'Descobrir um hábito para melhorar.':'Find one habit worth improving.'}</small></span><span aria-hidden="true">↗</span></button>
    </div>
    ${busy?`<p class="muted">${t('As prioridades podem mudar depois de encerrares a prática em curso.')}</p>`:''}
  </section>`;
}
