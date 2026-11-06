// Quantified self-reports, not sensor readings, medical tests or diagnoses.
export const METRIC_FIELDS=Object.freeze([
 Object.freeze({key:'sleepHours',min:3,max:12,step:0.5,unit:'h'}),
 Object.freeze({key:'aerobicMinutes',min:0,max:1000,step:5,unit:'min/week'}),
 Object.freeze({key:'strengthDays',min:0,max:7,step:1,unit:'days/week'})
]);
const isValid=(key,value)=>{
 const field=METRIC_FIELDS.find(x=>x.key===key);
 return Boolean(field&&typeof value==='number'&&Number.isFinite(value)&&value>=field.min&&value<=field.max&&Math.abs(value/field.step-Math.round(value/field.step))<1e-8);
};
export function normaliseQuantifiedContext(input){
 if(!input||typeof input!=='object'||input.source!=='self-report'||input.consentVersion!==1)return null;
 if(typeof input.recordedAt!=='string'||!Number.isFinite(Date.parse(input.recordedAt)))return null;
 if(!METRIC_FIELDS.every(field=>isValid(field.key,input[field.key])))return null;
 return {source:'self-report',consentVersion:1,recordedAt:input.recordedAt,...Object.fromEntries(METRIC_FIELDS.map(field=>[field.key,input[field.key]]))};
}
export function createQuantifiedContext(values,{now=new Date()}={}){
 const fields=Object.fromEntries(METRIC_FIELDS.map(field=>[field.key,values?.[field.key]]));
 return normaliseQuantifiedContext({source:'self-report',consentVersion:1,recordedAt:now.toISOString(),...fields});
}
export function quantifiedContextLines(input,language='pt'){
 const item=normaliseQuantifiedContext(input),pt=language==='pt';
 if(!item)return [];
 const records=[
 [pt?'Sono habitual referido':'Reported usual sleep',`${item.sleepHours} h`],
 [pt?'Atividade aeróbia semanal referida':'Reported weekly aerobic activity',`${item.aerobicMinutes} min`],
 [pt?'Treino de força semanal referido':'Reported weekly strength training',`${item.strengthDays} ${pt?'dias':'days'}`]
 ];
 return records.map(([label,value])=>`${label}: ${value}`);
}
export function quantifiedContextCaution(input,language='pt'){
 const item=normaliseQuantifiedContext(input),pt=language==='pt';
 if(!item)return '';
 // This is educational context; neither a clinical decision nor an eligibility gate.
 if(item.sleepHours<7)return pt?'O sono referido é inferior à faixa habitualmente recomendada para muitos adultos. Confirma se esta duração é representativa e avalia a qualidade e o contexto do sono.':'Reported sleep is below the range usually recommended for many adults. Check whether this reflects your usual schedule and consider sleep quality and context.';
 if(item.aerobicMinutes<150)return pt?'A atividade aeróbia referida está abaixo dos 150 minutos semanais de intensidade moderada usados como referência geral para adultos. A progressão deve respeitar limitações e intensidade.':'Reported aerobic activity is below the general reference of 150 weekly minutes of moderate-intensity activity for adults. Progression must account for intensity and limitations.';
 if(item.strengthDays<2)return pt?'Registas menos de duas sessões semanais de força; as orientações gerais para adultos incluem fortalecimento muscular em pelo menos dois dias.':'You report fewer than two weekly strength sessions; general adult guidance includes muscle strengthening on at least two days.';
 return pt?'Estes dados são auto-declarados, não confirmam aptidão clínica nem demonstram benefício individual.':'These figures are self-reported and do not establish clinical fitness or individual benefit.';
}
