/**
 * state-init.ts - Initial state creation and character rig builder factories.
 */

import { CONFIG, PALETTE } from './config.ts';
import { Animator } from './animation.ts';
import { BATTER_CLIPS, BOWLER_CLIPS, FIELDER_CLIPS } from './poses.ts';
import type { GameState, CharacterRig, CharacterVariant, RigPart } from './types.ts';

export function createRig(
  x: number,
  y: number,
  scale: number,
  variant: CharacterVariant,
  shirtColor: string,
  pantsColor: string,
  extraPart?: { name: string; part: RigPart },
  facing: 'left' | 'right' = 'right'
): CharacterRig {
  const parts: Record<string, RigPart> = {
    torso: { pivotX: 0, pivotY: -66, width: 38, height: 52, angle: 0, color: shirtColor },
    head: { pivotX: 0, pivotY: -130, width: 42, height: 42, angle: 0, color: PALETTE.roadLines },
    frontLeg: { pivotX: 7, pivotY: -62, width: 16, height: 58, angle: 0.05, color: pantsColor },
    backLeg: { pivotX: -5, pivotY: -62, width: 16, height: 58, angle: -0.05, color: pantsColor },
    arms: { pivotX: 10, pivotY: -110, width: 15, height: 44, angle: -0.3, color: shirtColor },
  };
  if (extraPart) parts[extraPart.name] = extraPart.part;
  return { x, y, scale, variant, expression: 'neutral', shirtColor, pantsColor, parts, facing };
}

export function createBatterRig(x: number, y: number): CharacterRig {
  return createRig(x, y, 1.0, 'batter', PALETTE.cream, '#2563EB', {
    name: 'bat',
    part: { pivotX: 20, pivotY: -80, width: 16, height: 75, angle: -0.45, color: PALETTE.wicketWood },
  }, 'right');
}

export function createBowlerRig(x: number, y: number): CharacterRig {
  return createRig(x, y, 1.0, 'bowler', PALETTE.buildingA, PALETTE.asphalt, {
    name: 'bowlingArm',
    part: { pivotX: -12, pivotY: -110, width: 15, height: 46, angle: 0.08, color: PALETTE.buildingA },
  }, 'left');
}

export function createInitialState(): GameState {
  const l = CONFIG.layout;
  const f1Anim = new Animator(FIELDER_CLIPS.idle); f1Anim.currentTime = 0.0;
  const f2Anim = new Animator(FIELDER_CLIPS.idle); f2Anim.currentTime = 0.35;
  const f3Anim = new Animator(FIELDER_CLIPS.idle); f3Anim.currentTime = 0.70;

  return {
    state: 'TITLE',
    score: 0,
    lives: CONFIG.gameplay.initialLives,
    ballCount: 0,
    currentBallSpeed: CONFIG.ball.baseSpeed,
    ball: {
      x: l.bowler.x + CONFIG.ball.releaseOffsetX,
      y: l.bowler.y + CONFIG.ball.releaseOffsetY,
      vx: -CONFIG.ball.baseSpeed,
      vy: 0,
      radius: CONFIG.ball.radius,
      active: false,
      bounced: false,
      arcProgress: 0,
      trail: [],
    },
    lastResult: null,
    batterRig: createBatterRig(l.batter.x, l.batter.y),
    bowlerRig: createBowlerRig(l.bowler.x, l.bowler.y),
    fielder1Rig: createRig(l.fielder1.x, l.fielder1.y, 0.85, 'gully', PALETTE.buildingB, PALETTE.asphalt, undefined, 'left'),
    fielder2Rig: createRig(l.fielder2.x, l.fielder2.y, 0.85, 'gully', PALETTE.mint, PALETTE.asphalt, undefined, 'left'),
    fielder3Rig: createRig(l.fielder3.x, l.fielder3.y, 0.85, 'gully', '#F97316', PALETTE.asphalt, undefined, 'left'),
    batterAnimator: new Animator(BATTER_CLIPS.idle),
    bowlerAnimator: new Animator(BOWLER_CLIPS.idle),
    fielder1Animator: f1Anim,
    fielder2Animator: f2Anim,
    fielder3Animator: f3Anim,
    previewClipName: null,
    isBallReleased: false,
    bowlerPhase: 'RUN_UP',
    bowlerTimer: 0,
    squashX: 1.0,
    squashY: 1.0,
    swingProgress: 0,
    isSwinging: false,
    hasSwungThisBall: false,
    resultTimer: 0,
    debugMode: false,
    selectedHitTarget: 'window',
    isPortrait: false,
    isWaitingForBall: false,
  };
}
