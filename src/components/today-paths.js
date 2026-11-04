export function renderTodayPaths({busy=false}={}){
  return `<section class="today-paths" lang="pt-PT" aria-labelledby="today-paths-title">
    <p class="eyebrow">SAÚDE AO LONGO DA VIDA</p>
    <h2 id="today-paths-title">Cuida do que importa.</h2>
    <p class="today-paths-intro">Uma entrada simples para o sono, a alimentação e decisões mais informadas.</p>
    <div class="today-path-list">
      <button class="today-path" data-daily-priority="sleep" ${busy?'disabled':''}><span><strong>Sono</strong><small>Preparar espaço para descansar.</small></span><span aria-hidden="true">↗</span></button>
      <button class="today-path" data-daily-priority="nutrition" ${busy?'disabled':''}><span><strong>Alimentação</strong><small>Tornar uma refeição mais fácil.</small></span><span aria-hidden="true">↗</span></button>
      <button class="today-path" data-action="open-supplements"><span><strong>Suplementos</strong><small>Conhecer a evidência antes de decidir.</small></span><span aria-hidden="true">↗</span></button>
    </div>
    ${busy?'<p class="muted">As prioridades podem mudar depois de encerrares a prática em curso.</p>':''}
  </section>`;
}
