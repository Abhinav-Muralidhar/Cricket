/**
 * timing.ts - Swing timing evaluation and ball trajectory calculations.
 */

import { CONFIG } from './config.ts';
import type { DeliveryResult, TimingRating, OutcomeType, BallState } from './types.ts';

/** Evaluates hit outcome based on ball offset from sweet spot in pixels */
export function evaluateTiming(offsetPx: number, speed: number): DeliveryResult {
  const timingOffsetMs = Math.round((offsetPx / speed) * 1000);

  // 1. CAR_GLASS: Hit on late slash / outside edge when ball has passed sweet spot (-50px to -98px)
  if (offsetPx <= -50 && offsetPx >= -98) {
    return {
      outcome: 'CAR_GLASS',
      timingRating: 'TOO_LATE',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'CAR HIT! BALL LOST (-1)',
      runsScored: 0,
      livesLost: 1,
      isWindowBroken: false,
      isScooterHit: false,
      isCarGlassBroken: true,
    };
  }

  // 2. WINDOW: Hit on very early lofted shot (+180px to +240px)
  if (offsetPx >= 180 && offsetPx <= 240) {
    return {
      outcome: 'WINDOW',
      timingRating: 'TOO_EARLY',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'WINDOW SMASHED! BALL LOST (-1)',
      runsScored: 0,
      livesLost: 1,
      isWindowBroken: true,
      isScooterHit: false,
    };
  }

  // 3. AC_UNIT: Sliced high on early drive (+130px to +179px)
  if (offsetPx >= 130 && offsetPx < 180) {
    return {
      outcome: 'AC_UNIT',
      timingRating: 'TOO_EARLY',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'AC UNIT HIT! BALL LOST (-1)',
      runsScored: 0,
      livesLost: 1,
      isWindowBroken: false,
      isScooterHit: false,
      isAcHit: true,
    };
  }

  // 4. NEWSPAPER: Sliced pop-up / skier to balcony uncle (+75px to +129px)
  if (offsetPx >= 75 && offsetPx < 130) {
    return {
      outcome: 'NEWSPAPER',
      timingRating: 'EARLY',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'NEWSPAPER HIT! BALL LOST (-1)',
      runsScored: 0,
      livesLost: 1,
      isWindowBroken: false,
      isScooterHit: false,
      isNewspaperHit: true,
    };
  }

  // 5. Perfect timing: SIX (within ±22px of sweet spot)
  if (Math.abs(offsetPx) <= 22) {
    const isPull = offsetPx < 0;
    return {
      outcome: 'SIX',
      timingRating: 'PERFECT',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: isPull ? 'PULL SHOT (MAXIMUM 6!)' : 'LOFTED ON-DRIVE (6 RUNS!)',
      runsScored: 6,
      livesLost: 0,
      isWindowBroken: false,
      isScooterHit: false,
    };
  }

  // 6. Good timing: FOUR
  if ((offsetPx > 22 && offsetPx < 75) || (offsetPx < -22 && offsetPx >= -38)) {
    const isCover = offsetPx > 0;
    return {
      outcome: 'FOUR',
      timingRating: isCover ? 'GOOD_EARLY' : 'GOOD_LATE',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: isCover ? 'COVER DRIVE (FOUR!)' : 'SQUARE CUT (FOUR!)',
      runsScored: 4,
      livesLost: 0,
      isWindowBroken: false,
      isScooterHit: false,
    };
  }

  // 7. Decent timing: SINGLE (-38px to -49px)
  if (offsetPx < -38 && offsetPx > -50) {
    return {
      outcome: 'SINGLE',
      timingRating: 'LATE',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'GLANCE TO THIRD MAN (+1)',
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
export function setupHitTrajectory(ball: BallState, outcome: OutcomeType, timingRating?: TimingRating): void {
  ball.startPos = { x: ball.x, y: ball.y };
  ball.arcProgress = 0;
  const l = CONFIG.layout;
  if (outcome === 'WINDOW') {
    ball.target = { x: l.window.x + l.window.width / 2, y: l.window.y + l.window.height / 2 };
  } else if (outcome === 'AC_UNIT') {
    ball.target = { x: l.acUnit.x + l.acUnit.width / 2, y: l.acUnit.y + l.acUnit.height / 2 };
  } else if (outcome === 'NEWSPAPER') {
    ball.target = { x: l.newspaper.x + l.newspaper.width / 2, y: l.newspaper.y + l.newspaper.height / 2 };
  } else if (outcome === 'CAR_GLASS') {
    ball.target = { x: l.car.x + 194, y: l.car.y - 37 };
  } else if (outcome === 'SCOOTER') {
    ball.target = { x: l.scooter.x + l.scooter.width / 2, y: l.scooter.y + l.scooter.height / 2 };
  } else if (outcome === 'SIX') {
    const targetY = timingRating === 'PERFECT' ? 100 : 140;
    ball.target = { x: CONFIG.world.width + 150, y: targetY };
  } else if (outcome === 'FOUR') {
    const targetX = timingRating === 'GOOD_EARLY' ? CONFIG.world.width + 120 : CONFIG.world.width + 80;
    ball.target = { x: targetX, y: CONFIG.street.groundY - 14 };
  } else if (outcome === 'SINGLE') {
    const targetX = timingRating === 'EARLY' ? 780 : 640;
    ball.target = { x: targetX, y: CONFIG.street.groundY - 12 };
  }
}

