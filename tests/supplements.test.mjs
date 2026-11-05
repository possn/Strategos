import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPLEMENT_GUIDE} from '../src/data/supplements.js';
import {renderSupplementsGuide} from '../src/components/supplements.js';
import {CODEX} from '../src/data/codex.js';
test('every supplement has outcome-specific context and traceable institutional or primary research sources',()=>{
 assert.equal(new Set(SUPPLEMENT_GUIDE.map(item=>item.id)).size,9);
 for(const item of SUPPLEMENT_GUIDE){
  for(const field of ['question','population','finding','uncertainty','risks','discuss','reviewedAt'])assert.ok(item[field],`${item.id}: ${field}`);
  const source=new URL(item.source);
  assert.ok(['ods.od.nih.gov','pubmed.ncbi.nlm.nih.gov','www.nature.com'].includes(source.hostname));
  assert.equal(source.protocol,'https:');
 }
});
test('the catalogue is educational and cannot become a selected practice',()=>{
 const html=renderSupplementsGuide();
 assert.doesNotMatch(html,/<(input|form|script)\b|data-choice|data-action|data-daily-priority/);
 for(const item of SUPPLEMENT_GUIDE)assert.equal(CODEX.some(practice=>practice.id===item.id),false);
 assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,12);
});

import {supplementGuide} from '../src/data/supplements-en.js';
test('both guide languages preserve source provenance and complete outcome boundaries',()=>{
 const pt=supplementGuide('pt'),en=supplementGuide('en');
 assert.deepEqual(en.map(r=>[r.id,r.source,r.reviewedAt,(r.additionalSources||[]).map(s=>s.url)]),pt.map(r=>[r.id,r.source,r.reviewedAt,(r.additionalSources||[]).map(s=>s.url)]));
 for(const record of en)for(const key of ['name','verdict','question','population','finding','uncertainty','risks','discuss'])assert.ok(record[key]);
 for(const language of ['pt','en']){
  const html=renderSupplementsGuide(language);
  assert.doesNotMatch(html,/<(input|form|script)\b|data-choice|data-action|data-daily-priority/);
  assert.equal((html.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,12);
 }
 assert.match(renderSupplementsGuide('en'),/general clinical benefit remains uncertain/);
});
