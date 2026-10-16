/**
 * main.ts - Application entry point. Sets up the canvas, initializes input
 * handlers, and runs the requestAnimationFrame game loop with delta time.
 */

import { CONFIG } from './config.ts';
import { createInitialState, updateGame, handlePlayerSwing } from './state.ts';
import { renderGame } from './render.ts';
import { InputManager } from './input.ts';

function initGame(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element #game-canvas not found');
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to obtain 2D canvas context');
  }

  // Set internal virtual resolution (portrait-friendly 9:16 reference)
  canvas.width = CONFIG.canvas.width;
  canvas.height = CONFIG.canvas.height;

  // Initialize modular game state
  const state = createInitialState();

  // Set up unified input manager (tap, click, space, and debug toggle 'D')
  new InputManager(canvas, {
    onAction: () => {
      handlePlayerSwing(state);
    },
    onDebugToggle: () => {
      state.debugMode = !state.debugMode;
    },
  });

  // Track timestamps for frame-rate independent delta time
  let lastTime = performance.now();

  function loop(currentTime: number): void {
    // Delta time in seconds
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // 1. Advance game physics and state transitions
    updateGame(state, dt);

    // 2. Render all scene elements, rigs, and debug overlays
    renderGame(ctx!, state);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame((time) => {
    lastTime = time;
    loop(time);
  });
}

// Start game after DOM is loaded
window.addEventListener('DOMContentLoaded', initGame);
