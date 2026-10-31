/**
 * sky.ts - Atmospheric sky animations: drifting sunset clouds & flying birds.
 */

import { CONFIG } from './config.ts';

interface CloudPuff {
  dx: number;
  dy: number;
  rx: number;
  ry: number;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
  puffs: CloudPuff[];
}

interface Bird {
  x: number;
  baseY: number;
  vx: number;
  scale: number;
  flapSpeed: number;
  flapPhase: number;
  glideOffset: number;
  flockIndex: number;
}

function makeCloudPuffs(scale: number): CloudPuff[] {
  return [
    { dx: 0, dy: 0, rx: 32 * scale, ry: 20 * scale },
    { dx: -26 * scale, dy: 3 * scale, rx: 24 * scale, ry: 16 * scale },
    { dx: 26 * scale, dy: 2 * scale, rx: 25 * scale, ry: 17 * scale },
    { dx: -48 * scale, dy: 8 * scale, rx: 18 * scale, ry: 12 * scale },
    { dx: 48 * scale, dy: 7 * scale, rx: 19 * scale, ry: 13 * scale },
    { dx: 0, dy: 9 * scale, rx: 50 * scale, ry: 11 * scale },
  ];
}

const clouds: Cloud[] = [
  { x: 80, y: 35, speed: 5.5, scale: 0.75, opacity: 0.36, puffs: makeCloudPuffs(0.75) },
  { x: 500, y: 72, speed: 9.0, scale: 1.15, opacity: 0.48, puffs: makeCloudPuffs(1.15) },
  { x: 920, y: 44, speed: 6.5, scale: 0.85, opacity: 0.38, puffs: makeCloudPuffs(0.85) },
  { x: 1340, y: 80, speed: 11.0, scale: 1.30, opacity: 0.50, puffs: makeCloudPuffs(1.30) },
  { x: 1720, y: 56, speed: 8.0, scale: 0.95, opacity: 0.42, puffs: makeCloudPuffs(0.95) },
];

const birds: Bird[] = [
  // Coordinated V-formation flock
  { x: 420, baseY: 75, vx: 52, scale: 0.95, flapSpeed: 8.0, flapPhase: 0.0, glideOffset: 0.0, flockIndex: 0 },
  { x: 375, baseY: 58, vx: 52, scale: 0.85, flapSpeed: 8.2, flapPhase: 0.8, glideOffset: 0.6, flockIndex: 1 },
  { x: 365, baseY: 92, vx: 52, scale: 0.90, flapSpeed: 8.1, flapPhase: 1.5, glideOffset: 1.2, flockIndex: 2 },
  { x: 320, baseY: 46, vx: 52, scale: 0.80, flapSpeed: 8.4, flapPhase: 2.2, glideOffset: 1.8, flockIndex: 3 },
  { x: 310, baseY: 106, vx: 52, scale: 0.85, flapSpeed: 8.3, flapPhase: 2.9, glideOffset: 2.4, flockIndex: 4 },
  // Independent cruisers across high sky and lower wire/sun zone
  { x: 1050, baseY: 42, vx: 44, scale: 0.68, flapSpeed: 7.2, flapPhase: 0.5, glideOffset: 3.2, flockIndex: -1 },
  { x: 780, baseY: 135, vx: 60, scale: 1.00, flapSpeed: 8.6, flapPhase: 1.9, glideOffset: 4.1, flockIndex: -1 },
  { x: 220, baseY: 165, vx: 48, scale: 0.88, flapSpeed: 7.8, flapPhase: 2.5, glideOffset: 1.5, flockIndex: -1 },
];

let lastTime = 0;

function drawSingleCloud(ctx: CanvasRenderingContext2D, c: Cloud): void {
  ctx.save();
  ctx.translate(c.x, c.y);

  // 1. Warm apricot dusk under-shadow
  ctx.fillStyle = `rgba(225, 125, 100, ${(c.opacity * 0.45).toFixed(3)})`;
  ctx.beginPath();
  for (const p of c.puffs) {
    ctx.ellipse(p.dx, p.dy + 4 * c.scale, p.rx, p.ry, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // 2. Main soft glowing cream cloud body
  ctx.fillStyle = `rgba(255, 244, 230, ${c.opacity.toFixed(3)})`;
  ctx.beginPath();
  for (const p of c.puffs) {
    ctx.ellipse(p.dx, p.dy, p.rx, p.ry, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  // 3. Sunlit top crest highlight
  ctx.fillStyle = `rgba(255, 255, 245, ${(c.opacity * 0.40).toFixed(3)})`;
  ctx.beginPath();
  for (const p of c.puffs) {
    ctx.ellipse(p.dx, p.dy - 3 * c.scale, p.rx * 0.82, p.ry * 0.75, 0, 0, Math.PI * 2);
  }
  ctx.fill();

  ctx.restore();
}

function drawSingleBird(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  tipY: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(40, 28, 42, 0.82)';

  // Center body & head
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.4, 1.6, 0.08, 0, Math.PI * 2);
  ctx.arc(3.6, -0.4, 1.2, 0, Math.PI * 2);
  // Tail
  ctx.moveTo(-2.5, 0);
  ctx.lineTo(-6.5, 1.8);
  ctx.lineTo(-4.5, 0);
  ctx.fill();

  // Near (left) wing: root -> elbow -> tip -> trailing edge
  const elbowY = tipY * 0.65;
  const span = 13;
  ctx.beginPath();
  ctx.moveTo(0, -0.8);
  ctx.quadraticCurveTo(-2, elbowY - 2.5, -6, elbowY);
  ctx.quadraticCurveTo(-9, tipY - 1, -span, tipY);
  ctx.quadraticCurveTo(-6, elbowY + 2.2, 0, 0.8);
  ctx.fill();

  // Far (right) wing
  const farTipY = tipY * 0.85;
  const farElbowY = elbowY * 0.85;
  ctx.beginPath();
  ctx.moveTo(1.2, -0.8);
  ctx.quadraticCurveTo(3, farElbowY - 2, 6, farElbowY);
  ctx.quadraticCurveTo(9, farTipY - 1, span * 0.88, farTipY);
  ctx.quadraticCurveTo(6, farElbowY + 2.0, 1.2, 0.8);
  ctx.fill();

  ctx.restore();
}

export function drawSky(ctx: CanvasRenderingContext2D): void {
  const now = performance.now();
  if (lastTime === 0) lastTime = now;
  const rawDt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  const reducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dt = reducedMotion ? 0 : rawDt;

  // 1. Update and draw clouds
  for (const c of clouds) {
    c.x += c.speed * dt;
    if (c.x > CONFIG.world.width + 250) c.x = -250;
    drawSingleCloud(ctx, c);
  }

  // 2. Update and draw birds
  const timeSec = now * 0.001;
  for (const b of birds) {
    b.x += b.vx * dt;
    if (b.x > CONFIG.world.width + 160) {
      if (b.flockIndex >= 0) {
        b.x = -160 - b.flockIndex * 40;
      } else {
        b.x = -160 - Math.random() * 100;
        b.baseY = 35 + Math.random() * 135;
      }
    }

    // Glide vs Flap cycle (3.2s flap, 2.4s glide)
    const cycle = (timeSec + b.glideOffset) % 5.6;
    const isFlapping = cycle < 3.2;

    let tipY = -2.5;
    let bobY = 0;

    if (isFlapping && !reducedMotion) {
      const flap = Math.sin(timeSec * b.flapSpeed + b.flapPhase);
      tipY = flap * 7.5; // -7.5 = wings up, +7.5 = wings down
      bobY = Math.cos(timeSec * b.flapSpeed + b.flapPhase) * 1.6;
    } else {
      // Gentle glide: wings held slightly dihedral with subtle atmospheric bob
      tipY = -2.5 + Math.sin(timeSec * 2.0 + b.flapPhase) * 0.6;
      bobY = Math.sin(timeSec * 1.5 + b.flapPhase) * 0.8;
    }

    drawSingleBird(ctx, b.x, b.baseY + bobY, b.scale, tipY);
  }
}

