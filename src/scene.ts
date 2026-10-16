/**
 * scene.ts - Vector scene rendering for Gully Cricket (1600x800 Landscape World).
 * Composition: Sky 0-20%, Buildings 15-62%, Footpath/Kerb 62-68%, Street 68-100%.
 */

import { CONFIG, PALETTE } from './config.ts';

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

export function drawSky(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, PALETTE.skyTop);
  grad.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

export function drawSkyline(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Silhouettes of rooftops and water tanks across 1600 world
  for (let sx = 40; sx < 1600; sx += 220) {
    rect(ctx, sx, -70, 110, 70, PALETTE.buildingBTrim);
    rect(ctx, sx + 25, -92, 35, 22, PALETTE.asphalt); // Water tank
    rect(ctx, sx + 120, -50, 90, 50, PALETTE.asphalt);
    // Antenna
    ctx.strokeStyle = PALETTE.outlines;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 80, -70); ctx.lineTo(sx + 80, -105); ctx.moveTo(sx + 70, -95); ctx.lineTo(sx + 90, -95);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawBuildings(ctx: CanvasRenderingContext2D): void {
  const l = CONFIG.layout;
  const bY = CONFIG.street.buildingsY;
  const bH = CONFIG.street.footpathY - bY;

  // 1. Far-left flanking building
  rect(ctx, 0, bY + 15, 310, bH - 15, PALETTE.buildingBTrim);
  // 2. Building A (Aunty's yellow building)
  rect(ctx, l.buildingA.x, l.buildingA.y, l.buildingA.width, l.buildingA.height, PALETTE.buildingA);
  rect(ctx, l.buildingA.x - 6, l.buildingA.y, l.buildingA.width + 12, 14, PALETTE.buildingATrim);
  // Balcony & laundry on Building A
  const balY = l.buildingA.y + 220;
  rect(ctx, l.buildingA.x + 20, balY, l.buildingA.width - 40, 50, PALETTE.buildingATrim);
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  for (let rx = l.buildingA.x + 30; rx < l.buildingA.x + l.buildingA.width - 30; rx += 14) {
    ctx.beginPath(); ctx.moveTo(rx, balY); ctx.lineTo(rx, balY + 50); ctx.stroke();
  }
  rect(ctx, l.buildingA.x + 40, balY - 18, 24, 30, PALETTE.ball); // Hanging shirt
  rect(ctx, l.buildingA.x + 85, balY - 18, 30, 34, PALETTE.buildingB); // Saree
  rect(ctx, l.buildingA.x + 135, balY - 18, 22, 26, PALETTE.roadLines); // Towel

  // 3. Building B (Blue apartment building)
  rect(ctx, l.buildingB.x, l.buildingB.y, l.buildingB.width, l.buildingB.height, PALETTE.buildingB);
  rect(ctx, l.buildingB.x - 6, l.buildingB.y, l.buildingB.width + 12, 16, PALETTE.buildingBTrim);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const wx = l.buildingB.x + 25 + c * 135;
      const wy = l.buildingB.y + 55 + r * 140;
      rect(ctx, wx - 6, wy - 8, 100, 10, PALETTE.buildingBTrim); // Sunshade
      rect(ctx, wx, wy, 88, 85, PALETTE.buildingBTrim);
      rect(ctx, wx + 6, wy + 6, 34, 73, PALETTE.asphalt);
      rect(ctx, wx + 48, wy + 6, 34, 73, PALETTE.asphalt);
    }
  }

  // 4. Far-right flanking building
  rect(ctx, 1130, bY + 10, 470, bH - 10, PALETTE.buildingATrim);
}

export function drawAuntyWindow(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const { width: w, height: h } = CONFIG.layout.window;
  rect(ctx, -6, -10, w + 12, 12, PALETTE.buildingATrim);
  rect(ctx, 0, 0, w, h, PALETTE.outlines);
  // Curtains
  ctx.fillStyle = PALETTE.roadLines;
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(26, 0); ctx.lineTo(16, h); ctx.lineTo(0, h); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w, 0); ctx.lineTo(w - 26, 0); ctx.lineTo(w - 16, h); ctx.lineTo(w, h); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Aunty Silhouette
  const cx = w / 2;
  ctx.fillStyle = PALETTE.outlines;
  ctx.beginPath(); ctx.arc(cx, h - 55, 16, 0, Math.PI * 2); ctx.fill(); // Head
  ctx.beginPath(); ctx.arc(cx - 10, h - 58, 8, 0, Math.PI * 2); ctx.fill(); // Hair bun
  ctx.beginPath(); ctx.ellipse(cx, h - 18, 28, 28, 0, 0, Math.PI * 2); ctx.fill(); // Torso
  ctx.strokeStyle = PALETTE.roadLines;
  ctx.beginPath(); ctx.arc(cx + 3, h - 55, 4, 0, Math.PI * 2); ctx.stroke(); // Glasses
  rect(ctx, -8, h - 8, w + 16, 12, PALETTE.buildingATrim); // Bottom sill
  ctx.restore();
}

export function drawStreetAndFootpath(ctx: CanvasRenderingContext2D): void {
  const { width: w } = CONFIG.world;
  const s = CONFIG.street;

  // Footpath (62% to 68%)
  rect(ctx, 0, s.footpathY, w, s.kerbY - s.footpathY, PALETTE.roadLines);
  // Kerb stone border
  rect(ctx, 0, s.kerbY, w, s.streetY - s.kerbY, PALETTE.buildingBTrim);

  // Street asphalt (68% to 100%)
  rect(ctx, 0, s.streetY, w, CONFIG.world.height - s.streetY, PALETTE.asphalt);
  rect(ctx, 0, s.streetY + 12, w, 8, PALETTE.outlines); // Gutter drain line

  // Faded pitch crease markings in street band
  ctx.strokeStyle = PALETTE.roadLines;
  ctx.lineWidth = 3;
  ctx.setLineDash([24, 18]);
  ctx.beginPath(); ctx.moveTo(460, s.groundY); ctx.lineTo(1100, s.groundY); ctx.stroke();
  ctx.setLineDash([]);
  // Batting crease
  rect(ctx, CONFIG.layout.batter.x - 25, s.groundY - 3, 50, 6, PALETTE.roadLines);
}

export function drawParkedCar(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  rect(ctx, 0, 26, 145, 42, PALETTE.buildingB);
  rect(ctx, 24, 0, 95, 30, PALETTE.buildingBTrim);
  rect(ctx, 28, 4, 28, 20, PALETTE.roadLines); // Windshield
  rect(ctx, 62, 4, 48, 20, PALETTE.roadLines); // Side window
  ctx.fillStyle = PALETTE.outlines;
  ctx.beginPath(); ctx.arc(30, 68, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(115, 68, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.roadLines;
  ctx.beginPath(); ctx.arc(30, 68, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(115, 68, 5, 0, Math.PI * 2); ctx.fill();
  rect(ctx, 137, 36, 8, 10, PALETTE.ball); // Tail light
  ctx.restore();
}

export function drawParkedScooter(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  rect(ctx, 38, 22, 68, 36, PALETTE.buildingA);
  rect(ctx, 48, 12, 50, 12, PALETTE.outlines);
  rect(ctx, 16, 14, 25, 44, PALETTE.buildingA);
  rect(ctx, 14, 0, 18, 14, PALETTE.buildingATrim);
  rect(ctx, 16, 3, 8, 8, PALETTE.roadLines);
  // Mirror
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(14, -14); ctx.stroke();
  ctx.fillStyle = PALETTE.roadLines;
  ctx.beginPath(); ctx.arc(12, -16, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Wheels
  ctx.fillStyle = PALETTE.outlines;
  ctx.beginPath(); ctx.arc(24, 62, 13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(90, 62, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.roadLines;
  ctx.beginPath(); ctx.arc(24, 62, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(90, 62, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawWickets(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  rect(ctx, -14, -28, 28, 28, PALETTE.wicketWood);
  rect(ctx, -14, -56, 28, 28, PALETTE.buildingATrim);
  rect(ctx, -14, -84, 28, 28, PALETTE.wicketWood);
  ctx.fillStyle = PALETTE.roadLines;
  ctx.fillRect(-10, -82, 4, 78); ctx.fillRect(-2, -82, 4, 78); ctx.fillRect(6, -82, 4, 78);
  rect(ctx, -12, -88, 24, 5, PALETTE.wicketWood);
  ctx.restore();
}

export function drawCricketBag(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  rect(ctx, -16, -50, 32, 50, PALETTE.ball);
  rect(ctx, -12, -36, 24, 7, PALETTE.outlines);
  rect(ctx, 3, -72, 7, 30, PALETTE.wicketWood);
  ctx.restore();
}

export function drawStrayDog(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = PALETTE.wicketWood;
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, 22, 13, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-14, 2, 9, 7, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PALETTE.buildingATrim;
  ctx.beginPath(); ctx.ellipse(-16, -2, 3, 6, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export function drawElectricPole(ctx: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  rect(ctx, 0, 0, 16, 490, PALETTE.asphalt);
  rect(ctx, -35, 45, 86, 10, PALETTE.asphalt);
  rect(ctx, -25, 95, 66, 9, PALETTE.asphalt);
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-340, 50); ctx.quadraticCurveTo(-150, 100, 0, 52); ctx.quadraticCurveTo(200, 110, 600, 70);
  ctx.moveTo(-340, 100); ctx.quadraticCurveTo(-160, 150, 0, 102); ctx.quadraticCurveTo(210, 160, 600, 120);
  ctx.stroke();
  ctx.restore();
}

export function createStaticSceneCanvas(): HTMLCanvasElement {
  const offscreen = document.createElement('canvas');
  offscreen.width = CONFIG.world.width;
  offscreen.height = CONFIG.world.height;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return offscreen;

  const l = CONFIG.layout;
  const s = CONFIG.street;

  drawSky(ctx, CONFIG.world.width, s.footpathY);
  drawSkyline(ctx, 0, l.skyline.y, 1);
  drawBuildings(ctx);
  drawAuntyWindow(ctx, l.window.x, l.window.y, 1);
  drawStreetAndFootpath(ctx);
  drawElectricPole(ctx, l.electricPole.x, l.electricPole.y, 1);
  drawParkedCar(ctx, l.car.x, l.car.y, 1);
  drawParkedScooter(ctx, l.scooter.x, l.scooter.y, 1);
  drawCricketBag(ctx, l.cricketBag.x, l.cricketBag.y, 1);
  drawWickets(ctx, l.wicket.x, l.wicket.y, 1);
  drawStrayDog(ctx, l.strayDog.x, l.strayDog.y, 1);

  return offscreen;
}
