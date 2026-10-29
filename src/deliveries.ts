/**
 * deliveries.ts - Delivery profiles, per-ball speed jitter, moving sweet-spot calculations,
 * and adaptive delivery selection logic.
 */

import { CONFIG } from './config.ts';

export type Delivery = 'NORMAL' | 'FULL_TOSS' | 'YORKER' | 'SLOWER';

export interface DeliveryProfile {
  type: Delivery;
  speedMultiplier: number;
  noBounce: boolean;
  bounceX: number;
  sweetSpotShift: number;
  label: string;
}

export const DELIVERY_PROFILES: Record<Delivery, DeliveryProfile> = {
  NORMAL: {
    type: 'NORMAL',
    speedMultiplier: 1.0,
    noBounce: false,
    bounceX: 750,
    sweetSpotShift: 0,
    label: 'NORMAL',
  },
  FULL_TOSS: {
    type: 'FULL_TOSS',
    speedMultiplier: 1.05,
    noBounce: true,
    bounceX: 750,
    sweetSpotShift: 50,
    label: 'FULL TOSS',
  },
  YORKER: {
    type: 'YORKER',
    speedMultiplier: 1.15,
    noBounce: false,
    bounceX: 480,
    sweetSpotShift: -45,
    label: 'YORKER',
  },
  SLOWER: {
    type: 'SLOWER',
    speedMultiplier: 0.7,
    noBounce: false,
    bounceX: 750,
    sweetSpotShift: 0,
    label: 'SLOW',
  },
};

/** Mulberry32 PRNG seeded once per ball */
export function createBallRng(seed: number): () => number {
  let s = (seed | 0) + 0x6d2b79f5;
  return function (): number {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

/** Delivery selection: NORMAL for balls 1-4. From ball 5, chance rises up to 50% max */
export function selectDelivery(
  ballCount: number,
  score: number,
  recentDeliveries: Delivery[],
  rng: () => number
): Delivery {
  if (ballCount <= 4) return 'NORMAL';

  const ballsFacedFactor = (ballCount - 4) * 0.03;
  const scoreFactor = score * 0.005;
  const specialChance = Math.min(CONFIG.delivery.specialMaxChance, ballsFacedFactor + scoreFactor);

  if (rng() >= specialChance) return 'NORMAL';

  const allSpecials: Delivery[] = ['FULL_TOSS', 'YORKER', 'SLOWER'];
  const len = recentDeliveries.length;
  let excluded: Delivery | null = null;
  if (len >= 2 && recentDeliveries[len - 1] === recentDeliveries[len - 2] && recentDeliveries[len - 1] !== 'NORMAL') {
    excluded = recentDeliveries[len - 1];
  }

  const eligible = excluded ? allSpecials.filter((s) => s !== excluded) : allSpecials;
  const idx = Math.floor(rng() * eligible.length);
  return eligible[idx];
}

/** Ball speed = rampedBaseSpeed * type.speedMultiplier * (1 + r) */
export function calculateBallSpeed(rampedBaseSpeed: number, type: Delivery, rng: () => number): number {
  const profile = DELIVERY_PROFILES[type];
  const r = (rng() * 2 - 1) * CONFIG.delivery.speedJitter;
  const rawSpeed = rampedBaseSpeed * profile.speedMultiplier * (1 + r);
  return Math.min(CONFIG.ball.maxSpeed, rawSpeed);
}

/** effectiveSweetSpotX = base sweetSpot.x + type.sweetSpotShift + speedShift + positionJitter */
export function calculateEffectiveSweetSpot(ballSpeed: number, type: Delivery, rng: () => number): number {
  const profile = DELIVERY_PROFILES[type];
  const refSpeed = CONFIG.delivery.refSpeed;
  const speedShift = ((ballSpeed - refSpeed) / refSpeed) * CONFIG.delivery.speedShiftPx;
  const positionJitter = (rng() * 2 - 1) * CONFIG.delivery.positionJitterPx;
  return CONFIG.layout.sweetSpot.x + profile.sweetSpotShift + speedShift + positionJitter;
}

/** Formats delivery label and speed indicator for Assist tag */
export function getAssistTagText(type: Delivery, speed: number): string {
  const profile = DELIVERY_PROFILES[type];
  const refSpeed = CONFIG.delivery.refSpeed;
  let speedText = '';
  if (speed > refSpeed * 1.10) {
    speedText = ' • FAST';
  } else if (speed < refSpeed * 0.90) {
    speedText = ' • SLOW';
  }
  return `${profile.label}${speedText}`;
}

/** Debug logger (localhost only, once per ball) */
export function logDeliveryDebug(type: Delivery, speed: number, effectiveSweetSpotX: number): void {
  if (typeof window === 'undefined') return;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    console.log(`[delivery] ${type}, ${speed.toFixed(1)}, ${effectiveSweetSpotX.toFixed(1)}`);
  }
}

