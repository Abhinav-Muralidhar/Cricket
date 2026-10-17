/**
 * config.ts - Game tuning constants, extended Indian street palette, and 1600x800 world layout.
 */

export const PALETTE = {
  // Sky & atmosphere
  skyTop: '#F76B5C',
  skyBottom: '#FFB26B',
  skyGlow: '#FFE29A',
  cloud: 'rgba(255, 230, 205, 0.45)',

  // Street & Ground
  asphalt: '#3B3F4A',
  asphaltDark: '#2C3039',
  asphaltLight: '#4B505D',
  roadLines: '#E8DCC0',
  kerbYellow: '#F2C14E',
  kerbBlack: '#1E1E24',
  shadow: 'rgba(0, 0, 0, 0.22)',

  // Buildings (Varied Indian lane colors + trims)
  buildingA: '#F2C14E',       // Aunty's signature warm yellow
  buildingATrim: '#C98F2B',
  buildingB: '#4A7FB5',       // Cool blue
  buildingBTrim: '#2F5580',
  peach: '#E9A27B',           // Soft peach terracotta
  peachTrim: '#C87850',
  mint: '#8FC1A9',            // Mint green
  mintTrim: '#5A947A',
  fadedPink: '#D98FA0',       // Dusty pink
  pinkTrim: '#B46476',
  buildingCream: '#EBD9B0',   // Sandstone cream
  creamTrim: '#C6B282',
  brick: '#A85C4A',           // Exposed red brick
  brickTrim: '#7B3828',

  // Distant skyline (2 shades lighter than buildings)
  distantSkyline: '#7D98B2',
  distantSkylineTrim: '#68829B',

  // Foliage & Nature
  leafGreen: '#4D7C52',
  leafGreenDark: '#335837',
  treeBark: '#543D2B',

  // Accents & Props
  ball: '#D62828',
  wicketWood: '#8B5E3C',
  outlines: '#1E1E24',
  cream: '#F5E9CF',
  plasticBlue: '#2563EB',
} as const;

export type Palette = typeof PALETTE;

export interface TimingWindowConfig {
  sixTolerance: number;
  fourEarlyTolerance: number;
  fourLateTolerance: number;
  singleEarlyTolerance: number;
  singleLateTolerance: number;
  windowMinOffset: number;
  windowMaxOffset: number;
  scooterMinOffset: number;
  scooterMaxOffset: number;
}

export interface GameConfig {
  world: {
    width: number;
    height: number;
    minVisibleWidth: number;
    maxVisibleWidth: number;
    actionCenterX: number;
  };
  bg: {
    src: string;
    scale: number;
    offsetY: number;
  };
  drawCodeVehicles: boolean;
  street: {
    buildingsY: number;
    footpathY: number;
    kerbY: number;
    streetY: number;
    groundY: number;
  };
  layout: {
    skyline: { y: number };
    buildingA: { x: number; y: number; width: number; height: number };
    window: { x: number; y: number; width: number; height: number };
    car: { x: number; y: number; width: number; height: number };
    scooter: { x: number; y: number; width: number; height: number };
    electricPole: { x: number; y: number; width: number; height: number };
    wicket: { x: number; y: number; width: number; height: number };
    cricketBag: { x: number; y: number };
    strayDog: { x: number; y: number };
    thela: { x: number; y: number; width: number; height: number };
    cow: { x: number; y: number; width: number; height: number };
    tree: { x: number; y: number };
    batter: { x: number; y: number };
    bowler: { x: number; y: number };
    fielder1: { x: number; y: number };
    fielder2: { x: number; y: number };
    fielder3: { x: number; y: number };
    sweetSpot: { x: number; y: number };
  };
  ball: {
    radius: number;
    baseSpeed: number;
    speedIncrementPerBall: number;
    maxSpeed: number;
    releaseOffsetX: number;
    releaseOffsetY: number;
    bounceX: number;
    bounceY: number;
  };
  timing: TimingWindowConfig;
  gameplay: {
    initialLives: number;
    swingDurationSec: number;
    resultPauseDurationSec: number;
    hitFlightDurationSec: number;
  };
  colors: {
    bg: string;
    road: string;
    roadMarking: string;
    wicket: string;
    ball: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export const CONFIG: GameConfig = {
  world: {
    width: 1600,
    height: 800,
    minVisibleWidth: 1080,
    maxVisibleWidth: 1600,
    actionCenterX: 800,
  },
  bg: {
    src: '/bg.png',
    scale: 1.0,
    offsetY: -70,
  },
  drawCodeVehicles: false,
  street: {
    buildingsY: 110,
    footpathY: 496,
    kerbY: 536,
    streetY: 544,
    groundY: 660,
  },
  layout: {
    skyline: { y: 155 },
    // Aunty's building on batter's leg side, visually distinct and hittable
    buildingA: { x: 340, y: 110, width: 290, height: 386 },
    window: { x: 88, y: 221, width: 143, height: 132 },
    // Parked hatchback & Activa made larger
    car: { x: 750, y: 565, width: 285, height: 115 },
    scooter: { x: 1130, y: 625, width: 140, height: 100 },
    electricPole: { x: 645, y: 40, width: 16, height: 504 }, // Between building A & B
    tree: { x: 1400, y: 70 },
    thela: { x: 180, y: 640, width: 120, height: 80 },
    cow: { x: 1340, y: 580, width: 130, height: 95 },
    wicket: { x: 520, y: 660, width: 28, height: 90 },
    cricketBag: { x: 440, y: 660 },
    strayDog: { x: 730, y: 695 },
    batter: { x: 480, y: 660 },
    bowler: { x: 1060, y: 660 },
    fielder1: { x: 720, y: 720 },
    fielder2: { x: 840, y: 610 },
    fielder3: { x: 1240, y: 690 },
    sweetSpot: { x: 600, y: 600 },
  },
  ball: {
    radius: 14,
    baseSpeed: 520,
    speedIncrementPerBall: 25,
    maxSpeed: 950,
    releaseOffsetX: -20,
    releaseOffsetY: -120,
    bounceX: 830,
    bounceY: 660,
  },
  timing: {
    sixTolerance: 24,
    fourEarlyTolerance: 75,
    fourLateTolerance: 65,
    singleEarlyTolerance: 145,
    singleLateTolerance: 110,
    windowMinOffset: 145,
    windowMaxOffset: 220,
    scooterMinOffset: 110,
    scooterMaxOffset: 180,
  },
  gameplay: {
    initialLives: 3,
    swingDurationSec: 0.22,
    resultPauseDurationSec: 1.4,
    hitFlightDurationSec: 1.1,
  },
  colors: {
    bg: PALETTE.skyBottom,
    road: PALETTE.asphalt,
    roadMarking: PALETTE.roadLines,
    wicket: PALETTE.wicketWood,
    ball: PALETTE.ball,
    textPrimary: '#ffffff',
    textSecondary: PALETTE.cream,
  },
};
