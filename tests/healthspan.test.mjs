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
test('education remains collapsed with no additional decision action or data collection',()=>{
  const html=renderHealthspanFoundation();
  assert.match(html,/^<details /);
  assert.doesNotMatch(html,/<details[^>]*\bopen\b/);
  assert.doesNotMatch(html,/<(button|input|script)\b|data-action=/);
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
