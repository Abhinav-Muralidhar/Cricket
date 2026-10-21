/**
 * camera.ts - Camera viewport calculation and types for 1600x800 world.
 */

import { CONFIG } from './config.ts';

export interface CameraViewport {
  scale: number;
  dpr: number;
  cssWidth: number;
  cssHeight: number;
  worldLeft: number;
  worldTop: number;
  visibleWorldWidth: number;
  visibleWorldHeight: number;
  isPortraitPhone: boolean;
}

export function computeCamera(cssWidth: number, cssHeight: number, dpr: number): CameraViewport {
  const worldH = CONFIG.world.height;
  const isPortraitPhone = cssHeight > cssWidth;

  const mustShowLeft = Math.max(0, CONFIG.layout.wicket.x - 70);
  const mustShowRight = Math.min(CONFIG.world.width, CONFIG.layout.bowler.x + 90);
  const minRequiredWidth = mustShowRight - mustShowLeft;

  let scale = cssHeight / worldH;
  let visibleWorldWidth = cssWidth / scale;
  if (visibleWorldWidth < minRequiredWidth) {
    scale = cssWidth / minRequiredWidth;
    visibleWorldWidth = minRequiredWidth;
  }
  let worldTop = 0;
  let visibleWorldHeight = cssHeight / scale;
  if (visibleWorldHeight < worldH) {
    worldTop = worldH - visibleWorldHeight;
  } else {
    visibleWorldHeight = worldH;
  }

  // Center pitch action (wickets to bowler) perfectly in frame
  const actionCenter = (mustShowLeft + mustShowRight) / 2;
  const desiredWorldLeft = actionCenter - visibleWorldWidth / 2;
  const worldLeft = Math.max(0, Math.min(CONFIG.world.width - visibleWorldWidth, desiredWorldLeft));

  return { scale, dpr, cssWidth, cssHeight, worldLeft, worldTop, visibleWorldWidth, visibleWorldHeight, isPortraitPhone };
}
