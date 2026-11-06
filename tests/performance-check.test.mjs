import test from 'node:test';
import assert from 'node:assert/strict';
import {performanceCopy,performanceGuidance,renderPerformanceCheck} from '../src/components/performance-check.js';
test('five progressive bilingual questions and a single next step',()=>{
 for(const lang of ['pt','en']){
  assert.equal(performanceCopy(lang).questions.length,5);
  for(let step=0;step<5;step++){
   const html=renderPerformanceCheck({language:lang,step,answers:[]});
   assert.match(html,new RegExp('data-performance-choice'));
   assert.equal((html.match(/data-performance-choice=/g)||[]).length,performanceCopy(lang).questions[step][1].length);
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
 assert.match(html,/Só ficam guardadas neste dispositivo se escolheres guardar/);
});

import {normalisePerformanceHistory,recordPerformanceCheck,performanceHistoryComparison} from '../src/core/performance-history.js';
import {migrateState} from '../src/core/state-schema.js';
test('self-report history is opt-in, bounded, same-day idempotent, and rejects symptoms',()=>{
 const d=new Date('2026-11-06T12:00:00Z'),answers=[1,1,2,1,0];
 assert.deepEqual(normalisePerformanceHistory(undefined),[]);
 assert.equal(recordPerformanceCheck([],answers,{date:d}).length,1);
 const again=recordPerformanceCheck(recordPerformanceCheck([],answers,{date:d}),answers,{date:d});
 assert.equal(again.length,1);
 assert.deepEqual(recordPerformanceCheck(again,[1,1,2,1,1],{date:d}),again);
 assert.match(performanceHistoryComparison(again,[1,0,2,1,0],'pt'),/Sono/);
 const bad=normalisePerformanceHistory([{date:'2026-11-06',answers:[1,0,2,1,1]}]);
 assert.equal(bad.length,0);
 assert.deepEqual(migrateState({schemaVersion:47}).performanceHistory,[]);
});
test('users must explicitly save and can inspect privacy language',()=>{
 for(const language of ['pt','en']){
  const html=renderPerformanceCheck({language,step:5,answers:[1,0,2,1,0],history:[],saved:false});
  assert.match(html,/data-performance-action="save"/);
  assert.doesNotMatch(renderPerformanceCheck({language,step:5,answers:[1,0,2,1,1]}),/data-performance-action="save"/);
  assert.doesNotMatch(renderPerformanceCheck({language,step:5,answers:[1,0,2,1,2]}),/data-performance-action="save"/);
  assert.doesNotMatch(renderPerformanceCheck({language,step:5,answers:[1,0,2,1,0],saved:true}),/data-performance-action="save"/);
 }
});
