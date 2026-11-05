import {HEALTHSPAN_REVIEWED_AT} from '../data/healthspan.js?v=pathways1';
import {healthspanDomains,healthspanBoundaries,foundationText} from '../data/healthspan-en.js?v=language4';
const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function renderHealthspanFoundation(language='pt'){
 const pt=language!=='en',t=(p,e)=>pt?p:e;
 return `<details class="healthspan-foundation" lang="${pt?'pt-PT':'en'}">
 <summary>${t('Viver melhor, ao longo da vida','Live better, throughout life')}</summary>
 <div class="healthspan-content">
 <p class="eyebrow">${t('STRATEGOS · SAÚDE E DISCERNIMENTO','STRATEGOS · HEALTH AND DISCERNMENT')}</p>
 <h2>${t('Cuidar de hoje. Preservar o amanhã.','Care for today. Preserve tomorrow.')}</h2>
 <p>${t('O estoicismo ajuda a escolher o que depende de ti. O taoísmo lembra que agir bem também implica flexibilidade e descanso. A evidência científica orienta os conteúdos de saúde.','Stoicism helps you choose what is within your control. Taoism reminds us that acting well also involves flexibility and rest. Scientific evidence informs the health content.')}</p>
 <p>${t('Estes são os fundamentos desta evolução. O acompanhamento personalizado de saúde será construído por etapas.','These are the foundations of this development. Personalised health support will be built in stages.')}</p>
 ${healthspanDomains(language).map(domain=>`<details class="healthspan-domain"><summary>${escape(domain.title)}</summary><p>${escape(domain.practice)}</p><p class="muted">${escape(domain.evidence)}</p><a href="${escape(domain.source)}" target="_blank" rel="noopener noreferrer">${t('Consultar a fonte','Read the source')} <span class="sr-only">${t('sobre','about')} ${escape(domain.title)}</span></a></details>`).join('')}
 <p><a href="#supplements" data-supplements-link>${t('Consultar o guia de suplementos','Read the supplement guide')}</a></p>
 <details class="healthspan-domain"><summary>${t('Critérios e limites','Criteria and limits')}</summary><ul>${healthspanBoundaries(language).map(text=>`<li>${escape(text)}</li>`).join('')}</ul><p>${t('Conteúdo educativo. Não constitui avaliação clínica nem um plano individual de saúde.','Educational content. This is not a clinical assessment or an individual health plan.')}</p><p class="muted">${t('Última revisão editorial','Last editorial review')}: <time datetime="${HEALTHSPAN_REVIEWED_AT}">${new Date(HEALTHSPAN_REVIEWED_AT+'T12:00:00Z').toLocaleDateString(pt?'pt-PT':'en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}</time>.</p></details>
 </div></details>`;
}
export function renderPracticeFoundation(record,language='pt'){
 if(!record)return '';
 const source=new URL(record.source);if(source.protocol!=='https:')return '';
 const pt=language!=='en';
 return `<details class="healthspan-practice" lang="${pt?'pt-PT':'en'}"><summary>${pt?'Filosofia e fundamento desta prática':'Philosophy and purpose of this practice'}</summary><p>${escape(foundationText(record.principle,language))}</p><p>${escape(foundationText(record.purpose,language))}</p><p class="muted">${escape(foundationText(record.limit,language))}</p><a href="${escape(source.href)}" target="_blank" rel="noopener noreferrer">${pt?'Consultar o enquadramento':'Read the background'}</a></details>`;
}
