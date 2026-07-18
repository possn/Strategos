let audioContext = null;
let activeUtterance = null;
let cachedVoices = [];

function context() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioContext = new AudioContext();
  }
  if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
  return audioContext;
}

export function unlockAudio() { context(); }

export function playTone(kind = 'phase', enabled = true) {
  if (!enabled) return;
  const ctx = context();
  if (!ctx) return;
  const presets = {
    begin: [[392, .00, .45], [523.25, .14, .60]],
    phase: [[440, .00, .24]],
    countdown: [[660, .00, .08]],
    finish: [[392, .00, .34], [523.25, .12, .48], [659.25, .26, .72]],
    complete: [[392, .00, .34], [523.25, .12, .48], [659.25, .26, .72]],
    pause: [[330, .00, .18]],
    resume: [[440, .00, .20]],
    reflection: [[523.25, .00, .40]]
  };
  (presets[kind] || presets.phase).forEach(([frequency, delay, duration]) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    const start = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.055, start + .025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .03);
  });
}

function loadVoices() {
  if (!('speechSynthesis' in window)) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
  return cachedVoices;
}

function scoreVoice(voice, preferredName = 'auto') {
  const name = `${voice.name || ''} ${voice.voiceURI || ''}`.toLowerCase();
  const lang = (voice.lang || '').toLowerCase();
  let score = 0;
  if (preferredName !== 'auto' && voice.name === preferredName) score += 1000;
  if (lang === 'en-gb') score += 160;
  else if (lang.startsWith('en-gb')) score += 150;
  else if (lang === 'en-us') score += 120;
  else if (lang.startsWith('en')) score += 80;
  if (/premium|enhanced|natural|neural/.test(name)) score += 80;
  if (/daniel|serena|arthur|martha|oliver|samantha|ava|allison|susan|tom/.test(name)) score += 40;
  if (/compact|novelty|whisper|zarvox|cellos|bells/.test(name)) score -= 200;
  if (voice.localService) score += 10;
  if (voice.default) score += 5;
  return score;
}

export function getEnglishVoices() {
  return loadVoices()
    .filter(v => /^en[-_]/i.test(v.lang || ''))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));
}

export function bestVoice(preferredName = 'auto') {
  const voices = loadVoices();
  if (!voices.length) return null;
  return [...voices].sort((a, b) => scoreVoice(b, preferredName) - scoreVoice(a, preferredName))[0] || null;
}

export function prepareSpokenText(text = '') {
  return String(text)
    .replace(/\bAgora\b/g, 'council')
    .replace(/\bHR\b/g, 'human return')
    .replace(/\+/g, ' plus ')
    .replace(/%/g, ' percent')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim();
}

export function speak(text, mode = 'minimal', enabled = true, options = {}) {
  if (!enabled || mode === 'off' || !('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(prepareSpokenText(options.spokenText || text));
  const pace = options.pace || 'calm';
  utterance.rate = pace === 'energetic' ? .98 : pace === 'balanced' ? .92 : .86;
  if (mode === 'minimal') utterance.rate += .03;
  utterance.pitch = 1.0;
  utterance.volume = .86;
  utterance.lang = 'en-GB';
  utterance.voice = bestVoice(options.voiceName || 'auto');
  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function previewVoice(settings = {}) {
  speak('I will listen first, explain my judgement, and leave the choice with you.', 'guided', true, {
    pace: settings.voicePace || 'calm',
    voiceName: settings.voiceName || 'auto'
  });
}

export function stopVoice() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  activeUtterance = null;
}

if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}
