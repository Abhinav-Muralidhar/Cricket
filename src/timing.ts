/**
 * timing.ts - Swing timing evaluation and ball trajectory calculations.
 */

import { CONFIG } from './config.ts';
import type { DeliveryResult, TimingRating, OutcomeType, BallState } from './types.ts';

export function computeTimingWindows(speed: number, isTouch = false) {
  const t = CONFIG.timing;
  const speedScale = Math.max(t.minScale, speed / CONFIG.delivery.refSpeed);
  const touchMul = isTouch ? t.touchForgiveness : 1.0;
  const scale = speedScale * touchMul;

  return {
    scale,
    sixTol: t.sixTolerance * scale,
    fourEarlyTol: t.fourEarlyTolerance * scale,
    fourLateTol: t.fourLateTolerance * scale,
    threeEarlyTol: t.threeEarlyTolerance * scale,
    threeLateTol: t.threeLateTolerance * scale,
    twoEarlyTol: t.twoEarlyTolerance * scale,
    twoLateTol: t.twoLateTolerance * scale,
    singleEarlyTol: t.singleEarlyTolerance * scale,
    singleLateTol: t.singleLateTolerance * scale,
    dotEarlyTol: t.dotEarlyTolerance * scale,
    dotLateTol: t.dotLateTolerance * scale,
    edgeLateMin: t.edgeLateMinOffset * scale,
    edgeLateMax: t.edgeLateMaxOffset * scale,
    carGlassMin: t.carGlassMinOffset,
    carGlassMax: t.carGlassMaxOffset,
    newsMin: t.newspaperMinOffset,
    newsMax: t.newspaperMaxOffset,
    acMin: t.acUnitMinOffset,
    acMax: t.acUnitMaxOffset,
    winMin: t.windowMinOffset,
    winMax: t.windowMaxOffset,
  };
}

/** Evaluates hit outcome based on ball offset from effective sweet spot in pixels */
export function evaluateTiming(offsetPx: number, speed: number, isTouch = false): DeliveryResult {
  const timingOffsetMs = Math.round((offsetPx / speed) * 1000);
  const w = computeTimingWindows(speed, isTouch);

  // 1. CAR_GLASS: Hit on late slash / outside edge (-58px to -98px)
  if (offsetPx <= -w.carGlassMin && offsetPx >= -w.carGlassMax) {
    return { outcome: 'CAR_GLASS', timingRating: 'TOO_LATE', timingOffsetPx: offsetPx, timingOffsetMs,
      description: 'CAR HIT! BALL LOST (-1)', runsScored: 0, livesLost: 1, isWindowBroken: false, isScooterHit: false, isCarGlassBroken: true };
  }

  // 2. WINDOW: Very early lofted shot (+180px to +240px)
  if (offsetPx >= w.winMin && offsetPx <= w.winMax) {
    return { outcome: 'WINDOW', timingRating: 'TOO_EARLY', timingOffsetPx: offsetPx, timingOffsetMs,
      description: 'WINDOW SMASHED! BALL LOST (-1)', runsScored: 0, livesLost: 1, isWindowBroken: true, isScooterHit: false };
  }

  // 3. AC_UNIT: Sliced high on early drive (+130px to +180px)
  if (offsetPx >= w.acMin && offsetPx < w.acMax) {
    return { outcome: 'AC_UNIT', timingRating: 'TOO_EARLY', timingOffsetPx: offsetPx, timingOffsetMs,
      description: 'AC UNIT HIT! BALL LOST (-1)', runsScored: 0, livesLost: 1, isWindowBroken: false, isScooterHit: false, isAcHit: true };
  }

  // 4. NEWSPAPER: Sliced pop-up to uncle (+75px to +130px)
  if (offsetPx >= w.newsMin && offsetPx < w.newsMax) {
    return { outcome: 'NEWSPAPER', timingRating: 'EARLY', timingOffsetPx: offsetPx, timingOffsetMs,
      description: 'NEWSPAPER HIT! BALL LOST (-1)', runsScored: 0, livesLost: 1, isWindowBroken: false, isScooterHit: false, isNewspaperHit: true };
  }

  // 5. Perfect timing: SIX (within ±12px scaled)
  if (Math.abs(offsetPx) <= w.sixTol) {
    const isPull = offsetPx < 0;
    return { outcome: 'SIX', timingRating: 'PERFECT', timingOffsetPx: offsetPx, timingOffsetMs,
      description: isPull ? 'PULL SHOT (MAXIMUM 6!)' : 'LOFTED ON-DRIVE (6 RUNS!)', runsScored: 6, livesLost: 0, isWindowBroken: false, isScooterHit: false };
  }

  // 6. Good timing: FOUR
  if ((offsetPx > w.sixTol && offsetPx <= w.fourEarlyTol) || (offsetPx < -w.sixTol && offsetPx >= -w.fourLateTol)) {
    const isCover = offsetPx > 0;
    return { outcome: 'FOUR', timingRating: isCover ? 'GOOD_EARLY' : 'GOOD_LATE', timingOffsetPx: offsetPx, timingOffsetMs,
      description: isCover ? 'COVER DRIVE (FOUR!)' : 'SQUARE CUT (FOUR!)', runsScored: 4, livesLost: 0, isWindowBroken: false, isScooterHit: false };
  }

  // 7. THREE: Between four and two
  if ((offsetPx > w.fourEarlyTol && offsetPx <= w.threeEarlyTol) || (offsetPx < -w.fourLateTol && offsetPx >= -w.threeLateTol)) {
    return { outcome: 'THREE', timingRating: offsetPx > 0 ? 'GOOD_EARLY' : 'GOOD_LATE', timingOffsetPx: offsetPx, timingOffsetMs,
      description: 'CRACKING DRIVE (3 RUNS!)', runsScored: 3, livesLost: 0, isWindowBroken: false, isScooterHit: false };
  }

  // 8. TWO: Between three and single
  if ((offsetPx > w.threeEarlyTol && offsetPx <= w.twoEarlyTol) || (offsetPx < -w.threeLateTol && offsetPx >= -w.twoLateTol)) {
    return { outcome: 'TWO', timingRating: offsetPx > 0 ? 'EARLY' : 'LATE', timingOffsetPx: offsetPx, timingOffsetMs,
      description: 'WORKED INTO THE GAP (2 RUNS!)', runsScored: 2, livesLost: 0, isWindowBroken: false, isScooterHit: false };
  }

  // 9. SINGLE
  if ((offsetPx > w.twoEarlyTol && offsetPx <= w.singleEarlyTol) || (offsetPx < -w.twoLateTol && offsetPx >= -w.singleLateTol)) {
    return { outcome: 'SINGLE', timingRating: offsetPx > 0 ? 'EARLY' : 'LATE', timingOffsetPx: offsetPx, timingOffsetMs,
      description: 'QUICK SINGLE (+1)', runsScored: 1, livesLost: 0, isWindowBroken: false, isScooterHit: false };
  }

  // 10. DOT: Block (0 runs, no life lost)
  if ((offsetPx > w.singleEarlyTol && offsetPx <= w.dotEarlyTol) || (offsetPx < -w.singleLateTol && offsetPx >= -w.dotLateTol)) {
    return { outcome: 'DOT', timingRating: offsetPx > 0 ? 'EARLY' : 'LATE', timingOffsetPx: offsetPx, timingOffsetMs,
      description: 'SOLID DEFENCE (0 RUNS)', runsScored: 0, livesLost: 0, isWindowBroken: false, isScooterHit: false };
  }

  // 11. EDGE: Lucky four off mistimed slash (narrow band before car glass)
  if (offsetPx < -w.dotLateTol && offsetPx >= -w.edgeLateMax) {
    return { outcome: 'EDGE', timingRating: 'TOO_LATE', timingOffsetPx: offsetPx, timingOffsetMs,
      description: 'LUCKY EDGE TO THIRD MAN (4 RUNS!)', runsScored: 4, livesLost: 0, isWindowBroken: false, isScooterHit: false };
  }

  const rating: TimingRating = offsetPx > 0 ? 'TOO_EARLY' : 'TOO_LATE';
  return { outcome: 'MISS', timingRating: rating, timingOffsetPx: offsetPx, timingOffsetMs,
    description: 'MISSED!', runsScored: 0, livesLost: 0, isWindowBroken: false, isScooterHit: false };
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
    ball.target = { x: l.car.x + l.car.width * 0.12, y: l.car.y + l.car.height * 0.16 };
  } else if (outcome === 'SCOOTER') {
    ball.target = { x: l.scooter.x + l.scooter.width / 2, y: l.scooter.y + l.scooter.height / 2 };
  } else if (outcome === 'SIX') {
    const targetY = timingRating === 'PERFECT' ? 100 : 140;
    ball.target = { x: CONFIG.world.width + 150, y: targetY };
  } else if (outcome === 'FOUR' || outcome === 'EDGE') {
    const targetX = timingRating === 'GOOD_EARLY' ? CONFIG.world.width + 120 : CONFIG.world.width + 80;
    ball.target = { x: targetX, y: CONFIG.street.groundY - 14 };
  } else if (outcome === 'THREE') {
    ball.target = { x: 1040, y: CONFIG.street.groundY - 14 };
  } else if (outcome === 'TWO') {
    ball.target = { x: 880, y: CONFIG.street.groundY - 13 };
  } else if (outcome === 'SINGLE') {
    const targetX = timingRating === 'EARLY' ? 780 : 640;
    ball.target = { x: targetX, y: CONFIG.street.groundY - 12 };
  } else if (outcome === 'DOT') {
    ball.target = { x: 470, y: CONFIG.street.groundY - 10 };
  }
}
