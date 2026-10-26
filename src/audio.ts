/**
 * audio.ts - Zero-dependency procedural Web Audio sound effects & master audio controller.
 * Synthesizes cricket bat strikes, wickets clatter, car alarm sirens, and glass break.
 */

import { startAmbienceEngine } from './audio-ambience.ts';

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;
let ambienceStarted = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
      masterGain.connect(ctx.destination);
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function initAudio(): void {
  getAudioContext();
  if (!ambienceStarted) {
    ambienceStarted = true;
    startAmbienceEngine();
  }
}

export function toggleAudioMute(): boolean {
  muted = !muted;
  if (ctx && masterGain) {
    masterGain.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
  }
  return muted;
}

export function isAudioMuted(): boolean {
  return muted;
}

export function getDestination(): AudioNode | null {
  const ac = getAudioContext();
  return masterGain && ac ? masterGain : ac ? ac.destination : null;
}

function createNoiseBuffer(ac: AudioContext, duration: number): AudioBuffer {
  const size = Math.floor(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, size, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

/** Cricket bat hitting ball: crisp willow crack + deep leather thud */
export function playBatHit(quality: 'PERFECT' | 'GOOD' | 'EDGED' = 'GOOD'): void {
  const ac = getAudioContext(), dest = getDestination();
  if (!ac || !dest) return;
  const now = ac.currentTime;

  // 1. Willow crack
  const noise = ac.createBufferSource();
  noise.buffer = createNoiseBuffer(ac, 0.08);
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(quality === 'PERFECT' ? 1400 : 1100, now);
  filter.Q.setValueAtTime(3.0, now);
  const noiseGain = ac.createGain();
  noiseGain.gain.setValueAtTime(quality === 'PERFECT' ? 0.9 : 0.6, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
  noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(dest);
  noise.start(now);

  // 2. Leather/bat body thud
  const osc = ac.createOscillator(), oscGain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(quality === 'PERFECT' ? 240 : 190, now);
  osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
  oscGain.gain.setValueAtTime(0.8, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(oscGain); oscGain.connect(dest);
  osc.start(now); osc.stop(now + 0.1);

  // 3. Sweet-spot ring for SIX
  if (quality === 'PERFECT') {
    const ring = ac.createOscillator(), ringGain = ac.createGain();
    ring.type = 'sine'; ring.frequency.setValueAtTime(680, now);
    ringGain.gain.setValueAtTime(0.35, now);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    ring.connect(ringGain); ringGain.connect(dest);
    ring.start(now); ring.stop(now + 0.22);
  }
}

/** Swing miss air whoosh */
export function playSwingMiss(): void {
  const ac = getAudioContext(), dest = getDestination();
  if (!ac || !dest) return;
  const now = ac.currentTime, noise = ac.createBufferSource();
  noise.buffer = createNoiseBuffer(ac, 0.18);
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(450, now);
  filter.frequency.exponentialRampToValueAtTime(120, now + 0.18);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  noise.connect(filter); filter.connect(gain); gain.connect(dest);
  noise.start(now);
}

/** Wooden stumps knocked down */
export function playWicketsClatter(): void {
  const ac = getAudioContext(), dest = getDestination();
  if (!ac || !dest) return;
  const now = ac.currentTime;
  [320, 480, 260, 410].forEach((freq, i) => {
    const delay = now + i * 0.04, osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, delay);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, delay + 0.12);
    gain.gain.setValueAtTime(0.5 / (i + 1), delay);
    gain.gain.exponentialRampToValueAtTime(0.001, delay + 0.12);
    osc.connect(gain); gain.connect(dest);
    osc.start(delay); osc.stop(delay + 0.12);
  });
}

/** Glass break (window / car window hit) */
export function playGlassBreak(): void {
  const ac = getAudioContext(), dest = getDestination();
  if (!ac || !dest) return;
  const now = ac.currentTime, noise = ac.createBufferSource();
  noise.buffer = createNoiseBuffer(ac, 0.35);
  const filter = ac.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.setValueAtTime(2200, now);
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.7, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  noise.connect(filter); filter.connect(gain); gain.connect(dest);
  noise.start(now);

  [2100, 2750, 3400, 1950].forEach((freq, idx) => {
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(freq, now + idx * 0.03);
    g.gain.setValueAtTime(0.25, now + idx * 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + idx * 0.03);
    osc.connect(g); g.connect(dest);
    osc.start(now + idx * 0.03); osc.stop(now + 0.3 + idx * 0.03);
  });
}

/** Car alarm siren alternating cadence */
export function playCarAlarm(): void {
  const ac = getAudioContext(), dest = getDestination();
  if (!ac || !dest) return;
  for (let i = 0; i < 6; i++) {
    const now = ac.currentTime + 0.35 + i * 0.32, osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(i % 2 === 0 ? 820 : 1050, now);
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(2200, now);
    gain.gain.setValueAtTime(0.18, now); gain.gain.setValueAtTime(0.18, now + 0.16);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.18);
    osc.connect(filter); filter.connect(gain); gain.connect(dest);
    osc.start(now); osc.stop(now + 0.18);
  }
}

/** Delivery whoosh */
export function playBallDelivery(): void {
  const ac = getAudioContext(), dest = getDestination();
  if (!ac || !dest) return;
  const now = ac.currentTime, osc = ac.createOscillator(), gain = ac.createGain();
  osc.type = 'sine'; osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.2);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(gain); gain.connect(dest);
  osc.start(now); osc.stop(now + 0.25);
}

/** Celebratory milestone fanfare (50 / 100 runs) */
export function playMilestoneFanfare(): void {
  const ac = getAudioContext(), dest = getDestination();
  if (!ac || !dest) return;
  const now = ac.currentTime;
  // Celebratory ascending brass arpeggio: C5 (523), E5 (659), G5 (784), C6 (1046)
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    const osc = ac.createOscillator(), gain = ac.createGain();
    const startTime = now + idx * 0.09;
    const dur = idx === notes.length - 1 ? 0.65 : 0.22;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.28, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    osc.connect(gain); gain.connect(dest);
    osc.start(startTime); osc.stop(startTime + dur);
  });
}
