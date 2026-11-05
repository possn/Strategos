// Presentation only: persisted decisions, instructions and timers remain canonical.
import {CODEX} from '../data/codex.js?v=review1';
const pt={
 strength:['Força',[
 ['Preparar','Respira devagar. Ajusta a postura.',['Mantém-te direito, com os pés por baixo das ancas.','Relaxa a mandíbula e os ombros.','Faz quatro respirações lentas antes de começar.']],
 ['Empurrar','Flexões controladas no chão ou com as mãos elevadas.',['Mãos um pouco mais afastadas do que os ombros.','Mantém cabeça, tronco e ancas alinhados.','Desce com controlo; para antes de perder a postura.','Mais fácil: mãos numa mesa ou parede. Mais difícil: descer mais devagar.']],
 ['Puxar','Remadas com barra, mesa ou sacos com carga.',['Conduz o movimento pelos cotovelos, mantendo o peito aberto.','Aproxima as omoplatas sem encolher os ombros.','Faz uma breve pausa em cima.','Usa uma mesa estável apenas se suportar o teu peso em segurança.']],
 ['Pernas','Agachamentos lentos e controlados.',['Pés aproximadamente à largura dos ombros.','Leva as ancas para trás, com os joelhos a acompanhar os dedos dos pés.','Mantém toda a planta do pé em contacto com o chão.','Fica direito sem bloquear os joelhos.']],
 ['Centro do corpo','Prancha ou dead bug.',['Na prancha, contrai os glúteos e mantém as costelas baixas.','No dead bug, mantém a região lombar suavemente encostada ao chão.','Respira durante o exercício; a qualidade importa mais do que a duração.','Para se sentires dor aguda nas costas ou nos ombros.']],
 ['Terminar','Fica de pé e recupera a respiração.',['Deixa a respiração abrandar naturalmente.','Observa o esforço, a tensão e a energia.','Termina com uma respiração calma e intencional.']]]],
 recovery:['Recuperação',[
 ['Abrandar','Inspira durante quatro tempos. Expira durante seis.',['Respira pelo nariz, se for confortável.','Mantém a expiração suave, longa e sem forçar.','Deixa os ombros descer em cada expiração.']],
 ['Mobilidade','Move devagar os ombros, as ancas e a coluna.',['Usa apenas amplitudes sem dor.','Acompanha a respiração em vez de forçar o alongamento.','Faz círculos com os ombros, roda a coluna torácica e mobiliza as ancas.']],
 ['Caminhar','Caminha sem o telemóvel, a um ritmo fácil.',['Mantém um ritmo que permita conversar.','Olha em frente, em vez de para o chão.','Deixa os braços balançar naturalmente.']],
 ['Terminar','Observa o que mudou.',['Compara a respiração e a tensão muscular com o início.','Identifica uma sensação sem a julgar.']]]],
 focus:['Foco',[
 ['Definir','Escreve o único resultado que importa.',['Usa uma frase concreta.','Escolhe um resultado observável.','Retira as tarefas desnecessárias para esse resultado.']],
 ['Trabalho concentrado','Uma tarefa, sem alternar.',['Silencia as notificações.','Mantém abertos apenas os materiais necessários.','Se te distraíres, repara nisso e volta sem te criticares.']],
 ['Terminar','Regista o próximo passo concreto.',['Escreve a ação exata que permite retomar o trabalho.','Deixa o espaço preparado para a próxima sessão.']]]],
 walk:['Caminhada',[
 ['Começar','Deixa o ecrã para trás.',['Mantém-te direito e liberta a tensão desnecessária.','Escolhe um percurso fácil, com poucas interrupções.']],
 ['Caminhar','Ritmo confortável. Respira pelo nariz quando for possível.',['Mantém uma passada natural.','Caminha a um ritmo que te permita pensar com clareza.','Repara em três coisas à tua volta sem as analisar.']],
 ['Regressar','Regressa com uma ideia clara.',['Abranda antes de parar.','Guarda uma ideia útil da caminhada.']]]],
 connection:['Ligação',[
 ['Escolher','Escolhe uma pessoa importante para ti.',['Escolhe estar presente, sem procurar eficiência.','Define como lhe darás atenção plena.']],
 ['Estar presente','Liga, escuta, brinca ou dedica atenção plena.',['Afasta o telemóvel, a menos que seja o meio de contacto.','Faz uma pergunta com interesse.','Escuta sem preparar a próxima resposta.']],
 ['Terminar','Termina sem correr para a próxima tarefa.',['Reconhece diretamente a outra pessoa.','Observa como te sentes depois do contacto.']]]]
};
const en={
 'sleep-plan':['Prepare for sleep',[
 ['Notice','Identify one concrete obstacle to rest.',['Choose just one: timing, light, noise or lack of a pause before bed.','You do not need to explain or assess every sleep difficulty.']],
 ['Prepare','Choose a small change for your next opportunity to rest.',['Plan a quiet moment before bed or an improvement in the environment.','Aim for regular timing when compatible with your life and shifts.','Do not force sleep or reduce sleep time to complete this plan.']],
 ['Choose','Note what you will do and on which occasion.',['Finishing with one feasible action is enough.','This preparation is not sleep time or insomnia treatment.','If difficulties persist or impair your day, seek a health assessment.']]]],
 'meal-plan':['Plan a meal',[
 ['Observe','Think of an upcoming meal and what you already have.',['Start with familiar foods that you know suit you.','Respect allergies, restrictions and existing nutritional or clinical advice.']],
 ['Plan','Choose a feasible, varied meal.',['Consider variety among foods you already tolerate and use.','General WHO guidance emphasises fruit, vegetables, pulses and whole grains; adapt it to your needs.','This plan does not require counting calories, restricting foods, fasting or adding supplements.']],
 ['Make it easier','Note one preparation or purchase that would make this meal easier.',['Choose just one next step.','Planning does not mean you have prepared or eaten the meal.','If you have a prescribed eating plan, keep it as your reference.']]]]
};
const pairs=[];
for(const practice of CODEX){
 const translated=pt[practice.id]||en[practice.id];if(!translated)continue;
 const portuguese=Boolean(pt[practice.id]);
 const add=(original,other)=>pairs.push(portuguese?[other,original]:[original,other]);
 add(practice.name,translated[0]);
 practice.phases.forEach((phase,i)=>{const row=translated[1][i];add(phase[0],row[0]);add(phase[2],row[1]);phase[3].forEach((text,j)=>add(text,row[2][j]));});
}
const toPt=new Map(pairs.map(([p,e])=>[e,p])),toEn=new Map(pairs);
export function practiceText(text,language){
 const value=String(text??''),map=language==='pt'?toPt:toEn;
 if(map.has(value))return map.get(value);
 const englishToPt=[
 [/^A (\d+)-minute strength practice offers the best current balance of adaptation and continuity\.$/,m=>`Uma prática de força de ${m[1]} minutos é a proposta de hoje para equilibrar adaptação e continuidade.`],
 [/^A (\d+)-minute recovery practice appears to offer the highest return today\.$/,m=>`Uma prática de recuperação de ${m[1]} minutos parece ser a opção mais útil hoje.`],
 [/^A protected (\d+)-minute focus practice is my best current judgement\.$/,m=>`A proposta de hoje é reservar ${m[1]} minutos para uma tarefa com foco.`],
 [/^A (\d+)-minute walk appears to create useful energy without unnecessary cost\.$/,m=>`Uma caminhada de ${m[1]} minutos parece útil sem esforço desnecessário.`],
 [/^A deliberate (\d+)-minute act of connection appears more valuable than another performance task today\.$/,m=>`A proposta de hoje é dedicar ${m[1]} minutos a uma relação importante.`],
 [/^A (\d+)-minute recovery practice is the safest useful direction while significant soreness is present\.$/,m=>`Com dor muscular significativa, a proposta é uma prática de recuperação de ${m[1]} minutos.`],
 [/^(\d+) of (\d+)$/,m=>`${m[1]} de ${m[2]}`],
 [/^(\d+)% complete$/,m=>`${m[1]}% concluído`],
 [/^Active for approximately (\d+) more minutes\.$/,m=>`Disponível para começar durante aproximadamente mais ${m[1]} minutos.`]
 ];
 const ptToEn=[[/^Reserva (\d+) minutos para preparar uma próxima oportunidade de descanso\.$/,m=>`Set aside ${m[1]} minutes to prepare your next opportunity to rest.`],[/^Reserva (\d+) minutos para planear uma refeição viável\.$/,m=>`Set aside ${m[1]} minutes to plan a feasible meal.`]];
 for(const [pattern,render] of language==='pt'?englishToPt:ptToEn){const match=value.match(pattern);if(match)return render(match);}
 return value;
}
