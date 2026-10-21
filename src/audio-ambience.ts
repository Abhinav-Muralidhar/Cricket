/**
 * audio-ambience.ts - Procedural Indian street soundscape.
 * Generates natural birds (Sparrows, Koel, Bulbul, Pigeons) and
 * variable street traffic (Bajaj scooter, auto-rickshaw, car, and distant truck).
 */

import { getAudioContext, getDestination, isAudioMuted } from './audio.ts';

let isRunning = false;

// 1. Bird species generators
function playSparrow(ac: AudioContext, dest: AudioNode, now: number, vol: number): void {
  const chirps = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < chirps; i++) {
    const t = now + i * (0.07 + Math.random() * 0.05);
    const osc = ac.createOscillator(), g = ac.createGain();
    const base = 3300 + Math.random() * 600;
    osc.type = 'sine'; osc.frequency.setValueAtTime(base, t);
    osc.frequency.linearRampToValueAtTime(base + 700, t + 0.03);
    osc.frequency.exponentialRampToValueAtTime(base - 300, t + 0.07);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + 0.07);
  }
}

function playKoel(ac: AudioContext, dest: AudioNode, now: number, vol: number): void {
  const calls = 1 + (Math.random() > 0.6 ? 1 : 0);
  for (let i = 0; i < calls; i++) {
    const t = now + i * 0.55;
    const osc = ac.createOscillator(), g = ac.createGain();
    const startF = 740 + Math.random() * 60;
    osc.type = 'sine'; osc.frequency.setValueAtTime(startF, t);
    osc.frequency.exponentialRampToValueAtTime(startF * 1.55, t + 0.38);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol * 0.85, t + 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + 0.42);
  }
}

function playBulbul(ac: AudioContext, dest: AudioNode, now: number, vol: number): void {
  const notes = [2700, 2400, 2900, 2200];
  notes.forEach((freq, i) => {
    const t = now + i * 0.08;
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(freq + Math.random() * 100, t);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol * 0.75, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
    osc.connect(g); g.connect(dest);
    osc.start(t); osc.stop(t + 0.075);
  });
}

function playPigeon(ac: AudioContext, dest: AudioNode, now: number, vol: number): void {
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.type = 'sine'; osc.frequency.setValueAtTime(320, now);
  osc.frequency.linearRampToValueAtTime(360, now + 0.12);
  osc.frequency.exponentialRampToValueAtTime(290, now + 0.32);
  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(vol * 0.9, now + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.connect(g); g.connect(dest);
  osc.start(now); osc.stop(now + 0.35);
}

// 2. Street vehicle horn generators
function playScooterHorn(ac: AudioContext, dest: AudioNode, now: number, vol: number): void {
  const taps = Math.random() > 0.35 ? 2 : 1;
  for (let i = 0; i < taps; i++) {
    const t = now + i * 0.14;
    [630, 790].forEach((freq) => {
      const osc = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
      osc.type = 'square'; osc.frequency.setValueAtTime(freq, t);
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(800, t);
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol * 0.9, t + 0.02);
      g.gain.setValueAtTime(vol * 0.9, t + 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(lp); lp.connect(g); g.connect(dest);
      osc.start(t); osc.stop(t + 0.1);
    });
  }
}

function playAutoHorn(ac: AudioContext, dest: AudioNode, now: number, vol: number): void {
  const dur = 0.12 + Math.random() * 0.1;
  [450, 560].forEach((freq) => {
    const osc = ac.createOscillator(), g = ac.createGain(), bp = ac.createBiquadFilter();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, now);
    bp.type = 'bandpass'; bp.frequency.setValueAtTime(950, now); bp.Q.setValueAtTime(2.0, now);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(vol, now + 0.02);
    g.gain.setValueAtTime(vol, now + dur - 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(bp); bp.connect(g); g.connect(dest);
    osc.start(now); osc.stop(now + dur);
  });
}

function playCarHorn(ac: AudioContext, dest: AudioNode, now: number, vol: number): void {
  const dur = 0.18 + Math.random() * 0.15;
  [440, 554].forEach((freq) => {
    const osc = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    osc.type = 'square'; osc.frequency.setValueAtTime(freq, now);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(750, now);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(vol * 0.8, now + 0.03);
    g.gain.setValueAtTime(vol * 0.8, now + dur - 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(lp); lp.connect(g); g.connect(dest);
    osc.start(now); osc.stop(now + dur);
  });
}

function playTruckHorn(ac: AudioContext, dest: AudioNode, now: number, vol: number): void {
  const dur = 0.35 + Math.random() * 0.2;
  [280, 350].forEach((freq) => {
    const osc = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(freq, now);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, now);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(vol * 0.5, now + 0.06);
    g.gain.setValueAtTime(vol * 0.5, now + dur - 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(lp); lp.connect(g); g.connect(dest);
    osc.start(now); osc.stop(now + dur);
  });
}

// 3. Ambience orchestrator loop
export function startAmbienceEngine(): void {
  if (isRunning) return;
  isRunning = true;

  function triggerBird(): void {
    const ac = getAudioContext(), dest = getDestination();
    if (ac && dest && !isAudioMuted()) {
      const vol = 0.015 + Math.random() * 0.035; // variable intensity
      const roll = Math.random();
      if (roll < 0.4) playSparrow(ac, dest, ac.currentTime, vol);
      else if (roll < 0.65) playKoel(ac, dest, ac.currentTime, vol);
      else if (roll < 0.85) playBulbul(ac, dest, ac.currentTime, vol);
      else playPigeon(ac, dest, ac.currentTime, vol);
    }
    setTimeout(triggerBird, 4000 + Math.random() * 7000);
  }

  function triggerHorn(): void {
    const ac = getAudioContext(), dest = getDestination();
    if (ac && dest && !isAudioMuted()) {
      const vol = 0.012 + Math.random() * 0.028; // variable intensity
      const roll = Math.random();
      if (roll < 0.4) playScooterHorn(ac, dest, ac.currentTime, vol);
      else if (roll < 0.7) playAutoHorn(ac, dest, ac.currentTime, vol);
      else if (roll < 0.9) playCarHorn(ac, dest, ac.currentTime, vol);
      else playTruckHorn(ac, dest, ac.currentTime, vol);
    }
    setTimeout(triggerHorn, 8000 + Math.random() * 12000);
  }

  setTimeout(triggerBird, 1500);
  setTimeout(triggerHorn, 5000);
}
