import { HEALTHSPAN_DOMAINS, HEALTHSPAN_BOUNDARIES, HEALTHSPAN_REVIEWED_AT } from '../data/healthspan.js?v=pathways1';

export function renderHealthspanFoundation(){
  return `<details class="healthspan-foundation" lang="pt-PT">
    <summary>Viver melhor, ao longo da vida</summary>
    <div class="healthspan-content">
      <p class="eyebrow">STRATEGOS · SAÚDE E DISCERNIMENTO</p>
      <h2>Cuidar de hoje. Preservar o amanhã.</h2>
      <p>O estoicismo ajuda a escolher o que depende de ti. O taoísmo lembra que agir bem também implica flexibilidade e descanso. A evidência científica orienta os conteúdos de saúde.</p>
      <p>Estes são os fundamentos desta evolução. O acompanhamento personalizado de saúde será construído por etapas.</p>
      ${HEALTHSPAN_DOMAINS.map(domain=>`<details class="healthspan-domain"><summary>${domain.title}</summary><p>${domain.practice}</p><p class="muted">${domain.evidence}</p><a href="${domain.source}" target="_blank" rel="noopener noreferrer">Consultar a fonte <span class="sr-only">sobre ${domain.title}</span></a></details>`).join('')}
      <p><a href="#supplements" data-supplements-link>Consultar o guia de suplementos</a></p>
      <details class="healthspan-domain"><summary>Critérios e limites</summary><ul>${HEALTHSPAN_BOUNDARIES.map(text=>`<li>${text}</li>`).join('')}</ul><p>Conteúdo educativo. Não constitui avaliação clínica nem um plano individual de saúde.</p><p class="muted">Última revisão editorial: <time datetime="${HEALTHSPAN_REVIEWED_AT}">4 de novembro de 2026</time>.</p></details>
    </div>
  </details>`;
}

export function renderPracticeFoundation(record){
  if(!record)return '';
  const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const source=new URL(record.source);
  if(source.protocol!=='https:')return '';
  return `<details class="healthspan-practice" lang="pt-PT"><summary>Filosofia e fundamento desta prática</summary><p>${escape(record.principle)}</p><p>${escape(record.purpose)}</p><p class="muted">${escape(record.limit)}</p><a href="${escape(source.href)}" target="_blank" rel="noopener noreferrer">Consultar o enquadramento</a></details>`;
}
