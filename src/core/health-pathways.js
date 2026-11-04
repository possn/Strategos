// Planning aids, not clinical prescriptions or estimates of health benefit.
export const HEALTH_PATHWAYS=Object.freeze({
  sleep:Object.freeze({practiceId:'sleep-plan',source:'https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits',reviewedAt:'2026-11-04'}),
  nutrition:Object.freeze({practiceId:'meal-plan',source:'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',reviewedAt:'2026-11-04'})
});

// Each existing advisor evaluates the new action within its own domain.
// These are ordinal product-policy weights, not clinical effect sizes.
export function withHealthPathwayOpinion(advisor,context={}){
  const pathway=Object.hasOwn(HEALTH_PATHWAYS,context.challenge)?HEALTH_PATHWAYS[context.challenge]:null;
  if(!pathway)return advisor;
  const heavy=context.emotionalLoad==='heavy';
  const domain={
    Body:{score:context.challenge==='nutrition'?.65:.45,reason:'Esta ação planeia um hábito; não presume conhecer as necessidades clínicas ou nutricionais individuais.'},
    Recovery:{score:context.challenge==='sleep'?.9:.4,reason:context.challenge==='sleep'?'Preparar uma oportunidade de descanso responde à prioridade que indicaste.':'Uma tarefa de planeamento breve pode respeitar a recuperação sem impor uma alteração alimentar.'},
    Mind:{score:heavy?.5:.7,reason:'Um plano pequeno permite escolher um próximo passo sem tentar resolver toda a saúde num dia.'},
    Agency:{score:.95,reason:'Há uma versão de cinco minutos; podes terminar com uma única decisão praticável.'},
    Purpose:{score:1,reason:context.challenge==='sleep'?'Escolheste cuidar do sono como prioridade de hoje.':'Escolheste cuidar da alimentação como prioridade de hoje.'},
    Relationships:{score:.35,reason:'O plano pode adaptar-se às obrigações familiares e ao apoio disponível.'}
  }[advisor.advisor];
  if(!domain)return advisor;
  return {...advisor,
    scores:{...advisor.scores,[pathway.practiceId]:domain.score},
    practiceReasons:{...(advisor.practiceReasons||{}),[pathway.practiceId]:domain.reason},
    unknowns:[...(advisor.unknowns||[]),'Clinical needs and health outcomes are not assessed by this planning practice.'],
    evidence:[...(advisor.evidence||[]),{family:'scientific_framework',description:'General habit guidance; this source does not validate an individual treatment or this app’s scoring.',source:pathway.source,reliability:'moderate',independent:false,observedAt:pathway.reviewedAt}]
  };
}

export function boundPlanningConfidence(value,practice){
  return practice?.planningOnly?Math.min(70,Number(value)):Number(value);
}
