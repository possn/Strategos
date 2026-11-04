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
