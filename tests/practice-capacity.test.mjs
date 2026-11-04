import test from 'node:test';
import assert from 'node:assert/strict';
import {CODEX,assessPracticeEligibility} from '../src/data/codex.js';
import {supportedPracticeDuration,buildTimedPracticePlan} from '../src/core/practice-capacity.js';
import {conveneAgora} from '../src/core/agora.js';
import {buildUnderstanding} from '../src/core/understanding.js';
import {buildSafetyEnvelope,createSafetyAcknowledgement,safetyStartGate} from '../src/core/safety-architecture.js';
import {applyPracticeDoseRevisionToJudgement} from '../src/core/practice-session.js';
const base={sleep:3,energy:2,time:15,challenge:'body',soreness:'none',emotionalLoad:'usual'};

test('five minutes excludes sessions whose supported minimum is fifteen',()=>{
 for(const id of ['strength','focus']){
  const p=CODEX.find(item=>item.id===id);
  assert.equal(supportedPracticeDuration(p,5),null);
  assert.equal(assessPracticeEligibility(p,{...base,time:5}).status,'blocked');
 }
});
test('all declared check-in combinations produce a fitting, eligible plan',()=>{
 for(const sleep of [1,2,3,4])for(const energy of [1,2,3])for(const time of [5,15,30,60])for(const challenge of ['body','mind','focus','recovery','family','work','sleep','nutrition'])for(const soreness of ['none','mild','significant'])for(const emotionalLoad of ['light','usual','heavy']){
  const context={sleep,energy,time,challenge,soreness,emotionalLoad};
  const d=conveneAgora(context,buildUnderstanding(context));
  assert.ok(d.duration<=time);
  assert.equal(assessPracticeEligibility(d.practice,context).status,'eligible');
  const phases=buildTimedPracticePlan(d.practice,d.duration,context);
  assert.equal(phases.reduce((sum,p)=>sum+p[1],0),d.duration*60);
  assert.ok(phases.every(p=>p[1]>=20&&Number.isInteger(p[1])));
  if(soreness==='significant')assert.notEqual(d.practice.id,'strength');
 }
});
test('phase allocation preserves the exact requested time without mutating content',()=>{
 const p=CODEX.find(item=>item.id==='walk'),before=JSON.stringify(p);
 for(const duration of [5,7,15,23,30,60])assert.equal(buildTimedPracticePlan(p,duration,{...base,time:60}).reduce((sum,x)=>sum+x[1],0),duration*60);
 assert.equal(JSON.stringify(p),before);
 assert.throws(()=>buildTimedPracticePlan(p,30,{...base,time:5}));
});
test('acknowledging a warning cannot authorize an excluded practice',()=>{
 const practice=CODEX.find(p=>p.id==='strength');
 const envelope=buildSafetyEnvelope({context:{...base,soreness:'significant'},decision:{practice}});
 const acknowledgement=createSafetyAcknowledgement({envelope,judgementId:'test'});
 assert.equal(safetyStartGate({envelope,acknowledgement,judgementId:'test'}).canStart,false);
 assert.equal(safetyStartGate({}).canStart,false);
});
test('learned duration changes cannot exceed today’s budget or unsupported minimum',()=>{
 const practice=CODEX.find(p=>p.id==='strength');
 const judgement={practice,duration:15,context:base};
 for(const proposedDurationMinutes of [5,30,NaN])assert.equal(applyPracticeDoseRevisionToJudgement(judgement,{status:'accepted',practiceId:'strength',proposedDurationMinutes}),judgement);
 assert.equal(applyPracticeDoseRevisionToJudgement(judgement,{status:'accepted',practiceId:'strength',proposedDurationMinutes:20},{...base,time:30}).duration,20);
});
test('excluding longer sessions does not require acknowledgement for a fitting walk',()=>{
 const practice=CODEX.find(p=>p.id==='walk');
 const envelope=buildSafetyEnvelope({context:{...base,time:5},decision:{practice,agora:{blockedPractices:[{practiceId:'strength',matchedContraindications:['insufficient-time']}]}}});
 assert.equal(envelope.status,'clear');
 assert.equal(safetyStartGate({envelope}).canStart,true);
});
