import {HEALTHSPAN_DOMAINS,HEALTHSPAN_BOUNDARIES,PRACTICE_FOUNDATIONS} from './healthspan.js?v=pathways1';
const domains={
 movement:['A capable body','Build strength, endurance, mobility and balance while respecting current capacity.','WHO recommends aerobic activity and muscle strengthening; in older age, balance work is also recommended.'],
 nutrition:['Adequate nutrition','Take care of dietary quality and adequacy before adding supplements.','Nutritional needs vary. Supplements can be useful in specific situations and can cause interactions.'],
 sleep:['Sleep and recovery','Make room for rest and adapt effort to your current state.','Sleep, physical activity, nutrition and healthcare are part of healthy ageing.'],
 mind:['Clarity and balance','Notice how you feel, distinguish facts from interpretations and choose what you can do.','Mindfulness practices may help some people; results vary and adverse effects can occur.'],
 connection:['Relationships and meaning','Make time to be present with people and activities that give life meaning.','Mental health in older age also depends on social context, losses and a sense of purpose.'],
 autonomy:['Autonomy throughout life','Preserve the abilities that allow participation and everyday living.','WHO centres healthy ageing on functional ability and the relationship between a person and their environment.']
};
const boundaries=[
 'Philosophy guides choices; it is not presented as medical treatment.',
 'An improvement in a biomarker does not prove a longer life.',
 'Current daily context does not support prescribing supplements, doses or treatments.',
 'Personal reports help adapt the experience; they do not demonstrate clinical causality.',
 'Resting, declining a practice and asking for help are legitimate choices.'
];
const foundations={
 'sleep-plan':['Temperance: prepare conditions for rest without forcing results.','Choose a small change to the timing or environment for rest.','This is habit planning, not sleep achieved, insomnia treatment or evidence of clinical improvement.'],
 'meal-plan':['Wisdom and simplicity: make a meal feasible with the resources available.','Plan a varied meal with familiar foods that suit you.','This is planning, not a meal consumed or a dietary prescription. Respect allergies and existing clinical advice.'],
 strength:['Courage with prudence: progress within your current capacity.','Work on strength, one component of physical capacity.','One session cannot predict gains in strength, autonomy or years of life.'],
 walk:['Act simply: take a feasible step without forcing.','Create an opportunity for movement adapted to the day.','An easy walk may not reach moderate aerobic intensity. It does not by itself meet weekly recommendations.'],
 recovery:['Temperance and flexibility: recovery is also part of the journey.','Make room for recovery and notice how you feel.','This practice does not treat insomnia, illness or injury. You do not need to control your breathing if doing so causes discomfort.'],
 focus:['Practical wisdom: distinguish what is within your control and choose one task.','Set aside attention for a meaningful action.','This is a personal organisation practice, not a mental health treatment or an exercise with demonstrated longevity benefits.'],
 connection:['Justice and presence: care for a relationship through attention.','Make room for a relationship the person values.','The value of relationships does not guarantee a clinical effect from an isolated conversation or activity.']
};
const translations=new Map();
for(const [id,record] of Object.entries(PRACTICE_FOUNDATIONS))['principle','purpose','limit'].forEach((key,i)=>translations.set(record[key],foundations[id][i]));
export function healthspanDomains(language='pt'){
 return language==='en'?HEALTHSPAN_DOMAINS.map(record=>({...record,title:domains[record.id][0],practice:domains[record.id][1],evidence:domains[record.id][2]})):HEALTHSPAN_DOMAINS;
}
export function healthspanBoundaries(language='pt'){return language==='en'?[...boundaries]:HEALTHSPAN_BOUNDARIES;}
export function foundationText(text,language='pt'){return language==='en'?(translations.get(text)||text):text;}
