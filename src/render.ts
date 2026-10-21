/**
 * render.ts - Canvas rendering, scene composition, wickets, and ball drawing.
 * Camera viewport & dynamic effects are in camera.ts and effects.ts respectively.
 */

import { CONFIG, PALETTE } from './config.ts';
import { drawBackground } from './background.ts';
import { drawCharacter } from './characters.ts';
import { drawDynamicEffects } from './effects.ts';
import { drawHUD, drawWorldDebug, drawRotatePhoneOverlay } from './hud.ts';
import type { GameState } from './types.ts';
import type { Characters3DManager } from './characters3d.ts';

// Re-export camera so existing imports from './render.ts' still work
export { computeCamera } from './camera.ts';
export type { CameraViewport } from './camera.ts';
import type { CameraViewport } from './camera.ts';

function drawWickets(ctx: CanvasRenderingContext2D, state: GameState): void {
  const w = CONFIG.layout.wicket;
  const isBowled = state.lastResult?.outcome === 'BOWLED' && (state.state === 'RESULT' || state.state === 'GAME_OVER');
  const t = isBowled ? Math.min(1.2, state.resultTimer) : 0;
  ctx.save();

  // Ground shadow under wickets
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(w.x + 3, w.y + 1, 10, 4, -0.15, 0, Math.PI * 2);
  ctx.fill();

  const stumps = [
    { x: w.x + 6, y: w.y - 6, col: '#784D2B', rot: -Math.min(0.55, t * 1.5), dx: -t * 15, dy: t * 5 },
    { x: w.x + 3, y: w.y - 3, col: '#8B5E3C', rot: -Math.min(1.10, t * 2.8), dx: -t * 35, dy: t * 12 },
    { x: w.x, y: w.y, col: '#9E6D44', rot: -Math.min(0.75, t * 2.0), dx: -t * 22, dy: t * 8 },
  ];

  for (const s of stumps) {
    ctx.save();
    ctx.translate(s.x + s.dx, s.y + s.dy);
    if (s.rot !== 0) ctx.rotate(s.rot);
    ctx.fillStyle = s.col;
    ctx.fillRect(0, -74, 5, 74);
    ctx.fillStyle = 'rgba(255, 235, 205, 0.25)';
    ctx.fillRect(1, -74, 1.2, 74);
    ctx.strokeStyle = '#382210';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(0, -74, 5, 74);
    ctx.restore();
  }

  // Wooden bails resting or flying off when bowled
  ctx.fillStyle = '#C89260';
  ctx.strokeStyle = '#382210';
  ctx.lineWidth = 1;
  if (!isBowled) {
    ctx.fillRect(w.x - 1, w.y - 78, 13, 3.5);
    ctx.strokeRect(w.x - 1, w.y - 78, 13, 3.5);
  } else {
    const bails = [
      { x: w.x - t * 75, y: (w.y - 78) - (130 * t - 160 * t * t), rot: t * 8 },
      { x: w.x + 5 - t * 50, y: (w.y - 78) - (95 * t - 140 * t * t), rot: -t * 9 },
    ];
    for (const b of bails) {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
      ctx.fillRect(-3.5, -1.7, 7, 3.5); ctx.strokeRect(-3.5, -1.7, 7, 3.5);
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawBall(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { ball } = state;
  if (!state.isBallReleased && state.state !== 'HIT' && state.state !== 'RESULT') return;

  ctx.save();

  // 1. Dynamic ground drop shadow on asphalt (removed when stopped)
  const isMoving = state.state === 'BOWLING' ||
    (state.state === 'HIT' && (ball.arcProgress || 0) < 1.0) ||
    (state.state === 'RESULT' && (Math.abs(ball.vx || 0) > 5 || Math.abs(ball.vy || 0) > 5));

  if (isMoving) {
    const asphaltY = 690;
    const heightAboveGround = Math.max(0, asphaltY - ball.y);
    const shadowScale = Math.max(0.4, 1.0 - heightAboveGround * 0.0028);
    const shadowAlpha = Math.max(0.08, 0.38 - heightAboveGround * 0.0016);
    ctx.beginPath();
    ctx.ellipse(ball.x, asphaltY, ball.radius * 1.8 * shadowScale, ball.radius * 0.6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha.toFixed(3)})`;
    ctx.fill();
  }

  // 2. High-speed projectile motion trail
  if (ball.trail && ball.trail.length > 1) {
    for (let i = 0; i < ball.trail.length - 1; i++) {
      const p1 = ball.trail[i];
      const p2 = ball.trail[i + 1];
      const progress = (i + 1) / ball.trail.length;
      const alpha = progress * 0.45;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(214, 40, 40, ${alpha.toFixed(3)})`;
      ctx.lineWidth = ball.radius * 2 * progress;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = `rgba(255, 230, 190, ${(alpha * 0.7).toFixed(3)})`;
      ctx.lineWidth = ball.radius * 0.7 * progress;
      ctx.stroke();
    }
  }

  // 3. Crisp cricket ball sphere
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.ball;
  ctx.fill();

  // White stitched seam arc
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, -0.7, 0.7);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Ink outline
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

function drawLoadingScreen(ctx: CanvasRenderingContext2D, cam: CameraViewport): void {
  ctx.save();
  ctx.fillStyle = 'rgba(18, 18, 24, 0.88)';
  ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);

  const cx = cam.cssWidth / 2;
  const cy = cam.cssHeight / 2;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.buildingA;
  ctx.font = '900 44px sans-serif';
  ctx.fillText('GULLY CRICKET', cx, cy - 44);

  ctx.fillStyle = PALETTE.cream;
  ctx.font = '16px sans-serif';
  ctx.fillText('Neighborhood Chaos', cx, cy - 12);

  // Animated loading bar
  const barW = 200, barH = 5, barX = cx - barW / 2, barY = cy + 24;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 2.5); ctx.fill();

  const anim = (Math.sin(performance.now() * 0.0035) + 1) / 2;
  const thumbW = 60, thumbX = barX + anim * (barW - thumbW);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.roundRect(thumbX, barY, thumbW, barH, 2.5); ctx.fill();

  ctx.fillStyle = 'rgba(245, 233, 207, 0.75)';
  ctx.font = '12px monospace';
  ctx.fillText('Loading pitch & players...', cx, cy + 50);

  // Minimal creator credit stuck to bottom
  ctx.fillStyle = 'rgba(245, 233, 207, 0.48)';
  ctx.font = '500 12px system-ui, -apple-system, Roboto, sans-serif';
  ctx.fillText('Developed by Abhinav M ↗', cx, cam.cssHeight - 20);

  ctx.restore();
}

export function renderGame(
  bgCtx: CanvasRenderingContext2D,
  hudCtx: CanvasRenderingContext2D,
  state: GameState,
  cam: CameraViewport,
  characters3D?: Characters3DManager
): void {
  bgCtx.setTransform(1, 0, 0, 1, 0, 0);
  bgCtx.clearRect(0, 0, bgCtx.canvas.width, bgCtx.canvas.height);
  hudCtx.setTransform(1, 0, 0, 1, 0, 0);
  hudCtx.clearRect(0, 0, hudCtx.canvas.width, hudCtx.canvas.height);

  if (cam.isPortraitPhone) {
    drawRotatePhoneOverlay(hudCtx, cam);
    return;
  }

  // 1. Layer 1: 2D Background
  bgCtx.setTransform(cam.dpr * cam.scale, 0, 0, cam.dpr * cam.scale, -cam.worldLeft * cam.dpr * cam.scale, -cam.worldTop * cam.dpr * cam.scale);
  drawBackground(bgCtx, cam);

  // Hold in atmospheric loading screen while 3D characters initialize
  if (CONFIG.use3DCharacters && characters3D && !characters3D.isReady) {
    hudCtx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
    drawLoadingScreen(hudCtx, cam);
    return;
  }

  // 2. Layer 2: 3D Characters via Three.js
  if (CONFIG.use3DCharacters && characters3D) {
    characters3D.render(cam);
  }

  // 3. Layer 3: 2D dynamic effects, wickets, ball, and optional 2D fallback rigs
  hudCtx.setTransform(cam.dpr * cam.scale, 0, 0, cam.dpr * cam.scale, -cam.worldLeft * cam.dpr * cam.scale, -cam.worldTop * cam.dpr * cam.scale);
  drawDynamicEffects(hudCtx, state);
  if (!CONFIG.use3DCharacters) [state.fielder3Rig, state.fielder2Rig, state.fielder1Rig, state.batterRig, state.bowlerRig].forEach((r) => drawCharacter(hudCtx, r));
  drawWickets(hudCtx, state);
  drawBall(hudCtx, state);
  drawWorldDebug(hudCtx, state);

  // 4. Screen-space HUD
  hudCtx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
  drawHUD(hudCtx, state, cam);
}
