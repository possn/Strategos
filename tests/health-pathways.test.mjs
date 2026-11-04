import test from 'node:test';
import assert from 'node:assert/strict';
import {CODEX,assessPracticeEligibility} from '../src/data/codex.js';
import {HEALTH_PATHWAYS,boundPlanningConfidence} from '../src/core/health-pathways.js';
import {conveneAgora} from '../src/core/agora.js';
import {buildUnderstanding} from '../src/core/understanding.js';
import {upsertDailyCheckIn,todaySignals} from '../src/core/daily-signals.js';
import {evidenceGate} from '../src/core/evidence-gate.js';
import {buildTimedPracticePlan} from '../src/core/practice-capacity.js';
import {buildPracticeContract} from '../src/core/practice-session.js';
import {buildSafetyEnvelope,safetyStartGate} from '../src/core/safety-architecture.js';
import {practiceFoundation} from '../src/data/healthspan.js';
const base={sleep:3,energy:2,time:5,challenge:'body',soreness:'none',emotionalLoad:'usual'};

test('new priorities survive persistence and authorize the ordinary evidence gate',()=>{
 for(const challenge of ['sleep','nutrition']){
  const signals={...base,challenge},records=upsertDailyCheckIn([],signals);
  assert.equal(todaySignals(records).challenge,challenge);
  assert.equal(evidenceGate({checkIns:records}).canDeliberate,true);
 }
});
test('health planning stays opt-in and retains all six independent advisor perspectives',()=>{
 for(const [challenge,pathway] of Object.entries(HEALTH_PATHWAYS)){
  const practice=CODEX.find(item=>item.id===pathway.practiceId);
  assert.equal(assessPracticeEligibility(practice,base).status,'blocked');
  for(const time of [5,15,30,60]){
   const context={...base,challenge,time};
   const d=conveneAgora(context,buildUnderstanding(context));
   assert.equal(d.practice.id,pathway.practiceId);
   assert.equal(d.advisors.length,6);
   assert.ok(d.reasons.length>=2);
   assert.ok(d.confidence<=70);
   assert.equal(d.confidenceCalibration.confidence,d.confidence);
   assert.equal(d.delta.overall,0);
   assert.equal(practiceFoundation(d.practice.id).source,pathway.source);
   const phases=buildTimedPracticePlan(d.practice,d.duration,context);
   assert.equal(phases.reduce((sum,p)=>sum+p[1],0),d.duration*60);
   assert.ok(d.duration<=15);
   const contract=buildPracticeContract({judgement:d,context,phases});
   assert.match(contract.expectedEffect,/plan|Plan/);
   assert.ok(d.advisors.every(a=>a.evidence.find(e=>e.source===pathway.source)?.independent===false));
   assert.equal(safetyStartGate({envelope:buildSafetyEnvelope({context,decision:d})}).canStart,true);
  }
 }
});
test('subsequent calibration cannot turn planning confidence into a clinical probability',()=>{
 const planning=CODEX.find(p=>p.planningOnly);
 assert.equal(boundPlanningConfidence(88,planning),70);
 assert.equal(boundPlanningConfidence(58,planning),58);
 assert.equal(boundPlanningConfidence(88,CODEX.find(p=>p.id==='walk')),88);
});

import {applyPracticeDoseRevisionToJudgement} from '../src/core/practice-session.js';
test('learned duration changes cannot stretch a brief planning practice beyond its scope',()=>{
 const practice=CODEX.find(p=>p.id==='sleep-plan'),context={...base,time:60,challenge:'sleep'};
 const judgement={practice,duration:15,context};
 assert.throws(()=>buildTimedPracticePlan(practice,30,context));
 assert.equal(applyPracticeDoseRevisionToJudgement(judgement,{status:'accepted',practiceId:practice.id,proposedDurationMinutes:30}),judgement);
});
