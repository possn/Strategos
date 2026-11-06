import test from 'node:test';
import assert from 'node:assert/strict';
import {createQuantifiedContext,normaliseQuantifiedContext,quantifiedContextCaution,quantifiedContextLines} from '../src/core/quantified-context.js';
import {renderQuantifiedContext} from '../src/components/quantified-context.js';
import {renderPerformanceCheck} from '../src/components/performance-check.js';
import {migrateState} from '../src/core/state-schema.js';
import {serializeStateExport,validateStateImport} from '../src/core/state-transfer.js';

test('quantified data are explicit, numeric, bounded and never inferred',()=>{
 const now=new Date('2026-11-06T16:00:00Z');
 const metrics=createQuantifiedContext({sleepHours:7.5,aerobicMinutes:150,strengthDays:2},{now});
 assert.equal(metrics.source,'self-report');
 assert.equal(metrics.consentVersion,1);
 assert.equal(metrics.recordedAt,now.toISOString());
 assert.equal(createQuantifiedContext({sleepHours:14,aerobicMinutes:150,strengthDays:2}),null);
 assert.equal(createQuantifiedContext({sleepHours:7,aerobicMinutes:-5,strengthDays:2}),null);
 assert.equal(createQuantifiedContext({sleepHours:7,aerobicMinutes:150,strengthDays:2.5}),null);
 assert.equal(createQuantifiedContext({sleepHours:7,aerobicMinutes:150}),null);
 assert.equal(normaliseQuantifiedContext({...metrics,source:'device'}),null);
 assert.equal(normaliseQuantifiedContext({...metrics,consentVersion:0}),null);
 assert.equal(normaliseQuantifiedContext({...metrics,recordedAt:'invalid'}),null);
 assert.deepEqual(normaliseQuantifiedContext({...metrics,extra:'not persisted'}),metrics);
});
test('quantified metrics are educational self-reports, not clinical findings',()=>{
 const metrics=createQuantifiedContext({sleepHours:6,aerobicMinutes:100,strengthDays:1});
 for(const language of ['pt','en']){
   assert.equal(quantifiedContextLines(metrics,language).length,3);
   assert.ok(quantifiedContextCaution(metrics,language).length>30);
   for(let step=0;step<3;step++){
     const html=renderQuantifiedContext({language,step});
     assert.match(html,/id="quantified-metric"/);
     assert.match(html,/data-metric-action="next"/);
     assert.equal((html.match(/id="quantified-metric"/g)||[]).length,1);
   }
   const completed=renderQuantifiedContext({language,step:3,saved:metrics});
   assert.match(completed,/data-metric-action="delete"/);
   assert.doesNotMatch(completed,/id="quantified-metric"/);
   assert.match(renderPerformanceCheck({language,step:5,answers:[0,0,1,0,0],metrics}),/data-action="open-metrics"/);
 }
});
test('quantified metrics survive state migration and export, never alter existing history',()=>{
 const metrics=createQuantifiedContext({sleepHours:7,aerobicMinutes:200,strengthDays:3});
 const old={schemaVersion:48,history:[{id:'existing-session'}],performanceHistory:[],profile:{name:'Test'}};
 const initial=migrateState(old);
 assert.equal(initial.quantifiedContext,null);
 const next=migrateState({...old,quantifiedContext:metrics});
 assert.deepEqual(next.quantifiedContext,metrics);
 assert.equal(next.history[0].id,'existing-session');
 const result=validateStateImport(serializeStateExport(next));
 assert.equal(result.ok,true);
 assert.deepEqual(result.state.quantifiedContext,metrics);
 assert.equal(result.state.history[0].id,'existing-session');
 assert.equal(migrateState({...next,quantifiedContext:null}).quantifiedContext,null);
});
