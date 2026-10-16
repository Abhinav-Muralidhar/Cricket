/**
 * state.ts - Game state machine, transitions, physics updates and timing evaluations.
 */

import { CONFIG } from './config.ts';
import type {
  GameState,
  DeliveryResult,
  OutcomeType,
  TimingRating,
  CharacterRig,
  BallState,
} from './types.ts';

/**
 * Creates the initial rig structure for the batter.
 * Bat rotation pivots from the hands and swings through an arc.
 */
export function createBatterRig(x: number, y: number): CharacterRig {
  return {
    x,
    y,
    parts: {
      torso: {
        pivotX: 0,
        pivotY: -70,
        width: 24,
        height: 50,
        angle: 0,
        color: CONFIG.colors.batter,
      },
      head: {
        pivotX: 0,
        pivotY: -105,
        width: 22,
        height: 22,
        angle: 0,
        color: CONFIG.colors.batter,
      },
      legs: {
        pivotX: 0,
        pivotY: -20,
        width: 14,
        height: 40,
        angle: 0,
        color: CONFIG.colors.batter,
      },
      arms: {
        pivotX: 10,
        pivotY: -60,
        width: 10,
        height: 30,
        angle: -0.3, // Ready batting stance
        color: CONFIG.colors.batter,
      },
      bat: {
        pivotX: 15,
        pivotY: -45,
        width: 10,
        height: 65,
        angle: -0.4, // Held back ready to strike
        color: CONFIG.colors.bat,
      },
    },
  };
}

/**
 * Creates the initial rig structure for the bowler.
 */
export function createBowlerRig(x: number, y: number): CharacterRig {
  return {
    x,
    y,
    parts: {
      torso: {
        pivotX: 0,
        pivotY: -70,
        width: 22,
        height: 52,
        angle: 0.1,
        color: CONFIG.colors.bowler,
      },
      head: {
        pivotX: 0,
        pivotY: -105,
        width: 22,
        height: 22,
        angle: 0,
        color: CONFIG.colors.bowler,
      },
      legs: {
        pivotX: 0,
        pivotY: -20,
        width: 14,
        height: 40,
        angle: -0.1,
        color: CONFIG.colors.bowler,
      },
      bowlingArm: {
        pivotX: -10,
        pivotY: -75,
        width: 8,
        height: 38,
        angle: -1.2, // Release position
        color: CONFIG.colors.bowler,
      },
    },
  };
}

/**
 * Creates a fresh tape ball instance at the bowler release position.
 */
function createBallAtRelease(): BallState {
  return {
    x: CONFIG.layout.bowler.x + CONFIG.ball.releaseOffsetX,
    y: CONFIG.layout.bowler.y + CONFIG.ball.releaseOffsetY,
    vx: -CONFIG.ball.baseSpeed,
    vy: 0,
    radius: CONFIG.ball.radius,
    active: true,
    bounced: false,
    arcProgress: 0,
  };
}

/**
 * Initializes the entire game state.
 */
export function createInitialState(): GameState {
  return {
    state: 'TITLE',
    score: 0,
    lives: CONFIG.gameplay.initialLives,
    ballCount: 0,
    currentBallSpeed: CONFIG.ball.baseSpeed,
    ball: createBallAtRelease(),
    lastResult: null,
    batterRig: createBatterRig(CONFIG.layout.batter.x, CONFIG.layout.batter.y),
    bowlerRig: createBowlerRig(CONFIG.layout.bowler.x, CONFIG.layout.bowler.y),
    swingProgress: 0,
    isSwinging: false,
    hasSwungThisBall: false,
    resultTimer: 0,
    debugMode: false,
  };
}

/**
 * Starts a new ball delivery, ramping up speed each time.
 */
export function startNewDelivery(state: GameState): void {
  state.ballCount++;
  // Each ball gets slightly faster up to maximum configured speed
  state.currentBallSpeed = Math.min(
    CONFIG.ball.maxSpeed,
    CONFIG.ball.baseSpeed + (state.ballCount - 1) * CONFIG.ball.speedIncrementPerBall
  );

  state.ball = {
    x: CONFIG.layout.bowler.x + CONFIG.ball.releaseOffsetX,
    y: CONFIG.layout.bowler.y + CONFIG.ball.releaseOffsetY,
    vx: -state.currentBallSpeed,
    vy: 0,
    radius: CONFIG.ball.radius,
    active: true,
    bounced: false,
    arcProgress: 0,
    startPos: {
      x: CONFIG.layout.bowler.x + CONFIG.ball.releaseOffsetX,
      y: CONFIG.layout.bowler.y + CONFIG.ball.releaseOffsetY,
    },
  };

  state.isSwinging = false;
  state.swingProgress = 0;
  state.hasSwungThisBall = false;
  state.resultTimer = 0;
  state.state = 'BOWLING';

  // Reset batter stance
  state.batterRig.parts.arms.angle = -0.3;
  state.batterRig.parts.bat.angle = -0.4;
  // Reset bowler arm
  state.bowlerRig.parts.bowlingArm.angle = 0.5;
}

/**
 * Resets the entire match to fresh game state.
 */
export function resetGame(state: GameState): void {
  state.score = 0;
  state.lives = CONFIG.gameplay.initialLives;
  state.ballCount = 0;
  state.lastResult = null;
  startNewDelivery(state);
}

/**
 * Evaluates the timing offset and maps it to the corresponding game outcome.
 *
 * @param offsetPx Pixel distance from sweet spot (ball.x - sweetSpot.x)
 *                 positive = swung before ball reached sweet spot (EARLY)
 *                 negative = swung after ball passed sweet spot (LATE)
 * @param speed Current ball velocity in px/s
 */
export function evaluateTiming(offsetPx: number, speed: number): DeliveryResult {
  const t = CONFIG.timing;
  const timingOffsetMs = Math.round((offsetPx / speed) * 1000);

  // 1. Check Aunty's Window (Very Early Slice)
  if (offsetPx >= t.windowMinOffset && offsetPx <= t.windowMaxOffset) {
    return {
      outcome: 'WINDOW',
      timingRating: 'TOO_EARLY',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: "AUNTY'S WINDOW! Instant Game Over!",
      runsScored: 0,
      livesLost: CONFIG.gameplay.initialLives, // Ends game immediately
      isWindowBroken: true,
      isScooterHit: false,
    };
  }

  // 2. Check Activa Scooter (Late Outside Edge)
  if (offsetPx <= -t.scooterMinOffset && offsetPx >= -t.scooterMaxOffset) {
    return {
      outcome: 'SCOOTER',
      timingRating: 'TOO_LATE',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'ACTIVA SCOOTER DENT! Lost a life!',
      runsScored: 0,
      livesLost: 1,
      isWindowBroken: false,
      isScooterHit: true,
    };
  }

  // 3. PERFECT: SIX (Center of the sweet spot)
  if (Math.abs(offsetPx) <= t.sixTolerance) {
    return {
      outcome: 'SIX',
      timingRating: 'PERFECT',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'PERFECT! MASSIVE SIX! (+6)',
      runsScored: 6,
      livesLost: 0,
      isWindowBroken: false,
      isScooterHit: false,
    };
  }

  // 4. GOOD: FOUR
  if (offsetPx > t.sixTolerance && offsetPx <= t.fourEarlyTolerance) {
    return {
      outcome: 'FOUR',
      timingRating: 'GOOD_EARLY',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'GOOD TIMING! BOUNDARY FOUR! (+4)',
      runsScored: 4,
      livesLost: 0,
      isWindowBroken: false,
      isScooterHit: false,
    };
  }
  if (offsetPx < -t.sixTolerance && offsetPx >= -t.fourLateTolerance) {
    return {
      outcome: 'FOUR',
      timingRating: 'GOOD_LATE',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'LATE CUT! BOUNDARY FOUR! (+4)',
      runsScored: 4,
      livesLost: 0,
      isWindowBroken: false,
      isScooterHit: false,
    };
  }

  // 5. SLIGHTLY OFF: SINGLE
  if (offsetPx > t.fourEarlyTolerance && offsetPx <= t.singleEarlyTolerance) {
    return {
      outcome: 'SINGLE',
      timingRating: 'EARLY',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'SLIGHTLY EARLY! Quick Single (+1)',
      runsScored: 1,
      livesLost: 0,
      isWindowBroken: false,
      isScooterHit: false,
    };
  }
  if (offsetPx < -t.fourLateTolerance && offsetPx >= -t.singleLateTolerance) {
    return {
      outcome: 'SINGLE',
      timingRating: 'LATE',
      timingOffsetPx: offsetPx,
      timingOffsetMs,
      description: 'SLIGHTLY LATE! Pushed for a Single (+1)',
      runsScored: 1,
      livesLost: 0,
      isWindowBroken: false,
      isScooterHit: false,
    };
  }

  // 6. Complete whiff / Miss
  const rating: TimingRating = offsetPx > 0 ? 'TOO_EARLY' : 'TOO_LATE';
  return {
    outcome: 'MISS',
    timingRating: rating,
    timingOffsetPx: offsetPx,
    timingOffsetMs,
    description: rating === 'TOO_EARLY' ? 'SWUNG TOO EARLY! Whiffed!' : 'SWUNG TOO LATE! Missed!',
    runsScored: 0,
    livesLost: 0, // Ball continues to wicket to potentially bowl
    isWindowBroken: false,
    isScooterHit: false,
  };
}

/**
 * Sets up the ball flight trajectory according to hit outcome.
 */
function setupHitTrajectory(ball: BallState, outcome: OutcomeType): void {
  ball.startPos = { x: ball.x, y: ball.y };
  ball.arcProgress = 0;

  switch (outcome) {
    case 'WINDOW':
      // Flies directly toward Aunty's window at top-left
      ball.target = {
        x: CONFIG.layout.window.x + CONFIG.layout.window.width / 2,
        y: CONFIG.layout.window.y + CONFIG.layout.window.height / 2,
      };
      break;

    case 'SCOOTER':
      // Deflects low and backwards toward the scooter at bottom-right
      ball.target = {
        x: CONFIG.layout.scooter.x + CONFIG.layout.scooter.width / 2,
        y: CONFIG.layout.scooter.y + CONFIG.layout.scooter.height / 2,
      };
      break;

    case 'SIX':
      // Flies high over the bowler into the distance
      ball.target = { x: CONFIG.canvas.width + 120, y: 140 };
      break;

    case 'FOUR':
      // Driven low and fast along the road past the bowler
      ball.target = { x: CONFIG.canvas.width + 90, y: CONFIG.street.groundY - 15 };
      break;

    case 'SINGLE':
      // Soft nudge that stops in the middle of the pitch
      ball.target = { x: 420, y: CONFIG.street.groundY - 12 };
      break;

    default:
      ball.target = { x: ball.x, y: ball.y };
      break;
  }
}

/**
 * Handles swing input from the player (tap / space).
 */
export function handlePlayerSwing(state: GameState): void {
  if (state.state === 'TITLE' || state.state === 'GAME_OVER') {
    resetGame(state);
    return;
  }

  if (state.state === 'RESULT') {
    // Fast forward to next ball if clicked during result screen
    if (state.lives <= 0 || (state.lastResult && state.lastResult.isWindowBroken)) {
      state.state = 'GAME_OVER';
    } else {
      startNewDelivery(state);
    }
    return;
  }

  if (state.state !== 'BOWLING' || state.hasSwungThisBall) {
    return;
  }

  // Trigger swing animation
  state.hasSwungThisBall = true;
  state.isSwinging = true;
  state.swingProgress = 0;

  // Calculate distance from sweet spot
  const offsetPx = state.ball.x - CONFIG.layout.sweetSpot.x;
  const result = evaluateTiming(offsetPx, state.currentBallSpeed);

  if (result.outcome !== 'MISS') {
    // Ball successfully contacted the bat!
    state.lastResult = result;
    state.score += result.runsScored;
    state.lives -= result.livesLost;
    setupHitTrajectory(state.ball, result.outcome);
    state.state = 'HIT';
  } else {
    // Swing and miss! Batter whiffed, ball continues toward wicket.
    state.lastResult = result;
  }
}

/**
 * Advances the game simulation by delta time `dt` (in seconds).
 * Frame-rate independent physics and state progression.
 */
export function updateGame(state: GameState, dt: number): void {
  // Cap large delta times (e.g. tab switching) to prevent tunneling
  const delta = Math.min(dt, 0.05);

  // 1. Update Batter swing animation
  if (state.isSwinging) {
    state.swingProgress += delta / CONFIG.gameplay.swingDurationSec;
    const p = Math.min(1, state.swingProgress);

    // Bat rotates from -0.4 rad (cocked back) through contact (+0.3 rad) to follow-through (+1.6 rad)
    const batAngle = -0.4 + p * 2.0;
    const armAngle = -0.3 + p * 1.8;
    state.batterRig.parts.bat.angle = batAngle;
    state.batterRig.parts.arms.angle = armAngle;

    if (state.swingProgress >= 1) {
      state.isSwinging = false;
    }
  }

  // 2. State-specific logic
  switch (state.state) {
    case 'BOWLING': {
      // Animate bowler release arm
      if (state.bowlerRig.parts.bowlingArm.angle > -1.2) {
        state.bowlerRig.parts.bowlingArm.angle -= delta * 8;
      }

      // Ball moves along bowling trajectory toward the batter
      state.ball.x += state.ball.vx * delta;

      // Vertical trajectory: bowler release -> pitch bounce -> sweet spot height
      const releaseX = CONFIG.layout.bowler.x + CONFIG.ball.releaseOffsetX;
      const bounceX = CONFIG.ball.bounceX;
      const sweetX = CONFIG.layout.sweetSpot.x;

      if (state.ball.x > bounceX) {
        // Pre-bounce: descends toward road
        const t = (releaseX - state.ball.x) / (releaseX - bounceX);
        const startY = CONFIG.layout.bowler.y + CONFIG.ball.releaseOffsetY;
        const groundY = CONFIG.ball.bounceY - state.ball.radius;
        state.ball.y = startY + t * (groundY - startY);
      } else {
        // Post-bounce: rises up toward waist height at sweet spot
        state.ball.bounced = true;
        const t = (bounceX - state.ball.x) / (bounceX - sweetX);
        const groundY = CONFIG.ball.bounceY - state.ball.radius;
        const sweetY = CONFIG.layout.sweetSpot.y;
        state.ball.y = groundY + t * (sweetY - groundY);
      }

      // Check if ball crashed into the stumps on the left
      const wicketRightEdge = CONFIG.layout.wicket.x + CONFIG.layout.wicket.width;
      if (state.ball.x <= wicketRightEdge) {
        // Bowler has hit the wicket!
        state.lives = Math.max(0, state.lives - 1);
        state.lastResult = {
          outcome: 'BOWLED',
          timingRating: state.hasSwungThisBall ? 'TOO_LATE' : 'NONE',
          timingOffsetPx: state.ball.x - CONFIG.layout.sweetSpot.x,
          timingOffsetMs: Math.round(((state.ball.x - CONFIG.layout.sweetSpot.x) / state.currentBallSpeed) * 1000),
          description: state.hasSwungThisBall ? 'MISSED! CLEAN BOWLED! (-1 Life)' : 'BOWLED! Did not swing! (-1 Life)',
          runsScored: 0,
          livesLost: 1,
          isWindowBroken: false,
          isScooterHit: false,
        };
        state.ball.active = false;
        state.state = 'RESULT';
      }
      break;
    }

    case 'HIT': {
      // Move ball along parabolic hit trajectory
      if (state.ball.target && state.ball.startPos) {
        state.ball.arcProgress = (state.ball.arcProgress || 0) + delta / CONFIG.gameplay.hitFlightDurationSec;
        const t = Math.min(1, state.ball.arcProgress);

        // Linear interpolation for X
        state.ball.x = state.ball.startPos.x + t * (state.ball.target.x - state.ball.startPos.x);

        // Parabolic arc for Y
        const startY = state.ball.startPos.y;
        const endY = state.ball.target.y;
        const peakHeight = state.lastResult?.outcome === 'SIX' ? 320 : 60;
        const arc = 4 * peakHeight * t * (1 - t);
        state.ball.y = startY + t * (endY - startY) - arc;

        if (t >= 1) {
          // Trajectory finished, proceed to result display
          state.state = 'RESULT';
        }
      }
      break;
    }

    case 'RESULT': {
      state.resultTimer += delta;
      if (state.resultTimer >= CONFIG.gameplay.resultPauseDurationSec) {
        if (state.lives <= 0 || (state.lastResult && state.lastResult.isWindowBroken)) {
          state.state = 'GAME_OVER';
        } else {
          startNewDelivery(state);
        }
      }
      break;
    }

    case 'TITLE':
    case 'GAME_OVER':
      // Awaiting user tap to start
      break;
  }
}
