/**
 * hud.ts - Screen-space HUD, target rect aligners, and rotate-phone overlay.
 */

import { CONFIG, PALETTE } from './config.ts';
import { EASINGS } from './animation.ts';
import type { GameState } from './types.ts';
import type { CameraViewport } from './render.ts';

export function drawRotatePhoneOverlay(ctx: CanvasRenderingContext2D, cam: CameraViewport): void {
  ctx.save();
  ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
  ctx.fillStyle = 'rgba(18, 18, 24, 0.96)';
  ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);

  const cx = cam.cssWidth / 2;
  const cy = cam.cssHeight / 2;

  ctx.save();
  ctx.translate(cx, cy - 50);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-22, -36, 44, 72, 8);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(0, 26, 3, 0, Math.PI * 2); ctx.fill();

  ctx.beginPath(); ctx.arc(0, 0, 48, -Math.PI * 0.35, Math.PI * 0.45, false); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(35, 34); ctx.lineTo(44, 44); ctx.lineTo(28, 46); ctx.fill();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 24px sans-serif';
  ctx.fillText('PLEASE ROTATE YOUR PHONE', cx, cy + 35);
  ctx.fillStyle = PALETTE.cream;
  ctx.font = '15px sans-serif';
  ctx.fillText('Gully Cricket is best played in landscape mode', cx, cy + 68);
  ctx.restore();
}

export function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, cam: CameraViewport): void {
  ctx.save();

  // 1. Top-left dark pill
  const pillX = 20;
  const pillY = 18;
  const pillW = 280;
  const pillH = 46;

  ctx.fillStyle = 'rgba(30, 30, 36, 0.70)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 23);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245, 233, 207, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = PALETTE.cream;
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`RUNS ${state.score}  B#${state.ballCount}`, pillX + 18, pillY + pillH / 2);

  for (let i = 0; i < CONFIG.gameplay.initialLives; i++) {
    const bx = pillX + 195 + i * 22;
    const by = pillY + pillH / 2;
    const alive = i < state.lives;
    ctx.beginPath();
    ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = alive ? PALETTE.ball : 'rgba(100, 100, 100, 0.4)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = alive ? PALETTE.roadLines : 'rgba(150, 150, 150, 0.3)';
    ctx.stroke();
  }

  // 2. Big outcome banner
  if (state.lastResult) {
    const res = state.lastResult;
    const bannerY = Math.max(90, Math.min(cam.cssHeight - 80, (600 - cam.worldTop) * cam.scale));
    const scale = EASINGS.easeOutBack(Math.min(1, state.resultTimer / 0.28));

    ctx.save();
    ctx.translate(cam.cssWidth / 2, bannerY);
    ctx.scale(scale, scale);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 46px sans-serif';
    ctx.lineWidth = 6;
    ctx.strokeStyle = PALETTE.outlines;
    ctx.strokeText(res.description.toUpperCase(), 0, -12);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(res.description.toUpperCase(), 0, -12);

    if (state.debugMode) {
      const sign = res.timingOffsetPx > 0 ? '+' : '';
      const sub = `TIMING: ${res.timingRating} (${sign}${Math.round(res.timingOffsetPx)}px / ${sign}${res.timingOffsetMs}ms)`;
      ctx.font = 'bold 18px monospace';
      ctx.lineWidth = 4;
      ctx.strokeStyle = PALETTE.outlines;
      ctx.strokeText(sub, 0, 26);
      ctx.fillStyle = PALETTE.cream;
      ctx.fillText(sub, 0, 26);
    }
    ctx.restore();
  }

  // 3. Debug panel
  if (state.debugMode) {
    ctx.fillStyle = 'rgba(30, 30, 36, 0.88)';
    ctx.fillRect(cam.cssWidth - 280, 18, 260, 84);
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1;
    ctx.strokeRect(cam.cssWidth - 280, 18, 260, 84);
    ctx.fillStyle = '#00f5d4';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`DEBUG [D] | TARGET: ${state.selectedHitTarget.toUpperCase()}`, cam.cssWidth - 270, 36);
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText(`Scale: ${cam.scale.toFixed(2)} | DPR: ${cam.dpr}`, cam.cssWidth - 270, 54);
    ctx.fillStyle = '#FACC15';
    ctx.fillText(`Tab/T: Switch | Arrows: Nudge`, cam.cssWidth - 270, 72);
  }

  // 4. Title / Game Over Screen Overlay
  if (state.state === 'TITLE' || state.state === 'GAME_OVER') {
    ctx.fillStyle = 'rgba(30, 30, 36, 0.82)';
    ctx.fillRect(0, 0, cam.cssWidth, cam.cssHeight);
    ctx.textAlign = 'center';
    const cx = cam.cssWidth / 2;
    const cy = cam.cssHeight / 2;

    if (state.state === 'TITLE') {
      ctx.fillStyle = PALETTE.buildingA;
      ctx.font = '900 48px sans-serif';
      ctx.fillText('GULLY CRICKET', cx, cy - 40);
      ctx.fillStyle = PALETTE.cream;
      ctx.font = '20px sans-serif';
      ctx.fillText('Neighborhood Chaos', cx, cy - 2);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('TAP OR PRESS SPACE TO BOWL', cx, cy + 60);
    } else {
      ctx.fillStyle = PALETTE.ball;
      ctx.font = '900 52px sans-serif';
      ctx.fillText('GAME OVER', cx, cy - 40);
      ctx.fillStyle = PALETTE.cream;
      ctx.font = 'bold 28px monospace';
      ctx.fillText(`FINAL SCORE: ${state.score} RUNS`, cx, cy + 10);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('TAP OR PRESS SPACE TO RETRY', cx, cy + 65);
    }
  }
  ctx.restore();
}

export function drawWorldDebug(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.debugMode) return;
  const sweetX = CONFIG.layout.sweetSpot.x;
  const groundY = CONFIG.street.groundY;
  const zoneY = groundY + 14;

  ctx.save();

  // Outlined Hit Targets with coordinates and selection highlight
  const targets = [
    { key: 'window' as const, name: 'WINDOW', rect: CONFIG.layout.window },
    { key: 'acUnit' as const, name: 'AC UNIT', rect: CONFIG.layout.acUnit },
    { key: 'newspaper' as const, name: 'NEWSPAPER', rect: CONFIG.layout.newspaper },
    { key: 'car' as const, name: 'CAR', rect: CONFIG.layout.car },
    { key: 'scooter' as const, name: 'SCOOTER', rect: CONFIG.layout.scooter },
  ];

  for (const item of targets) {
    const isSel = state.selectedHitTarget === item.key;
    const r = item.rect;
    ctx.save();
    ctx.fillStyle = isSel ? 'rgba(250, 204, 21, 0.25)' : 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(r.x, r.y, r.width, r.height);
    ctx.strokeStyle = isSel ? '#FACC15' : '#38BDF8';
    ctx.lineWidth = isSel ? 3 : 1.5;
    if (!isSel) ctx.setLineDash([6, 4]);
    ctx.strokeRect(r.x, r.y, r.width, r.height);

    ctx.fillStyle = isSel ? '#FACC15' : '#FFFFFF';
    ctx.font = isSel ? 'bold 13px monospace' : '11px monospace';
    const tag = isSel ? `* [SELECTED ${item.name}]` : item.name;
    ctx.fillText(`${tag} { x: ${r.x}, y: ${r.y}, w: ${r.width}, h: ${r.height} }`, r.x + 4, Math.max(18, r.y - 6));
    ctx.restore();
  }

  // Sweet spot and timing zones
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(sweetX, groundY - 140); ctx.lineTo(sweetX, groundY + 40); ctx.stroke();
  ctx.setLineDash([]);

  const drawZone = (minO: number, maxO: number, col: string, lbl: string) => {
    const x1 = sweetX + minO;
    const x2 = sweetX + maxO;
    const sx = Math.min(x1, x2);
    const w = Math.abs(x2 - x1);
    ctx.fillStyle = col;
    ctx.fillRect(sx, zoneY, w, 22);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, zoneY, w, 22);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(lbl, sx + w / 2 - 8, zoneY + 15);
  };

  drawZone(180, 240, 'rgba(214, 40, 40, 0.85)', 'WIN');
  drawZone(130, 180, 'rgba(56, 189, 248, 0.85)', 'AC');
  drawZone(75, 130, 'rgba(250, 204, 21, 0.85)', 'NEWS');
  drawZone(22, 75, 'rgba(6, 182, 212, 0.8)', '4');
  drawZone(-22, 22, 'rgba(16, 185, 129, 0.9)', '6');
  drawZone(-22, -38, 'rgba(6, 182, 212, 0.8)', '4');
  drawZone(-38, -50, 'rgba(234, 179, 8, 0.8)', '1');
  drawZone(-50, -98, 'rgba(249, 115, 22, 0.85)', 'CAR');

  if (state.ball.active || state.state === 'BOWLING') {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(state.ball.x, groundY - 80); ctx.lineTo(state.ball.x, zoneY + 36); ctx.stroke();
  }
  ctx.restore();
}
