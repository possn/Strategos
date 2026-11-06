import {mindfulFeedbackPreference} from './mindful-feedback.js?v=feedback1';
import {todaySignals} from './daily-signals.js?v=pathways1';
// A small editorial decision, derived only from today's explicitly reported context.
// Never use defaults, inferred health scores or historical symptoms as current evidence.
const COPY={
 pt:{
  mindful:{title:'Mindfulness',description:'Uma pausa consciente de 90 segundos.',reason:'Pausa livre, sem avaliação prévia.'},
  stress:{title:'Mindfulness',description:'Hoje, uma pausa para ganhar espaço.',reason:'Sugerido pela carga emocional referida hoje.'},
  recovery:{title:'Recuperação',description:'90 segundos para abrandar.',reason:'Sugerido pelo sono, energia ou desconforto referidos hoje.'},
  reflection:{title:'Reflexão',description:'Uma pergunta para ganhar clareza.',reason:'Sugerida pelo desafio mental ou relacional referido hoje.'},
  alternative:{title:'Reflexão',description:'Hoje, uma perspetiva diferente.',reason:'Alternativa sugerida a partir do feedback que escolheste registar.'}
 },
 en:{
  mindful:{title:'Mindfulness',description:'A 90-second mindful pause.',reason:'An open invitation, without prior assessment.'},
  stress:{title:'Mindfulness',description:'A little space for today.',reason:'Suggested from today’s reported emotional load.'},
  recovery:{title:'Recovery',description:'90 seconds to slow down.',reason:'Suggested from today’s reported sleep, energy or discomfort.'},
  reflection:{title:'Reflection',description:'One question for greater clarity.',reason:'Suggested from today’s mental or relational challenge.'},
  alternative:{title:'Reflection',description:'A different perspective today.',reason:'An alternative based on feedback you chose to record.'}
 }
};
export function contextualNextStep(state={},language='pt',now=new Date()){
 const reported=todaySignals(state.dailyCheckIns,now);
 const has=key=>Object.hasOwn(reported,key);
 let kind='mindful';
 if(has('emotionalLoad')&&reported.emotionalLoad==='heavy')kind='stress';
 else if((has('sleep')&&reported.sleep<=2)||(has('energy')&&reported.energy===1)||(has('soreness')&&reported.soreness==='significant'))kind='recovery';
 else if(has('challenge')&&['mind','focus','work','family'].includes(reported.challenge))kind='reflection';
 if(kind!=='reflection'&&mindfulFeedbackPreference(state.mindfulFeedback).offerAlternative)kind='alternative';
 const t=COPY[language==='en'?'en':'pt'][kind];
 return {kind,action:['reflection','alternative'].includes(kind)?'journey':'open-mindfulness',...t,personalized:kind!=='mindful'};
}
