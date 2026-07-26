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

export function playTone(kind = 'phase', enabled = true, options = {}) {
  if (!enabled) return;
  const ctx = context();
  if (!ctx) return;
  const presets = {
    begin: [[392, .00, .45], [523.25, .14, .60]],
    phase: [[440, .00, .24]],
    countdown: [[560 + (5-Math.max(1,Math.min(5,Number(options.remaining)||5)))*70, .00, .13]],
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
    gain.gain.exponentialRampToValueAtTime(kind==='countdown'?0.085:0.055, start + .025);
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

function preferredVoice() {
  const voices = loadVoices();
  if (!voices.length) return null;

  // Restores the voice-selection behaviour that sounded natural in v0.5.
  // Prefer familiar high-quality English system voices without forcing a locale.
  return voices.find(v => /Daniel|Samantha/i.test(v.name || ''))
    || voices.find(v => /en-GB|en_US/i.test(`${v.lang || ''} ${v.name || ''}`))
    || voices.find(v => /^en[-_]/i.test(v.lang || ''))
    || voices[0]
    || null;
}

export function getEnglishVoices() {
  return loadVoices().filter(v => /^en[-_]/i.test(v.lang || ''));
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

  // Exact vocal calibration restored from the well-received v0.5 release.
  utterance.rate = mode === 'guided' ? .88 : .94;
  utterance.pitch = .88;
  utterance.volume = .72;
  utterance.voice = preferredVoice();
  if (utterance.voice?.lang) utterance.lang = utterance.voice.lang;

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function previewVoice() {
  speak("Good morning. I've been thinking about today. Here's what I think.", 'guided', true);
}

export function stopVoice() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  activeUtterance = null;
}

if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}
