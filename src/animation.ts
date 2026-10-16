/**
 * animation.ts - Typed keyframe animation engine for Gully Cricket character rigs.
 * Interpolates angles between poses using configurable easing functions.
 */

import type { CharacterRig } from './types.ts';

export type PartName = string;

/** Angle per rig part in radians */
export type Pose = Record<PartName, number>;

export type EasingType = 'linear' | 'easeInOut' | 'easeOutBack' | 'easeIn' | 'easeOut';

export interface Keyframe {
  t: number; // Normalized time (0.0 to 1.0)
  pose: Pose;
  easing?: EasingType;
}

export interface Clip {
  name: string;
  duration: number; // in seconds
  keyframes: Keyframe[];
  loop: boolean;
}

/** Easing mathematics */
export const EASINGS: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  // Snappy swing with overshoot
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

/**
 * Samples an animated clip at a normalized time [0.0 .. 1.0]
 */
export function sampleClip(clip: Clip, normTime: number): Pose {
  const kfs = clip.keyframes;
  if (kfs.length === 0) return {};
  if (kfs.length === 1 || normTime <= kfs[0].t) return { ...kfs[0].pose };
  if (normTime >= kfs[kfs.length - 1].t) return { ...kfs[kfs.length - 1].pose };

  // Find surrounding keyframe bracket
  let i0 = 0;
  for (let i = 0; i < kfs.length - 1; i++) {
    if (normTime >= kfs[i].t && normTime <= kfs[i + 1].t) {
      i0 = i;
      break;
    }
  }
  const k0 = kfs[i0];
  const k1 = kfs[i0 + 1];

  const span = Math.max(0.0001, k1.t - k0.t);
  const u = (normTime - k0.t) / span;
  const easingFn = EASINGS[k1.easing || 'linear'] || EASINGS.linear;
  const alpha = easingFn(Math.max(0, Math.min(1, u)));

  const result: Pose = {};
  const allParts = new Set([...Object.keys(k0.pose), ...Object.keys(k1.pose)]);
  for (const part of allParts) {
    const a0 = k0.pose[part] ?? 0;
    const a1 = k1.pose[part] ?? a0;
    result[part] = a0 + (a1 - a0) * alpha;
  }
  return result;
}

/**
 * Applies a pose's joint angles onto the character rig parts.
 */
export function applyPoseToRig(rig: CharacterRig, pose: Pose): void {
  for (const partName in pose) {
    if (rig.parts[partName]) {
      rig.parts[partName].angle = pose[partName];
    }
  }
}

/**
 * State tracking animator for a single character rig.
 */
export class Animator {
  public clip: Clip | null = null;
  public currentTime = 0;
  public isFinished = false;
  private currentPose: Pose = {};

  constructor(initialClip?: Clip) {
    if (initialClip) this.play(initialClip);
  }

  play(clip: Clip, restart = false): void {
    if (this.clip?.name === clip.name && !restart) return;
    this.clip = clip;
    this.currentTime = 0;
    this.isFinished = false;
  }

  update(dt: number): Pose {
    if (!this.clip || this.clip.keyframes.length === 0) return this.currentPose;

    this.currentTime += dt;
    let normTime = this.currentTime / this.clip.duration;

    if (normTime >= 1.0) {
      if (this.clip.loop) {
        normTime = normTime % 1.0;
        this.currentTime = normTime * this.clip.duration;
      } else {
        normTime = 1.0;
        this.isFinished = true;
      }
    }

    this.currentPose = sampleClip(this.clip, normTime);
    return this.currentPose;
  }

  applyToRig(rig: CharacterRig): void {
    applyPoseToRig(rig, this.currentPose);
  }
}
