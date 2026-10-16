/**
 * scene-street.ts - Renders the detailed ground band: footpath, black/yellow kerb,
 * asphalt with potholes, tar patches, puddle, larger car & scooter, thela, dog, cow, and cricket props.
 */

import { CONFIG, PALETTE } from './config.ts';

function r(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function shadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
  ctx.fillStyle = PALETTE.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFootpathAndKerb(ctx: CanvasRenderingContext2D): void {
  const w = CONFIG.world.width;
  const s = CONFIG.street;

  // 1. Footpath slab surface
  r(ctx, 0, s.footpathY, w, s.kerbY - s.footpathY, PALETTE.roadLines);
  for (let px = 40; px < w; px += 75) {
    ctx.strokeStyle = 'rgba(30, 30, 36, 0.25)';
    ctx.beginPath(); ctx.moveTo(px, s.footpathY); ctx.lineTo(px, s.kerbY); ctx.stroke();
  }

  // 2. Gutter drain grate + tape ball stuck in gutter
  r(ctx, 380, s.kerbY - 10, 70, 8, PALETTE.outlines);
  for (let gx = 388; gx < 445; gx += 7) {
    ctx.strokeStyle = PALETTE.roadLines; ctx.beginPath(); ctx.moveTo(gx, s.kerbY - 9); ctx.lineTo(gx, s.kerbY - 3); ctx.stroke();
  }
  // Half tape-ball stuck in gutter
  ctx.fillStyle = PALETTE.ball;
  ctx.beginPath(); ctx.arc(415, s.kerbY - 6, 5, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = PALETTE.roadLines; ctx.lineWidth = 1.5; ctx.stroke();

  // 3. Alternating black & yellow kerb
  const kerbW = 45;
  const numKerbs = Math.ceil(w / kerbW);
  for (let i = 0; i < numKerbs; i++) {
    const kx = i * kerbW;
    const col = i % 2 === 0 ? PALETTE.kerbYellow : PALETTE.kerbBlack;
    r(ctx, kx, s.kerbY, Math.min(kerbW, w - kx), s.streetY - s.kerbY, col);
  }
}

export function drawAsphaltSurface(ctx: CanvasRenderingContext2D): void {
  const w = CONFIG.world.width;
  const s = CONFIG.street;
  r(ctx, 0, s.streetY, w, CONFIG.world.height - s.streetY, PALETTE.asphalt);

  // Tar patches
  ctx.fillStyle = PALETTE.asphaltDark;
  ctx.fillRect(280, 590, 110, 35);
  ctx.fillRect(680, 680, 140, 42);
  ctx.fillRect(1220, 600, 95, 30);

  // Potholes
  ctx.strokeStyle = PALETTE.asphaltLight;
  ctx.lineWidth = 2;
  ctx.fillStyle = PALETTE.asphaltDark;
  ctx.beginPath(); ctx.ellipse(540, 720, 24, 10, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(980, 590, 20, 8, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Manhole cover
  ctx.fillStyle = PALETTE.asphaltLight;
  ctx.beginPath(); ctx.ellipse(320, 715, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2; ctx.stroke();

  // Speed breaker with yellow/black diagonal hazard stripes
  r(ctx, 1080, 710, 160, 14, PALETTE.kerbBlack);
  for (let z = 1090; z < 1230; z += 24) {
    ctx.fillStyle = PALETTE.kerbYellow;
    ctx.beginPath(); ctx.moveTo(z, 724); ctx.lineTo(z + 10, 710); ctx.lineTo(z + 18, 710); ctx.lineTo(z + 8, 724); ctx.fill();
  }

  // Water puddle with sky reflection
  ctx.fillStyle = 'rgba(74, 127, 181, 0.35)';
  ctx.beginPath(); ctx.ellipse(860, 730, 45, 14, -0.05, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.skyGlow;
  ctx.beginPath(); ctx.ellipse(875, 728, 12, 3, 0, 0, Math.PI * 2); ctx.fill(); // Highlight

  // Cricket chalk crease lines
  ctx.strokeStyle = PALETTE.roadLines;
  ctx.lineWidth = 3;
  ctx.setLineDash([20, 15]);
  ctx.beginPath(); ctx.moveTo(460, s.groundY); ctx.lineTo(1080, s.groundY); ctx.stroke();
  ctx.setLineDash([]);
  r(ctx, CONFIG.layout.batter.x - 24, s.groundY - 3, 48, 6, PALETTE.roadLines);
}

export function drawParkedCar(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(ctx, x + 142, y + 105, 145, 15); // Under-car shadow
  // Car body
  r(ctx, x, y + 42, 285, 62, PALETTE.buildingB);
  r(ctx, x + 45, y, 195, 46, PALETTE.buildingBTrim);
  // Windshield & side windows
  r(ctx, x + 55, y + 6, 65, 34, PALETTE.roadLines); // Windshield
  r(ctx, x + 130, y + 6, 95, 34, PALETTE.roadLines); // Side window
  // Wheels
  for (const wx of [x + 58, x + 225]) {
    ctx.fillStyle = PALETTE.outlines;
    ctx.beginPath(); ctx.arc(wx, y + 102, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.roadLines;
    ctx.beginPath(); ctx.arc(wx, y + 102, 8, 0, Math.PI * 2); ctx.fill();
  }
  r(ctx, x + 276, y + 54, 10, 14, PALETTE.ball); // Tail light
}

export function drawParkedScooter(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(ctx, x + 70, y + 95, 65, 12);
  r(ctx, x + 40, y + 28, 75, 42, PALETTE.buildingA); // Body
  r(ctx, x + 50, y + 14, 58, 15, PALETTE.outlines);  // Seat
  r(ctx, x + 15, y + 18, 28, 52, PALETTE.buildingA); // Apron
  r(ctx, x + 14, y, 20, 18, PALETTE.buildingATrim);  // Cowl
  r(ctx, x + 16, y + 4, 10, 10, PALETTE.roadLines);  // Headlight
  // Rear view mirror
  ctx.strokeStyle = PALETTE.outlines; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + 22, y); ctx.lineTo(x + 14, y - 16); ctx.stroke();
  ctx.fillStyle = PALETTE.roadLines;
  ctx.beginPath(); ctx.arc(x + 12, y - 18, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Wheels
  for (const wx of [x + 26, x + 96]) {
    ctx.fillStyle = PALETTE.outlines;
    ctx.beginPath(); ctx.arc(wx, y + 84, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.roadLines;
    ctx.beginPath(); ctx.arc(wx, y + 84, 6, 0, Math.PI * 2); ctx.fill();
  }
}

export function drawThela(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(ctx, x + 55, y + 74, 58, 10);
  r(ctx, x, y + 25, 110, 20, PALETTE.wicketWood); // Wooden plank bed
  // 2 large spoked wheels
  for (const wx of [x + 25, x + 85]) {
    ctx.fillStyle = PALETTE.outlines;
    ctx.beginPath(); ctx.arc(wx, y + 55, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.roadLines;
    ctx.beginPath(); ctx.arc(wx, y + 55, 14, 0, Math.PI * 2); ctx.fill();
  }
  // Fruits: Bananas & Apples
  for (let i = 0; i < 5; i++) {
    r(ctx, x + 8 + i * 18, y + 12, 16, 14, i % 2 === 0 ? PALETTE.buildingA : PALETTE.ball);
  }
}

export function drawCow(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  shadow(ctx, x + 65, y + 90, 55, 12);
  // Torso
  r(ctx, x + 25, y + 25, 80, 48, PALETTE.roadLines);
  // Legs
  for (let i = 0; i < 4; i++) {
    r(ctx, x + 30 + i * 20, y + 70, 8, 22, PALETTE.roadLines);
  }
  // Head & curved horns
  r(ctx, x, y + 20, 28, 32, PALETTE.roadLines);
  ctx.strokeStyle = PALETTE.outlines; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x + 10, y + 16, 12, Math.PI * 0.9, Math.PI * 1.8); ctx.stroke(); // Horn
  ctx.beginPath(); ctx.arc(x + 18, y + 16, 12, Math.PI * 1.2, Math.PI * 2.1); ctx.stroke();
}

export function drawWicketsAndBag(ctx: CanvasRenderingContext2D): void {
  const l = CONFIG.layout;
  // Bricks stack + chalk stumps
  shadow(ctx, l.wicket.x, l.wicket.y + 6, 22, 6);
  r(ctx, l.wicket.x - 14, l.wicket.y - 28, 28, 28, PALETTE.brick);
  r(ctx, l.wicket.x - 14, l.wicket.y - 56, 28, 28, PALETTE.buildingATrim);
  r(ctx, l.wicket.x - 14, l.wicket.y - 84, 28, 28, PALETTE.brick);
  ctx.fillStyle = PALETTE.roadLines;
  ctx.fillRect(l.wicket.x - 10, l.wicket.y - 82, 4, 78);
  ctx.fillRect(l.wicket.x - 2, l.wicket.y - 82, 4, 78);
  ctx.fillRect(l.wicket.x + 6, l.wicket.y - 82, 4, 78);

  // Cricket bag as non-striker marker
  shadow(ctx, l.cricketBag.x, l.cricketBag.y + 5, 18, 6);
  r(ctx, l.cricketBag.x - 15, l.cricketBag.y - 48, 30, 48, PALETTE.ball);
  r(ctx, l.cricketBag.x - 12, l.cricketBag.y - 34, 24, 7, PALETTE.outlines);
  r(ctx, l.cricketBag.x + 3, l.cricketBag.y - 68, 6, 26, PALETTE.wicketWood); // Bat handle

  // Sleeping dog
  shadow(ctx, l.strayDog.x, l.strayDog.y + 4, 24, 8);
  ctx.fillStyle = PALETTE.wicketWood;
  ctx.strokeStyle = PALETTE.outlines; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(l.strayDog.x, l.strayDog.y, 22, 13, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(l.strayDog.x - 14, l.strayDog.y + 2, 9, 7, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Props: Plastic chairs + Water can + Chips packet
  r(ctx, 650, 485, 20, 24, PALETTE.ball); // Stacked chairs
  r(ctx, 652, 481, 20, 24, PALETTE.plasticBlue);
  r(ctx, 1070, 520, 14, 20, PALETTE.plasticBlue); // 20L water can
  r(ctx, 1073, 516, 8, 4, PALETTE.roadLines);
  r(ctx, 510, 550, 8, 10, PALETTE.ball); // Chips packet litter
}
