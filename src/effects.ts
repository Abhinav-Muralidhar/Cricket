/**
 * effects.ts - Dynamic visual effects for hazard impacts, sparks, and car indicators.
 */

import { CONFIG, PALETTE } from './config.ts';
import type { GameState } from './types.ts';

/** Renders hazard impact effects: sparks, cracks, and car indicators */
export function drawDynamicEffects(ctx: CanvasRenderingContext2D, state: GameState): void {
  const res = state.lastResult;
  if (!res) return;
  const t = state.resultTimer;

  drawWindowBreak(ctx, res, t);
  drawCarHit(ctx, res, t);
  drawAcSparks(ctx, res, t);
  drawNewspaperFlutter(ctx, res, t);
}

function drawWindowBreak(ctx: CanvasRenderingContext2D, res: NonNullable<GameState['lastResult']>, t: number): void {
  if (!res.isWindowBroken) return;
  const w = CONFIG.layout.window;
  const cx = w.x + w.width / 2, cy = w.y + w.height / 2;
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2.5;
  const cracks = [[-0.7, -0.6], [0.5, -0.8], [0.9, 0.3], [-0.5, 0.9], [0.1, -1]];
  for (const [dx, dy] of cracks) {
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + dx * 38, cy + dy * 40); ctx.stroke();
  }
  ctx.strokeStyle = PALETTE.ball; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w.x + 15, w.y + 15); ctx.lineTo(cx, cy); ctx.lineTo(w.x + w.width - 20, w.y + 25); ctx.stroke();
  // Spark particles
  if (t < 0.5) {
    const alpha = Math.max(0, 1 - t / 0.5);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + t * 4;
      const r = 12 + t * 80;
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 2.5 * alpha, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 200, 60, ${alpha.toFixed(2)})`; ctx.fill();
    }
  }
  ctx.restore();
}

function drawCarHit(ctx: CanvasRenderingContext2D, res: NonNullable<GameState['lastResult']>, t: number): void {
  if (res.outcome !== 'CAR_GLASS' && !res.isCarGlassBroken) return;
  const c = CONFIG.layout.car;
  // Impact precisely on the car's window glass
  const impactX = c.x + 194, impactY = c.y - 37;

  // Glass crack lines radiating across car window glass
  ctx.save();
  ctx.strokeStyle = 'rgba(200, 220, 255, 0.7)'; ctx.lineWidth = 1.8;
  const angles = [-2.2, -1.6, -0.8, 0, 0.6, 1.4];
  for (const a of angles) {
    ctx.beginPath(); ctx.moveTo(impactX, impactY);
    ctx.lineTo(impactX + Math.cos(a) * 28, impactY + Math.sin(a) * 22); ctx.stroke();
  }
  // Spark burst (first 0.4s)
  if (t < 0.4) {
    const sa = Math.max(0, 1 - t / 0.4);
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2 + t * 6;
      const r = 8 + t * 60;
      ctx.beginPath(); ctx.arc(impactX + Math.cos(ang) * r, impactY + Math.sin(ang) * r, 2 * sa, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 180, 40, ${sa.toFixed(2)})`; ctx.fill();
    }
  }
  ctx.restore();

  // Hazard indicator — realistic automotive flasher cadence & optics
  if (t > 0.35) {
    const elapsed = t - 0.35;
    const cycle = elapsed % 0.65; // ~92 flashes/min cadence
    let intensity = 0;
    if (cycle < 0.05) {
      intensity = cycle / 0.05; // rapid incandescent rise
    } else if (cycle < 0.22) {
      intensity = 1.0;          // sustained peak illumination
    } else if (cycle < 0.38) {
      intensity = Math.max(0, 1.0 - (cycle - 0.22) / 0.16); // natural decay
    }

    if (intensity > 0.02) {
      const indX = c.x + c.width - 10;
      const indY = c.y + c.height * 0.1;
      drawRealisticIndicator(ctx, indX, indY, intensity);
    }
  }
}

function drawRealisticIndicator(ctx: CanvasRenderingContext2D, x: number, y: number, intensity: number): void {
  ctx.save();

  // 1. Wide warm ambient radial bloom across car body
  const gradWide = ctx.createRadialGradient(x, y, 2, x, y, 24);
  gradWide.addColorStop(0, `rgba(255, 140, 0, ${(0.42 * intensity).toFixed(3)})`);
  gradWide.addColorStop(0.5, `rgba(255, 95, 0, ${(0.18 * intensity).toFixed(3)})`);
  gradWide.addColorStop(1, 'rgba(255, 80, 0, 0)');
  ctx.fillStyle = gradWide;
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.fill();

  // 2. Focused lens bloom
  const gradCore = ctx.createRadialGradient(x, y, 1, x, y, 10);
  gradCore.addColorStop(0, `rgba(255, 230, 130, ${(0.95 * intensity).toFixed(3)})`);
  gradCore.addColorStop(0.45, `rgba(255, 150, 0, ${(0.85 * intensity).toFixed(3)})`);
  gradCore.addColorStop(1, 'rgba(255, 100, 0, 0)');
  ctx.fillStyle = gradCore;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();

  // 3. Rotated indicator lens: angled ~50 deg along car taillight, NO dark border
  ctx.translate(x, y);
  ctx.rotate(-50 * (Math.PI / 180));

  // Amber prismatic lens
  ctx.fillStyle = `rgba(255, 155, 0, ${(0.85 + 0.15 * intensity).toFixed(3)})`;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(-6, -2.5, 12, 5, 2);
    ctx.fill();
  } else {
    ctx.fillRect(-6, -2.5, 12, 5);
  }

  // Hot emitter filament core
  ctx.fillStyle = `rgba(255, 255, 225, ${(0.95 * intensity).toFixed(3)})`;
  ctx.fillRect(-4, -1, 8, 2);

  // Subtle optical glint streak along rotated axis
  ctx.strokeStyle = `rgba(255, 235, 160, ${(0.5 * intensity).toFixed(3)})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.lineTo(12, 0);
  ctx.stroke();

  ctx.restore();
}

function drawAcSparks(ctx: CanvasRenderingContext2D, res: NonNullable<GameState['lastResult']>, t: number): void {
  if (!res.isAcHit || t >= 0.5) return;
  const ac = CONFIG.layout.acUnit;
  const acx = ac.x + ac.width / 2, acy = ac.y + ac.height / 2;
  ctx.save();
  const a = Math.max(0, 1 - t / 0.5);
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * Math.PI * 2 + t * 5;
    const r = 6 + t * 50;
    ctx.beginPath(); ctx.arc(acx + Math.cos(ang) * r, acy + Math.sin(ang) * r, 2 * a, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(100, 200, 255, ${a.toFixed(2)})`; ctx.fill();
  }
  ctx.restore();
}

function drawNewspaperFlutter(ctx: CanvasRenderingContext2D, res: NonNullable<GameState['lastResult']>, t: number): void {
  if (!res.isNewspaperHit || t >= 0.6) return;
  const np = CONFIG.layout.newspaper;
  const npx = np.x + np.width / 2, npy = np.y + np.height / 2;
  ctx.save();
  const a = Math.max(0, 1 - t / 0.6);
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + t * 3;
    const r = 8 + t * 45;
    ctx.fillStyle = `rgba(230, 210, 170, ${(a * 0.8).toFixed(2)})`;
    ctx.fillRect(npx + Math.cos(ang) * r - 4, npy + Math.sin(ang) * r - 2, 8, 4);
  }
  ctx.restore();
}
