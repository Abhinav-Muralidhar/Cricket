/**
 * character-parts.ts - Two-tone shaded chibi parts, rim lighting, soft ground shadows,
 * colored outlines, and golden-hour overlay.
 */

import { SHADED, type ShadedColor } from './palette-shaded.ts';
import type { CharacterVariant, FaceExpression } from './types.ts';

export { SHADED, type ShadedColor };

/** Stretched ground shadow cast away from sun (to the right) with soft feathered edges */
export function drawGroundShadow(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, squashY = 1): void {
  ctx.save();
  const castX = x + 24 * scale;
  const castY = y + 2;
  const radX = 50 * scale * (2 - squashY);
  const radY = 11 * scale;

  const grad = ctx.createRadialGradient(castX - 6, castY, 3 * scale, castX, castY, radX);
  grad.addColorStop(0, 'rgba(20, 20, 28, 0.25)');
  grad.addColorStop(0.65, 'rgba(20, 20, 28, 0.16)');
  grad.addColorStop(1, 'rgba(20, 20, 28, 0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(castX, castY, radX, radY, 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Tapered capsule with two-tone shading, sunward rim light, 2px outline, and warm overlay */
export function drawCapsule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  r1: number,
  r2: number,
  angle: number,
  color: ShadedColor,
  flipSun = false
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const dr = (r1 - r2) / Math.max(1, len);
  const rad = Math.asin(Math.max(-0.95, Math.min(0.95, dr)));
  ctx.beginPath();
  ctx.arc(0, 0, r1, Math.PI + rad, -rad, false);
  ctx.arc(0, len, r2, -rad, Math.PI + rad, false);
  ctx.closePath();

  // Two-tone soft gradient
  const grad = ctx.createLinearGradient(flipSun ? r1 : -r1, 0, flipSun ? -r1 : r1, 0);
  grad.addColorStop(0, color.lit);
  grad.addColorStop(0.48, color.fill);
  grad.addColorStop(0.52, color.shade);
  grad.addColorStop(1, color.shade);
  ctx.fillStyle = grad;
  ctx.fill();

  // Warm rim light on sunward edge
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 217, 160, 0.60)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  const sx = flipSun ? r1 - 1 : -r1 + 1;
  ctx.moveTo(sx, 2);
  ctx.lineTo(flipSun ? r2 - 1 : -r2 + 1, len - 2);
  ctx.stroke();
  ctx.restore();

  // 2px colored outline
  ctx.strokeStyle = color.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Warm golden-hour overlay (12% multiply)
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(247, 163, 92, 0.12)';
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

export function drawFootwear(ctx: CanvasRenderingContext2D, x: number, y: number, variant: CharacterVariant): void {
  ctx.save();
  ctx.translate(x, y);
  const c = variant === 'uncle' ? SHADED.uncleChappals : SHADED.shoes;
  ctx.fillStyle = c.fill;
  ctx.beginPath();
  ctx.roundRect(-4, -2, 18, 9, [3, 5, 2, 2]);
  ctx.fill();
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (variant === 'uncle') {
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(6, -2); ctx.stroke();
  }
  ctx.restore();
}

export function drawCricketBat(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const handle = SHADED.batHandle;
  const willow = SHADED.batWillow;

  // Grip handle
  ctx.fillStyle = handle.fill;
  ctx.beginPath();
  ctx.roundRect(-3.5, -20, 7, 22, 3);
  ctx.fill();
  ctx.strokeStyle = handle.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Willow blade with two-tone shading
  const grad = ctx.createLinearGradient(-8, 0, 8, 0);
  grad.addColorStop(0, willow.lit);
  grad.addColorStop(0.5, willow.fill);
  grad.addColorStop(1, willow.shade);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(-8, 2, 16, 56, [2, 2, 6, 6]);
  ctx.fill();
  ctx.strokeStyle = willow.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Red sticker
  ctx.fillStyle = SHADED.redStripe.fill;
  ctx.fillRect(-5, 12, 10, 22);
  ctx.restore();
}

export function drawFace(ctx: CanvasRenderingContext2D, expr: FaceExpression, variant: CharacterVariant): void {
  const ink = SHADED.skin.stroke;
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;

  // Eyes
  if (expr === 'wince') {
    ctx.beginPath();
    ctx.moveTo(3, -5); ctx.lineTo(9, -2); ctx.lineTo(3, 1);
    ctx.moveTo(13, -5); ctx.lineTo(19, -2); ctx.lineTo(13, 1);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(7, -3, 2.8, 0, Math.PI * 2);
    ctx.arc(17, -3, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth
  ctx.beginPath();
  if (expr === 'smile') {
    ctx.arc(12, 5, 5, 0.1, Math.PI - 0.1, false);
    ctx.stroke();
  } else if (expr === 'shout') {
    ctx.ellipse(12, 6, 3.8, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (expr === 'sad') {
    ctx.arc(12, 10, 5, Math.PI + 0.2, -0.2, false);
    ctx.stroke();
  } else if (expr === 'wince') {
    ctx.moveTo(8, 7); ctx.lineTo(11, 5); ctx.lineTo(14, 8); ctx.lineTo(17, 5);
    ctx.stroke();
  } else {
    ctx.moveTo(8, 6); ctx.lineTo(16, 6);
    ctx.stroke();
  }

  // Uncle small thin mustache (no black blobs!)
  if (variant === 'uncle') {
    ctx.strokeStyle = '#3D2A1D';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(7, 3.5);
    ctx.quadraticCurveTo(12, 1.8, 17, 3.5);
    ctx.stroke();
  }
}

export function drawHeadDecorations(ctx: CanvasRenderingContext2D, variant: CharacterVariant): void {
  if (variant === 'batter') {
    const c = SHADED.bluePants;
    ctx.fillStyle = c.fill;
    ctx.beginPath();
    ctx.arc(0, -5, 23, Math.PI * 1.05, Math.PI * 1.95, false);
    ctx.fill();
    ctx.strokeStyle = c.stroke; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(18, -8, 14, 5, 0.2, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  } else if (variant === 'bowler') {
    ctx.fillStyle = '#22252A';
    ctx.beginPath();
    ctx.moveTo(-16, -14); ctx.lineTo(-12, -26); ctx.lineTo(-4, -18);
    ctx.lineTo(4, -28); ctx.lineTo(12, -18); ctx.lineTo(18, -26); ctx.lineTo(20, -12);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = SHADED.redStripe.fill; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, -6, 21.5, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke();
  } else if (variant === 'schoolKid') {
    ctx.fillStyle = '#1E232A';
    ctx.beginPath();
    ctx.arc(0, -4, 22.5, Math.PI * 0.85, Math.PI * 2.15);
    ctx.lineTo(8, -8); ctx.closePath(); ctx.fill();
  } else if (variant === 'uncle') {
    // Uncle neat receding hairline: subtle temples, no black blobs!
    ctx.strokeStyle = '#4A3B32';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-18, -2); ctx.lineTo(-14, 4);
    ctx.moveTo(18, -2); ctx.lineTo(14, 4);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#22252A';
    ctx.beginPath();
    ctx.moveTo(-18, -10); ctx.lineTo(-10, -25); ctx.lineTo(-2, -18);
    ctx.lineTo(6, -26); ctx.lineTo(14, -16); ctx.lineTo(20, -22); ctx.lineTo(20, -8);
    ctx.closePath(); ctx.fill();
  }
}
