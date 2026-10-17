/**
 * render.ts - Canvas rendering, camera scaling (1600x800 world to screen), and scene composition.
 */

import { CONFIG, PALETTE } from './config.ts';
import { drawBackground } from './background.ts';
import { drawCharacter } from './characters.ts';
import { drawHUD, drawWorldDebug, drawRotatePhoneOverlay } from './hud.ts';
import type { GameState } from './types.ts';

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

  const mustShowLeft = Math.max(0, CONFIG.layout.window.x - 20);
  const mustShowRight = CONFIG.layout.bowler.x + 80;
  const minRequiredWidth = mustShowRight - mustShowLeft;

  let scale = cssHeight / worldH;
  let visibleWorldWidth = cssWidth / scale;
  if (visibleWorldWidth < minRequiredWidth) {
    scale = cssWidth / minRequiredWidth;
    visibleWorldWidth = minRequiredWidth;
  }
  const visibleWorldHeight = worldH;
  const worldTop = 0;

  // Clamp horizontal crop so window rect and pitch never leave the screen
  const minWorldLeft = mustShowRight - visibleWorldWidth;
  const maxWorldLeft = mustShowLeft;
  const desiredWorldLeft = (mustShowLeft + mustShowRight - visibleWorldWidth) / 2;
  const worldLeft = Math.max(minWorldLeft, Math.min(maxWorldLeft, desiredWorldLeft));

  return { scale, dpr, cssWidth, cssHeight, worldLeft, worldTop, visibleWorldWidth, visibleWorldHeight, isPortraitPhone };
}

function drawWickets(ctx: CanvasRenderingContext2D): void {
  const w = CONFIG.layout.wicket;
  ctx.save();
  ctx.fillStyle = '#8B5E3C';
  ctx.fillRect(w.x, w.y - 78, 5, 78);
  ctx.fillRect(w.x + 10, w.y - 78, 5, 78);
  ctx.fillRect(w.x + 20, w.y - 78, 5, 78);
  ctx.fillRect(w.x - 2, w.y - 82, 28, 4);

  ctx.strokeStyle = '#5C3814';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(w.x, w.y - 78, 5, 78);
  ctx.strokeRect(w.x + 10, w.y - 78, 5, 78);
  ctx.strokeRect(w.x + 20, w.y - 78, 5, 78);
  ctx.strokeRect(w.x - 2, w.y - 82, 28, 4);
  ctx.restore();
}

function drawDynamicEffects(ctx: CanvasRenderingContext2D, state: GameState): void {
  const res = state.lastResult;
  if (!res) return;
  if (res.isWindowBroken) {
    const w = CONFIG.layout.window;
    ctx.save();
    ctx.strokeStyle = PALETTE.ball;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w.x + 15, w.y + 15); ctx.lineTo(w.x + w.width / 2, w.y + w.height / 2); ctx.lineTo(w.x + w.width - 20, w.y + 25);
    ctx.stroke();
    ctx.restore();
  }
  if (res.isCarGlassBroken) {
    const c = CONFIG.layout.car;
    ctx.save();
    ctx.strokeStyle = PALETTE.ball;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x + 55, c.y + 8); ctx.lineTo(c.x + 75, c.y + 24);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBall(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { ball } = state;
  if (!ball.active && state.state !== 'HIT' && state.state !== 'BOWLING') return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.ball;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.roadLines;
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = PALETTE.outlines;
  ctx.stroke();
  ctx.restore();
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, cam: CameraViewport): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  if (cam.isPortraitPhone) {
    drawRotatePhoneOverlay(ctx, cam);
    return;
  }

  // 1. World-space transform
  ctx.setTransform(cam.dpr * cam.scale, 0, 0, cam.dpr * cam.scale, -cam.worldLeft * cam.dpr * cam.scale, -cam.worldTop * cam.dpr * cam.scale);

  // 2. Illustrated background with soft asphalt extension (covers 100% width)
  drawBackground(ctx, cam);

  // 3. Dynamic effects, wickets, and characters
  drawDynamicEffects(ctx, state);

  drawCharacter(ctx, state.fielder3Rig);
  drawCharacter(ctx, state.fielder2Rig);
  drawCharacter(ctx, state.fielder1Rig);

  drawWickets(ctx);
  drawCharacter(ctx, state.batterRig, state.squashX, state.squashY);
  drawCharacter(ctx, state.bowlerRig);

  drawBall(ctx, state);
  drawWorldDebug(ctx, state);

  // 4. Screen-space HUD
  ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
  drawHUD(ctx, state, cam);
}
