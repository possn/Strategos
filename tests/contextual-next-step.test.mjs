import test from 'node:test';
import assert from 'node:assert/strict';
import {contextualNextStep} from '../src/core/contextual-next-step.js';
import {renderTodayPaths} from '../src/components/today-paths.js';
const now=new Date(2026,10,6,12);
const check=signals=>({dailyCheckIns:[{day:'2026-11-06',signals}]});
test('single Today action responds only to explicit, same-day signals',()=>{
 for(const language of ['pt','en']){
  const defaultStep=contextualNextStep({},language,now);
  assert.equal(defaultStep.kind,'mindful');
  assert.equal(defaultStep.personalized,false);
  assert.equal(defaultStep.action,'open-mindfulness');
  assert.equal(contextualNextStep({dailyCheckIns:[{day:'2026-11-05',signals:{emotionalLoad:'heavy'}}]},language,now).kind,'mindful');
  assert.equal(contextualNextStep(check({emotionalLoad:'heavy'}),language,now).kind,'stress');
  assert.equal(contextualNextStep(check({sleep:1}),language,now).kind,'recovery');
  assert.equal(contextualNextStep(check({energy:1}),language,now).kind,'recovery');
  assert.equal(contextualNextStep(check({soreness:'significant'}),language,now).kind,'recovery');
  assert.equal(contextualNextStep(check({challenge:'family'}),language,now).kind,'reflection');
  assert.equal(contextualNextStep(check({challenge:'focus'}),language,now).kind,'reflection');
  assert.equal(contextualNextStep(check({sleep:4,energy:3,challenge:'body'}),language,now).kind,'mindful');
  assert.equal(contextualNextStep(check({sleep:4,emotionalLoad:'heavy',challenge:'work'}),language,now).kind,'stress');
  assert.equal(contextualNextStep(check({sleep:1,challenge:'work'}),language,now).kind,'recovery');
 }
});
test('premium Today hierarchy is unchanged: three paths, one contextual next action',()=>{
 for(const language of ['pt','en']){
  for(const signals of [{},{emotionalLoad:'heavy'},{sleep:1},{challenge:'mind'}]){
   const nextStep=contextualNextStep(check(signals),language,now);
   const html=renderTodayPaths({language,nextStep,busy:false});
   assert.equal((html.match(/class="today-path"/g)||[]).length,3);
   assert.match(html,new RegExp('data-action="'+nextStep.action+'"'));
   assert.match(html,/data-daily-priority="sleep"/);
   assert.match(html,/data-daily-priority="nutrition"/);
   assert.doesNotMatch(html,/<aside|class="recommendation-card"/);
  }
 }
});
test('missing or invalid signals cannot be mistaken for reported poor health',()=>{
 const empty={dailyCheckIns:[{day:'2026-11-06',signals:{sleep:null,energy:undefined,emotionalLoad:'invalid',challenge:'unknown'}}]};
 assert.equal(contextualNextStep(empty,'pt',now).personalized,false);
 assert.equal(contextualNextStep(check({sleep:3,energy:2,emotionalLoad:'usual',challenge:'sleep'}),'pt',now).kind,'mindful');
});
