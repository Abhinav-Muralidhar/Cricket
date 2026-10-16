/**
 * config.ts - Game tuning constants, palette, and 1600x800 landscape world layout.
 * Strictly typed configuration with no magic values.
 */

export const PALETTE = {
  skyTop: '#F76B5C',
  skyBottom: '#FFB26B',
  asphalt: '#3B3F4A',
  roadLines: '#E8DCC0',
  buildingA: '#F2C14E',
  buildingATrim: '#C98F2B',
  buildingB: '#4A7FB5',
  buildingBTrim: '#2F5580',
  ball: '#D62828',
  wicketWood: '#8B5E3C',
  outlines: '#1E1E24',
  cream: '#F5E9CF',
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
    buildingB: { x: number; y: number; width: number; height: number };
    window: { x: number; y: number; width: number; height: number };
    electricPole: { x: number; y: number; width: number; height: number };
    wicket: { x: number; y: number; width: number; height: number };
    cricketBag: { x: number; y: number };
    strayDog: { x: number; y: number };
    car: { x: number; y: number; width: number; height: number };
    scooter: { x: number; y: number; width: number; height: number };
    batter: { x: number; y: number };
    bowler: { x: number; y: number };
    fielder1: { x: number; y: number };
    fielder2: { x: number; y: number };
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
  // 1600 x 800 landscape logical world units
  world: {
    width: 1600,
    height: 800,
    minVisibleWidth: 900,
    maxVisibleWidth: 1600,
    actionCenterX: 800,
  },
  // Vertical composition: sky 0-20%, buildings 15-62%, footpath 62-68%, street 68-100%
  street: {
    buildingsY: 120,
    footpathY: 496,
    kerbY: 536,
    streetY: 544,
    groundY: 660,
  },
  // Centered in middle ~900 units of world [350 .. 1250]
  layout: {
    skyline: { y: 150 },
    buildingA: { x: 320, y: 130, width: 340, height: 366 },
    buildingB: { x: 680, y: 100, width: 440, height: 396 },
    window: { x: 420, y: 200, width: 120, height: 130 },
    electricPole: { x: 345, y: 50, width: 18, height: 490 },
    wicket: { x: 490, y: 660, width: 28, height: 90 },
    cricketBag: { x: 440, y: 660 },
    strayDog: { x: 740, y: 700 },
    car: { x: 810, y: 615, width: 150, height: 75 },
    scooter: { x: 1140, y: 665, width: 130, height: 85 },
    batter: { x: 560, y: 660 },
    bowler: { x: 1060, y: 660 },
    fielder1: { x: 960, y: 660 },
    fielder2: { x: 730, y: 660 },
    sweetSpot: { x: 620, y: 600 },
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
    windowFrame: PALETTE.buildingATrim,
    windowGlass: PALETTE.buildingB,
    windowBroken: PALETTE.ball,
    scooterBody: PALETTE.buildingB,
    scooterAccent: PALETTE.buildingA,
    ball: PALETTE.ball,
    ballTape: PALETTE.roadLines,
    batter: PALETTE.roadLines,
    bat: PALETTE.wicketWood,
    bowler: PALETTE.buildingA,
    textPrimary: '#ffffff',
    textSecondary: PALETTE.roadLines,
    debugWindow: '#00f5d4',
  },
};
