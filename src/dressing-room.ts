/**
 * dressing-room.ts - Coordinates Dressing Room UI, camera framing, turntable auto-rotate, and profile persistence.
 */

import { DressingRoomDOM } from './dressing-room-dom.ts';
import { getStoredProfile, saveStoredProfile, type BatterProfile } from './profile.ts';
import type { Characters3DManager } from './characters3d.ts';
import type { CameraViewport } from './render.ts';

export class DressingRoom {
  private dom: DressingRoomDOM;
  private c3d: Characters3DManager;
  private savedProfile: BatterProfile = getStoredProfile();
  private isOpen = false;
  private onPlayGame: () => void;
  private onCloseCallback?: () => void;
  private threeCanvas: HTMLElement | null;
  private resumeTimer: number | null = null;
  private autoRotatePaused = false;

  constructor(characters3D: Characters3DManager, onPlayGame: () => void, onClose?: () => void) {
    this.c3d = characters3D;
    this.onPlayGame = onPlayGame;
    this.onCloseCallback = onClose;
    this.threeCanvas = document.getElementById('three-canvas');

    this.dom = new DressingRoomDOM({
      onProfileChange: (p) => {
        this.c3d.applyCustomization(p);
      },
      onSaveAndPlay: () => {
        const finalProfile = this.dom.getProfile();
        saveStoredProfile(finalProfile);
        this.savedProfile = { ...finalProfile };
        this.c3d.applyCustomization(finalProfile);
        this.close();
        this.onPlayGame();
      },
      onCancel: () => {
        this.c3d.applyCustomization(this.savedProfile);
        this.close();
      },
      onCategoryChange: () => {
        // Character stays framed consistently at gameplay size
      },
      onRotateDrag: (dx) => {
        this.c3d.rotateBatter(dx * 0.015);
      },
      onDragStart: () => {
        this.c3d.isDraggingBatter = true;
        this.autoRotatePaused = true;
        if (this.resumeTimer !== null) {
          clearTimeout(this.resumeTimer);
          this.resumeTimer = null;
        }
      },
      onDragEnd: () => {
        this.c3d.isDraggingBatter = false;
        if (this.resumeTimer !== null) clearTimeout(this.resumeTimer);
        this.resumeTimer = window.setTimeout(() => {
          this.autoRotatePaused = false;
          this.resumeTimer = null;
        }, 2000);
      },
      onBatterTap: () => {
        this.c3d.triggerBatterShot();
      },
    });
  }

  public open(cam: CameraViewport): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.autoRotatePaused = false;
    this.savedProfile = getStoredProfile();

    if (this.threeCanvas) {
      this.threeCanvas.classList.add('dr-active');
    }

    this.c3d.setDressingRoomMode(true, cam);
    this.c3d.applyCustomization(this.savedProfile);
    this.dom.show(this.savedProfile);
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.resumeTimer !== null) {
      clearTimeout(this.resumeTimer);
      this.resumeTimer = null;
    }
    this.dom.hide();

    if (this.threeCanvas) {
      this.threeCanvas.classList.remove('dr-active');
    }

    this.c3d.setDressingRoomMode(false);
    if (this.onCloseCallback) this.onCloseCallback();
  }

  public get active(): boolean {
    return this.isOpen;
  }

  public isAutoRotateActive(): boolean {
    return this.isOpen && !this.autoRotatePaused && !this.c3d.isDraggingBatter;
  }
}
