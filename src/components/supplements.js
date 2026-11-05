import {SUPPLEMENTS_REVIEWED_AT} from '../data/supplements.js?v=supplements2';
import {supplementGuide} from '../data/supplements-en.js?v=language2';
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function renderSupplementsGuide(language='pt'){
 const pt=language!=='en',t=(p,e)=>pt?p:e,records=supplementGuide(pt?'pt':'en');
 return `<section class="supplement-guide" lang="${pt?'pt-PT':'en'}" aria-labelledby="supplement-guide-title">
 <p class="eyebrow">${t('CONHECER ANTES DE DECIDIR','UNDERSTAND BEFORE DECIDING')}</p>
 <h1 id="supplement-guide-title">${t('Suplementos, com contexto.','Supplements, in context.')}</h1>
 <p class="supplement-intro">${t('A pergunta começa pelo objetivo: corrigir uma deficiência, apoiar o treino ou tratar uma situação clínica são decisões diferentes.','Start with the goal: correcting a deficiency, supporting training and treating a clinical condition are different decisions.')}</p>
 <p class="muted">${t('Este guia resume evidência geral. Consultá-lo não cria uma recomendação pessoal, não define doses e não avalia todas as interações.','This guide summarises general evidence. Reading it does not create a personal recommendation, specify doses or assess every interaction.')}</p>
 <div class="supplement-list">${records.map(record=>`<details class="supplement-entry" name="supplement-evidence" data-supplement-id="${escape(record.id)}">
 <summary><span class="supplement-name">${escape(record.name)}</span><span class="supplement-verdict">${escape(record.verdict)}</span></summary>
 <div class="supplement-detail"><h2>${escape(record.question)}</h2><dl>${[
 [t('Em quem foi estudado ou pode haver necessidade','Who was studied or may have a need'),record.population],
 [t('O que a evidência permite dizer','What the evidence supports'),record.finding],
 [t('O que permanece incerto','What remains uncertain'),record.uncertainty],
 [t('Riscos e contexto de medicação','Risks and medication context'),record.risks],
 [t('Pergunta útil para esclarecer a decisão','A useful question for the decision'),record.discuss]
 ].map(([title,text])=>`<div><dt>${escape(title)}</dt><dd>${escape(text)}</dd></div>`).join('')}</dl>
 <a href="${escape(record.source)}" target="_blank" rel="noopener noreferrer">${t('Consultar fonte','Read the source')} · ${escape(record.name)}</a>${(record.additionalSources||[]).map(source=>`<p><a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.label)}</a></p>`).join('')}</div></details>`).join('')}</div>
 <p class="muted">${t(`Síntese editorial de ${records.length} suplementos. Os riscos referidos são exemplos, não uma lista completa. Não é uma classificação formal da qualidade de toda a literatura.`,`Editorial summary of ${records.length} supplements. Listed risks are examples, not a complete list. This is not a formal quality grading of all the literature.`)}</p>
 <p class="muted">${t('Revisão editorial','Editorial review')}: <time datetime="${SUPPLEMENTS_REVIEWED_AT}">${new Date(SUPPLEMENTS_REVIEWED_AT+'T12:00:00Z').toLocaleDateString(pt?'pt-PT':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}</time>. ${t('Fontes: fichas institucionais e ensaios humanos. A presença no guia não significa recomendação de utilização.','Sources: institutional factsheets and human trials. Inclusion in this guide is not a recommendation to use a supplement.')}</p>
 </section>`;
}
