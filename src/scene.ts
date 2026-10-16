/**
 * scene.ts - Vector scene orchestration for Gully Cricket.
 * Backdrops (sky, sun glow, clouds, distant temple skyline, neem tree, electric pole)
 * and assembly of the pre-rendered static scene canvas.
 */

import { CONFIG, PALETTE } from './config.ts';
import { drawBuildingRow } from './scene-buildings.ts';
import {
  drawFootpathAndKerb,
  drawAsphaltSurface,
  drawParkedCar,
  drawParkedScooter,
  drawThela,
  drawCow,
  drawWicketsAndBag,
} from './scene-street.ts';

/** Seeded PRNG for deterministic clutter and scene variations */
export function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawSkyAndBackdrop(ctx: CanvasRenderingContext2D): void {
  const w = CONFIG.world.width;
  const h = CONFIG.street.footpathY;

  // 1. Warm evening sunset gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(0.7, PALETTE.skyBottom);
  grad.addColorStop(1, PALETTE.skyGlow);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 2. Low sun glow near horizon
  ctx.fillStyle = 'rgba(255, 226, 154, 0.40)';
  ctx.beginPath();
  ctx.arc(880, 140, 75, 0, Math.PI * 2);
  ctx.fill();

  // 3. Soft flat stylized clouds
  ctx.fillStyle = PALETTE.cloud;
  const drawCloud = (cx: number, cy: number, cw: number) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, 16, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - cw * 0.35, cy + 3, cw * 0.45, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + cw * 0.3, cy + 2, cw * 0.4, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  drawCloud(320, 55, 65);
  drawCloud(820, 40, 85);
  drawCloud(1310, 60, 55);
}

export function drawDistantSkyline(ctx: CanvasRenderingContext2D): void {
  const y = CONFIG.layout.skyline.y;
  ctx.save();
  ctx.fillStyle = PALETTE.distantSkyline;
  ctx.strokeStyle = PALETTE.distantSkylineTrim;
  ctx.lineWidth = 1.5;

  for (let sx = 20; sx < 1600; sx += 180) {
    const bh = 55 + ((sx * 37) % 45);
    ctx.fillRect(sx, y - bh, 100, bh);
    ctx.strokeRect(sx, y - bh, 100, bh);
    // Water tank
    ctx.fillRect(sx + 20, y - bh - 16, 25, 16);
    // Antenna
    ctx.beginPath();
    ctx.moveTo(sx + 65, y - bh); ctx.lineTo(sx + 65, y - bh - 24); ctx.stroke();
  }

  // Traditional temple spire (shikhara + kalash + flag)
  const tx = 580;
  const ty = y - 65;
  ctx.fillStyle = PALETTE.distantSkyline;
  ctx.beginPath();
  ctx.moveTo(tx - 22, ty); ctx.lineTo(tx, ty - 60); ctx.lineTo(tx + 22, ty); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Kalash + flag
  ctx.fillRect(tx - 3, ty - 68, 6, 8);
  ctx.fillStyle = PALETTE.ball;
  ctx.beginPath(); ctx.moveTo(tx, ty - 68); ctx.lineTo(tx + 16, ty - 63); ctx.lineTo(tx, ty - 58); ctx.fill();

  ctx.restore();
}

export function drawNeemTree(ctx: CanvasRenderingContext2D): void {
  const l = CONFIG.layout;
  ctx.save();
  // Trunk overhanging the far right wall
  ctx.fillStyle = PALETTE.treeBark;
  ctx.fillRect(l.tree.x + 80, l.tree.y + 110, 32, 280);
  ctx.strokeStyle = PALETTE.outlines; ctx.lineWidth = 2;
  ctx.strokeRect(l.tree.x + 80, l.tree.y + 110, 32, 280);

  // Large leafy canopy lobes overhanging wall
  const drawLobe = (cx: number, cy: number, r: number, col: string) => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  };
  drawLobe(l.tree.x + 70, l.tree.y + 80, 52, PALETTE.leafGreenDark);
  drawLobe(l.tree.x + 120, l.tree.y + 60, 60, PALETTE.leafGreen);
  drawLobe(l.tree.x + 40, l.tree.y + 110, 48, PALETTE.leafGreen);
  drawLobe(l.tree.x + 100, l.tree.y + 120, 56, PALETTE.leafGreenDark);
  drawLobe(l.tree.x + 160, l.tree.y + 95, 46, PALETTE.leafGreen);
  ctx.restore();
}

export function drawElectricPoleAndWires(ctx: CanvasRenderingContext2D): void {
  const p = CONFIG.layout.electricPole;
  ctx.save();
  // Pole strictly in the alley gap between building A & B
  ctx.fillStyle = PALETTE.asphalt;
  ctx.fillRect(p.x, p.y, p.width, p.height);
  ctx.strokeStyle = PALETTE.outlines; ctx.lineWidth = 2;
  ctx.strokeRect(p.x, p.y, p.width, p.height);
  // Crossbars
  ctx.fillRect(p.x - 32, p.y + 40, 80, 9);
  ctx.strokeRect(p.x - 32, p.y + 40, 80, 9);
  ctx.fillRect(p.x - 24, p.y + 85, 64, 8);
  ctx.strokeRect(p.x - 24, p.y + 85, 64, 8);
  // Insulators
  ctx.fillStyle = PALETTE.roadLines;
  for (const ix of [p.x - 28, p.x + 40]) ctx.fillRect(ix, p.y + 30, 7, 10);
  for (const ix of [p.x - 20, p.x + 32]) ctx.fillRect(ix, p.y + 76, 6, 9);

  // Wires spanning with realistic catenary sag across the full 1600 width
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  // Wire 1
  ctx.moveTo(0, 70); ctx.quadraticCurveTo(p.x * 0.45, 140, p.x, p.y + 42);
  ctx.quadraticCurveTo(p.x + (1600 - p.x) * 0.5, 160, 1600, 90);
  // Wire 2
  ctx.moveTo(0, 115); ctx.quadraticCurveTo(p.x * 0.5, 185, p.x, p.y + 87);
  ctx.quadraticCurveTo(p.x + (1600 - p.x) * 0.45, 195, 1600, 140);
  // Wire 3
  ctx.moveTo(p.x, p.y + 42); ctx.quadraticCurveTo(1050, 185, 1600, 165);
  ctx.stroke();
  ctx.restore();
}

/** Pre-renders the complete static street backdrop once to an offscreen canvas */
export function createStaticSceneCanvas(): HTMLCanvasElement {
  const offscreen = document.createElement('canvas');
  offscreen.width = CONFIG.world.width;
  offscreen.height = CONFIG.world.height;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return offscreen;

  const l = CONFIG.layout;

  // 1. Sky, clouds, sunset glow & distant temple skyline
  drawSkyAndBackdrop(ctx);
  drawDistantSkyline(ctx);

  // 2. Continuous row of 7 diverse buildings & shops
  drawBuildingRow(ctx);

  // 3. Overhanging neem tree & utility pole between buildings
  drawNeemTree(ctx);
  drawElectricPoleAndWires(ctx);

  // 4. Ground band: Footpath, black/yellow kerb & asphalt details
  drawFootpathAndKerb(ctx);
  drawAsphaltSurface(ctx);

  // 5. Street clutter & props with soft shadows
  drawParkedCar(ctx, l.car.x, l.car.y);
  drawParkedScooter(ctx, l.scooter.x, l.scooter.y);
  drawThela(ctx, l.thela.x, l.thela.y);
  drawCow(ctx, l.cow.x, l.cow.y);
  drawWicketsAndBag(ctx);

  return offscreen;
}
