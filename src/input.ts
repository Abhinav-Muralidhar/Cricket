import { getSafeAreaInsets, isIOS } from './pwa.ts';

export interface InputHandlers {
  onAction: () => void;
  onDebugToggle: () => void;
  onPreviewToggle: () => void;
  onCycleTarget?: () => void;
  onNudgeTarget?: (dx: number, dy: number, dw: number, dh: number) => void;
  onTogglePoseEditor?: () => void;
  onCycleEditorCharacter?: () => void;
  onStepKeyframe?: (dir: -1 | 1) => void;
  isPoseEditorActive?: () => boolean;
  onDebugKey?: (code: string) => boolean;
  onCycle3DCharacter?: () => void;
  onNudge3DCharacter?: (dx: number, dy: number, dYaw: number) => void;
  onAudioToggle?: () => void;
  onFullscreenToggle?: () => void;
  onSettingsToggle?: () => void;
  onSettingsPointer?: (clientX: number, clientY: number) => boolean;
  isSettingsHover?: (clientX: number, clientY: number) => boolean;
  onGuidePointer?: (clientX: number, clientY: number) => boolean;
  isGuideHover?: (clientX: number, clientY: number) => boolean;
  onInstallClick?: () => void;
  is3DMode?: () => boolean;
  isTitleOrGameOver?: () => boolean;
  onAuthorClick?: () => void;
  onGameOverPointer?: (clientX: number, clientY: number) => boolean;
  isGameOverHover?: (clientX: number, clientY: number) => boolean;
  onMilestonePointer?: (clientX: number, clientY: number) => boolean;
  onMilestoneDismiss?: () => boolean;
  onTestMilestone?: () => void;
  isDebugActive?: () => boolean;
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
    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.handlers.isPoseEditorActive?.()) return;

      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left, clientY = e.clientY - rect.top;
      const insets = getSafeAreaInsets();
      const topPad = Math.max(18, insets.top + 10), rightPad = Math.max(18, insets.right + 12);
      const leftPad = Math.max(18, insets.left + 12), botPad = Math.max(20, insets.bottom + 12);
      const isTitleOrOver = !!this.handlers.isTitleOrGameOver?.();
      const showFs = !isIOS();
      const fsX = rect.width - rightPad - 36;

      if (isTitleOrOver && showFs && clientY >= topPad - 8 && clientY <= topPad + 44) {
        if (clientX >= fsX - 8 && clientX <= fsX + 44) { this.handlers.onFullscreenToggle?.(); return; }
      }

      if (this.handlers.onGuidePointer?.(clientX, clientY)) return;
      if (this.handlers.onSettingsPointer?.(clientX, clientY)) return;
      if (this.handlers.onMilestonePointer?.(clientX, clientY)) return;
      if (this.handlers.onGameOverPointer?.(clientX, clientY)) return;

      if (this.handlers.isTitleOrGameOver?.()) {
        const iw = 100, ih = 28, ix = rect.width - iw - rightPad, iy = rect.height - ih - botPad;
        if (clientX >= ix - 10 && clientX <= ix + iw + 10 && clientY >= iy - 8 && clientY <= iy + ih + 10) {
          this.handlers.onInstallClick?.();
        } else if (clientX >= leftPad - 10 && clientX <= leftPad + 220 && clientY >= rect.height - botPad - 16 && clientY <= rect.height - botPad + 16) {
          this.handlers.onAuthorClick?.();
        }
        return;
      }

      this.handlers.onAction();
    });

    this.canvas.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left, clientY = e.clientY - rect.top;
      const insets = getSafeAreaInsets();
      const topPad = Math.max(18, insets.top + 10), rightPad = Math.max(18, insets.right + 12);
      const leftPad = Math.max(18, insets.left + 12), botPad = Math.max(20, insets.bottom + 12);
      const isTitleOrOver = !!this.handlers.isTitleOrGameOver?.();
      const showFs = !isIOS();
      const fsX = rect.width - rightPad - 36;

      const isFs = isTitleOrOver && showFs && clientX >= fsX - 6 && clientX <= fsX + 42 && clientY >= topPad - 6 && clientY <= topPad + 42;
      const isAuthor = isTitleOrOver && clientX >= leftPad - 10 && clientX <= leftPad + 200 && clientY >= rect.height - botPad - 14;
      const isInstall = isTitleOrOver && clientX >= rect.width - 100 - rightPad - 10 && clientY >= rect.height - 28 - botPad - 6;
      const isOver = !!this.handlers.isGameOverHover?.(clientX, clientY);
      const isSet = !!this.handlers.isSettingsHover?.(clientX, clientY);
      const isGd = !!this.handlers.isGuideHover?.(clientX, clientY);

      this.canvas.style.cursor = isFs || isAuthor || isInstall || isOver || isSet || isGd ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('contextmenu', (e: MouseEvent) => e.preventDefault());

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      const inPoseEditor = !!this.handlers.isPoseEditorActive?.();

      if (e.code === 'KeyM') { e.preventDefault(); this.handlers.onAudioToggle?.(); return; }
      if (e.code === 'KeyF') { if (isIOS()) return; e.preventDefault(); this.handlers.onFullscreenToggle?.(); return; }
      if (e.code === 'KeyE') { e.preventDefault(); this.handlers.onTogglePoseEditor?.(); return; }
      if (e.code === 'KeyC') { if (!this.handlers.isDebugActive?.()) return; e.preventDefault(); this.handlers.onTestMilestone?.(); return; }

      if (inPoseEditor) {
        if (e.code === 'Tab') { e.preventDefault(); this.handlers.onCycleEditorCharacter?.(); }
        else if (e.code === 'ArrowLeft') { e.preventDefault(); this.handlers.onStepKeyframe?.(-1); }
        else if (e.code === 'ArrowRight') { e.preventDefault(); this.handlers.onStepKeyframe?.(1); }
        return;
      }

      if (this.handlers.onDebugKey?.(e.code)) { e.preventDefault(); return; }
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.handlers.onMilestoneDismiss?.()) { e.preventDefault(); return; }
      }
      if (e.code === 'Space') { e.preventDefault(); this.handlers.onAction(); }
      else if (e.code === 'KeyD') { e.preventDefault(); this.handlers.onDebugToggle(); }
      else if (e.code === 'KeyP') { e.preventDefault(); this.handlers.onPreviewToggle(); }
      else if (e.code === 'Tab' || e.code === 'KeyT') {
        e.preventDefault();
        if (this.handlers.is3DMode?.() && this.handlers.onCycle3DCharacter) this.handlers.onCycle3DCharacter();
        else if (this.handlers.onCycleTarget) this.handlers.onCycleTarget();
      } else if (e.code.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        if (this.handlers.is3DMode?.() && this.handlers.onNudge3DCharacter) {
          let dx = 0, dy = 0, dYaw = 0;
          if (e.altKey) {
            if (e.code === 'ArrowLeft') dYaw = -0.05 * step;
            else if (e.code === 'ArrowRight') dYaw = 0.05 * step;
          } else {
            if (e.code === 'ArrowLeft') dx = -2 * step; else if (e.code === 'ArrowRight') dx = 2 * step;
            else if (e.code === 'ArrowUp') dy = -2 * step; else if (e.code === 'ArrowDown') dy = 2 * step;
          }
          this.handlers.onNudge3DCharacter(dx, dy, dYaw);
        } else if (this.handlers.onNudgeTarget) {
          let dx = 0, dy = 0, dw = 0, dh = 0;
          if (e.altKey) {
            if (e.code === 'ArrowLeft') dw = -step; else if (e.code === 'ArrowRight') dw = step;
            else if (e.code === 'ArrowUp') dh = -step; else if (e.code === 'ArrowDown') dh = step;
          } else {
            if (e.code === 'ArrowLeft') dx = -step; else if (e.code === 'ArrowRight') dx = step;
            else if (e.code === 'ArrowUp') dy = -step; else if (e.code === 'ArrowDown') dy = step;
          }
          this.handlers.onNudgeTarget(dx, dy, dw, dh);
        }
      }
    });
  }
}
