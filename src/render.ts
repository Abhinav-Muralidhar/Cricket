/**
 * render.ts - Canvas rendering system. Draws the gully street, character rigs,
 * placeholder elements, ball, HUD text, and debug timing windows.
 */

import { CONFIG } from './config.ts';
import type { GameState, CharacterRig, RigPart } from './types.ts';

/**
 * Draws an individual rig part with local pivot translation and rotation.
 */
function drawRigPart(ctx: CanvasRenderingContext2D, rigX: number, rigY: number, part: RigPart): void {
  ctx.save();
  // Translate to the part's pivot point
  ctx.translate(rigX + part.pivotX, rigY + part.pivotY);
  ctx.rotate(part.angle);

  ctx.fillStyle = part.color;
  ctx.strokeStyle = '#ffffff22';
  ctx.lineWidth = 1;

  // Draw rectangle centered horizontally on the pivot
  const rx = -part.width / 2;
  const ry = 0;
  ctx.fillRect(rx, ry, part.width, part.height);
  ctx.strokeRect(rx, ry, part.width, part.height);

  // If part has child parts, draw them recursively
  if (part.children) {
    for (const child of part.children) {
      drawRigPart(ctx, 0, 0, child);
    }
  }

  ctx.restore();
}

/**
 * Renders a full character rig.
 */
function drawCharacterRig(ctx: CanvasRenderingContext2D, rig: CharacterRig): void {
  // 1. Draw head (circle)
  const head = rig.parts.head;
  if (head) {
    ctx.save();
    ctx.fillStyle = head.color;
    ctx.beginPath();
    ctx.arc(rig.x + head.pivotX, rig.y + head.pivotY, head.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff33';
    ctx.stroke();
    ctx.restore();
  }

  // 2. Draw torso and legs
  if (rig.parts.torso) drawRigPart(ctx, rig.x, rig.y, rig.parts.torso);
  if (rig.parts.legs) drawRigPart(ctx, rig.x, rig.y, rig.parts.legs);

  // 3. Draw arms / bat / bowling arm
  if (rig.parts.arms) drawRigPart(ctx, rig.x, rig.y, rig.parts.arms);
  if (rig.parts.bat) drawRigPart(ctx, rig.x, rig.y, rig.parts.bat);
  if (rig.parts.bowlingArm) drawRigPart(ctx, rig.x, rig.y, rig.parts.bowlingArm);
}

/**
 * Draws the street, buildings, wickets, and scene placeholders.
 */
function drawEnvironment(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { width, height } = CONFIG.canvas;
  const { groundY } = CONFIG.street;

  // 1. Sky / Gully Street backdrop
  ctx.fillStyle = CONFIG.colors.bg;
  ctx.fillRect(0, 0, width, height);

  // 2. Road surface
  ctx.fillStyle = CONFIG.colors.road;
  ctx.fillRect(0, groundY, width, height - groundY);

  // Street pitch center crease / white chalk line
  ctx.strokeStyle = CONFIG.colors.roadMarking;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  // Batting crease (chalk line)
  ctx.strokeStyle = '#ffffff44';
  ctx.lineWidth = 2;
  ctx.strokeRect(CONFIG.layout.batter.x - 30, groundY - 2, 60, 4);

  // 3. Top-left building with window rect labelled "window"
  const b = CONFIG.layout.building;
  ctx.fillStyle = '#222834';
  ctx.fillRect(b.x, b.y, b.width, b.height);
  ctx.strokeStyle = '#343c4d';
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x, b.y, b.width, b.height);

  // Aunty's Window
  const w = CONFIG.layout.window;
  const isBroken = state.lastResult?.isWindowBroken ?? false;
  ctx.fillStyle = isBroken ? CONFIG.colors.windowBroken : CONFIG.colors.windowGlass;
  ctx.fillRect(w.x, w.y, w.width, w.height);
  ctx.strokeStyle = CONFIG.colors.windowFrame;
  ctx.lineWidth = 4;
  ctx.strokeRect(w.x, w.y, w.width, w.height);

  // Window pane divider lines
  ctx.beginPath();
  ctx.moveTo(w.x + w.width / 2, w.y);
  ctx.lineTo(w.x + w.width / 2, w.y + w.height);
  ctx.moveTo(w.x, w.y + w.height / 2);
  ctx.lineTo(w.x + w.width, w.y + w.height / 2);
  ctx.stroke();

  // "window" label placeholder
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('window', w.x + w.width / 2, w.y + w.height + 24);
  if (isBroken) {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('CRASHED!', w.x + w.width / 2, w.y + w.height / 2 + 6);
  }

  // 4. Bottom-right rect labelled "scooter"
  const sc = CONFIG.layout.scooter;
  const isScooterHit = state.lastResult?.isScooterHit ?? false;
  ctx.fillStyle = isScooterHit ? '#c1121f' : CONFIG.colors.scooterBody;
  ctx.fillRect(sc.x, sc.y, sc.width, sc.height);
  ctx.strokeStyle = CONFIG.colors.scooterAccent;
  ctx.lineWidth = 3;
  ctx.strokeRect(sc.x, sc.y, sc.width, sc.height);

  // "scooter" label placeholder
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('scooter', sc.x + sc.width / 2, sc.y + sc.height / 2 + 6);

  // 5. Left: Wickets (stumps + bails)
  const wk = CONFIG.layout.wicket;
  ctx.fillStyle = CONFIG.colors.wicket;
  // 3 stumps
  const stumpWidth = 5;
  const stumpSpacing = (wk.width - 3 * stumpWidth) / 2;
  for (let i = 0; i < 3; i++) {
    const sx = wk.x + i * (stumpWidth + stumpSpacing);
    ctx.fillRect(sx, wk.y - wk.height, stumpWidth, wk.height);
  }
  // Bails
  ctx.fillRect(wk.x - 2, wk.y - wk.height - 4, wk.width + 4, 4);
}

/**
 * Draws the tape ball.
 */
function drawBall(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { ball } = state;
  if (!ball.active && state.state !== 'HIT' && state.state !== 'BOWLING') {
    return;
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = CONFIG.colors.ball;
  ctx.fill();

  // White electric tape seam running across the ball
  ctx.lineWidth = 4;
  ctx.strokeStyle = CONFIG.colors.ballTape;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the score, lives, timing result, and state messages.
 */
function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { width } = CONFIG.canvas;

  // 1. Top status bar (Score & Lives)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`RUNS: ${state.score}`, 30, 60);

  // Lives display (Red hearts / counters)
  ctx.textAlign = 'center';
  const hearts = '♥ '.repeat(Math.max(0, state.lives)).trim();
  ctx.fillStyle = '#ff4d6d';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText(`LIVES: ${hearts || '0'}`, width / 2, 60);

  // Ball & Speed Info
  ctx.fillStyle = CONFIG.colors.textSecondary;
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`BALL: #${state.ballCount} | SPEED: ${Math.round(state.currentBallSpeed)} px/s`, 30, 95);

  // Debug Toggle Pill (Top-Right)
  ctx.textAlign = 'right';
  ctx.fillStyle = state.debugMode ? '#00f5d4' : '#64748b';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`[D] DEBUG: ${state.debugMode ? 'ON' : 'OFF'}`, width - 30, 60);
  ctx.restore();

  // 2. Prominent Timing Result Banner
  if (state.lastResult) {
    const res = state.lastResult;
    ctx.save();
    ctx.textAlign = 'center';

    // Outcome Tag Badge
    let badgeColor = '#ffffff';
    if (res.outcome === 'SIX') badgeColor = '#10b981'; // Green
    else if (res.outcome === 'FOUR') badgeColor = '#06b6d4'; // Cyan
    else if (res.outcome === 'SINGLE') badgeColor = '#eab308'; // Yellow
    else if (res.outcome === 'SCOOTER') badgeColor = '#f97316'; // Orange
    else if (res.outcome === 'WINDOW' || res.outcome === 'BOWLED') badgeColor = '#ef4444'; // Red

    ctx.fillStyle = badgeColor;
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(res.description, width / 2, 160);

    // Timing detail line (shows timing rating and offset in ms & px)
    const sign = res.timingOffsetPx > 0 ? '+' : '';
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(
      `TIMING: ${res.timingRating} (${sign}${Math.round(res.timingOffsetPx)}px / ${sign}${res.timingOffsetMs}ms)`,
      width / 2,
      200
    );
    ctx.restore();
  }

  // 3. State-specific overlays
  ctx.save();
  ctx.textAlign = 'center';

  if (state.state === 'TITLE') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, width, CONFIG.canvas.height);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 46px sans-serif';
    ctx.fillText('GULLY CRICKET', width / 2, 520);

    ctx.fillStyle = '#ffffff';
    ctx.font = '22px sans-serif';
    ctx.fillText('Neighborhood Chaos', width / 2, 565);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('TAP OR PRESS SPACE TO BOWL', width / 2, 660);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px sans-serif';
    ctx.fillText('Watch out for Aunty’s Window and the Activa!', width / 2, 710);
    ctx.fillText('Press [D] to toggle Timing Window Debugger', width / 2, 740);
  } else if (state.state === 'GAME_OVER') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, width, CONFIG.canvas.height);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText('GAME OVER', width / 2, 520);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(`FINAL SCORE: ${state.score} RUNS`, width / 2, 580);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('TAP OR PRESS SPACE TO RETRY', width / 2, 660);
  }
  ctx.restore();
}

/**
 * Draws the debug timing window on the pitch when 'D' is pressed.
 * Visualizes the exact zones: PERFECT (SIX), GOOD (FOUR), SINGLE, SCOOTER, WINDOW.
 */
function drawDebugOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.debugMode) return;

  const sweetX = CONFIG.layout.sweetSpot.x;
  const sweetY = CONFIG.layout.sweetSpot.y;
  const groundY = CONFIG.street.groundY;
  const t = CONFIG.timing;

  ctx.save();

  // 1. Draw sweet spot center line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(sweetX, groundY - 140);
  ctx.lineTo(sweetX, groundY + 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // Sweet spot crosshair
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(sweetX, sweetY, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SWEET SPOT', sweetX, groundY - 150);

  // 2. Color-coded zone brackets along the street pitch
  // Note: Ball travels right-to-left (+offset is right/early, -offset is left/late)
  const zoneY = groundY + 12;
  const zoneHeight = 24;

  const drawZone = (minOffset: number, maxOffset: number, color: string, label: string) => {
    const x1 = sweetX + minOffset;
    const x2 = sweetX + maxOffset;
    const startX = Math.min(x1, x2);
    const boxWidth = Math.abs(x2 - x1);

    ctx.fillStyle = color;
    ctx.fillRect(startX, zoneY, boxWidth, zoneHeight);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(startX, zoneY, boxWidth, zoneHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, startX + boxWidth / 2, zoneY + 16);
  };

  // Aunty's Window (+125px to +190px)
  drawZone(t.windowMinOffset, t.windowMaxOffset, 'rgba(239, 68, 68, 0.8)', 'WINDOW');
  // Early Single (+65px to +125px)
  drawZone(t.fourEarlyTolerance, t.singleEarlyTolerance, 'rgba(234, 179, 8, 0.8)', '1');
  // Early Four (+20px to +65px)
  drawZone(t.sixTolerance, t.fourEarlyTolerance, 'rgba(6, 182, 212, 0.8)', '4');
  // PERFECT SIX (-20px to +20px)
  drawZone(-t.sixTolerance, t.sixTolerance, 'rgba(16, 185, 129, 0.9)', '6');
  // Late Four (-20px to -55px)
  drawZone(-t.sixTolerance, -t.fourLateTolerance, 'rgba(6, 182, 212, 0.8)', '4');
  // Late Single (-55px to -90px)
  drawZone(-t.fourLateTolerance, -t.singleLateTolerance, 'rgba(234, 179, 8, 0.8)', '1');
  // Scooter (-90px to -145px)
  drawZone(-t.scooterMinOffset, -t.scooterMaxOffset, 'rgba(249, 115, 22, 0.8)', 'SCOOTER');

  // 3. Current Ball indicator line
  if (state.ball.active || state.state === 'BOWLING') {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(state.ball.x, groundY - 120);
    ctx.lineTo(state.ball.x, zoneY + zoneHeight + 20);
    ctx.stroke();

    const currOffset = state.ball.x - sweetX;
    const sign = currOffset > 0 ? '+' : '';
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`BALL (${sign}${Math.round(currOffset)}px)`, state.ball.x, zoneY + zoneHeight + 35);
  }

  // 4. Debug Metrics Telemetry Box (Top-Left)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(20, 110, 260, 95);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 110, 260, 95);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TIMING DEBUGGER [D to close]', 30, 130);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '12px monospace';
  const currOffset = Math.round(state.ball.x - sweetX);
  const offsetMs = Math.round((currOffset / state.currentBallSpeed) * 1000);
  ctx.fillText(`Ball X: ${Math.round(state.ball.x)} | SweetSpot: ${sweetX}`, 30, 150);
  ctx.fillText(`Current Offset: ${currOffset > 0 ? '+' : ''}${currOffset}px (${offsetMs}ms)`, 30, 170);
  ctx.fillText(`Ball Speed: ${Math.round(state.currentBallSpeed)} px/s`, 30, 190);

  ctx.restore();
}

/**
 * Main render function. Call this every animation frame.
 */
export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  // 1. Street, background, and environmental placeholders
  drawEnvironment(ctx, state);

  // 2. Character rigs (Batter on left, Bowler on right)
  drawCharacterRig(ctx, state.batterRig);
  drawCharacterRig(ctx, state.bowlerRig);

  // 3. Tape ball
  drawBall(ctx, state);

  // 4. HUD, Score, Lives, Outcome labels
  drawHUD(ctx, state);

  // 5. Debug overlay (toggled with 'D')
  drawDebugOverlay(ctx, state);
}
