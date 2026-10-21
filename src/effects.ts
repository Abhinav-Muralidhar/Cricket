/**
 * effects.ts - Dynamic visual effects for hazard impacts, sparks, and car indicators.
 */

import { CONFIG, PALETTE } from './config.ts';
import type { GameState } from './types.ts';

/** Renders hazard impact effects: flashes, sparks, cracks, and car indicators */
export function drawDynamicEffects(ctx: CanvasRenderingContext2D, state: GameState): void {
  const res = state.lastResult;
  if (!res) return;
  const t = state.resultTimer;

  // --- Impact flash on any hazard (first 0.15s) ---
  const isHazard = res.isWindowBroken || res.isCarGlassBroken || res.isAcHit || res.isNewspaperHit;
  if (isHazard && t < 0.15) {
    ctx.save();
    ctx.globalAlpha = 0.18 * (1 - t / 0.15);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CONFIG.world.width, CONFIG.world.height);
    ctx.restore();
  }

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
  const impactX = c.x + c.width * 0.35, impactY = c.y + 25;
  // Glass crack lines from impact point
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
  // Hazard indicators — delayed by 0.35s, then blink at 4Hz
  if (t > 0.35) {
    const blinkPhase = Math.floor((t - 0.35) * 8) % 2 === 0;
    if (blinkPhase) {
      ctx.save();
      ctx.fillStyle = '#FFA500'; ctx.shadowColor = '#FF8800'; ctx.shadowBlur = 18;
      // Rear indicator (right edge of car)
      ctx.beginPath(); ctx.arc(c.x + c.width - 10, c.y + c.height * 0.1, 4, 0, Math.PI * 2); ctx.fill();
      // Warm glow halo on rear light
      ctx.globalAlpha = 0.55;
      ctx.beginPath(); ctx.arc(c.x + c.width - 10, c.y + c.height * 0.1, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FF6600'; ctx.fill();
      ctx.restore();
    }
  }
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
