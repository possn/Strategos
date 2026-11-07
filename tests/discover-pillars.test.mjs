import test from 'node:test';
import assert from 'node:assert/strict';
import {renderHealthspanFoundation} from '../src/components/healthspan.js';
import {renderTodayPaths} from '../src/components/today-paths.js';

test('existing collapsible healthspan area reveals actionable three-pillar routes in both languages',()=>{
 for(const language of ['pt','en']){
  const html=renderHealthspanFoundation(language);
  assert.match(html,/<details class="healthspan-foundation"/);
  assert.match(html,/class="healthspan-pillars"/);
  assert.equal((html.match(/class="healthspan-pillar"/g)||[]).length,3);
  assert.equal((html.match(/data-action="open-mindfulness"/g)||[]).length,1);
  assert.equal((html.match(/data-action="checkin"/g)||[]).length,1);
  assert.equal((html.match(/data-action="open-philosophy-practice"/g)||[]).length,1);
  assert.equal((html.match(/class="healthspan-domain"/g)||[]).length,7); // 6 evidence domains + limits
  const today=renderTodayPaths({language,busy:false});
  assert.equal((today.match(/class="today-path"/g)||[]).length,3);
  assert.doesNotMatch(today,/healthspan-pillars/);
 }
});
test('mind-body-philosophy language content does not cross locale boundaries',()=>{
 const pt=renderHealthspanFoundation('pt');
 const en=renderHealthspanFoundation('en');
 assert.match(pt,/Mente sã em corpo são/);
 assert.match(pt,/Disciplina espartana/);
 assert.match(pt,/clareza estoica/);
 assert.match(pt,/equilíbrio taoista/);
 assert.match(pt,/Força, movimento e recuperação/);
 assert.doesNotMatch(pt,/Spartan discipline|A sound mind|Capable body/);
 assert.match(en,/A sound mind in a sound body/);
 assert.match(en,/Spartan discipline/);
 assert.match(en,/Stoic clarity/);
 assert.match(en,/Taoist balance/);
 assert.doesNotMatch(en,/Disciplina espartana|Mente sã em corpo são|Filosofia prática/);
});
