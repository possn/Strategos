import test from 'node:test';
import assert from 'node:assert/strict';
import {renderLivingGraph} from '../src/components/living-graph.js';
import {buildHumanGraph} from '../src/core/human-graph.js';
import {renderTodayPaths} from '../src/components/today-paths.js';
import {readFileSync} from 'node:fs';
test('ambient presence is neutral and no graph emits independent SVG animations',()=>{
 const graph=buildHumanGraph([],null);
 for(const ambient of [true,false]){
  const html=renderLivingGraph(graph,{ambient});
  assert.doesNotMatch(html,/<animate\b|<animateTransform\b/);
  if(ambient){assert.match(html,/sem pontuação de saúde/);assert.doesNotMatch(html,/Stable|Awakening|node-label/);}
 }
});
test('health paths are visible secondary routes and respect an active practice',()=>{
 const html=renderTodayPaths({busy:true});
 assert.equal((html.match(/data-daily-priority=/g)||[]).length,2);
 assert.equal((html.match(/disabled/g)||[]).length,2);
 assert.doesNotMatch(html,/moment-action/);
 assert.match(html,/open-supplements/);
});
test('the motion policy is loaded after legacy styles and explicitly supports reduced motion',()=>{
 const html=readFileSync('index.html','utf8'),css=readFileSync('experience.css','utf8');
 assert.ok(html.indexOf('experience.css')>html.indexOf('styles.css'));
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
 assert.doesNotMatch(css,/@keyframes[^}]+transform:/);
});

import {CODEX,practiceLibraryCatalog,validatePracticeLibrary} from '../src/data/codex.js';
test('the real practice catalogue renders without assuming unavailable metadata',()=>{
 const catalogue=practiceLibraryCatalog(CODEX);
 assert.equal(validatePracticeLibrary(CODEX).valid,CODEX.length);
 for(const item of catalogue){
  for(const field of ['goals','levels','equipment','durationOptions'])assert.equal(typeof item[field].join(' '),'string');
  assert.equal(item.phaseCount,CODEX.find(p=>p.id===item.id).phases.length);
 }
 assert.equal(practiceLibraryCatalog([{id:'new',name:'Unknown practice'}])[0].evidenceStatus,'not-classified');
});

import {practiceText} from '../src/core/practice-language.js';
test('canonical practice instructions can be displayed in both languages without changing phases',()=>{
 const original=JSON.stringify(CODEX);
 for(const record of CODEX){
  const language=record.planningOnly?'en':'pt';
  assert.ok(practiceText(record.name,language));
  for(const phase of record.phases){
   for(const text of [phase[0],phase[2],...phase[3]]){
    const translated=practiceText(text,language);
    assert.equal(typeof translated,'string');assert.ok(translated.length>0);
   }
  }
 }
 assert.equal(JSON.stringify(CODEX),original);
 assert.match(practiceText('A 15-minute strength practice offers the best current balance of adaptation and continuity.','pt'),/15 minutos/);
 assert.match(practiceText('Reserva 5 minutos para planear uma refeição viável.','en'),/5 minutes/);
});
