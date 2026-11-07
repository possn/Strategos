import test from 'node:test';
import assert from 'node:assert/strict';
import { HEALTHSPAN_DOMAINS, HEALTHSPAN_BOUNDARIES } from '../src/data/healthspan.js';
import { renderHealthspanFoundation } from '../src/components/healthspan.js';

test('each health domain has a unique id and a primary institutional source',()=>{
  assert.equal(new Set(HEALTHSPAN_DOMAINS.map(d=>d.id)).size,6);
  for(const domain of HEALTHSPAN_DOMAINS){
    const source=new URL(domain.source);
    assert.equal(source.protocol,'https:');
    assert.match(source.hostname,/(^|\.)(who\.int|nih\.gov)$/);
    assert.ok(domain.practice && domain.evidence);
  }
});
test('education remains collapsed; pillar navigation adds no data input or automatic decision',()=>{
  const html=renderHealthspanFoundation();
  assert.match(html,/^<details /);
  assert.doesNotMatch(html,/<details[^>]*\bopen\b/);
  assert.doesNotMatch(html,/<(input|script)\b/);
  assert.equal((html.match(/class="healthspan-pillar"/g)||[]).length,3);
  assert.match(html,/data-action="open-mindfulness"/);
  assert.match(html,/data-action="checkin"/);
  assert.match(html,/data-guide-section="philosophy"/);
  assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,6);
  for(const boundary of HEALTHSPAN_BOUNDARIES) assert.ok(html.includes(boundary));
});

import { CODEX } from '../src/data/codex.js';
import { practiceFoundation } from '../src/data/healthspan.js';
import { renderPracticeFoundation } from '../src/components/healthspan.js';
test('every selectable practice has a rationale without pretending to prescribe',()=>{
  for(const practice of CODEX){
    const record=practiceFoundation(practice.id);
    assert.ok(record,practice.id);
    assert.ok(record.principle && record.purpose && record.limit);
    assert.match(renderPracticeFoundation(record),/Filosofia e fundamento/);
  }
  assert.equal(practiceFoundation('unknown'),null);
  assert.equal(practiceFoundation('toString'),null);
  assert.equal(renderPracticeFoundation(null),'');
});
test('rationale escapes text and rejects unsafe source protocols',()=>{
  const record=practiceFoundation('walk');
  assert.equal(renderPracticeFoundation({...record,source:'javascript:alert(1)'}),'');
  const html=renderPracticeFoundation({...record,principle:'<img src=x onerror=alert(1)>'});
  assert.doesNotMatch(html,/<img/);
});

import {healthspanDomains,healthspanBoundaries} from '../src/data/healthspan-en.js';
test('English health education retains source identity and every clinical boundary',()=>{
 assert.deepEqual(healthspanDomains('en').map(d=>[d.id,d.source]),HEALTHSPAN_DOMAINS.map(d=>[d.id,d.source]));
 assert.equal(healthspanBoundaries('en').length,HEALTHSPAN_BOUNDARIES.length);
 const html=renderHealthspanFoundation('en');
 assert.match(html,/lang="en"/);assert.match(html,/does not prove a longer life/);
 for(const practice of CODEX){
  const record=practiceFoundation(practice.id),rendered=renderPracticeFoundation(record,'en');
  assert.ok(rendered.includes(record.source));
  assert.doesNotMatch(rendered,/Filosofia e fundamento/);
 }
 const record=practiceFoundation('walk');
 assert.doesNotMatch(renderPracticeFoundation({...record,principle:'<img src=x>'},'en'),/<img/);
});
