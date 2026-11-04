// Editorial evidence summaries. This catalogue is not an input to the decision engine.
export const SUPPLEMENTS_REVIEWED_AT='2026-11-04';
export const SUPPLEMENT_GUIDE=Object.freeze([
  {
    id:'creatine',name:'Creatina',verdict:'Desempenho: benefício em contextos específicos',
    question:'Pode apoiar o treino de força e potência?',
    population:'Adultos saudáveis em treino, sobretudo com esforços breves e repetidos de elevada intensidade.',
    finding:'Ensaios mostram benefícios em força, potência e adaptação ao treino. A resposta varia entre pessoas.',
    uncertainty:'Os resultados de desempenho não demonstram, por si só, prolongamento da vida. O benefício é menor em esforços predominantemente de resistência prolongada.',
    risks:'Pode aumentar o peso por retenção de água. Há relatos de desconforto gastrointestinal. A evidência em adultos saudáveis não resolve todas as situações clínicas.',
    discuss:'Qual é o objetivo de treino e há condições clínicas que alterem a decisão?',
    source:'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/'
  },
  {
    id:'vitamin-d',name:'Vitamina D',verdict:'Distinguir défice de suplementação de rotina',
    question:'Há uma necessidade concreta a corrigir?',
    population:'A necessidade depende do contexto nutricional e clínico; não se deduz apenas da idade ou de um dia de cansaço.',
    finding:'A deficiência pode prejudicar a mineralização óssea. Corrigir uma deficiência é uma situação diferente de suplementar pessoas sem défice.',
    uncertainty:'No ensaio VITAL, em adultos maioritariamente com níveis suficientes, a suplementação não reduziu as fraturas. Isto não resolve todas as indicações clínicas.',
    risks:'O excesso pode causar hipercalcemia e lesão renal. A associação a diuréticos tiazídicos pode aumentar o risco de hipercalcemia em algumas pessoas.',
    discuss:'Qual é a indicação, que outros produtos já contêm vitamina D e como será reavaliada a necessidade?',
    source:'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/'
  },
  {
    id:'vitamin-b12',name:'Vitamina B12',verdict:'Utilidade ligada ao risco ou presença de défice',
    question:'A ingestão ou absorção pode ser insuficiente?',
    population:'Pessoas veganas ou vegetarianas, adultos mais velhos e pessoas com problemas de absorção podem apresentar maior risco de deficiência.',
    finding:'A suplementação pode ajudar a prevenir ou corrigir deficiência; a causa do problema influencia a abordagem.',
    uncertainty:'Sem défice, não demonstrou melhorar o desempenho físico ou a resistência. A associação da B12 ao metabolismo não prova um efeito energético adicional em pessoas com níveis suficientes.',
    risks:'Metformina e medicamentos que reduzem a acidez gástrica podem afetar os níveis ou a absorção de B12. Isto é diferente de afirmar que a B12 interage perigosamente com esses medicamentos.',
    discuss:'Há fatores de risco, uma necessidade identificada ou uma causa de má absorção a avaliar?',
    source:'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/'
  },
  {
    id:'omega-3',name:'Ómega‑3',verdict:'O resultado depende da formulação e da população',
    question:'Qual é o objetivo e de que produto se trata?',
    population:'Os resultados variam entre prevenção geral e pessoas com risco cardiovascular ou triglicéridos elevados.',
    finding:'Pode reduzir triglicéridos. Os benefícios cardiovasculares dependem da população e da formulação estudadas; medicamentos prescritos não equivalem a qualquer suplemento de óleo de peixe.',
    uncertainty:'Os ensaios cardiovasculares não têm resultados uniformes. Não se deve transferir o benefício de uma formulação para todos os produtos.',
    risks:'Doses elevadas aumentaram a incidência de fibrilhação auricular em alguns ensaios com pessoas de alto risco cardiovascular. A utilização com anticoagulantes merece revisão das possíveis interações.',
    discuss:'O objetivo é alimentar ou terapêutico, e existem antecedentes de arritmia ou medicação anticoagulante?',
    source:'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/'
  },
  {
    id:'multivitamin',name:'Multivitamínicos',verdict:'Cobrir necessidades não é garantir longevidade',
    question:'Que insuficiência alimentar se pretende compensar?',
    population:'Pessoas com ingestões inadequadas ou necessidades específicas; as formulações variam muito.',
    finding:'Podem ajudar a atingir ingestões adequadas. Alguns ensaios em adultos mais velhos observaram benefício cognitivo, o que não equivale a prevenir todas as doenças.',
    uncertainty:'A evidência não permite recomendar uso universal para prevenir doença cardiovascular ou cancro. Um resultado cognitivo não prova prolongamento da vida.',
    risks:'Combinar um multivitamínico com suplementos isolados pode duplicar nutrientes e ultrapassar limites de ingestão.',
    discuss:'Que nutrientes faltam, que produtos já são usados e será mais adequado corrigir uma necessidade específica?',
    source:'https://ods.od.nih.gov/factsheets/MVMS-HealthProfessional/'
  }
].map(record=>Object.freeze({...record,reviewedAt:SUPPLEMENTS_REVIEWED_AT})));
