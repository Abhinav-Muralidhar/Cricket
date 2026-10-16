/**
 * main.ts - Application entry point. Handles responsive full-window canvas,
 * devicePixelRatio backing store, debounced static scene rebuilds, and game loop.
 */

import { createInitialState, updateGame, handlePlayerSwing, cycleBatterPreviewClip } from './state.ts';
import { renderGame, computeCamera, rebuildStaticScene, type CameraViewport } from './render.ts';
import { InputManager } from './input.ts';

function initGame(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas element #game-canvas not found');

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Unable to obtain 2D canvas context');

  let camera: CameraViewport;
  let resizeTimer: number | null = null;

  function resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;

    // Backing store = CSS size * DPR for razor-sharp rendering
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    camera = computeCamera(cssW, cssH, dpr);

    // Debounced rebuild of static scene on resize
    if (resizeTimer !== null) window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      rebuildStaticScene();
      resizeTimer = null;
    }, 150);
  }

  // Initial sizing and camera setup
  resize();
  window.addEventListener('resize', resize);

  const state = createInitialState();

  // Input manager: clicks/taps anywhere trigger swing; D toggles debug; P previews poses
  new InputManager(canvas, {
    onAction: () => handlePlayerSwing(state),
    onDebugToggle: () => {
      state.debugMode = !state.debugMode;
    },
    onPreviewToggle: () => cycleBatterPreviewClip(state),
  });

  let lastTime = performance.now();

  function loop(currentTime: number): void {
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    updateGame(state, dt);
    renderGame(ctx!, state, camera);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
}

window.addEventListener('DOMContentLoaded', initGame);
