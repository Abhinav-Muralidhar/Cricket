/**
 * state.ts - Game state machine, character animators, physics updates, and timing evaluations.
 */

import { CONFIG, PALETTE } from './config.ts';
import { Animator } from './animation.ts';
import { BATTER_CLIPS, BOWLER_CLIPS, FIELDER_CLIPS } from './poses.ts';
import type {
  GameState,
  DeliveryResult,
  OutcomeType,
  TimingRating,
  CharacterRig,
  BallState,
} from './types.ts';

export function createCharacterRig(
  x: number,
  y: number,
  shirtColor: string,
  pantsColor: string,
  extraPart?: { name: string; part: any }
): CharacterRig {
  const parts: Record<string, any> = {
    torso: { pivotX: 0, pivotY: -70, width: 22, height: 50, angle: 0, color: shirtColor },
    head: { pivotX: 0, pivotY: -105, width: 22, height: 22, angle: 0, color: PALETTE.roadLines },
    frontLeg: { pivotX: 4, pivotY: -20, width: 10, height: 42, angle: 0.05, color: pantsColor },
    backLeg: { pivotX: -4, pivotY: -20, width: 10, height: 42, angle: -0.05, color: pantsColor },
    arms: { pivotX: 8, pivotY: -60, width: 9, height: 32, angle: -0.3, color: shirtColor },
  };
  if (extraPart) parts[extraPart.name] = extraPart.part;
  return { x, y, parts };
}

export function createBatterRig(x: number, y: number): CharacterRig {
  return createCharacterRig(x, y, PALETTE.roadLines, PALETTE.asphalt, {
    name: 'bat',
    part: { pivotX: 14, pivotY: -45, width: 10, height: 65, angle: -0.4, color: PALETTE.wicketWood },
  });
}

export function createBowlerRig(x: number, y: number): CharacterRig {
  return createCharacterRig(x, y, PALETTE.buildingA, PALETTE.asphalt, {
    name: 'bowlingArm',
    part: { pivotX: -8, pivotY: -72, width: 8, height: 38, angle: 0.4, color: PALETTE.buildingA },
  });
}

export function createInitialState(): GameState {
  const l = CONFIG.layout;
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
    },
    lastResult: null,
    batterRig: createBatterRig(l.batter.x, l.batter.y),
    bowlerRig: createBowlerRig(l.bowler.x, l.bowler.y),
    fielder1Rig: createCharacterRig(l.fielder1.x, l.fielder1.y, PALETTE.buildingB, PALETTE.asphalt),
    fielder2Rig: createCharacterRig(l.fielder2.x, l.fielder2.y, PALETTE.roadLines, PALETTE.buildingBTrim),
    batterAnimator: new Animator(BATTER_CLIPS.idle),
    bowlerAnimator: new Animator(BOWLER_CLIPS.idle),
    fielder1Animator: new Animator(FIELDER_CLIPS.idle),
    fielder2Animator: new Animator(FIELDER_CLIPS.idle),
    previewClipName: null,
    isBallReleased: false,
    bowlerPhase: 'RUN_UP',
    bowlerTimer: 0,
    swingProgress: 0,
    isSwinging: false,
    hasSwungThisBall: false,
    resultTimer: 0,
    debugMode: false,
  };
}

export function startNewDelivery(state: GameState): void {
  state.ballCount++;
  state.currentBallSpeed = Math.min(
    CONFIG.ball.maxSpeed,
    CONFIG.ball.baseSpeed + (state.ballCount - 1) * CONFIG.ball.speedIncrementPerBall
  );

  state.bowlerRig.x = CONFIG.layout.bowler.x + 25;
  state.bowlerPhase = 'RUN_UP';
  state.bowlerTimer = 0;
  state.isBallReleased = false;

  state.ball = {
    x: CONFIG.layout.bowler.x + CONFIG.ball.releaseOffsetX,
    y: CONFIG.layout.bowler.y + CONFIG.ball.releaseOffsetY,
    vx: -state.currentBallSpeed,
    vy: 0,
    radius: CONFIG.ball.radius,
    active: false,
    bounced: false,
    arcProgress: 0,
    startPos: { x: CONFIG.layout.bowler.x + CONFIG.ball.releaseOffsetX, y: CONFIG.layout.bowler.y + CONFIG.ball.releaseOffsetY },
  };

  state.isSwinging = false;
  state.hasSwungThisBall = false;
  state.resultTimer = 0;
  state.state = 'BOWLING';

  state.bowlerAnimator.play(BOWLER_CLIPS.runUp, true);
  state.batterAnimator.play(BATTER_CLIPS.idle);
  state.fielder1Animator.play(FIELDER_CLIPS.idle);
  state.fielder2Animator.play(FIELDER_CLIPS.idle);
}

export function resetGame(state: GameState): void {
  state.score = 0;
  state.lives = CONFIG.gameplay.initialLives;
  state.ballCount = 0;
  state.lastResult = null;
  state.previewClipName = null;
  startNewDelivery(state);
}

export function evaluateTiming(offsetPx: number, speed: number): DeliveryResult {
  const t = CONFIG.timing;
  const timingOffsetMs = Math.round((offsetPx / speed) * 1000);

  if (offsetPx >= t.windowMinOffset && offsetPx <= t.windowMaxOffset) {
    return { outcome: 'WINDOW', timingRating: 'TOO_EARLY', timingOffsetPx: offsetPx, timingOffsetMs, description: "AUNTY'S WINDOW! GAME OVER", runsScored: 0, livesLost: CONFIG.gameplay.initialLives, isWindowBroken: true, isScooterHit: false };
  }
  if (offsetPx <= -t.scooterMinOffset && offsetPx >= -t.scooterMaxOffset) {
    const isCar = Math.abs(offsetPx) > (t.scooterMinOffset + t.scooterMaxOffset) / 2;
    return isCar
      ? { outcome: 'CAR_GLASS', timingRating: 'TOO_LATE', timingOffsetPx: offsetPx, timingOffsetMs, description: 'CAR WINDSHIELD CRACKED! -1 LIFE', runsScored: 0, livesLost: 1, isWindowBroken: false, isScooterHit: false, isCarGlassBroken: true }
      : { outcome: 'SCOOTER', timingRating: 'TOO_LATE', timingOffsetPx: offsetPx, timingOffsetMs, description: 'ACTIVA SCOOTER DENT! -1 LIFE', runsScored: 0, livesLost: 1, isWindowBroken: false, isScooterHit: true, isCarGlassBroken: false };
  }
  if (Math.abs(offsetPx) <= t.sixTolerance) {
    return { outcome: 'SIX', timingRating: 'PERFECT', timingOffsetPx: offsetPx, timingOffsetMs, description: 'SIX!', runsScored: 6, livesLost: 0, isWindowBroken: false, isScooterHit: false };
  }
  if ((offsetPx > t.sixTolerance && offsetPx <= t.fourEarlyTolerance) || (offsetPx < -t.sixTolerance && offsetPx >= -t.fourLateTolerance)) {
    return { outcome: 'FOUR', timingRating: offsetPx > 0 ? 'GOOD_EARLY' : 'GOOD_LATE', timingOffsetPx: offsetPx, timingOffsetMs, description: 'FOUR!', runsScored: 4, livesLost: 0, isWindowBroken: false, isScooterHit: false };
  }
  if ((offsetPx > t.fourEarlyTolerance && offsetPx <= t.singleEarlyTolerance) || (offsetPx < -t.fourLateTolerance && offsetPx >= -t.singleLateTolerance)) {
    return { outcome: 'SINGLE', timingRating: offsetPx > 0 ? 'EARLY' : 'LATE', timingOffsetPx: offsetPx, timingOffsetMs, description: 'SINGLE (+1)', runsScored: 1, livesLost: 0, isWindowBroken: false, isScooterHit: false };
  }
  const rating: TimingRating = offsetPx > 0 ? 'TOO_EARLY' : 'TOO_LATE';
  return { outcome: 'MISS', timingRating: rating, timingOffsetPx: offsetPx, timingOffsetMs, description: 'MISSED!', runsScored: 0, livesLost: 0, isWindowBroken: false, isScooterHit: false };
}

function setupHitTrajectory(ball: BallState, outcome: OutcomeType): void {
  ball.startPos = { x: ball.x, y: ball.y };
  ball.arcProgress = 0;
  const l = CONFIG.layout;
  if (outcome === 'WINDOW') ball.target = { x: l.window.x + l.window.width / 2, y: l.window.y + l.window.height / 2 };
  else if (outcome === 'CAR_GLASS') ball.target = { x: l.car.x + l.car.width / 2, y: l.car.y + 20 };
  else if (outcome === 'SCOOTER') ball.target = { x: l.scooter.x + l.scooter.width / 2, y: l.scooter.y + l.scooter.height / 2 };
  else if (outcome === 'SIX') ball.target = { x: CONFIG.world.width + 120, y: 120 };
  else if (outcome === 'FOUR') ball.target = { x: CONFIG.world.width + 90, y: CONFIG.street.groundY - 15 };
  else if (outcome === 'SINGLE') ball.target = { x: 740, y: CONFIG.street.groundY - 12 };
}

export function handlePlayerSwing(state: GameState): void {
  if (state.state === 'TITLE' || state.state === 'GAME_OVER') {
    resetGame(state);
    return;
  }
  if (state.state === 'RESULT') {
    if (state.lives <= 0 || (state.lastResult && state.lastResult.isWindowBroken)) state.state = 'GAME_OVER';
    else startNewDelivery(state);
    return;
  }
  if (state.state !== 'BOWLING' || state.hasSwungThisBall) return;

  state.hasSwungThisBall = true;
  state.isSwinging = true;
  state.batterAnimator.play(BATTER_CLIPS.swing, true);

  const offsetPx = state.ball.x - CONFIG.layout.sweetSpot.x;
  const result = evaluateTiming(offsetPx, state.currentBallSpeed);

  if (result.outcome !== 'MISS') {
    state.lastResult = result;
    state.score += result.runsScored;
    state.lives -= result.livesLost;
    setupHitTrajectory(state.ball, result.outcome);
    state.state = 'HIT';

    if (result.outcome === 'FOUR' || result.outcome === 'SIX' || result.outcome === 'WINDOW' || result.outcome === 'CAR_GLASS' || result.outcome === 'SCOOTER') {
      state.fielder1Animator.play(FIELDER_CLIPS.handsOnHead, true);
      state.fielder2Animator.play(FIELDER_CLIPS.handsOnHead, true);
    } else if (result.outcome === 'SINGLE') {
      state.fielder1Animator.play(FIELDER_CLIPS.run, true);
      state.fielder2Animator.play(FIELDER_CLIPS.dive, true);
    }
  } else {
    state.lastResult = result;
  }
}

export function cycleBatterPreviewClip(state: GameState): void {
  const clips = [BATTER_CLIPS.idle, BATTER_CLIPS.backlift, BATTER_CLIPS.swing, BATTER_CLIPS.followThrough, BATTER_CLIPS.bowledReaction];
  const currIdx = clips.findIndex((c) => c.name === state.previewClipName);
  const nextClip = clips[(currIdx + 1) % clips.length];
  state.previewClipName = nextClip.name;
  state.batterAnimator.play(nextClip, true);
}

export function updateGame(state: GameState, dt: number): void {
  const delta = Math.min(dt, 0.05);

  state.batterAnimator.update(delta);
  state.bowlerAnimator.update(delta);
  state.fielder1Animator.update(delta);
  state.fielder2Animator.update(delta);

  state.batterAnimator.applyToRig(state.batterRig);
  state.bowlerAnimator.applyToRig(state.bowlerRig);
  state.fielder1Animator.applyToRig(state.fielder1Rig);
  state.fielder2Animator.applyToRig(state.fielder2Rig);

  if (state.batterAnimator.clip?.name === 'swing' && state.batterAnimator.isFinished && !state.previewClipName) {
    state.batterAnimator.play(BATTER_CLIPS.followThrough);
  }

  switch (state.state) {
    case 'BOWLING': {
      state.bowlerTimer += delta;

      if (state.bowlerPhase === 'RUN_UP') {
        state.bowlerRig.x = Math.max(CONFIG.layout.bowler.x, state.bowlerRig.x - delta * 35);
        if (state.bowlerTimer >= 0.4) state.batterAnimator.play(BATTER_CLIPS.backlift);
        if (state.bowlerAnimator.isFinished || state.bowlerTimer >= BOWLER_CLIPS.runUp.duration) {
          state.bowlerPhase = 'DELIVERY';
          state.bowlerTimer = 0;
          state.bowlerAnimator.play(BOWLER_CLIPS.delivery, true);
        }
      } else if (state.bowlerPhase === 'DELIVERY') {
        if (!state.isBallReleased && state.bowlerTimer >= 0.22) {
          state.isBallReleased = true;
          state.ball.active = true;
        }
        if (state.bowlerAnimator.isFinished) {
          state.bowlerPhase = 'RELEASED';
          state.bowlerAnimator.play(BOWLER_CLIPS.followThrough, true);
        }
      }

      if (state.isBallReleased) {
        state.ball.x += state.ball.vx * delta;
        const bounceX = CONFIG.ball.bounceX;
        const releaseX = CONFIG.layout.bowler.x + CONFIG.ball.releaseOffsetX;
        if (state.ball.x > bounceX) {
          const t = (releaseX - state.ball.x) / (releaseX - bounceX);
          state.ball.y = (CONFIG.layout.bowler.y + CONFIG.ball.releaseOffsetY) + t * (CONFIG.ball.bounceY - state.ball.radius - (CONFIG.layout.bowler.y + CONFIG.ball.releaseOffsetY));
        } else {
          state.ball.bounced = true;
          const t = (bounceX - state.ball.x) / (bounceX - CONFIG.layout.sweetSpot.x);
          state.ball.y = (CONFIG.ball.bounceY - state.ball.radius) + t * (CONFIG.layout.sweetSpot.y - (CONFIG.ball.bounceY - state.ball.radius));
        }

        if (state.ball.x <= CONFIG.layout.wicket.x + CONFIG.layout.wicket.width) {
          state.lives = Math.max(0, state.lives - 1);
          state.lastResult = {
            outcome: 'BOWLED',
            timingRating: state.hasSwungThisBall ? 'TOO_LATE' : 'NONE',
            timingOffsetPx: state.ball.x - CONFIG.layout.sweetSpot.x,
            timingOffsetMs: Math.round(((state.ball.x - CONFIG.layout.sweetSpot.x) / state.currentBallSpeed) * 1000),
            description: 'BOWLED!',
            runsScored: 0,
            livesLost: 1,
            isWindowBroken: false,
            isScooterHit: false,
          };
          state.ball.active = false;
          state.batterAnimator.play(BATTER_CLIPS.bowledReaction, true);
          state.state = 'RESULT';
        }
      }
      break;
    }

    case 'HIT': {
      if (state.ball.target && state.ball.startPos) {
        state.ball.arcProgress = (state.ball.arcProgress || 0) + delta / CONFIG.gameplay.hitFlightDurationSec;
        const t = Math.min(1, state.ball.arcProgress);
        state.ball.x = state.ball.startPos.x + t * (state.ball.target.x - state.ball.startPos.x);
        const peakHeight = state.lastResult?.outcome === 'SIX' ? 320 : 60;
        state.ball.y = state.ball.startPos.y + t * (state.ball.target.y - state.ball.startPos.y) - 4 * peakHeight * t * (1 - t);
        if (t >= 1) state.state = 'RESULT';
      }
      break;
    }

    case 'RESULT': {
      state.resultTimer += delta;
      if (state.resultTimer >= CONFIG.gameplay.resultPauseDurationSec) {
        if (state.lives <= 0 || (state.lastResult && state.lastResult.isWindowBroken)) state.state = 'GAME_OVER';
        else startNewDelivery(state);
      }
      break;
    }

    case 'TITLE':
    case 'GAME_OVER':
      break;
  }
}
