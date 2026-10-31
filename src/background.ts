/**
 * background.ts - Loads and renders static background with "cover" scaling,
 * anchored to bottom-centre of visible window, cropping top and sides as needed.
 */

import { CONFIG, PALETTE } from './config.ts';
import { drawParkedCar, drawParkedScooter } from './scene-street.ts';
import { drawSky } from './sky.ts';
import type { CameraViewport } from './render.ts';

let bgImage: HTMLImageElement | null = null;
let wiresImage: HTMLImageElement | null = null;
let isLoaded = false;

export function isBackgroundLoaded(): boolean {
  return isLoaded;
}

export function loadBackgroundImage(onLoad?: () => void): void {
  if (bgImage) return;
  bgImage = new Image();
  bgImage.src = '/bg.jpg';
  bgImage.onload = () => {
    isLoaded = true;
    if (onLoad) onLoad();
  };

  wiresImage = new Image();
  wiresImage.src = '/wires.png';
}

export function getBgTransform(cam: CameraViewport): { drawX: number; drawY: number; drawW: number; drawH: number; coverScale: number } {
  const imgW = bgImage?.naturalWidth || 1456;
  const imgH = bgImage?.naturalHeight || 720;
  const visW = cam.visibleWorldWidth;
  const visH = CONFIG.world.height; // 800

  // "cover" scaling guarantees zero black or empty bands on any aspect ratio or device
  const coverScale = Math.max(visW / imgW, visH / imgH);
  const drawW = imgW * coverScale;
  const drawH = imgH * coverScale;

  const centerX = cam.worldLeft + visW / 2;
  const drawX = centerX - drawW / 2;
  const drawY = visH - drawH;

  return { drawX, drawY, drawW, drawH, coverScale };
}

export function updateResponsiveLayout(cam: CameraViewport): void {
  const { drawX, drawY, coverScale } = getBgTransform(cam);
  const toW = (ix: number, iy: number) => ({ x: drawX + ix * coverScale, y: drawY + iy * coverScale });

  // 1. Red building open window (man on phone)
  const win = toW(970, 100);
  CONFIG.layout.window.x = win.x;
  CONFIG.layout.window.y = win.y;
  CONFIG.layout.window.width = 90 * coverScale;
  CONFIG.layout.window.height = 100 * coverScale;

  // 2. AC compressor unit below red building
  const ac = toW(945, 255);
  CONFIG.layout.acUnit.x = ac.x;
  CONFIG.layout.acUnit.y = ac.y;
  CONFIG.layout.acUnit.width = 55 * coverScale;
  CONFIG.layout.acUnit.height = 45 * coverScale;

  // 3. Uncle's newspaper on balcony
  const news = toW(580, 295);
  CONFIG.layout.newspaper.x = news.x;
  CONFIG.layout.newspaper.y = news.y;
  CONFIG.layout.newspaper.width = 56 * coverScale;
  CONFIG.layout.newspaper.height = 48 * coverScale;

  // 4. Parked car bounds in world coordinates
  const car = toW(1260, 475);
  CONFIG.layout.car.x = car.x;
  CONFIG.layout.car.y = car.y;
  CONFIG.layout.car.width = 196 * coverScale;
  CONFIG.layout.car.height = 185 * coverScale;
}

const SKYLINE_PTS: [number, number][] = [
  [1456, 74], [1400, 74], [1320, 75], [1280, 85], [1200, 70], [1160, 54],
  [1140, 20], [950, 20], // Tall Red building roof
  [920, 62], [880, 74], [800, 86], [720, 104], [640, 112], [600, 83], // Blue & Green buildings
  [560, 185], [520, 168], [480, 185], // Distant house balcony
  [440, 289], [360, 300], [320, 286], // Open sun valley under wires
  [280, 57], [240, 123], [200, 92], [160, 84], [120, 44], [80, 34], [40, 15], [0, 35], // Yellow building
];

function clipToSky(ctx: CanvasRenderingContext2D, toW: (ix: number, iy: number) => { x: number; y: number }): void {
  ctx.beginPath();
  const p0 = toW(0, 0); ctx.moveTo(p0.x, p0.y);
  const pTR = toW(1456, 0); ctx.lineTo(pTR.x, pTR.y);
  for (const [ix, iy] of SKYLINE_PTS) {
    const p = toW(ix, iy);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.clip();
}

export function drawBackground(ctx: CanvasRenderingContext2D, cam: CameraViewport): void {
  if (!isLoaded || !bgImage || !bgImage.naturalWidth || !bgImage.naturalHeight) {
    ctx.save();
    ctx.fillStyle = '#1E1E24';
    ctx.fillRect(cam.worldLeft, 0, cam.visibleWorldWidth, CONFIG.world.height);
    ctx.fillStyle = PALETTE.cream;
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading...', cam.worldLeft + cam.visibleWorldWidth / 2, CONFIG.world.height / 2);
    ctx.restore();
    return;
  }

  const { drawX, drawY, drawW, drawH, coverScale } = getBgTransform(cam);
  updateResponsiveLayout(cam);
  const toW = (ix: number, iy: number) => ({ x: drawX + ix * coverScale, y: drawY + iy * coverScale });

  ctx.save();

  // 1. Full original hand-painted background (100% intact, zero missing pixels)
  ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);

  // 2. Animated clouds & birds in the sky (clipped to pass BEHIND the buildings)
  ctx.save();
  clipToSky(ctx, toW);
  drawSky(ctx);
  ctx.restore();

  // 3. Wires overlay on top of sky elements (so clouds & birds pass BEHIND the wires)
  if (wiresImage && wiresImage.complete && wiresImage.naturalWidth) {
    ctx.drawImage(wiresImage, drawX, drawY, drawW, drawH);
  }

  // 4. Parked vehicles (if enabled)
  if (CONFIG.drawCodeVehicles) {
    drawParkedCar(ctx, CONFIG.layout.car.x, CONFIG.layout.car.y);
    drawParkedScooter(ctx, CONFIG.layout.scooter.x, CONFIG.layout.scooter.y);
  }
  ctx.restore();
}
