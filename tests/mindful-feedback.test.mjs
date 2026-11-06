import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseMindfulFeedback,recordMindfulFeedback,mindfulFeedbackPreference,MINDFUL_FEEDBACK_LIMIT} from '../src/core/mindful-feedback.js';
import {contextualNextStep} from '../src/core/contextual-next-step.js';
import {renderMindfulness} from '../src/components/mindfulness.js';
import {migrateState} from '../src/core/state-schema.js';
import {serializeStateExport,validateStateImport} from '../src/core/state-transfer.js';
const date=new Date(2026,10,6,12);
const at=n=>new Date(Date.UTC(2026,10,6,11,0,n)).toISOString();
const feedback=(outcome,atTime)=>({practice:'mindfulness-90',outcome,at:atTime});
test('feedback is opt-in, bounded, explicit and non-diagnostic',()=>{
 assert.deepEqual(normaliseMindfulFeedback(null),[]);
 assert.deepEqual(normaliseMindfulFeedback([feedback('wrong',at(1)),feedback('helpful','bad'),feedback('helpful',at(2))]),[feedback('helpful',at(2))]);
 assert.deepEqual(recordMindfulFeedback([],'skip'),[]);
 const records=Array.from({length:25},(_,i)=>feedback('helpful',new Date(Date.UTC(2026,10,6,11,i)).toISOString()));
 assert.equal(normaliseMindfulFeedback(records).length,MINDFUL_FEEDBACK_LIMIT);
 assert.equal(recordMindfulFeedback([], 'helpful',{now:new Date(at(0))}).length,1);
 assert.equal(recordMindfulFeedback([], 'not-helpful',{now:new Date(at(0))})[0].outcome,'not-helpful');
 assert.equal(mindfulFeedbackPreference([]).offerAlternative,false);
 assert.equal(mindfulFeedbackPreference([feedback('not-helpful',at(2)),feedback('not-helpful',at(1))]).offerAlternative,true);
 assert.equal(mindfulFeedbackPreference([feedback('helpful',at(3)),feedback('not-helpful',at(2)),feedback('not-helpful',at(1))]).offerAlternative,true);
 assert.equal(mindfulFeedbackPreference([feedback('helpful',at(4)),feedback('helpful',at(3)),feedback('not-helpful',at(2))]).offerAlternative,false);
});
test('feedback changes only the optional suggested action and never overrides explicit reflection',()=>{
 const negative=[feedback('not-helpful',at(2)),feedback('not-helpful',at(1))];
 for(const language of ['pt','en']){
   assert.equal(contextualNextStep({mindfulFeedback:negative},language,date).kind,'alternative');
   assert.equal(contextualNextStep({mindfulFeedback:negative,dailyCheckIns:[{day:'2026-11-06',signals:{emotionalLoad:'heavy'}}]},language,date).action,'journey');
   assert.equal(contextualNextStep({mindfulFeedback:negative,dailyCheckIns:[{day:'2026-11-06',signals:{challenge:'work'}}]},language,date).kind,'reflection');
   assert.equal(contextualNextStep({mindfulFeedback:[feedback('helpful',at(2))]},language,date).kind,'mindful');
   const running=renderMindfulness({language,started:true,secondsLeft:23});
   assert.doesNotMatch(running,/data-mindful-feedback=/);
   const finished=renderMindfulness({language,started:true,secondsLeft:0});
   assert.match(finished,/data-mindful-feedback="helpful"/);
   assert.match(finished,/data-mindful-feedback="not-helpful"/);
   assert.match(finished,/data-mindful-feedback="skip"/);
   assert.doesNotMatch(renderMindfulness({language,started:true,secondsLeft:0,feedback:'helpful'}),/data-mindful-feedback=/);
 }
});
test('existing histories and exported backup survive feedback changes and clearing',()=>{
 const initial=migrateState({schemaVersion:49,history:[{id:'practice'}]});
 assert.deepEqual(initial.mindfulFeedback,[]);
 const withFeedback=migrateState({...initial,mindfulFeedback:[feedback('helpful',at(0))]});
 const restored=validateStateImport(serializeStateExport(withFeedback));
 assert.equal(restored.ok,true);
 assert.equal(restored.state.history[0].id,'practice');
 assert.equal(restored.state.mindfulFeedback.length,1);
 assert.equal(migrateState({...withFeedback,mindfulFeedback:[]}).history[0].id,'practice');
});

test('skipping is explicitly acknowledged without implying persistence',()=>{
 const pt=renderMindfulness({language:'pt',started:true,secondsLeft:0,feedback:'skipped'});
 const en=renderMindfulness({language:'en',started:true,secondsLeft:0,feedback:'skipped'});
 assert.match(pt,/Sem registo/);
 assert.match(en,/Nothing saved/);
 assert.doesNotMatch(pt,/data-mindful-feedback=/);
 assert.doesNotMatch(en,/data-mindful-feedback=/);
});
