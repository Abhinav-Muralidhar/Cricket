/**
 * background.ts - Loads and renders static background with "cover" scaling,
 * anchored to bottom-centre of visible window, cropping top and sides as needed.
 */

import { CONFIG, PALETTE } from './config.ts';
import { drawParkedCar, drawParkedScooter } from './scene-street.ts';
import type { CameraViewport } from './render.ts';

let bgImage: HTMLImageElement | null = null;
let isLoaded = false;

export function isBackgroundLoaded(): boolean {
  return isLoaded;
}

export function loadBackgroundImage(onLoad?: () => void): void {
  if (bgImage) return;
  bgImage = new Image();
  bgImage.src = '/bg.png';
  bgImage.onload = () => {
    isLoaded = true;
    if (onLoad) onLoad();
  };
  bgImage.onerror = () => {
    // Fallback to /bg.jpg if /bg.png does not exist
    if (bgImage && !bgImage.src.endsWith('/bg.jpg')) {
      bgImage.src = '/bg.jpg';
    }
  };
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

  const { drawX, drawY, drawW, drawH } = getBgTransform(cam);
  updateResponsiveLayout(cam);

  ctx.save();
  ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);

  if (CONFIG.drawCodeVehicles) {
    drawParkedCar(ctx, CONFIG.layout.car.x, CONFIG.layout.car.y);
    drawParkedScooter(ctx, CONFIG.layout.scooter.x, CONFIG.layout.scooter.y);
  }
  ctx.restore();
}
