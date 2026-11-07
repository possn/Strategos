import test from 'node:test';
import assert from 'node:assert/strict';
import {renderPhilosophyPractice,philosophyPracticeForDay,philosophyPracticeCopy} from '../src/components/philosophy-practice.js';
import {renderMindfulness,mindfulCopy,mindfulPrompt} from '../src/components/mindfulness.js';

test('philosophy offers three distinct practical traditions without scores or persistence',()=>{
 for(const language of ['pt','en']){
  for(const tradition of ['stoic','tao','spartan']){
   const ready=renderPhilosophyPractice({language,tradition});
   assert.equal((ready.match(/data-philosophy-choice=/g)||[]).length,3);
   assert.match(ready,/data-philosophy-action="start"/);
   assert.doesNotMatch(ready,/data-philosophy-action="finish"/);
   const started=renderPhilosophyPractice({language,tradition,stage:'started'});
   assert.match(started,/data-philosophy-action="finish"/);
   assert.match(started,/class="philosophy-action-step"/);
   const finished=renderPhilosophyPractice({language,tradition,stage:'finished'});
   assert.match(finished,/data-philosophy-action="again"/);
   assert.doesNotMatch(finished,/data-philosophy-action="finish"/);
   assert.match(ready,/data-action="today"/);
   assert.doesNotMatch(ready,/localStorage|fetch\(|health-score|streak/);
  }
 }
 assert.match(philosophyPracticeCopy('pt').spartan.reflection,/sustentável/);
 assert.match(philosophyPracticeCopy('en').spartan.reflection,/sustainable/);
 assert.equal(philosophyPracticeForDay(new Date(2026,10,7)),philosophyPracticeForDay(new Date(2026,10,7)));
 assert.ok(['stoic','tao','spartan'].includes(philosophyPracticeForDay(new Date(2026,10,8))));
});
test('guided mindfulness visibly defaults to speech, can mute and replay, and remains bilingual',()=>{
 for(const language of ['pt','en']){
  const ready=renderMindfulness({language});
  const running=renderMindfulness({language,started:true,secondsLeft:58});
  const muted=renderMindfulness({language,started:true,secondsLeft:58,voiceEnabled:false});
  const paused=renderMindfulness({language,started:true,secondsLeft:58,paused:true});
  const done=renderMindfulness({language,started:true,secondsLeft:0});
  assert.match(ready,/data-mindful-voice="toggle" aria-pressed="true"/);
  assert.match(ready,/data-mindful-voice="test"/);
  assert.match(renderMindfulness({language,voiceStatus:'preparing'}),/mindfulness-voice-status/);
  assert.match(renderMindfulness({language,voiceStatus:'error'}),/mindfulness-voice-status/);
  assert.match(renderMindfulness({language,speechSupported:false}),/mindfulness-voice-status/);
  assert.doesNotMatch(renderMindfulness({language,speechSupported:false}),/data-mindful-voice="test"/);
  assert.doesNotMatch(ready,/data-mindful-voice="replay"/);
  assert.match(running,/data-mindful-voice="replay"/);
  assert.match(muted,/data-mindful-voice="toggle" aria-pressed="false"/);
  assert.doesNotMatch(muted,/data-mindful-voice="replay"/);
  assert.doesNotMatch(paused,/data-mindful-voice="replay"/);
  assert.doesNotMatch(done,/data-mindful-voice="replay"/);
  assert.notEqual(mindfulPrompt(60,language),mindfulPrompt(30,language));
  assert.ok(mindfulCopy(language).complete.length>20);
 }
});
