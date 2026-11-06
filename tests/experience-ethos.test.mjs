import test from 'node:test';
import assert from 'node:assert/strict';
import {renderUsageGuide} from '../src/components/usage-guide.js';
import {renderTodayPaths} from '../src/components/today-paths.js';
import {renderOnboarding} from '../src/components/onboarding.js';
import {selectVoice} from '../src/core/voice-language.js';
test('guide is self-contained in the selected locale and exposes mindfulness directly',()=>{
 const pt=renderUsageGuide({language:'pt'});
 const en=renderUsageGuide({language:'en'});
 assert.match(pt,/Mente sã em corpo são/);
 assert.match(pt,/Disciplina/);
 assert.match(pt,/Estoicismo/);
 assert.match(pt,/Taoismo/);
 assert.match(pt,/espartano/);
 assert.match(pt,/Longevidade/);
 assert.match(pt,/data-action="open-mindfulness"/);
 assert.match(pt,/90 segundos/);
 assert.doesNotMatch(pt,/How Today works|Back to Settings|What is Strategos|One person|Your Journey/);
 assert.match(en,/A sound mind in a sound body/);
 assert.match(en,/Stoicism/);
 assert.match(en,/Taoism/);
 assert.match(en,/Spartan/);
 assert.match(en,/Longevity/);
 assert.doesNotMatch(en,/Voltar às Definições|Mente sã em corpo são|Como funciona/);
 assert.equal((pt.match(/class="guide-section"/g)||[]).length,7);
 assert.equal((en.match(/class="guide-section"/g)||[]).length,7);
 assert.match(renderUsageGuide({language:'pt',focus:'mindfulness'}),/data-guide-id="mindfulness" open/);
});
test('mindfulness remains visible regardless of the selected contextual practice',()=>{
 for(const language of ['pt','en']){
  for(const nextStep of [{kind:'alternative',title:'Reflection',action:'journey',description:'Think'},{kind:'recovery',title:'Recovery',action:'open-mindfulness',description:'Rest'}]){
   const html=renderTodayPaths({language,nextStep});
   assert.equal((html.match(/class="today-path"/g)||[]).length,3);
   assert.equal((html.match(/class="today-mindfulness-link"/g)||[]).length,1);
   assert.match(html,/today-mindfulness-link" data-action="open-mindfulness"/);
  }
  assert.match(renderOnboarding({language}),/espartan|Spartan/i);
 }
});
test('natural and enhanced installed voices outrank older robotic system voices for same locale',()=>{
 const voices=[{name:'Sistema',lang:'pt-PT'},{name:'Catarina Enhanced',lang:'pt-PT'},{name:'Samantha',lang:'en-US'},{name:'Daniel Premium',lang:'en-GB'}];
 assert.equal(selectVoice(voices,'pt'),voices[1]);
 assert.equal(selectVoice(voices,'en'),voices[3]);
 assert.equal(selectVoice(voices,'pt-PT'),voices[1]);
 assert.equal(selectVoice([{name:'French Premium',lang:'fr-FR'}],'pt'),null);
});
