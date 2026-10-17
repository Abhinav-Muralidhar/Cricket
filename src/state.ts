/**
 * state.ts - Game state machine, character animators, physics updates, and timing evaluations.
 */

import { CONFIG } from './config.ts';
import { BATTER_CLIPS, BOWLER_CLIPS, FIELDER_CLIPS } from './poses.ts';
import { evaluateTiming, setupHitTrajectory } from './timing.ts';
import type { GameState } from './types.ts';

export { createRig, createBatterRig, createBowlerRig, createInitialState } from './state-init.ts';

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

  state.batterRig.expression = 'neutral';
  state.bowlerRig.expression = 'neutral';
  [state.fielder1Rig, state.fielder2Rig, state.fielder3Rig].forEach((r) => (r.expression = 'neutral'));

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
  state.fielder3Animator.play(FIELDER_CLIPS.idle);
}

export function resetGame(state: GameState): void {
  state.score = 0;
  state.lives = CONFIG.gameplay.initialLives;
  state.ballCount = 0;
  state.lastResult = null;
  state.previewClipName = null;
  startNewDelivery(state);
}

export function handlePlayerSwing(state: GameState): void {
  if (state.isPortrait) return;
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
    state.squashX = 1.18; state.squashY = 0.84;

    const allFielders = [state.fielder1Rig, state.fielder2Rig, state.fielder3Rig];
    const allFieldAnim = [state.fielder1Animator, state.fielder2Animator, state.fielder3Animator];

    if (result.outcome === 'SIX' || result.outcome === 'FOUR') {
      state.batterRig.expression = 'smile';
      allFielders.forEach((r) => (r.expression = 'sad'));
      allFieldAnim.forEach((a) => a.play(FIELDER_CLIPS.handsOnHead, true));
    } else if (result.outcome === 'WINDOW' || result.outcome === 'CAR_GLASS' || result.outcome === 'SCOOTER') {
      state.batterRig.expression = 'shout';
      state.bowlerRig.expression = 'shout';
      allFielders.forEach((r) => (r.expression = 'shout'));
      allFieldAnim.forEach((a) => a.play(FIELDER_CLIPS.handsOnHead, true));
    } else if (result.outcome === 'SINGLE') {
      state.batterRig.expression = 'neutral';
      state.fielder1Animator.play(FIELDER_CLIPS.run, true);
      state.fielder2Animator.play(FIELDER_CLIPS.dive, true);
      state.fielder3Animator.play(FIELDER_CLIPS.run, true);
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
  if (state.isPortrait) return;
  const delta = Math.min(dt, 0.05);

  state.batterAnimator.update(delta);
  state.bowlerAnimator.update(delta);
  state.fielder1Animator.update(delta);
  state.fielder2Animator.update(delta);
  state.fielder3Animator.update(delta);

  state.batterAnimator.applyToRig(state.batterRig);
  state.bowlerAnimator.applyToRig(state.bowlerRig);
  state.fielder1Animator.applyToRig(state.fielder1Rig);
  state.fielder2Animator.applyToRig(state.fielder2Rig);
  state.fielder3Animator.applyToRig(state.fielder3Rig);

  // Smooth squash/stretch recovery
  state.squashX += (1.0 - state.squashX) * Math.min(1, 10 * delta);
  state.squashY += (1.0 - state.squashY) * Math.min(1, 10 * delta);

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
          state.squashX = 1.08; state.squashY = 0.92;
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

        // Secondary motion: Batter's head tracks the approaching delivery
        const dx = state.ball.x - state.batterRig.x;
        const dy = state.ball.y - (state.batterRig.y - 130);
        const targetHead = Math.max(-0.35, Math.min(0.25, Math.atan2(dy, dx)));
        state.batterRig.parts.head.angle += (targetHead - state.batterRig.parts.head.angle) * Math.min(1, 10 * delta);

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
          state.batterRig.expression = 'wince';
          state.bowlerRig.expression = 'smile';
          state.squashX = 0.92; state.squashY = 1.12;
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
