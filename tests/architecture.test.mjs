import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {evidenceGate} from '../src/core/evidence-gate.js';
import {upsertDailyCheckIn} from '../src/core/daily-signals.js';
import {conveneAgora} from '../src/core/agora.js';
import {buildUnderstanding} from '../src/core/understanding.js';
const signals={sleep:3,energy:2,time:15,challenge:'body',soreness:'none',emotionalLoad:'usual'};
test('all static module imports resolve to repository files',()=>{
  function visit(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){
    const file=resolve(dir,entry.name);if(entry.isDirectory()){visit(file);continue;}
    if(!file.endsWith('.js'))continue;
    const text=readFileSync(file,'utf8');
    for(const match of text.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){
      assert.ok(existsSync(resolve(dirname(file),match[1].split('?')[0])),`${file}: ${match[1]}`);
    }
  }}visit('src');
});
test('past or incomplete context never authorizes a daily judgement',()=>{
  assert.equal(evidenceGate().canDeliberate,false);
  const now=new Date(2026,10,4,12);
  const old=upsertDailyCheckIn([],signals,{now:new Date(2026,10,3,12)});
  assert.equal(evidenceGate({checkIns:old,now}).canDeliberate,false);
  const partial=upsertDailyCheckIn([],{sleep:3},{now});
  assert.equal(evidenceGate({checkIns:partial,now}).canDeliberate,false);
  const complete=upsertDailyCheckIn([],signals,{now});
  assert.equal(evidenceGate({checkIns:complete,now}).canDeliberate,true);
});
test('existing deliberation retains explanation and human choice boundaries',()=>{
  const judgement=conveneAgora(signals,buildUnderstanding(signals,[]));
  assert.ok(judgement.practice.id);
  assert.ok(judgement.advisors.length);
  assert.ok(judgement.reasons.length);
  assert.ok(judgement.deliberationTrace);
  assert.equal(judgement.status,'current');
});

import {todaySignals,declaredDailySignals,dailyCheckInSummary} from '../src/core/daily-signals.js';
test('saving and reloading a partial check-in preserves unanswered questions',()=>{
  const now=new Date(2026,10,4,12);
  const records=upsertDailyCheckIn([],{sleep:2},{now});
  assert.deepEqual(todaySignals(JSON.parse(JSON.stringify(records)),now),{sleep:2});
  assert.match(dailyCheckInSummary(records[0]),/1\/6/);
  assert.deepEqual(declaredDailySignals({sleep:true,energy:999,time:'',challenge:'invalid'}),{});
  const gate=evidenceGate({checkIns:[{day:'2026-11-04',signals:{...signals,energy:999}}],now});
  assert.equal(gate.canDeliberate,false);
  assert.deepEqual(gate.context.missing,['energy']);
});
