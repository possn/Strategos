import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPLEMENT_GUIDE} from '../src/data/supplements.js';
import {renderSupplementsGuide} from '../src/components/supplements.js';
import {CODEX} from '../src/data/codex.js';
test('every supplement has outcome-specific context and a primary NIH source',()=>{
 assert.equal(new Set(SUPPLEMENT_GUIDE.map(item=>item.id)).size,5);
 for(const item of SUPPLEMENT_GUIDE){
  for(const field of ['question','population','finding','uncertainty','risks','discuss','reviewedAt'])assert.ok(item[field],`${item.id}: ${field}`);
  const source=new URL(item.source);
  assert.equal(source.hostname,'ods.od.nih.gov');
  assert.equal(source.protocol,'https:');
 }
});
test('the catalogue is educational and cannot become a selected practice',()=>{
 const html=renderSupplementsGuide();
 assert.doesNotMatch(html,/<(input|form|script)\b|data-choice|data-action|data-daily-priority/);
 for(const item of SUPPLEMENT_GUIDE)assert.equal(CODEX.some(practice=>practice.id===item.id),false);
 assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,5);
});
