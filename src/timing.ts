/**
 * timing.ts - Swing timing evaluation and ball trajectory calculations.
 */

import { CONFIG } from './config.ts';
import type { DeliveryResult, TimingRating, OutcomeType, BallState } from './types.ts';

/** Evaluates hit outcome based on ball offset from sweet spot in pixels */
export function evaluateTiming(offsetPx: number, speed: number): DeliveryResult {
  const t = CONFIG.timing;
  const timingOffsetMs = Math.round((offsetPx / speed) * 1000);

  if (offsetPx >= t.windowMinOffset && offsetPx <= t.windowMaxOffset) {
    return {
      outcome: 'WINDOW',
      timingRating: 'TOO_EARLY',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: "AUNTY'S WINDOW! GAME OVER",
      runsScored: 0,
      livesLost: CONFIG.gameplay.initialLives,
      isWindowBroken: true,
      isScooterHit: false,
    };
  }
  if (offsetPx <= -t.scooterMinOffset && offsetPx >= -t.scooterMaxOffset) {
    const isCar = Math.abs(offsetPx) > (t.scooterMinOffset + t.scooterMaxOffset) / 2;
    return isCar
      ? {
          outcome: 'CAR_GLASS',
          timingRating: 'TOO_LATE',
          timingOffsetPx: offsetPx,
          timingOffsetMs,
          description: 'CAR WINDSHIELD CRACKED! -1 LIFE',
          runsScored: 0,
          livesLost: 1,
          isWindowBroken: false,
          isScooterHit: false,
          isCarGlassBroken: true,
        }
      : {
          outcome: 'SCOOTER',
          timingRating: 'TOO_LATE',
          timingOffsetPx: offsetPx,
          timingOffsetMs,
          description: 'ACTIVA SCOOTER DENT! -1 LIFE',
          runsScored: 0,
          livesLost: 1,
          isWindowBroken: false,
          isScooterHit: true,
          isCarGlassBroken: false,
        };
  }
  if (Math.abs(offsetPx) <= t.sixTolerance) {
    return {
      outcome: 'SIX',
      timingRating: 'PERFECT',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'SIX!',
      runsScored: 6,
      livesLost: 0,
      isWindowBroken: false,
      isScooterHit: false,
    };
  }
  if (
    (offsetPx > t.sixTolerance && offsetPx <= t.fourEarlyTolerance) ||
    (offsetPx < -t.sixTolerance && offsetPx >= -t.fourLateTolerance)
  ) {
    return {
      outcome: 'FOUR',
      timingRating: offsetPx > 0 ? 'GOOD_EARLY' : 'GOOD_LATE',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'FOUR!',
      runsScored: 4,
      livesLost: 0,
      isWindowBroken: false,
      isScooterHit: false,
    };
  }
  if (
    (offsetPx > t.fourEarlyTolerance && offsetPx <= t.singleEarlyTolerance) ||
    (offsetPx < -t.fourLateTolerance && offsetPx >= -t.singleLateTolerance)
  ) {
    return {
      outcome: 'SINGLE',
      timingRating: offsetPx > 0 ? 'EARLY' : 'LATE',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'SINGLE (+1)',
      runsScored: 1,
      livesLost: 0,
      isWindowBroken: false,
      isScooterHit: false,
    };
  }
  const rating: TimingRating = offsetPx > 0 ? 'TOO_EARLY' : 'TOO_LATE';
  return {
    outcome: 'MISS',
    timingRating: rating,
    timingOffsetPx: offsetPx,
    timingOffsetMs,
    description: 'MISSED!',
    runsScored: 0,
    livesLost: 0,
    isWindowBroken: false,
    isScooterHit: false,
  };
}

/** Configures ball target arc for various shot outcomes */
export function setupHitTrajectory(ball: BallState, outcome: OutcomeType): void {
  ball.startPos = { x: ball.x, y: ball.y };
  ball.arcProgress = 0;
  const l = CONFIG.layout;
  if (outcome === 'WINDOW') {
    ball.target = { x: l.window.x + l.window.width / 2, y: l.window.y + l.window.height / 2 };
  } else if (outcome === 'CAR_GLASS') {
    ball.target = { x: l.car.x + l.car.width / 2, y: l.car.y + 20 };
  } else if (outcome === 'SCOOTER') {
    ball.target = { x: l.scooter.x + l.scooter.width / 2, y: l.scooter.y + l.scooter.height / 2 };
  } else if (outcome === 'SIX') {
    ball.target = { x: CONFIG.world.width + 120, y: 120 };
  } else if (outcome === 'FOUR') {
    ball.target = { x: CONFIG.world.width + 90, y: CONFIG.street.groundY - 15 };
  } else if (outcome === 'SINGLE') {
    ball.target = { x: 740, y: CONFIG.street.groundY - 12 };
  }
}
