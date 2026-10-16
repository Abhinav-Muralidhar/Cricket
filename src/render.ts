/**
 * render.ts - Canvas rendering, camera scaling (1600x800 world to screen), and screen-space HUD.
 */

import { CONFIG, PALETTE } from './config.ts';
import { createStaticSceneCanvas } from './scene.ts';
import { EASINGS } from './animation.ts';
import type { GameState, CharacterRig, RigPart } from './types.ts';

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

let staticCanvasCache: HTMLCanvasElement | null = null;
export function rebuildStaticScene(): void {
  staticCanvasCache = createStaticSceneCanvas();
}
function getStaticScene(): HTMLCanvasElement {
  if (!staticCanvasCache) rebuildStaticScene();
  return staticCanvasCache!;
}

export function computeCamera(cssWidth: number, cssHeight: number, dpr: number): CameraViewport {
  const worldH = CONFIG.world.height;
  const fitHScale = cssHeight / worldH;
  const rawVisibleWidth = cssWidth / fitHScale;

  let scale = fitHScale;
  let visibleWorldWidth = rawVisibleWidth;
  let visibleWorldHeight = worldH;
  let worldTop = 0;
  let isPortraitPhone = false;

  if (rawVisibleWidth < CONFIG.world.minVisibleWidth) {
    isPortraitPhone = true;
    scale = cssWidth / CONFIG.world.minVisibleWidth;
    visibleWorldWidth = CONFIG.world.minVisibleWidth;
    visibleWorldHeight = cssHeight / scale;
    worldTop = -(visibleWorldHeight - worldH) * 0.42;
  } else {
    visibleWorldWidth = Math.min(CONFIG.world.maxVisibleWidth, rawVisibleWidth);
    scale = cssHeight / worldH;
  }

  const worldLeft = CONFIG.world.actionCenterX - visibleWorldWidth / 2;
  return { scale, dpr, cssWidth, cssHeight, worldLeft, worldTop, visibleWorldWidth, visibleWorldHeight, isPortraitPhone };
}

function drawRigPart(ctx: CanvasRenderingContext2D, rigX: number, rigY: number, part: RigPart): void {
  ctx.save();
  ctx.translate(rigX + part.pivotX, rigY + part.pivotY);
  ctx.rotate(part.angle);
  ctx.fillStyle = part.color;
  ctx.fillRect(-part.width / 2, 0, part.width, part.height);
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  ctx.strokeRect(-part.width / 2, 0, part.width, part.height);
  ctx.restore();
}

function drawCharacterRig(ctx: CanvasRenderingContext2D, rig: CharacterRig): void {
  const head = rig.parts.head;
  if (head) {
    ctx.save();
    ctx.fillStyle = head.color;
    ctx.beginPath();
    ctx.arc(rig.x + head.pivotX, rig.y + head.pivotY, head.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.outlines;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }
  for (const k of ['backLeg', 'torso', 'frontLeg', 'arms', 'bat', 'bowlingArm']) {
    if (rig.parts[k]) drawRigPart(ctx, rig.x, rig.y, rig.parts[k]);
  }
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

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, cam: CameraViewport): void {
  ctx.save();

  // 1. Top-left dark pill (#1E1E24 at 70% opacity, cream text, thin border)
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

  // Lives as small tape ball icons
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

  // 2. Big white outcome banner with scale-in animation centered over street
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

  // 3. Debug text ONLY when debug mode (D) is on
  if (state.debugMode) {
    ctx.fillStyle = 'rgba(30, 30, 36, 0.85)';
    ctx.fillRect(cam.cssWidth - 210, 18, 190, 68);
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1;
    ctx.strokeRect(cam.cssWidth - 210, 18, 190, 68);
    ctx.fillStyle = '#00f5d4';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('DEBUG MODE ON [D]', cam.cssWidth - 200, 36);
    ctx.fillStyle = PALETTE.cream;
    ctx.fillText(`Scale: ${cam.scale.toFixed(2)} | DPR: ${cam.dpr}`, cam.cssWidth - 200, 54);
  }

  // Title / Game Over Screen Overlay
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

function drawWorldDebug(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.debugMode) return;
  const sweetX = CONFIG.layout.sweetSpot.x;
  const groundY = CONFIG.street.groundY;
  const t = CONFIG.timing;
  const zoneY = groundY + 14;

  ctx.save();
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

  drawZone(t.windowMinOffset, t.windowMaxOffset, 'rgba(214, 40, 40, 0.85)', 'WIN');
  drawZone(t.fourEarlyTolerance, t.singleEarlyTolerance, 'rgba(234, 179, 8, 0.8)', '1');
  drawZone(t.sixTolerance, t.fourEarlyTolerance, 'rgba(6, 182, 212, 0.8)', '4');
  drawZone(-t.sixTolerance, t.sixTolerance, 'rgba(16, 185, 129, 0.9)', '6');
  drawZone(-t.sixTolerance, -t.fourLateTolerance, 'rgba(6, 182, 212, 0.8)', '4');
  drawZone(-t.fourLateTolerance, -t.singleLateTolerance, 'rgba(234, 179, 8, 0.8)', '1');
  drawZone(-t.scooterMinOffset, -t.scooterMaxOffset, 'rgba(249, 115, 22, 0.85)', 'CAR');

  if (state.ball.active || state.state === 'BOWLING') {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(state.ball.x, groundY - 80); ctx.lineTo(state.ball.x, zoneY + 36); ctx.stroke();
  }
  ctx.restore();
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState, cam: CameraViewport): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.setTransform(cam.dpr * cam.scale, 0, 0, cam.dpr * cam.scale, -cam.worldLeft * cam.dpr * cam.scale, -cam.worldTop * cam.dpr * cam.scale);

  if (cam.isPortraitPhone) {
    ctx.fillStyle = PALETTE.skyTop;
    ctx.fillRect(cam.worldLeft - 100, cam.worldTop - 200, cam.visibleWorldWidth + 200, -cam.worldTop + 200);
    ctx.fillStyle = PALETTE.asphalt;
    ctx.fillRect(cam.worldLeft - 100, CONFIG.world.height, cam.visibleWorldWidth + 200, cam.visibleWorldHeight + 200);
  }

  // 1. Static scene blit
  ctx.drawImage(getStaticScene(), 0, 0);

  // 2. Dynamic objects
  drawDynamicEffects(ctx, state);
  drawCharacterRig(ctx, state.fielder1Rig);
  drawCharacterRig(ctx, state.fielder2Rig);
  drawCharacterRig(ctx, state.batterRig);
  drawCharacterRig(ctx, state.bowlerRig);
  drawBall(ctx, state);
  drawWorldDebug(ctx, state);

  // 3. Screen-space HUD
  ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
  drawHUD(ctx, state, cam);
}
