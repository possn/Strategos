// Original practice prompts inspired by traditions, never attributed quotations.
const prompts=[
 ['stoic','What is within your control today?','O que depende de ti hoje?','Choose one response you can take responsibility for.','Escolhe uma resposta pela qual possas assumir responsabilidade.'],
 ['tao','Where could you stop forcing?','Onde podes deixar de forçar?','Look for a smaller, workable next step.','Procura um próximo passo mais pequeno e possível.'],
 ['stoic','What would acting with fairness look like?','Como seria agir com justiça?','Consider the effect of one choice on another person.','Considera o efeito de uma escolha noutra pessoa.'],
 ['tao','What needs room rather than more effort?','O que precisa de espaço em vez de mais esforço?','Notice one demand you can simplify.','Repara numa exigência que possas simplificar.'],
 ['stoic','What matters enough to practise patiently?','O que merece ser praticado com paciência?','Name one action consistent with your values.','Identifica uma ação coerente com os teus valores.'],
 ['tao','How could you adapt to today’s limits?','Como podes adaptar-te aos limites de hoje?','Adjust the size of the action to the day you actually have.','Ajusta a dimensão da ação ao dia que realmente tens.'],
 ['stoic','What can you learn without judging yourself?','O que podes aprender sem te condenares?','Review one choice and one possible adjustment.','Revê uma escolha e um ajuste possível.']
];
export function philosophyPrompt(day,language='en'){
 const [y,m,d]=String(day).split('-').map(Number);
 const stamp=Date.UTC(y,m-1,d);
 const row=prompts[Number.isFinite(stamp)?((Math.floor(stamp/86400000)%prompts.length)+prompts.length)%prompts.length:0];
 const pt=language==='pt';
 return {tradition:row[0],label:row[0]==='stoic'?(pt?'Inspiração estoica':'Stoic inspiration'):(pt?'Inspiração taoísta':'Taoist inspiration'),question:row[pt?2:1],action:row[pt?4:3],boundary:pt?'Uma proposta de reflexão, não uma citação nem uma avaliação de saúde.':'A reflection prompt, not a quotation or a health assessment.'};
}
