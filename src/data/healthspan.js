// Educational content. These records never authorize clinical recommendations.
export const HEALTHSPAN_REVIEWED_AT = '2026-11-04';
export const HEALTHSPAN_DOMAINS = Object.freeze([
  {id:'movement',title:'Corpo capaz',practice:'Construir força, resistência, mobilidade e equilíbrio, respeitando a capacidade atual.',evidence:'A OMS recomenda atividade aeróbia e fortalecimento muscular; na idade avançada, também trabalho de equilíbrio.',source:'https://www.who.int/europe/publications/i/item/9789240014886'},
  {id:'nutrition',title:'Alimentação suficiente',practice:'Cuidar da qualidade e adequação alimentar antes de acrescentar suplementos.',evidence:'As necessidades nutricionais variam. Suplementar pode ser útil em situações específicas e pode causar interações.',source:'https://www.nia.nih.gov/health/vitamins-and-supplements/dietary-supplements-older-adults'},
  {id:'sleep',title:'Sono e recuperação',practice:'Dar espaço ao descanso e adaptar o esforço ao estado presente.',evidence:'Sono, atividade física, alimentação e acompanhamento de saúde integram o envelhecimento saudável.',source:'https://health.nih.gov/health-topics-a-z/healthy-aging'},
  {id:'mind',title:'Clareza e equilíbrio',practice:'Observar o que sentes, distinguir factos de interpretações e escolher o que podes fazer.',evidence:'As práticas de atenção plena podem ajudar algumas pessoas; os resultados variam e podem ocorrer efeitos adversos.',source:'https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety'},
  {id:'connection',title:'Relações e sentido',practice:'Reservar presença para as pessoas e atividades que dão significado à vida.',evidence:'A saúde mental na idade avançada também depende do contexto social, das perdas e do sentido de propósito.',source:'https://www.who.int/news-room/fact-sheets/detail/mental-health-of-older-adults'},
  {id:'autonomy',title:'Autonomia ao longo da vida',practice:'Preservar as capacidades que permitem participar e viver o quotidiano.',evidence:'A OMS centra o envelhecimento saudável na capacidade funcional e na relação entre pessoa e ambiente.',source:'https://www.who.int/news-room/questions-and-answers/item/healthy-ageing-and-functional-ability'}
].map(Object.freeze));

export const HEALTHSPAN_BOUNDARIES = Object.freeze([
  'A filosofia orienta escolhas; não é apresentada como tratamento médico.',
  'Uma melhoria num biomarcador não prova prolongamento da vida.',
  'O contexto diário atual não permite prescrever suplementos, doses ou tratamentos.',
  'Os relatos pessoais ajudam a adaptar a experiência; não demonstram causalidade clínica.',
  'Descansar, recusar uma prática e pedir ajuda são escolhas legítimas.'
]);

// Rationale accompanies an existing deliberated practice; it never changes ranking.
export const PRACTICE_FOUNDATIONS = Object.freeze({
  strength: Object.freeze({domain:'movement',principle:'Coragem com prudência: progredir dentro da capacidade atual.',purpose:'Trabalhar a força, uma componente da capacidade física.',limit:'Uma sessão não permite prever ganhos de força, autonomia ou anos de vida.'}),
  walk: Object.freeze({domain:'movement',principle:'Agir com simplicidade: um passo possível, sem forçar.',purpose:'Criar uma oportunidade de movimento adaptada ao dia.',limit:'Uma caminhada leve pode não atingir intensidade aeróbia moderada. Não equivale, por si só, às recomendações semanais.'}),
  recovery: Object.freeze({domain:'sleep',principle:'Temperança e flexibilidade: recuperar também faz parte do caminho.',purpose:'Dar espaço à recuperação e observar como te sentes.',limit:'Esta prática não trata insónia, doença ou lesão. Não é necessário controlar a respiração se isso causar desconforto.'}),
  focus: Object.freeze({domain:'mind',principle:'Sabedoria prática: distinguir o que depende de ti e escolher uma tarefa.',purpose:'Reservar atenção para uma ação com significado.',limit:'É uma prática de organização pessoal; não é um tratamento de saúde mental nem um exercício com benefício de longevidade demonstrado.'}),
  connection: Object.freeze({domain:'connection',principle:'Justiça e presença: cuidar da relação através da atenção.',purpose:'Criar espaço para uma relação que a pessoa valoriza.',limit:'O valor das relações não permite garantir um efeito clínico de uma conversa ou atividade isolada.'})
});

export function practiceFoundation(practiceId){
  if(!Object.hasOwn(PRACTICE_FOUNDATIONS,practiceId))return null;
  const record=PRACTICE_FOUNDATIONS[practiceId];
  const domain=HEALTHSPAN_DOMAINS.find(item=>item.id===record.domain);
  return {...record,source:domain.source,reviewedAt:HEALTHSPAN_REVIEWED_AT};
}
