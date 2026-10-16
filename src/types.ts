/**
 * types.ts - Core types and interfaces for Gully Cricket
 */

import type { Animator } from './animation.ts';

/** Possible game state machine states */
export type GameStateKind =
  | 'TITLE'
  | 'BOWLING'
  | 'HIT'
  | 'RESULT'
  | 'GAME_OVER';

/** Possible batting outcomes decided by timing */
export type OutcomeType =
  | 'SIX'
  | 'FOUR'
  | 'SINGLE'
  | 'WINDOW'
  | 'SCOOTER'
  | 'CAR_GLASS'
  | 'MISS'
  | 'BOWLED';

/** Qualitative timing feedback for the player */
export type TimingRating =
  | 'PERFECT'
  | 'GOOD_EARLY'
  | 'GOOD_LATE'
  | 'EARLY'
  | 'LATE'
  | 'TOO_EARLY'
  | 'TOO_LATE'
  | 'NONE';

/** Rig part definition for hierarchical 2D character rendering */
export interface RigPart {
  pivotX: number;
  pivotY: number;
  width: number;
  height: number;
  angle: number;
  color: string;
  label?: string;
  children?: RigPart[];
}

/** Character rig containing named body parts */
export interface CharacterRig {
  x: number;
  y: number;
  parts: Record<string, RigPart>;
}

/** 2D point / vector */
export interface Vector2D {
  x: number;
  y: number;
}

/** State of the tape ball */
export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  active: boolean;
  bounced: boolean;
  target?: Vector2D;
  arcProgress?: number;
  startPos?: Vector2D;
}

/** Result details of the most recent delivery */
export interface DeliveryResult {
  outcome: OutcomeType;
  timingRating: TimingRating;
  timingOffsetPx: number;
  timingOffsetMs: number;
  description: string;
  runsScored: number;
  livesLost: number;
  isWindowBroken: boolean;
  isScooterHit: boolean;
  isCarGlassBroken?: boolean;
}

/** Complete runtime game state */
export interface GameState {
  state: GameStateKind;
  score: number;
  lives: number;
  ballCount: number;
  currentBallSpeed: number;
  ball: BallState;
  lastResult: DeliveryResult | null;
  batterRig: CharacterRig;
  bowlerRig: CharacterRig;
  fielder1Rig: CharacterRig;
  fielder2Rig: CharacterRig;
  batterAnimator: Animator;
  bowlerAnimator: Animator;
  fielder1Animator: Animator;
  fielder2Animator: Animator;
  previewClipName: string | null;
  isBallReleased: boolean;
  bowlerPhase: 'RUN_UP' | 'DELIVERY' | 'RELEASED';
  bowlerTimer: number;
  swingProgress: number;
  isSwinging: boolean;
  hasSwungThisBall: boolean;
  resultTimer: number;
  debugMode: boolean;
}
