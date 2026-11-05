import test from 'node:test';
import assert from 'node:assert/strict';
import {selectVoice} from '../src/core/voice-language.js';
const voices=[{name:'Daniel',lang:'en-GB'},{name:'Joana',lang:'pt-BR'},{name:'Catarina',lang:'pt-PT'}];
test('voice choice respects the selected language and prefers European Portuguese',()=>{
 assert.equal(selectVoice(voices,'pt'),voices[2]);
 assert.equal(selectVoice(voices,'en'),voices[0]);
 assert.equal(selectVoice([voices[0]],'pt'),null);
 assert.equal(selectVoice([voices[1]],'pt'),voices[1]);
});
test('speech requests carry matching text and locale without rewriting Portuguese agora',async()=>{
 let spoken;
 globalThis.window={speechSynthesis:{getVoices:()=>voices,cancel:()=>{},speak:value=>{spoken=value},addEventListener:()=>{}}};
 globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 const {speak,prepareSpokenText,previewVoice}=await import('../src/core/audio.js');
 speak('Agora, 50% + descanso.','guided',true,{language:'pt'});
 assert.equal(spoken.lang,'pt-PT');assert.equal(spoken.voice,voices[2]);
 assert.equal(spoken.text,'Agora, 50 por cento mais descanso.');
 assert.equal(prepareSpokenText('Agora','pt'),'Agora');
 previewVoice('en');assert.equal(spoken.lang,'en-GB');assert.match(spoken.text,/Good morning/);
 previewVoice('pt');assert.match(spoken.text,/Bom dia/);
 delete globalThis.window;delete globalThis.SpeechSynthesisUtterance;
});
