// Editorial evidence summaries. This catalogue is not an input to the decision engine.
export const SUPPLEMENTS_REVIEWED_AT='2026-11-05';
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
  }  ,{
    id:'resveratrol',name:'Resveratrol',verdict:'Resultados humanos específicos; longevidade por demonstrar',
    question:'Que benefício humano foi realmente medido?',
    population:'Ensaios em populações distintas, incluindo pessoas mais velhas com artrose do joelho e homens mais velhos em treino.',
    finding:'Um ensaio de 16 semanas em 123 pessoas com artrose encontrou melhorias em fragilidade, dor e força de preensão, mas não na velocidade da marcha. Não permite generalizar a adultos saudáveis.',
    uncertainty:'Não demonstra prolongamento da vida. Noutro ensaio, com 27 homens durante oito semanas de treino, atenuou algumas adaptações cardiovasculares ao exercício.',
    risks:'O resultado desfavorável com exercício contraria a ideia de que acrescentar um antioxidante é sempre benéfico. Estes ensaios não estabelecem segurança a longo prazo nem avaliam todas as interações.',
    discuss:'Existe um objetivo clínico concreto ou apenas uma promessa de antienvelhecimento?',
    source:'https://pubmed.ncbi.nlm.nih.gov/40990472/',
    additionalSources:[{label:'Ensaio sobre resveratrol e exercício',url:'https://pubmed.ncbi.nlm.nih.gov/23878368/'}]
  },{
    id:'nmn',name:'NMN',verdict:'NAD+ aumenta; benefício clínico geral permanece incerto',
    question:'Aumentar NAD+ traduz-se em viver melhor ou mais tempo?',
    population:'Ensaios pequenos em adultos mais velhos e em mulheres pós-menopáusicas com pré-diabetes; não representam toda a população.',
    finding:'Um ensaio de 2026, de 24 semanas, encontrou aumento sustentado de metabolitos relacionados com NAD+, com evidência limitada de benefícios fisiológicos mais amplos. Um ensaio anterior em 25 mulheres encontrou melhoria da sensibilidade muscular à insulina, sem redução significativa da glicemia em jejum.',
    uncertainty:'Um biomarcador não é um desfecho de longevidade. Estes resultados não demonstram prevenção de diabetes, incapacidade ou mortalidade.',
    risks:'A duração e dimensão dos ensaios limitam a avaliação de efeitos raros e da utilização durante anos. Não permitem presumir segurança universal ou equivalência entre produtos.',
    discuss:'Qual é o desfecho procurado, e que incerteza sobre benefício e segurança se está a aceitar?',
    source:'https://www.nature.com/articles/s41514-026-00482-7',
    additionalSources:[{label:'Ensaio em mulheres com pré-diabetes',url:'https://pubmed.ncbi.nlm.nih.gov/33888596/'}]
  },{
    id:'nr',name:'NR — ribósido de nicotinamida',verdict:'Precursor de NAD+ com sinais clínicos ainda exploratórios',
    question:'Há benefício funcional além do biomarcador?',
    population:'O ensaio NICE estudou 90 pessoas com doença arterial periférica durante seis meses.',
    finding:'A diferença no teste de marcha de seis minutos favoreceu NR em cerca de 18 metros. O estudo usou um limiar estatístico pré-definido de 0,10; o resultado teve p=0,08. Resveratrol não acrescentou benefício ao NR.',
    uncertainty:'É um resultado exploratório numa doença específica, que exige confirmação. Não prova benefício equivalente em pessoas saudáveis nem prolongamento da vida.',
    risks:'A segurança numa amostra pequena durante seis meses não estabelece segurança ao longo de anos. NR e NMN são moléculas distintas; resultados de uma não se transferem automaticamente para a outra.',
    discuss:'O benefício alegado corresponde à população e ao desfecho realmente estudados?',
    source:'https://www.nature.com/articles/s41467-024-49092-5'
  },{
    id:'psyllium',name:'Psyllium — fibra solúvel',verdict:'Benefício demonstrado no LDL; não é uma prova de longevidade',
    question:'Pode complementar a alimentação na redução do LDL?',
    population:'Adultos com hipercolesterolemia, como complemento de uma intervenção alimentar.',
    finding:'Num ensaio aleatorizado de 26 semanas, o LDL foi cerca de 7% inferior ao placebo no final do estudo. O efeito foi sobre um fator de risco, não sobre eventos cardiovasculares ou duração da vida.',
    uncertainty:'Não substitui a avaliação do risco cardiovascular nem tratamentos indicados. O efeito depende do contexto alimentar e da utilização.',
    risks:'Precisa de líquido adequado. Dificuldade em engolir ou obstrução intestinal exigem avaliação antes da utilização. Pode interferir com medicamentos; o intervalo necessário depende do fármaco.',
    discuss:'O objetivo é trânsito intestinal ou LDL, e existe medicação cuja absorção possa ser afetada?',
    source:'https://pubmed.ncbi.nlm.nih.gov/10837282/',
    additionalSources:[{label:'Precauções e interações — MedlinePlus',url:'https://medlineplus.gov/druginfo/meds/a601104.html'}]
  }

].map(record=>Object.freeze({...record,reviewedAt:SUPPLEMENTS_REVIEWED_AT})));
