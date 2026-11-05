import test from 'node:test';
import assert from 'node:assert/strict';
import {renderOnboarding} from '../src/components/onboarding.js';
test('the introduction states purpose and explains the daily cycle in both languages',()=>{
 assert.match(renderOnboarding({language:'pt'}),/Estoicismo e taoísmo/);
 assert.match(renderOnboarding({language:'en'}),/healthy|age/);
 for(const language of ['pt','en']){
  const cycle=renderOnboarding({step:1,language});
  assert.equal((cycle.match(/<li>/g)||[]).length,3);
  assert.match(cycle,/onboarding-back/);
  const final=renderOnboarding({step:2,name:'<script>x</script>',language});
  assert.doesNotMatch(final,/<script>/);
  assert.match(final,/onboarding-complete/);
  assert.doesNotMatch(renderOnboarding({step:2,replay:true,language}),/<input/);
 }
});
