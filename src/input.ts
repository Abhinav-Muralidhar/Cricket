/**
 * input.ts - Handles user taps, mouse clicks, keyboard space, and debug toggles.
 */

export interface InputHandlers {
  onAction: () => void;
  onDebugToggle: () => void;
  onPreviewToggle: () => void;
}

export class InputManager {
  private handlers: InputHandlers;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, handlers: InputHandlers) {
    this.canvas = canvas;
    this.handlers = handlers;
    this.setupListeners();
  }

  private setupListeners(): void {
    // 1. Pointer input (Mouse click / Mobile touch)
    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const canvasX = (clientX / rect.width) * this.canvas.width;
      const canvasY = (clientY / rect.height) * this.canvas.height;

      // Debug toggle touch region: top right corner (x: 560..710, y: 15..75)
      if (canvasX >= 560 && canvasX <= 710 && canvasY >= 15 && canvasY <= 75) {
        this.handlers.onDebugToggle();
        return;
      }

      this.handlers.onAction();
    });

    this.canvas.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
    });

    // 2. Keyboard input: Space (Swing), 'D' (Debug window), 'P' (Preview batter clips)
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.handlers.onAction();
      } else if (e.code === 'KeyD') {
        e.preventDefault();
        this.handlers.onDebugToggle();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        this.handlers.onPreviewToggle();
      }
    });
  }
}
