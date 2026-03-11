/**
 * Procedural audio system using Web Audio API.
 * Generates BGM and sound effects without external files.
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let bgmPlaying = false;
let bgmNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let bgmInterval: ReturnType<typeof setTimeout> | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);

    bgmGain = ctx.createGain();
    bgmGain.gain.value = 0.25;
    bgmGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.6;
    sfxGain.connect(masterGain);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* ---- BGM ---- */

const MELODY_NOTES = [
  // cheerful kids melody (C major pentatonic)
  523, 587, 659, 784, 880, 784, 659, 587,
  523, 659, 784, 880, 1047, 880, 784, 659,
  523, 587, 659, 784, 659, 587, 523, 440,
  523, 659, 523, 587, 523, 440, 392, 440,
];

const BASS_NOTES = [
  262, 262, 330, 330, 349, 349, 392, 392,
  262, 262, 330, 330, 349, 349, 392, 392,
  262, 262, 330, 330, 349, 349, 262, 262,
  262, 262, 330, 330, 349, 349, 262, 262,
];

let melodyIdx = 0;
let bgmSpeed = 200; // ms per note

export function startBGM() {
  const c = getCtx();
  if (bgmPlaying) return;
  bgmPlaying = true;
  melodyIdx = 0;

  function playNext() {
    if (!bgmPlaying || !bgmGain) return;
    const note = MELODY_NOTES[melodyIdx % MELODY_NOTES.length];
    const bass = BASS_NOTES[melodyIdx % BASS_NOTES.length];

    // melody voice
    playTone(c, bgmGain, note, bgmSpeed / 1000 * 0.8, 'triangle', 0.3);
    // bass voice
    playTone(c, bgmGain, bass, bgmSpeed / 1000 * 0.9, 'sine', 0.15);

    melodyIdx++;
    bgmInterval = setTimeout(playNext, bgmSpeed);
  }

  playNext();
}

export function stopBGM() {
  bgmPlaying = false;
  if (bgmInterval) {
    clearTimeout(bgmInterval);
    bgmInterval = null;
  }
}

export function setBGMSpeed(speed: number) {
  bgmSpeed = Math.max(100, Math.min(350, speed));
}

/* ---- SFX ---- */

export function sfxCoin() {
  const c = getCtx();
  if (!sfxGain) return;
  playTone(c, sfxGain, 1200, 0.08, 'sine', 0.4);
  setTimeout(() => playTone(c, sfxGain!, 1600, 0.1, 'sine', 0.3), 60);
}

export function sfxBoost() {
  const c = getCtx();
  if (!sfxGain) return;
  // rising sweep
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(200, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.3);
  gain.gain.setValueAtTime(0.3, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.4);
  osc.connect(gain).connect(sfxGain);
  osc.start();
  osc.stop(c.currentTime + 0.4);
}

export function sfxBarrelRoll() {
  const c = getCtx();
  if (!sfxGain) return;
  // whoosh
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.15);
  osc.frequency.exponentialRampToValueAtTime(300, c.currentTime + 0.35);
  gain.gain.setValueAtTime(0.25, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.35);
  osc.connect(gain).connect(sfxGain);
  osc.start();
  osc.stop(c.currentTime + 0.4);
}

export function sfxCountdown(isGo = false) {
  const c = getCtx();
  if (!sfxGain) return;
  const freq = isGo ? 880 : 523;
  const dur = isGo ? 0.3 : 0.15;
  playTone(c, sfxGain, freq, dur, 'square', 0.2);
  if (isGo) {
    setTimeout(() => playTone(c, sfxGain!, 1047, 0.2, 'square', 0.15), 150);
  }
}

export function sfxGoal() {
  const c = getCtx();
  if (!sfxGain) return;
  // fanfare: 3 ascending notes
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(c, sfxGain!, freq, 0.25, 'triangle', 0.35), i * 180);
  });
}

export function sfxClick() {
  const c = getCtx();
  if (!sfxGain) return;
  playTone(c, sfxGain, 800, 0.05, 'sine', 0.2);
}

export function sfxWindTunnel() {
  const c = getCtx();
  if (!sfxGain) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(300, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.2);
  osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.5);
  gain.gain.setValueAtTime(0.2, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + 0.5);
  osc.connect(gain).connect(sfxGain);
  osc.start();
  osc.stop(c.currentTime + 0.5);
}

/* ---- Internal helper ---- */

function playTone(
  c: AudioContext,
  dest: GainNode,
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain).connect(dest);
  osc.start();
  osc.stop(c.currentTime + duration + 0.05);
}

/* ---- Resume on interaction ---- */

export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}
