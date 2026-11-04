import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseHealthContext,createHealthContext,withHealthContext,canEditHealthContext} from '../src/core/health-context.js';
import {createInitialState,migrateState} from '../src/core/state-schema.js';
import {serializeStateExport,validateStateImport,createImportPreview} from '../src/core/state-transfer.js';
import {CODEX,assessPracticeEligibility} from '../src/data/codex.js';
import {conveneAgora} from '../src/core/agora.js';
import {buildUnderstanding} from '../src/core/understanding.js';
import {buildTimedPracticePlan} from '../src/core/practice-capacity.js';
import {compareDecisionContexts,assessCandidateStability} from '../src/core/judgement-stability.js';
const signals={sleep:4,energy:3,time:15,challenge:'body',soreness:'none',emotionalLoad:'light'};

test('health context is optional and requires an explicit versioned person choice',()=>{
 assert.equal(createInitialState().healthContext,null);
 assert.equal(normaliseHealthContext({movementPreference:'avoid-strength'}),null);
 assert.equal(createHealthContext('toString'),null);
 const record=createHealthContext('avoid-strength');
 assert.equal(normaliseHealthContext({...record,consentVersion:true}),null);
 assert.deepEqual(normaliseHealthContext({...record,diagnosis:'discard me'}),record);
 assert.equal(normaliseHealthContext({...record,updatedAt:'invalid'}),null);
});
test('migration and export preserve valid context without inventing consent',()=>{
 const legacy=migrateState({schemaVersion:46,healthContext:{movementPreference:'avoid-strength'},history:[]});
 assert.equal(legacy.healthContext,null);
 const state={...createInitialState(),healthContext:createHealthContext('avoid-movement')};
 const imported=validateStateImport(serializeStateExport(state));
 assert.equal(imported.ok,true);
 assert.deepEqual(imported.state.healthContext,state.healthContext);
 assert.equal(createImportPreview(imported.state).hasHealthContext,true);
 assert.equal(validateStateImport(serializeStateExport({...state,healthContext:null})).state.healthContext,null);
});
test('current choice replaces a historical restriction without changing daily signals',()=>{
 const current=withHealthContext({...signals,movementPreference:'avoid-movement'},createHealthContext('avoid-strength'));
 assert.equal(current.movementPreference,'avoid-strength');
 const cleared=withHealthContext(current,null);
 assert.equal(cleared.movementPreference,'not-shared');
 for(const [key,value] of Object.entries(signals))assert.equal(cleared[key],value);
 assert.equal(compareDecisionContexts(signals,current).materialChange,true);
 assert.equal(assessCandidateStability({practice:{id:'strength'},confidence:70},{practice:{id:'focus'},confidence:70},signals,current).action,'use-candidate');
});
test('movement preferences exclude the requested practices in deliberation and execution',()=>{
 for(const preference of ['avoid-strength','avoid-movement'])for(const time of [5,15,30,60]){
  const context=withHealthContext({...signals,time},createHealthContext(preference));
  const decision=conveneAgora(context,buildUnderstanding(context));
  assert.notEqual(decision.practice.id,'strength');
  if(preference==='avoid-movement')assert.ok(['focus','connection'].includes(decision.practice.id));
  for(const practice of CODEX){
   if(practice.id==='strength'||(preference==='avoid-movement'&&['walk','recovery'].includes(practice.id))){
    assert.equal(assessPracticeEligibility(practice,context).status,'blocked');
    assert.throws(()=>buildTimedPracticePlan(practice,time,context));
   }
  }
 }
 const strength=CODEX.find(p=>p.id==='strength');
 assert.equal(assessPracticeEligibility({...strength,id:'strength-fallback',basePracticeId:'strength'},{...signals,movementPreference:'avoid-strength'}).status,'blocked');
});
test('editing is deferred until an active or interrupted practice is closed',()=>{
 for(const status of ['active','paused','interrupted'])assert.equal(canEditHealthContext({current:{execution:{status}}}),false);
 assert.equal(canEditHealthContext({current:null}),true);
 assert.equal(canEditHealthContext({current:{execution:{status:'completed'}}}),true);
});
