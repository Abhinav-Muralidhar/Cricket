/**
 * poses.ts - Pure data definitions for character poses and animation clips.
 * Angles are in radians. Tweak values here to adjust character posture and motion feel.
 */

import type { Clip, Pose } from './animation.ts';

// ---------------------------------------------------------------------------
// BATTER POSES & CLIPS
// ---------------------------------------------------------------------------

export const BATTER_POSES: Record<string, Pose> = {
  // Relaxed batting stance in crease
  idle1: { head: 0.0, torso: -0.05, frontLeg: 0.08, backLeg: -0.08, arms: -0.30, bat: -0.40 },
  idle2: { head: 0.02, torso: -0.07, frontLeg: 0.08, backLeg: -0.08, arms: -0.32, bat: -0.42 },

  // Cocking bat back as bowler approaches
  backlift1: { head: 0.02, torso: -0.10, frontLeg: 0.12, backLeg: -0.10, arms: -0.60, bat: -0.80 },
  backlift2: { head: 0.05, torso: -0.16, frontLeg: 0.18, backLeg: -0.12, arms: -0.90, bat: -1.15 },

  // High-speed downswing (about 300ms)
  swingStart: { head: 0.04, torso: -0.12, frontLeg: 0.16, backLeg: -0.12, arms: -0.80, bat: -1.00 },
  swingImpact: { head: -0.02, torso: 0.10, frontLeg: 0.32, backLeg: -0.20, arms: 0.30, bat: 0.35 },
  swingFollow: { head: -0.08, torso: 0.25, frontLeg: 0.40, backLeg: -0.25, arms: 1.15, bat: 1.45 },

  // Elegant high finish hold
  finishHold1: { head: -0.18, torso: 0.28, frontLeg: 0.38, backLeg: -0.22, arms: 1.35, bat: 1.70 },
  finishHold2: { head: -0.15, torso: 0.26, frontLeg: 0.38, backLeg: -0.22, arms: 1.30, bat: 1.65 },

  // Dejection: head hangs, arms drop limp, bat rests sad
  bowledDejected: { head: 0.65, torso: 0.35, frontLeg: 0.05, backLeg: 0.05, arms: 0.25, bat: 0.12 },
};

export const BATTER_CLIPS: Record<string, Clip> = {
  idle: {
    name: 'idle',
    duration: 1.2,
    loop: true,
    keyframes: [
      { t: 0.0, pose: BATTER_POSES.idle1, easing: 'easeInOut' },
      { t: 0.5, pose: BATTER_POSES.idle2, easing: 'easeInOut' },
      { t: 1.0, pose: BATTER_POSES.idle1, easing: 'easeInOut' },
    ],
  },
  backlift: {
    name: 'backlift',
    duration: 0.4,
    loop: false,
    keyframes: [
      { t: 0.0, pose: BATTER_POSES.idle1, easing: 'easeInOut' },
      { t: 0.5, pose: BATTER_POSES.backlift1, easing: 'easeInOut' },
      { t: 1.0, pose: BATTER_POSES.backlift2, easing: 'easeInOut' },
    ],
  },
  swing: {
    name: 'swing',
    duration: 0.3, // ~300 ms fast swing
    loop: false,
    keyframes: [
      { t: 0.0, pose: BATTER_POSES.swingStart, easing: 'easeOutBack' },
      { t: 0.5, pose: BATTER_POSES.swingImpact, easing: 'easeOutBack' },
      { t: 1.0, pose: BATTER_POSES.swingFollow, easing: 'easeOutBack' },
    ],
  },
  followThrough: {
    name: 'followThrough',
    duration: 0.8,
    loop: false,
    keyframes: [
      { t: 0.0, pose: BATTER_POSES.swingFollow, easing: 'easeOut' },
      { t: 0.4, pose: BATTER_POSES.finishHold1, easing: 'easeInOut' },
      { t: 1.0, pose: BATTER_POSES.finishHold2, easing: 'easeInOut' },
    ],
  },
  bowledReaction: {
    name: 'bowledReaction',
    duration: 1.0,
    loop: false,
    keyframes: [
      { t: 0.0, pose: BATTER_POSES.idle1, easing: 'easeInOut' },
      { t: 0.35, pose: BATTER_POSES.bowledDejected, easing: 'easeOut' },
      { t: 1.0, pose: BATTER_POSES.bowledDejected, easing: 'linear' },
    ],
  },
};

// ---------------------------------------------------------------------------
// BOWLER POSES & CLIPS
// ---------------------------------------------------------------------------

export const BOWLER_POSES: Record<string, Pose> = {
  idle: { head: 0.0, torso: 0.05, frontLeg: 0.05, backLeg: -0.05, arms: -0.25, bowlingArm: 0.40 },

  // Run-up strides (leg/arm pump cycle)
  run1: { head: 0.05, torso: 0.16, frontLeg: 0.55, backLeg: -0.55, arms: -0.45, bowlingArm: 0.65 },
  run2: { head: 0.02, torso: 0.12, frontLeg: -0.50, backLeg: 0.50, arms: 0.45, bowlingArm: -0.35 },
  runGather: { head: 0.04, torso: 0.20, frontLeg: -0.25, backLeg: 0.25, arms: -0.30, bowlingArm: 1.10 },

  // 360-degree windmill delivery
  windup: { head: 0.06, torso: -0.22, frontLeg: 0.20, backLeg: -0.20, arms: 0.50, bowlingArm: 2.10 },
  releaseApex: { head: 0.02, torso: 0.08, frontLeg: 0.45, backLeg: -0.40, arms: -0.20, bowlingArm: -0.15 },
  releaseThrust: { head: -0.05, torso: 0.38, frontLeg: 0.55, backLeg: -0.45, arms: -0.40, bowlingArm: -1.75 },

  // Follow-through landing over the crease
  landing: { head: 0.08, torso: 0.44, frontLeg: 0.35, backLeg: -0.50, arms: 0.20, bowlingArm: -2.30 },
};

export const BOWLER_CLIPS: Record<string, Clip> = {
  idle: {
    name: 'idle',
    duration: 1.0,
    loop: true,
    keyframes: [
      { t: 0.0, pose: BOWLER_POSES.idle, easing: 'easeInOut' },
      { t: 0.5, pose: { ...BOWLER_POSES.idle, torso: 0.08, bowlingArm: 0.45 }, easing: 'easeInOut' },
      { t: 1.0, pose: BOWLER_POSES.idle, easing: 'easeInOut' },
    ],
  },
  runUp: {
    name: 'runUp',
    duration: 0.7,
    loop: false,
    keyframes: [
      { t: 0.0, pose: BOWLER_POSES.idle, easing: 'easeIn' },
      { t: 0.25, pose: BOWLER_POSES.run1, easing: 'linear' },
      { t: 0.55, pose: BOWLER_POSES.run2, easing: 'linear' },
      { t: 0.82, pose: BOWLER_POSES.run1, easing: 'linear' },
      { t: 1.0, pose: BOWLER_POSES.runGather, easing: 'easeOut' },
    ],
  },
  delivery: {
    name: 'delivery',
    duration: 0.35,
    loop: false,
    keyframes: [
      { t: 0.0, pose: BOWLER_POSES.runGather, easing: 'linear' },
      { t: 0.28, pose: BOWLER_POSES.windup, easing: 'easeInOut' },
      { t: 0.65, pose: BOWLER_POSES.releaseApex, easing: 'easeOut' },
      { t: 1.0, pose: BOWLER_POSES.releaseThrust, easing: 'easeOut' },
    ],
  },
  followThrough: {
    name: 'followThrough',
    duration: 0.5,
    loop: false,
    keyframes: [
      { t: 0.0, pose: BOWLER_POSES.releaseThrust, easing: 'linear' },
      { t: 0.5, pose: BOWLER_POSES.landing, easing: 'easeOut' },
      { t: 1.0, pose: BOWLER_POSES.idle, easing: 'easeInOut' },
    ],
  },
};

// ---------------------------------------------------------------------------
// FIELDER POSES & CLIPS
// ---------------------------------------------------------------------------

export const FIELDER_POSES: Record<string, Pose> = {
  // Crouched alert ready position
  ready1: { head: 0.0, torso: 0.18, frontLeg: 0.22, backLeg: -0.22, arms: 0.30 },
  ready2: { head: 0.02, torso: 0.22, frontLeg: 0.25, backLeg: -0.25, arms: 0.35 },

  // Running toward the ball
  run1: { head: 0.08, torso: 0.25, frontLeg: 0.60, backLeg: -0.60, arms: -0.50 },
  run2: { head: 0.08, torso: 0.25, frontLeg: -0.60, backLeg: 0.60, arms: 0.50 },

  // Horizontal dive on street asphalt
  dive: { head: -0.25, torso: 1.15, frontLeg: -0.30, backLeg: -0.40, arms: 1.45 },

  // Hands clutching head in dismay (FOUR / SIX / AUNTY'S WINDOW / CAR)
  handsOnHead: { head: -0.15, torso: -0.08, frontLeg: 0.08, backLeg: -0.08, arms: -2.25 },
};

export const FIELDER_CLIPS: Record<string, Clip> = {
  idle: {
    name: 'idle',
    duration: 1.1,
    loop: true,
    keyframes: [
      { t: 0.0, pose: FIELDER_POSES.ready1, easing: 'easeInOut' },
      { t: 0.5, pose: FIELDER_POSES.ready2, easing: 'easeInOut' },
      { t: 1.0, pose: FIELDER_POSES.ready1, easing: 'easeInOut' },
    ],
  },
  run: {
    name: 'run',
    duration: 0.45,
    loop: true,
    keyframes: [
      { t: 0.0, pose: FIELDER_POSES.run1, easing: 'linear' },
      { t: 0.5, pose: FIELDER_POSES.run2, easing: 'linear' },
      { t: 1.0, pose: FIELDER_POSES.run1, easing: 'linear' },
    ],
  },
  dive: {
    name: 'dive',
    duration: 0.8,
    loop: false,
    keyframes: [
      { t: 0.0, pose: FIELDER_POSES.ready1, easing: 'easeIn' },
      { t: 0.3, pose: FIELDER_POSES.dive, easing: 'easeOut' },
      { t: 1.0, pose: FIELDER_POSES.dive, easing: 'linear' },
    ],
  },
  handsOnHead: {
    name: 'handsOnHead',
    duration: 1.2,
    loop: false,
    keyframes: [
      { t: 0.0, pose: FIELDER_POSES.ready1, easing: 'easeInOut' },
      { t: 0.3, pose: FIELDER_POSES.handsOnHead, easing: 'easeOutBack' },
      { t: 1.0, pose: FIELDER_POSES.handsOnHead, easing: 'linear' },
    ],
  },
};
