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
  buildingA: '#F2C14E', buildingATrim: '#C98F2B',
  buildingB: '#4A7FB5', buildingBTrim: '#2F5580',
  peach: '#E9A27B', peachTrim: '#C87850',
  mint: '#8FC1A9', mintTrim: '#5A947A',
  fadedPink: '#D98FA0', pinkTrim: '#B46476',
  buildingCream: '#EBD9B0', creamTrim: '#C6B282',
  brick: '#A85C4A', brickTrim: '#7B3828',

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
    acUnit: { x: number; y: number; width: number; height: number };
    newspaper: { x: number; y: number; width: number; height: number };
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
  use3DCharacters: boolean;
  outline3D: boolean;
  pitchReleaseTime: number;
  swingStartOffset: number;
  swingTimeScale: number;
  batOffset: { x: number; y: number; z: number };
  batRotation: { x: number; y: number; z: number };
  batScale: { x: number; y: number; z: number };
  characters3D: Record<string, { yaw: number; scale: number; isLeftHanded?: boolean }>;
  colors3D: { batter: string; bowler: string; fielder1: string; fielder2: string; fielder3: string };
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
    buildingA: { x: 340, y: 110, width: 290, height: 386 },
    window: { x: 1070, y: 110, width: 100, height: 110 },
    acUnit: { x: 1045, y: 285, width: 58, height: 46 },
    newspaper: { x: 630, y: 275, width: 55, height: 50 },
    car: { x: 1380, y: 580, width: 165, height: 50 },
    scooter: { x: 10, y: 580, width: 140, height: 110 },
    electricPole: { x: 645, y: 40, width: 16, height: 504 },
    tree: { x: 1400, y: 70 },
    thela: { x: 180, y: 640, width: 120, height: 80 },
    cow: { x: 1340, y: 580, width: 130, height: 95 },
    wicket: { x: 280, y: 690, width: 28, height: 90 },
    cricketBag: { x: 220, y: 690 },
    strayDog: { x: 730, y: 720 },
    batter: { x: 410, y: 690 },
    bowler: { x: 1280, y: 690 },
    fielder1: { x: 680, y: 735 },
    fielder2: { x: 860, y: 665 },
    fielder3: { x: 1260, y: 710 },
    sweetSpot: { x: 410, y: 606 },
  },
  ball: {
    radius: 7,
    baseSpeed: 640,
    speedIncrementPerBall: 30,
    maxSpeed: 1050,
    releaseOffsetX: -20,
    releaseOffsetY: -120,
    bounceX: 750,
    bounceY: 690,
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
  use3DCharacters: true,
  outline3D: true,
  pitchReleaseTime: 0.35,
  swingStartOffset: 0.85,
  swingTimeScale: 2.2,
  batOffset: { x: -0.5, y: 7.5, z: 1.2 },
  batRotation: { x: -0.2, y: 1.2, z: 0.0 },
  batScale: { x: 1, y: 1, z: 1 },
  characters3D: {
    batter: { yaw: Math.PI / 2, scale: 1.0, isLeftHanded: false },
    bowler: { yaw: -Math.PI / 2, scale: 1.0 },
    fielder1: { yaw: -Math.PI * 0.60, scale: 0.85 },
    fielder2: { yaw: -Math.PI * 0.45, scale: 0.85 },
    fielder3: { yaw: -Math.PI * 0.55, scale: 0.85 },
  },
  colors3D: {
    batter: '#3B6FD6', bowler: '#EAB308', fielder1: '#0D9488', fielder2: '#F97316', fielder3: '#881337',
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
