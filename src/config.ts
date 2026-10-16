/**
 * config.ts - All game tuning constants as a strictly typed configuration object.
 * Adjust these values to tweak game speed, difficulty, layout, and timing feel.
 */

export interface TimingWindowConfig {
  /** Maximum pixel distance from sweet spot for a PERFECT (SIX) shot */
  sixTolerance: number;
  /** Pixel distance range for a GOOD (FOUR) shot when swinging early */
  fourEarlyTolerance: number;
  /** Pixel distance range for a GOOD (FOUR) shot when swinging late */
  fourLateTolerance: number;
  /** Pixel distance range for a SLIGHTLY OFF (SINGLE) shot when swinging early */
  singleEarlyTolerance: number;
  /** Pixel distance range for a SLIGHTLY OFF (SINGLE) shot when swinging late */
  singleLateTolerance: number;
  /** Minimum early pixel offset that catches the edge and flies into Aunty's window */
  windowMinOffset: number;
  /** Maximum early pixel offset for Aunty's window (beyond this is a complete whiff) */
  windowMaxOffset: number;
  /** Minimum late pixel offset that glances off the bat into the Activa scooter */
  scooterMinOffset: number;
  /** Maximum late pixel offset for the Activa scooter (beyond this ball hits stumps) */
  scooterMaxOffset: number;
}

export interface GameConfig {
  canvas: {
    width: number;
    height: number;
  };
  street: {
    groundY: number;
    pitchStartX: number;
    pitchEndX: number;
  };
  layout: {
    wicket: { x: number; y: number; width: number; height: number };
    batter: { x: number; y: number };
    sweetSpot: { x: number; y: number };
    bowler: { x: number; y: number };
    building: { x: number; y: number; width: number; height: number };
    window: { x: number; y: number; width: number; height: number };
    scooter: { x: number; y: number; width: number; height: number };
  };
  ball: {
    radius: number;
    baseSpeed: number;           // Starting speed (pixels per second)
    speedIncrementPerBall: number; // Speed increase for each successive ball bowled
    maxSpeed: number;            // Upper speed cap
    releaseOffsetX: number;      // Bowler hand release offset
    releaseOffsetY: number;
    bounceX: number;             // X coordinate where the ball pitches
    bounceY: number;             // Y coordinate at bounce
  };
  timing: TimingWindowConfig;
  gameplay: {
    initialLives: number;
    swingDurationSec: number;       // Bat swing animation duration in seconds
    resultPauseDurationSec: number; // How long outcome text stays before next ball
    hitFlightDurationSec: number;   // Duration of ball flying after hit
  };
  colors: {
    bg: string;
    road: string;
    roadMarking: string;
    wicket: string;
    windowFrame: string;
    windowGlass: string;
    windowBroken: string;
    scooterBody: string;
    scooterAccent: string;
    ball: string;
    ballTape: string;
    batter: string;
    bat: string;
    bowler: string;
    textPrimary: string;
    textSecondary: string;
    debugWindow: string;
  };
}

export const CONFIG: GameConfig = {
  // Mobile-first portrait reference resolution
  canvas: {
    width: 720,
    height: 1280,
  },

  // Street pitch geometry
  street: {
    groundY: 960,
    pitchStartX: 100,
    pitchEndX: 640,
  },

  // Positions and bounding boxes of scene placeholders
  layout: {
    // Stumps behind the batter on the left
    wicket: {
      x: 120,
      y: 960,
      width: 26,
      height: 95,
    },
    // Batter standing position
    batter: {
      x: 185,
      y: 960,
    },
    // Ideal contact point (sweet spot) just in front of batter
    sweetSpot: {
      x: 240,
      y: 890,
    },
    // Bowler standing position on the right
    bowler: {
      x: 620,
      y: 960,
    },
    // Building at top-left
    building: {
      x: 30,
      y: 180,
      width: 250,
      height: 380,
    },
    // Window in top-left building labelled "window"
    window: {
      x: 80,
      y: 280,
      width: 140,
      height: 150,
    },
    // Activa scooter at bottom-right labelled "scooter"
    scooter: {
      x: 520,
      y: 990,
      width: 150,
      height: 90,
    },
  },

  // Ball physical parameters
  ball: {
    radius: 14,
    baseSpeed: 440,             // Pixels per second at ball 1
    speedIncrementPerBall: 22,  // Accelerates each ball to raise tension
    maxSpeed: 820,
    releaseOffsetX: -20,
    releaseOffsetY: -120,
    bounceX: 430,               // Where the ball pitches on the road
    bounceY: 960,
  },

  // Timing thresholds in pixels relative to the sweet spot (x = 240)
  // Ball travels right-to-left:
  // ball.x > sweetSpot.x means ball has NOT reached sweet spot yet (swung early)
  // ball.x < sweetSpot.x means ball passed the sweet spot (swung late)
  timing: {
    sixTolerance: 20,           // [-20px, +20px] around sweet spot = PERFECT SIX
    fourEarlyTolerance: 65,     // [+20px, +65px] = GOOD FOUR (early)
    fourLateTolerance: 55,      // [-20px, -55px] = GOOD FOUR (late)
    singleEarlyTolerance: 125,  // [+65px, +125px] = SINGLE (early)
    singleLateTolerance: 90,    // [-55px, -90px] = SINGLE (late)

    // Mistimed special zone: Aunty's window (very early top-edge slice)
    windowMinOffset: 125,       // [+125px, +190px] -> skies into window
    windowMaxOffset: 190,

    // Mistimed special zone: Activa scooter (late outside edge deflection)
    scooterMinOffset: 90,       // [-90px, -145px] -> deflects into parked scooter
    scooterMaxOffset: 145,
  },

  // General gameplay rules
  gameplay: {
    initialLives: 3,
    swingDurationSec: 0.22,
    resultPauseDurationSec: 1.4,
    hitFlightDurationSec: 1.1,
  },

  // Visual theme colors (clean high-contrast palette)
  colors: {
    bg: '#16191f',
    road: '#252932',
    roadMarking: '#3a404e',
    wicket: '#d4a373',
    windowFrame: '#e76f51',
    windowGlass: '#2a9d8f',
    windowBroken: '#e63946',
    scooterBody: '#457b9d',
    scooterAccent: '#f4a261',
    ball: '#e63946',
    ballTape: '#ffffff',
    batter: '#f1faee',
    bat: '#d4a373',
    bowler: '#a8dadc',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    debugWindow: '#00f5d4',
  },
};
