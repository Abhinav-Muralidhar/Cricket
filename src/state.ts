/**
 * state.ts - Game state machine, physics updates, ball flight, and swing timing evaluation.
 */

import { CONFIG } from './config.ts';
import { BATTER_CLIPS, BOWLER_CLIPS, FIELDER_CLIPS } from './poses.ts';
import { evaluateTiming, setupHitTrajectory } from './timing.ts';
import { playBatHit, playSwingMiss, playWicketsClatter, playGlassBreak, playCarAlarm, playBallDelivery, playGameOverSadJingle } from './audio.ts';
import type { GameState } from './types.ts';
import { triggerMilestoneIfCrossed, updateMilestone } from './milestone.ts';
import { createBallRng, selectDelivery, calculateBallSpeed, calculateEffectiveSweetSpot, logDeliveryDebug, DELIVERY_PROFILES } from './deliveries.ts';
import { isTouchDevice } from './pwa.ts';
import { isFirstGuideDone } from './settings.ts';
export { createRig, createBatterRig, createBowlerRig, createInitialState } from './state-init.ts';

export function triggerGameOver(state: GameState): void { state.state = 'GAME_OVER'; playGameOverSadJingle(); }

function stepBowledPhysics(state: GameState, delta: number): void {
  const groundY = CONFIG.street.groundY - state.ball.radius;
  if (state.ball.y < groundY || Math.abs(state.ball.vy) > 10) {
    state.ball.vy = (state.ball.vy || 0) + 980 * delta;
    state.ball.y = Math.min(groundY, state.ball.y + state.ball.vy * delta);
    state.ball.x += (state.ball.vx || 0) * delta;
    if (state.ball.y >= groundY) {
      state.ball.vy = Math.abs(state.ball.vy) < 25 ? 0 : -state.ball.vy * 0.35;
      state.ball.vx *= 0.75;
    }
  }
}

export function startNewDelivery(state: GameState): void {
  state.lastResult = null;
  const nextBallNum = state.ballCount + 1;
  const rng = createBallRng(state.gameSeed + nextBallNum * 314159265);
  const del = selectDelivery(nextBallNum, state.score, state.recentDeliveries, rng);
  state.currentDeliveryType = del;
  state.recentDeliveries.push(del);
  if (state.recentDeliveries.length > 5) state.recentDeliveries.shift();

  const rampedBase = Math.min(CONFIG.ball.maxSpeed, CONFIG.ball.baseSpeed + (nextBallNum - 1) * CONFIG.ball.speedIncrementPerBall);
  state.currentBallSpeed = calculateBallSpeed(rampedBase, del, rng);
  state.effectiveSweetSpotX = calculateEffectiveSweetSpot(state.currentBallSpeed, del, rng);
  logDeliveryDebug(del, state.currentBallSpeed, state.effectiveSweetSpotX);

  state.bowlerRig.x = CONFIG.layout.bowler.x + 25;
  state.bowlerPhase = 'RUN_UP'; state.bowlerTimer = 0; state.isBallReleased = false; state.isWaitingForBall = false;
  state.batterRig.expression = 'neutral'; state.bowlerRig.expression = 'neutral';
  [state.fielder1Rig, state.fielder2Rig, state.fielder3Rig].forEach((r) => (r.expression = 'neutral'));

  const bx = CONFIG.layout.bowler.x + CONFIG.ball.releaseOffsetX, by = CONFIG.layout.bowler.y + CONFIG.ball.releaseOffsetY;
  state.ball = { x: bx, y: by, vx: -state.currentBallSpeed, vy: 0, radius: CONFIG.ball.radius, active: false, bounced: false, arcProgress: 0, startPos: { x: bx, y: by }, trail: [] };
  state.isSwinging = false; state.hasSwungThisBall = false; state.resultTimer = 0; state.state = 'BOWLING';
  state.bowlerAnimator.play(BOWLER_CLIPS.runUp, true); state.batterAnimator.play(BATTER_CLIPS.idle);
  [state.fielder1Animator, state.fielder2Animator, state.fielder3Animator].forEach((a) => a.play(FIELDER_CLIPS.idle));
}

export function resetGame(state: GameState): void {
  state.score = 0; state.fours = 0; state.sixes = 0; state.lives = CONFIG.gameplay.initialLives; state.ballCount = 0;
  state.lastResult = null; state.previewClipName = null; state.milestonePopup = null; state.recentDeliveries = [];
  if (!isFirstGuideDone()) state.guideActive = true;
  startNewDelivery(state);
}

export function handlePlayerSwing(state: GameState): void {
  if (state.isPortrait || state.guideActive || state.settingsOpen || state.profileOpen || state.milestonePopup?.active) return;
  if (state.state === 'TITLE' || state.state === 'GAME_OVER') return;
  if (state.state === 'RESULT') {
    if (state.lives <= 0) {
      if (state.resultTimer >= 1.5) triggerGameOver(state);
    } else startNewDelivery(state);
    return;
  }
  if (state.state !== 'BOWLING' || !state.isBallReleased || state.hasSwungThisBall) return;

  state.hasSwungThisBall = true;
  state.isSwinging = true;
  state.batterAnimator.play(BATTER_CLIPS.swing, true);

  const offsetPx = state.ball.x - state.effectiveSweetSpotX;
  const result = evaluateTiming(offsetPx, state.currentBallSpeed, isTouchDevice());

  if (result.outcome !== 'MISS') {
    const isBig = result.outcome === 'SIX';
    const isMedium = result.outcome === 'FOUR' || result.outcome === 'THREE' || result.outcome === 'TWO';
    playBatHit(isBig ? 'PERFECT' : isMedium ? 'GOOD' : 'EDGED');
    state.lastResult = result;
    setupHitTrajectory(state.ball, result.outcome, result.timingRating);
    state.state = 'HIT';
    state.squashX = 1.18; state.squashY = 0.84;

    const isSad = isBig || isMedium || result.outcome === 'EDGE';
    state.batterRig.expression = isSad ? 'smile' : (result.outcome === 'SINGLE' || result.outcome === 'DOT') ? 'neutral' : 'shout';
    const fClip = isSad ? FIELDER_CLIPS.handsOnHead : (result.outcome === 'SINGLE' || result.outcome === 'DOT') ? FIELDER_CLIPS.run : FIELDER_CLIPS.idle;
    [state.fielder1Rig, state.fielder2Rig, state.fielder3Rig].forEach((r) => (r.expression = isSad ? 'sad' : 'neutral'));
    [state.fielder1Animator, state.fielder2Animator, state.fielder3Animator].forEach((a) => a.play(fClip, true));
  } else {
    playSwingMiss();
    state.lastResult = result;
  }
}

export function cycleBatterPreviewClip(state: GameState): void {
  const clips = [BATTER_CLIPS.idle, BATTER_CLIPS.backlift, BATTER_CLIPS.swing, BATTER_CLIPS.followThrough, BATTER_CLIPS.bowledReaction];
  const nextIdx = (clips.findIndex((c) => c.name === state.previewClipName) + 1) % clips.length;
  state.previewClipName = clips[nextIdx].name;
  state.batterAnimator.play(clips[nextIdx], true);
}

export function updateGame(state: GameState, dt: number): void {
  if (state.isPortrait || state.guideActive || state.settingsOpen || state.profileOpen) return;
  const delta = Math.min(dt, 0.05);

  if (state.milestonePopup?.active) {
    updateMilestone(state.milestonePopup, delta);
    return;
  }

  const rigs = [state.batterRig, state.bowlerRig, state.fielder1Rig, state.fielder2Rig, state.fielder3Rig];
  [state.batterAnimator, state.bowlerAnimator, state.fielder1Animator, state.fielder2Animator, state.fielder3Animator].forEach((a, i) => { a.update(delta); a.applyToRig(rigs[i]); });

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
          state.bowlerPhase = 'DELIVERY'; state.bowlerTimer = 0; state.bowlerAnimator.play(BOWLER_CLIPS.delivery, true);
        }
      } else if (state.bowlerPhase === 'DELIVERY' || state.bowlerPhase === 'RELEASED') {
        const releaseTime = CONFIG.use3DCharacters ? CONFIG.pitchReleaseTime : 0.22;
        if (!state.isBallReleased && (state.bowlerTimer >= releaseTime || state.bowlerPhase === 'RELEASED')) {
          state.isBallReleased = true; playBallDelivery(); state.ball.active = true;
          state.ball.startPos = { x: state.ball.x, y: state.ball.y };
        }
        if (state.bowlerPhase === 'DELIVERY' && state.bowlerAnimator.isFinished) {
          state.bowlerPhase = 'RELEASED'; state.bowlerAnimator.play(BOWLER_CLIPS.followThrough, true); state.squashX = 1.08; state.squashY = 0.92;
        }
      }

      if (state.isBallReleased) {
        state.ball.x += state.ball.vx * delta;
        (state.ball.trail ??= []).push({ x: state.ball.x, y: state.ball.y });
        if (state.ball.trail.length > 8) state.ball.trail.shift();

        const profile = DELIVERY_PROFILES[state.currentDeliveryType];
        const bounceX = profile.type === 'YORKER' ? CONFIG.delivery.yorkerBounceX : CONFIG.ball.bounceX;
        const releaseX = state.ball.startPos?.x ?? (CONFIG.layout.bowler.x + CONFIG.ball.releaseOffsetX);
        const releaseY = state.ball.startPos?.y ?? (CONFIG.layout.bowler.y + CONFIG.ball.releaseOffsetY);
        const batSweetY = CONFIG.layout.sweetSpot.y, batSweetX = CONFIG.layout.sweetSpot.x;

        if (profile.noBounce) {
          state.ball.y = releaseY + Math.max(0, Math.min(1, (releaseX - state.ball.x) / (releaseX - batSweetX))) * (batSweetY - releaseY);
        } else if (state.ball.x > bounceX) {
          state.ball.y = releaseY + Math.max(0, Math.min(1, (releaseX - state.ball.x) / (releaseX - bounceX))) * (CONFIG.ball.bounceY - state.ball.radius - releaseY);
        } else {
          state.ball.bounced = true;
          state.ball.y = (CONFIG.ball.bounceY - state.ball.radius) + Math.max(0, Math.min(1, (bounceX - state.ball.x) / (bounceX - batSweetX))) * (batSweetY - (CONFIG.ball.bounceY - state.ball.radius));
        }

        const dx = state.ball.x - state.batterRig.x, dy = state.ball.y - (state.batterRig.y - 130);
        const targetHead = Math.max(-0.35, Math.min(0.25, Math.atan2(dy, dx)));
        state.batterRig.parts.head.angle += (targetHead - state.batterRig.parts.head.angle) * Math.min(1, 10 * delta);

        const wicketTriggerX = CONFIG.layout.wicket.x + 12;
        if (state.ball.x <= wicketTriggerX) {
          playWicketsClatter();
          state.ballCount++; state.lives = Math.max(0, state.lives - 1);
          state.lastResult = {
            outcome: 'BOWLED', timingRating: state.hasSwungThisBall ? 'TOO_LATE' : 'NONE',
            timingOffsetPx: state.ball.x - state.effectiveSweetSpotX,
            timingOffsetMs: Math.round(((state.ball.x - state.effectiveSweetSpotX) / state.currentBallSpeed) * 1000),
            description: 'BOWLED! BALL LOST (-1)', runsScored: 0, livesLost: 1, isWindowBroken: false, isScooterHit: false,
          };
          state.ball.active = false; state.ball.vx = 45; state.ball.vy = -120;
          state.batterRig.expression = 'wince'; state.bowlerRig.expression = 'smile';
          state.squashX = 0.92; state.squashY = 1.12; state.state = 'RESULT';
          state.batterAnimator.play(BATTER_CLIPS.bowledReaction, true);
        }
      }
      break;
    }

    case 'HIT': {
      if (state.ball.target && state.ball.startPos) {
        state.ball.arcProgress = (state.ball.arcProgress || 0) + delta / CONFIG.gameplay.hitFlightDurationSec;
        const t = Math.min(1, state.ball.arcProgress);
        state.ball.x = state.ball.startPos.x + t * (state.ball.target.x - state.ball.startPos.x);
        const groundHits = ['FOUR', 'THREE', 'TWO', 'SINGLE', 'DOT', 'EDGE'];
        if (groundHits.includes(state.lastResult?.outcome || '')) {
          const groundY = CONFIG.street.groundY - state.ball.radius;
          if (t < 0.12) state.ball.y = state.ball.startPos.y + (t / 0.12) * (groundY - state.ball.startPos.y);
          else {
            const p = (t - 0.12) / 0.88, h = state.lastResult?.outcome === 'DOT' ? 15 : 60;
            state.ball.y = groundY - h * Math.exp(-2.8 * p) * Math.abs(Math.sin(p * Math.PI * 3.0));
          }
        } else {
          const peak = state.lastResult?.outcome === 'SIX' ? 340 : 120;
          state.ball.y = state.ball.startPos.y + t * (state.ball.target.y - state.ball.startPos.y) - 4 * peak * t * (1 - t);
        }
        (state.ball.trail ??= []).push({ x: state.ball.x, y: state.ball.y });
        if (state.ball.trail.length > 8) state.ball.trail.shift();
        if (t >= 1) {
          state.state = 'RESULT'; state.ballCount++;
          const prevScore = state.score;
          state.score += state.lastResult?.runsScored || 0;
          if (state.lastResult?.outcome === 'SIX') state.sixes++;
          else if (state.lastResult?.outcome === 'FOUR' || state.lastResult?.outcome === 'EDGE') state.fours++;
          state.lives = Math.max(0, state.lives - (state.lastResult?.livesLost || 0));
          triggerMilestoneIfCrossed(state, prevScore);
          const o = state.lastResult?.outcome;
          if (o === 'CAR_GLASS') { playGlassBreak(); playCarAlarm(); }
          else if (o === 'WINDOW') playGlassBreak();
        }
      }
      break;
    }

    case 'RESULT': {
      state.resultTimer += delta;
      if (state.lastResult?.outcome === 'BOWLED') stepBowledPhysics(state, delta);
      if (state.milestonePopup?.active) updateMilestone(state.milestonePopup, delta);
      const pause = state.lives <= 0 ? 1.85 : CONFIG.gameplay.resultPauseDurationSec;
      if (state.resultTimer >= pause && !state.milestonePopup?.active && (!state.isWaitingForBall || state.resultTimer >= pause + 1.5)) {
        if (state.lives <= 0) triggerGameOver(state);
        else startNewDelivery(state);
      }
      break;
    }
    case 'GAME_OVER': {
      if (state.lastResult?.outcome === 'BOWLED') {
        state.resultTimer += delta;
        stepBowledPhysics(state, delta);
      }
      break;
    }
    case 'TITLE': break;
  }
}
