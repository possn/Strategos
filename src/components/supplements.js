import { SUPPLEMENT_GUIDE, SUPPLEMENTS_REVIEWED_AT } from '../data/supplements.js?v=supplements2';
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function renderSupplementsGuide(){
  return `<section class="supplement-guide" lang="pt-PT" aria-labelledby="supplement-guide-title">
    <p class="eyebrow">CONHECER ANTES DE DECIDIR</p>
    <h1 id="supplement-guide-title">Suplementos, com contexto.</h1>
    <p class="supplement-intro">A pergunta começa pelo objetivo: corrigir uma deficiência, apoiar o treino ou tratar uma situação clínica são decisões diferentes.</p>
    <p class="muted">Este guia resume evidência geral. Consultá-lo não cria uma recomendação pessoal, não define doses e não avalia todas as interações.</p>
    <div class="supplement-list">
      ${SUPPLEMENT_GUIDE.map(record=>`<details class="supplement-entry" name="supplement-evidence" data-supplement-id="${escape(record.id)}">
        <summary><span class="supplement-name">${escape(record.name)}</span><span class="supplement-verdict">${escape(record.verdict)}</span></summary>
        <div class="supplement-detail"><h2>${escape(record.question)}</h2><dl>
          ${[['Em quem foi estudado ou pode haver necessidade',record.population],['O que a evidência permite dizer',record.finding],['O que permanece incerto',record.uncertainty],['Riscos e contexto de medicação',record.risks],['Pergunta útil para esclarecer a decisão',record.discuss]].map(([title,text])=>`<div><dt>${escape(title)}</dt><dd>${escape(text)}</dd></div>`).join('')}
        </dl><a href="${escape(record.source)}" target="_blank" rel="noopener noreferrer">Consultar fonte · ${escape(record.name)}</a>${(record.additionalSources||[]).map(source=>`<p><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)}</a></p>`).join('')}</div>
      </details>`).join('')}
    </div>
    <p class="muted">Síntese editorial de ${SUPPLEMENT_GUIDE.length} suplementos. Os riscos referidos são exemplos, não uma lista completa. Não é uma classificação formal da qualidade de toda a literatura.</p>
    <p class="muted">Revisão editorial: <time datetime="${SUPPLEMENTS_REVIEWED_AT}">5 de novembro de 2026</time>. Fontes: fichas institucionais e ensaios humanos. A presença no guia não significa recomendação de utilização.</p>
  </section>`;
}
