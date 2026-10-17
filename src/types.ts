/**
 * types.ts - Core types and interfaces for Gully Cricket.
 */

import type { Animator } from './animation.ts';

export type GameStateKind =
  | 'TITLE'
  | 'BOWLING'
  | 'HIT'
  | 'RESULT'
  | 'GAME_OVER';

export type OutcomeType =
  | 'SIX'
  | 'FOUR'
  | 'SINGLE'
  | 'WINDOW'
  | 'SCOOTER'
  | 'CAR_GLASS'
  | 'MISS'
  | 'BOWLED';

export type TimingRating =
  | 'PERFECT'
  | 'GOOD_EARLY'
  | 'GOOD_LATE'
  | 'EARLY'
  | 'LATE'
  | 'TOO_EARLY'
  | 'TOO_LATE'
  | 'NONE';

export type FaceExpression = 'neutral' | 'smile' | 'shout' | 'sad' | 'wince';
export type CharacterVariant = 'batter' | 'bowler' | 'gully' | 'schoolKid' | 'uncle';
export type HitTargetKey = 'window' | 'car' | 'scooter';

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

export interface CharacterRig {
  x: number;
  y: number;
  scale: number;
  variant: CharacterVariant;
  parts: Record<string, RigPart>;
  expression: FaceExpression;
  shirtColor: string;
  pantsColor: string;
  facing?: 'left' | 'right';
  prevTorsoAngle?: number;
  bodyLean?: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

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
  fielder3Rig: CharacterRig;
  batterAnimator: Animator;
  bowlerAnimator: Animator;
  fielder1Animator: Animator;
  fielder2Animator: Animator;
  fielder3Animator: Animator;
  previewClipName: string | null;
  isBallReleased: boolean;
  bowlerPhase: 'RUN_UP' | 'DELIVERY' | 'RELEASED';
  bowlerTimer: number;
  squashX: number;
  squashY: number;
  swingProgress: number;
  isSwinging: boolean;
  hasSwungThisBall: boolean;
  resultTimer: number;
  debugMode: boolean;
  selectedHitTarget: HitTargetKey;
  isPortrait: boolean;
  poseEditorActive?: boolean;
}
