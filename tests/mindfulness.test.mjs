import test from 'node:test';
import assert from 'node:assert/strict';
import {MINDFUL_SECONDS,mindfulCopy,mindfulPrompt,renderMindfulness} from '../src/components/mindfulness.js';
import {renderTodayPaths} from '../src/components/today-paths.js';
test('mindfulness is a self-paced, bilingual, non-diagnostic practice',()=>{
 assert.equal(MINDFUL_SECONDS,90);
 for(const language of ['pt','en']){
  const start=renderMindfulness({language});
  assert.match(start,/data-mindful-action="start"/);
  assert.match(start,/1:30/);
  assert.doesNotMatch(start,/data-mindful-action="pause"/);
  const running=renderMindfulness({language,secondsLeft:43,started:true,paused:false});
  assert.match(running,/data-mindful-action="pause"/);
  assert.match(running,/0:43/);
  assert.match(renderMindfulness({language,secondsLeft:43,started:true,paused:true}),/data-mindful-action="resume"/);
  const done=renderMindfulness({language,secondsLeft:0,started:true});
  assert.match(done,/data-mindful-action="again"/);
  assert.match(start,/data-action="open-performance"/);
  assert.match(start,/data-action="today"/);
  assert.match(start,/nccih.nih.gov/);
  assert.notEqual(mindfulPrompt(85,language),mindfulPrompt(45,language));
  assert.notEqual(mindfulPrompt(45,language),mindfulPrompt(15,language));
  assert.equal((renderTodayPaths({language}).match(/class="today-path"/g)||[]).length,3);
  assert.match(renderTodayPaths({language}),/data-action="open-mindfulness"/);
  assert.doesNotMatch(start,/localStorage|fetch\(|autoplay|speechSynthesis|requestAnimationFrame/);
 }
 assert.match(mindfulCopy('pt').safety,/Não prendas/);
 assert.match(mindfulCopy('en').safety,/Do not hold/);
});
