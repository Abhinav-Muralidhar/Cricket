/**
 * scene-buildings.ts - Renders the continuous row of 7 diverse Indian lane buildings,
 * ground-floor shops (kirana, chai tapri, pharmacy, tailor), and Aunty's distinct window.
 */

import { CONFIG, PALETTE } from './config.ts';

function r(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawAC(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  r(ctx, x, y, 32, 22, PALETTE.roadLines);
  ctx.fillStyle = PALETTE.outlines;
  ctx.beginPath(); ctx.arc(x + 10, y + 11, 6, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + 20, y + 6 + i * 4, 8, 2);
  }
}

function drawDish(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(x + 12, y); ctx.stroke();
  ctx.fillStyle = PALETTE.roadLines;
  ctx.beginPath(); ctx.ellipse(x + 14, y, 6, 12, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  r(ctx, x - 5, y + 4, 10, 8, PALETTE.brick);
  ctx.fillStyle = PALETTE.leafGreen;
  ctx.beginPath(); ctx.arc(x, y + 2, 6, 0, Math.PI * 2); ctx.fill();
}

export function drawAuntyWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  r(ctx, x - 8, y - 10, w + 16, 12, PALETTE.buildingATrim);
  r(ctx, x, y, w, h, PALETTE.outlines);
  // Billowing white curtains
  ctx.fillStyle = PALETTE.roadLines;
  ctx.strokeStyle = PALETTE.outlines;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 28, y); ctx.lineTo(x + 18, y + h); ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w - 28, y); ctx.lineTo(x + w - 18, y + h); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill(); ctx.stroke();
  // Aunty Silhouette
  const cx = x + w / 2;
  ctx.fillStyle = PALETTE.outlines;
  ctx.beginPath(); ctx.arc(cx, y + h - 60, 18, 0, Math.PI * 2); ctx.fill(); // Head
  ctx.beginPath(); ctx.arc(cx - 12, y + h - 64, 9, 0, Math.PI * 2); ctx.fill(); // Bun
  ctx.beginPath(); ctx.ellipse(cx, y + h - 18, 32, 32, 0, 0, Math.PI * 2); ctx.fill(); // Torso
  ctx.strokeStyle = PALETTE.roadLines;
  ctx.beginPath(); ctx.arc(cx + 4, y + h - 60, 5, 0, Math.PI * 2); ctx.stroke(); // Glasses
  r(ctx, x - 10, y + h - 10, w + 20, 14, PALETTE.buildingATrim);
}

export function drawBuildingRow(ctx: CanvasRenderingContext2D): void {
  const fY = CONFIG.street.footpathY;
  const l = CONFIG.layout;

  // B1: Mint Residential (x=0, w=185)
  r(ctx, 0, 130, 185, fY - 130, PALETTE.mint);
  r(ctx, -5, 130, 195, 12, PALETTE.mintTrim);
  drawAC(ctx, 130, 180);
  for (let i = 0; i < 2; i++) {
    r(ctx, 25 + i * 75, 160, 48, 55, PALETTE.mintTrim);
    r(ctx, 28 + i * 75, 164, 42, 47, PALETTE.asphaltDark);
    r(ctx, 25 + i * 75, 270, 48, 65, PALETTE.mintTrim);
    r(ctx, 28 + i * 75, 274, 42, 57, PALETTE.asphaltDark);
  }

  // B2: Peach Building + Kirana Store (x=185, w=155)
  r(ctx, 185, 140, 155, fY - 140, PALETTE.peach);
  r(ctx, 180, 140, 165, 12, PALETTE.peachTrim);
  drawPlant(ctx, 230, 240);
  r(ctx, 215, 185, 45, 55, PALETTE.peachTrim);
  r(ctx, 218, 188, 39, 49, PALETTE.outlines);
  // Kirana Store: Board + Shutter + Chips packets
  r(ctx, 195, 360, 135, 26, PALETTE.buildingA); // Yellow board
  ctx.fillStyle = PALETTE.ball;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('KIRANA', 235, 378);
  r(ctx, 200, 388, 125, fY - 388, PALETTE.roadLines); // Shutter
  for (let sY = 400; sY < fY - 5; sY += 14) {
    ctx.strokeStyle = PALETTE.outlines; ctx.beginPath(); ctx.moveTo(200, sY); ctx.lineTo(325, sY); ctx.stroke();
  }
  // Hanging snacks
  for (let k = 0; k < 4; k++) {
    r(ctx, 312, 395 + k * 16, 9, 12, k % 2 === 0 ? PALETTE.ball : PALETTE.buildingA);
  }

  // B3: Aunty's Signature Building (x=340, w=290) - visually distinct on leg side
  r(ctx, l.buildingA.x, l.buildingA.y, l.buildingA.width, l.buildingA.height, PALETTE.buildingA);
  r(ctx, l.buildingA.x - 6, l.buildingA.y, l.buildingA.width + 12, 16, PALETTE.buildingATrim);
  drawDish(ctx, l.buildingA.x + 35, l.buildingA.y - 10);
  drawAuntyWindow(ctx, l.window.x, l.window.y, l.window.width, l.window.height);
  // Wide Balcony with grill & hanging clothes
  const balY = 380;
  r(ctx, l.buildingA.x + 20, balY, l.buildingA.width - 40, 52, PALETTE.buildingATrim);
  for (let bx = l.buildingA.x + 30; bx < l.buildingA.x + l.buildingA.width - 25; bx += 14) {
    ctx.strokeStyle = PALETTE.outlines; ctx.beginPath(); ctx.moveTo(bx, balY); ctx.lineTo(bx, balY + 52); ctx.stroke();
  }
  r(ctx, l.buildingA.x + 40, balY - 22, 26, 34, PALETTE.ball); // Shirt
  r(ctx, l.buildingA.x + 85, balY - 22, 34, 38, PALETTE.buildingB); // Saree
  r(ctx, l.buildingA.x + 140, balY - 22, 24, 28, PALETTE.roadLines); // Towel
  r(ctx, l.buildingA.x + 185, balY - 22, 28, 36, PALETTE.buildingBTrim); // Pants

  // B4: Blue Building + Chai Tapri (x=660, w=260)
  r(ctx, 660, 100, 260, fY - 100, PALETTE.buildingB);
  r(ctx, 655, 100, 270, 14, PALETTE.buildingBTrim);
  drawAC(ctx, 840, 145);
  for (let c = 0; c < 2; c++) {
    r(ctx, 690 + c * 95, 140, 68, 70, PALETTE.buildingBTrim);
    r(ctx, 694 + c * 95, 144, 60, 62, PALETTE.asphaltDark);
    r(ctx, 690 + c * 95, 245, 68, 70, PALETTE.buildingBTrim);
    r(ctx, 694 + c * 95, 249, 60, 62, PALETTE.roadLines);
  }
  // Chai Tapri
  r(ctx, 680, 375, 150, 22, PALETTE.brick);
  ctx.fillStyle = PALETTE.roadLines;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('CHAI POINT', 720, 390);
  r(ctx, 690, 400, 130, fY - 400, PALETTE.buildingBTrim);
  r(ctx, 705, 415, 22, 25, PALETTE.roadLines); // Kettle
  r(ctx, 740, 420, 18, 14, PALETTE.buildingA);  // Glasses

  // B5: Brick Building + Pharmacy (x=920, w=220)
  r(ctx, 920, 120, 220, fY - 120, PALETTE.brick);
  r(ctx, 915, 120, 230, 14, PALETTE.brickTrim);
  drawDish(ctx, 1090, 160);
  for (let c = 0; c < 2; c++) {
    r(ctx, 945 + c * 85, 160, 58, 65, PALETTE.brickTrim);
    r(ctx, 948 + c * 85, 163, 52, 59, PALETTE.asphaltDark);
  }
  // Pharmacy: Green cross
  r(ctx, 935, 365, 110, 22, PALETTE.buildingCream);
  ctx.fillStyle = PALETTE.leafGreen;
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('✚ PHARMACY', 945, 381);
  r(ctx, 945, 390, 90, fY - 390, PALETTE.roadLines);

  // B6: Faded Pink + Tailor Shop (x=1140, w=210)
  r(ctx, 1140, 135, 210, fY - 135, PALETTE.fadedPink);
  r(ctx, 1135, 135, 220, 14, PALETTE.pinkTrim);
  drawAC(ctx, 1280, 170);
  r(ctx, 1170, 175, 60, 68, PALETTE.pinkTrim);
  r(ctx, 1174, 179, 52, 60, PALETTE.roadLines);
  // Tailor sign
  r(ctx, 1160, 370, 130, 22, PALETTE.buildingBTrim);
  ctx.fillStyle = PALETTE.roadLines;
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('TAILOR SHOP', 1185, 385);
  r(ctx, 1170, 394, 110, fY - 394, PALETTE.asphaltLight);

  // B7: Cream Building (x=1350, w=250)
  r(ctx, 1350, 115, 250, fY - 115, PALETTE.buildingCream);
  r(ctx, 1345, 115, 260, 14, PALETTE.creamTrim);
  for (let c = 0; c < 2; c++) {
    r(ctx, 1380 + c * 90, 160, 60, 70, PALETTE.creamTrim);
    r(ctx, 1384 + c * 90, 164, 52, 62, PALETTE.asphaltDark);
  }
}
