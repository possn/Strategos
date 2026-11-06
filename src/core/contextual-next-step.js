import {recentReportedPattern,shortPatternDescription,longitudinalReason} from './recent-reported-pattern.js?v=longpattern1';
import {mindfulFeedbackPreference} from './mindful-feedback.js?v=longpattern1';
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
 const pattern=recentReportedPattern(state.dailyCheckIns,now);
 // A current, explicitly reported signal always outweighs an older pattern or preference.
 // Reject longitudinal suggestions contradicted by a positive signal reported today.
 const contradicts=pattern&&(
   (pattern.signal==='sleep'&&has('sleep')&&reported.sleep>=3)||
   (pattern.signal==='energy'&&has('energy')&&reported.energy>=2)||
   (pattern.signal==='emotionalLoad'&&has('emotionalLoad')&&reported.emotionalLoad!=='heavy')||
   (pattern.signal==='challenge'&&has('challenge')&&!['mind','focus','work','family'].includes(reported.challenge))
 );
 const fromHistory=kind==='mindful'&&!contradicts?pattern:null;
 if(fromHistory)kind=fromHistory.kind;
 // Preference learning is a soft alternative, never a reason to overrule today's
 // explicitly reported stress, recovery need, or reflection challenge.
 if(kind==='mindful'&&mindfulFeedbackPreference(state.mindfulFeedback,{now}).offerAlternative)kind='alternative';
 const t=COPY[language==='en'?'en':'pt'][kind];
 return {kind,action:['reflection','alternative'].includes(kind)?'journey':'open-mindfulness',...t,
  description:fromHistory?shortPatternDescription(fromHistory,language):t.description,
  reason:fromHistory?longitudinalReason(fromHistory,language):t.reason,
  personalized:kind!=='mindful',basis:fromHistory?'recent-self-report':kind==='alternative'?'explicit-feedback':kind==='mindful'?'none':'today-self-report'};
}
