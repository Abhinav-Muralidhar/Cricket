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

  const imgW = bgImage.naturalWidth;
  const imgH = bgImage.naturalHeight;
  const visW = cam.visibleWorldWidth;
  const visH = CONFIG.world.height; // 800

  // "cover" scaling: scale so image fully covers visible area (no empty bands on any side)
  const coverScale = Math.max(visW / imgW, visH / imgH);
  const drawW = imgW * coverScale;
  const drawH = imgH * coverScale;

  // Anchored to bottom-centre of visible area:
  // Center horizontally relative to visible camera frame, anchor bottom edge to world bottom
  const centerX = cam.worldLeft + visW / 2;
  const drawX = centerX - drawW / 2;
  const drawY = visH - drawH; // Bottom-anchored; crops top when drawH > visH

  ctx.save();
  ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);

  if (CONFIG.drawCodeVehicles) {
    drawParkedCar(ctx, CONFIG.layout.car.x, CONFIG.layout.car.y);
    drawParkedScooter(ctx, CONFIG.layout.scooter.x, CONFIG.layout.scooter.y);
  }
  ctx.restore();
}
