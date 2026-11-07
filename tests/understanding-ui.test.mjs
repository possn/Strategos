import test from 'node:test';
import assert from 'node:assert/strict';
import {translateUnderstandingLabel} from '../src/core/understanding-ui.js';
test('Understanding translates visible Human Model labels and guidance accurately',()=>{
 const pairs=[
  ['HUMAN MODEL FACT CANDIDATES','INFORMAÇÕES A CONFIRMAR'],
  ['Repeated observations never become stable facts without you','Nenhuma observação passa a ser considerada permanente sem a tua confirmação'],
  ['No stable-fact candidate has enough confirmed evidence yet.','Ainda não há observações suficientes para propor informações permanentes.'],
  ['Repeated confirmed observations may propose a stable fact. Only the person may promote it, and promotion remains non-influential in Phase 4.','Observações repetidas podem sugerir informação a confirmar. Só tu podes aceitá-la; isso não altera automaticamente as sugestões.'],
  ['ACCOUNTABLE LEARNING','APRENDIZAGEM TRANSPARENTE'],
  ['This is misleading','Isto é enganador'],
  ['CURRENT UNDERSTANDING','O QUE ESTOU A APRENDER'],
  ['No confirmed facts yet.','Ainda não há informações confirmadas.']
 ];
 for(const [en,pt] of pairs)assert.equal(translateUnderstandingLabel(en,'pt'),pt);
 assert.equal(translateUnderstandingLabel('2 observations','pt'),'2 observações');
 assert.equal(translateUnderstandingLabel('4 patterns','pt'),'4 padrões');
 assert.equal(translateUnderstandingLabel('3 hypotheses','pt'),'3 hipóteses');
 assert.equal(translateUnderstandingLabel('2 open questions','pt'),'2 questões em aberto');
 assert.equal(translateUnderstandingLabel('user note: X','pt'),'user note: X');
});
test('English mode also localizes original Portuguese-only introductory copy',()=>{
 assert.equal(translateUnderstandingLabel('Conhecer-te leva tempo.','en'),'Getting to know you takes time.');
 assert.equal(translateUnderstandingLabel('Rever aprendizagens e explicações','en'),'Review learning and explanations');
 assert.equal(translateUnderstandingLabel('Ainda não há práticas concluídas. Começa pelo teu dia; o percurso constrói-se com o que fazes e registas.','en'),'No practices completed yet. Begin with Today; your journey grows from what you do and choose to record.');
 assert.equal(translateUnderstandingLabel('Promote to stable fact','en'),'Promote to stable fact');
});
