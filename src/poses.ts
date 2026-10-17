/**
 * poses.ts - Pure data definitions for character poses and animation clips.
 * Angles are in radians. Tweak values here to adjust character posture and motion feel.
 */

import type { Clip, Pose } from './animation.ts';

// ---------------------------------------------------------------------------
// BATTER POSES & CLIPS
// ---------------------------------------------------------------------------

export const BATTER_POSES: Record<string, Pose> = {
  // Relaxed batting stance in crease with subtle breathing
  idle1: { head: -0.04, torso: -0.06, frontLeg: 0.08, backLeg: -0.08, arms: -0.35, bat: -0.45 },
  idle2: { head: -0.02, torso: -0.10, frontLeg: 0.10, backLeg: -0.06, arms: -0.40, bat: -0.52 },

  // Cocking bat back with weight shifted back as bowler approaches
  backlift1: { head: -0.02, torso: -0.12, frontLeg: 0.14, backLeg: -0.12, arms: -0.65, bat: -0.85 },
  backlift2: { head: 0.02, torso: -0.18, frontLeg: 0.20, backLeg: -0.15, arms: -0.95, bat: -1.25 },

  // High-speed downswing with full body lean into the stroke
  swingStart: { head: 0.02, torso: -0.14, frontLeg: 0.18, backLeg: -0.14, arms: -0.85, bat: -1.10 },
  swingImpact: { head: -0.04, torso: 0.22, frontLeg: 0.40, backLeg: -0.30, arms: 0.45, bat: 0.50 },
  swingFollow: { head: -0.12, torso: 0.38, frontLeg: 0.48, backLeg: -0.35, arms: 1.35, bat: 1.75 },

  // Follow-through overshoot & high finish hold
  finishHold1: { head: -0.22, torso: 0.42, frontLeg: 0.45, backLeg: -0.32, arms: 1.55, bat: 2.05 },
  finishHold2: { head: -0.18, torso: 0.38, frontLeg: 0.45, backLeg: -0.32, arms: 1.48, bat: 1.95 },

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
    duration: 0.3, // ~300 ms fast swing with overshoot
    loop: false,
    keyframes: [
      { t: 0.0, pose: BATTER_POSES.swingStart, easing: 'easeOutBack' },
      { t: 0.45, pose: BATTER_POSES.swingImpact, easing: 'easeOutBack' },
      { t: 1.0, pose: BATTER_POSES.swingFollow, easing: 'easeOutBack' },
    ],
  },
  followThrough: {
    name: 'followThrough',
    duration: 0.8,
    loop: false,
    keyframes: [
      { t: 0.0, pose: BATTER_POSES.swingFollow, easing: 'easeOut' },
      { t: 0.35, pose: BATTER_POSES.finishHold1, easing: 'easeInOut' },
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
  // Idle stance: bowling arm rests naturally down by hip holding the ball
  idle: { head: 0.0, torso: 0.04, frontLeg: 0.05, backLeg: -0.05, arms: 0.10, bowlingArm: 0.08 },

  // Run-up strides (dynamic arm/leg pump)
  run1: { head: 0.05, torso: 0.22, frontLeg: 0.65, backLeg: -0.65, arms: -0.55, bowlingArm: 0.75 },
  run2: { head: 0.02, torso: 0.18, frontLeg: -0.60, backLeg: 0.60, arms: 0.55, bowlingArm: -0.45 },
  runGather: { head: 0.04, torso: 0.26, frontLeg: -0.30, backLeg: 0.30, arms: -0.35, bowlingArm: 1.30 },

  // 360-degree windmill delivery
  windup: { head: 0.06, torso: -0.25, frontLeg: 0.25, backLeg: -0.25, arms: 0.60, bowlingArm: 2.30 },
  releaseApex: { head: 0.02, torso: 0.12, frontLeg: 0.55, backLeg: -0.45, arms: -0.25, bowlingArm: -0.10 },
  releaseThrust: { head: -0.05, torso: 0.45, frontLeg: 0.65, backLeg: -0.55, arms: -0.45, bowlingArm: -1.95 },

  // Follow-through landing over the crease
  landing: { head: 0.08, torso: 0.50, frontLeg: 0.45, backLeg: -0.60, arms: 0.25, bowlingArm: -2.45 },
};

export const BOWLER_CLIPS: Record<string, Clip> = {
  idle: {
    name: 'idle',
    duration: 1.0,
    loop: true,
    keyframes: [
      { t: 0.0, pose: BOWLER_POSES.idle, easing: 'easeInOut' },
      { t: 0.5, pose: { ...BOWLER_POSES.idle, torso: 0.07, bowlingArm: 0.12 }, easing: 'easeInOut' },
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
  ready1: { head: 0.0, torso: 0.24, frontLeg: 0.30, backLeg: -0.25, arms: 0.40 },
  ready2: { head: 0.02, torso: 0.28, frontLeg: 0.35, backLeg: -0.28, arms: 0.45 },

  // Running toward the ball
  run1: { head: 0.08, torso: 0.28, frontLeg: 0.65, backLeg: -0.65, arms: -0.55 },
  run2: { head: 0.08, torso: 0.28, frontLeg: -0.65, backLeg: 0.65, arms: 0.55 },

  // Horizontal dive on street asphalt
  dive: { head: -0.25, torso: 1.25, frontLeg: -0.35, backLeg: -0.45, arms: 1.60 },

  // Hands clutching head in dismay
  handsOnHead: { head: -0.15, torso: -0.10, frontLeg: 0.08, backLeg: -0.08, arms: -2.35 },
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
