/**
 * types.ts - Core types and interfaces for Gully Cricket
 */

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
  pivotX: number;     // Pivot offset X from rig origin
  pivotY: number;     // Pivot offset Y from rig origin
  width: number;      // Bounding width of the part
  height: number;     // Bounding height of the part
  angle: number;      // Local rotation in radians
  color: string;      // Fill/stroke color
  label?: string;     // Optional debug label
  children?: RigPart[]; // Sub-parts attached to this joint
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
  target?: Vector2D;   // Trajectory target during hit
  arcProgress?: number; // 0 to 1 for hit trajectory
  startPos?: Vector2D;
}

/** Result details of the most recent delivery */
export interface DeliveryResult {
  outcome: OutcomeType;
  timingRating: TimingRating;
  timingOffsetPx: number;  // Distance from sweet spot (px)
  timingOffsetMs: number;  // Approximate timing error in ms
  description: string;
  runsScored: number;
  livesLost: number;
  isWindowBroken: boolean;
  isScooterHit: boolean;
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
  swingProgress: number;     // 0 = ready, 0..1 = swinging, 1 = finish
  isSwinging: boolean;
  hasSwungThisBall: boolean;
  resultTimer: number;       // Elapsed time in RESULT state
  debugMode: boolean;        // Toggle with 'D'
}
