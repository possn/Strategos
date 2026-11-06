import test from 'node:test';
import assert from 'node:assert/strict';
import {performanceCopy,performanceGuidance,renderPerformanceCheck} from '../src/components/performance-check.js';
test('five progressive bilingual questions and a single next step',()=>{
 for(const lang of ['pt','en']){
  assert.equal(performanceCopy(lang).questions.length,5);
  for(let step=0;step<5;step++){
   const html=renderPerformanceCheck({language:lang,step,answers:[]});
   assert.match(html,new RegExp('data-performance-choice'));
   assert.doesNotMatch(html,/data-performance-choice="3"/);
  }
  assert.ok(performanceGuidance([0,1,0,0,0],lang).message.length>30);
  assert.equal(performanceGuidance([0,0,0,0,1],lang).safety,true);
  assert.equal(performanceGuidance([0,0,0,0,2],lang).safety,true);
  assert.equal(performanceGuidance([0,0,0,0,0],lang).safety,false);
  assert.equal(performanceGuidance([0,0,0],lang),null);
  assert.match(renderPerformanceCheck({language:lang,step:5,answers:[0,0,0,0,0]}),/data-performance-action="restart"/);
 }
});
test('health self-check does not write or ask for identifiable details',()=>{
 const html=renderPerformanceCheck({language:'pt',step:0,answers:[]});
 assert.doesNotMatch(html,/localStorage|name="|fetch\(/);
 assert.match(html,/não são guardadas/);
});
