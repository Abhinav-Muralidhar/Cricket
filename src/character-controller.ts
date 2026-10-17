/**
 * character-controller.ts - Controls an individual 3D character instance:
 * manages AnimationMixer transitions, cross-fades, yaw, scaling, and positioning.
 */

import * as THREE from 'three';
import type { LoadedCharacterInstance } from './model-loader.ts';

export class CharacterController3D {
  public group: THREE.Group;
  public instance: LoadedCharacterInstance;
  public currentActionName = '';
  public configScale: number;
  public yaw: number;
  public isLeftHanded: boolean;
  private currentAction: THREE.AnimationAction | null = null;
  private onFinishedCallback: (() => void) | null = null;

  constructor(
    instance: LoadedCharacterInstance,
    options: { yaw?: number; scale?: number; isLeftHanded?: boolean } = {}
  ) {
    this.instance = instance;
    this.group = instance.group;
    this.yaw = options.yaw ?? 0;
    this.configScale = options.scale ?? 1.0;
    this.isLeftHanded = options.isLeftHanded ?? false;

    this.applyTransform();

    // Listen for one-shot clip completions to return to idle
    this.instance.mixer.addEventListener('finished', () => {
      if (this.onFinishedCallback) {
        const cb = this.onFinishedCallback;
        this.onFinishedCallback = null;
        cb();
      } else if (this.currentActionName !== 'idle') {
        this.playClip('idle', { loop: true, crossFadeDuration: 0.25 });
      }
    });
  }

  public applyTransform(): void {
    // 200 world units tall * configScale
    const s = (200 * this.configScale) / this.instance.baseHeight;
    this.group.scale.set(this.isLeftHanded ? -s : s, s, s);
    this.group.rotation.y = this.yaw;
  }

  public setPosition(worldX: number, worldY: number, z = 0): void {
    // 2D: top-left (0,0), bottom is y=800. 3D: feet at (worldX, 800 - worldY, z)
    this.group.position.set(worldX, 800 - worldY, z);
  }

  public setYaw(yaw: number): void {
    this.yaw = yaw;
    this.group.rotation.y = yaw;
  }

  public playClip(
    name: string,
    options: {
      loop?: boolean;
      timeScale?: number;
      startTime?: number;
      crossFadeDuration?: number;
      onFinished?: () => void;
    } = {}
  ): void {
    const nextAction = this.instance.actions.get(name);
    if (!nextAction) return;

    const crossFade = options.crossFadeDuration ?? 0.15;
    this.onFinishedCallback = options.onFinished ?? null;

    if (this.currentAction && this.currentAction !== nextAction) {
      nextAction.reset();
      nextAction.enabled = true;
      if (options.startTime !== undefined) nextAction.time = options.startTime;
      nextAction.setEffectiveTimeScale(options.timeScale ?? 1.0);
      nextAction.setEffectiveWeight(1.0);

      if (options.loop) {
        nextAction.setLoop(THREE.LoopRepeat, Infinity);
        nextAction.clampWhenFinished = false;
      } else {
        nextAction.setLoop(THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = true;
      }

      this.currentAction.crossFadeTo(nextAction, crossFade, true);
      nextAction.play();
    } else {
      nextAction.reset();
      if (options.startTime !== undefined) nextAction.time = options.startTime;
      nextAction.setEffectiveTimeScale(options.timeScale ?? 1.0);
      nextAction.setEffectiveWeight(1.0);

      if (options.loop) {
        nextAction.setLoop(THREE.LoopRepeat, Infinity);
        nextAction.clampWhenFinished = false;
      } else {
        nextAction.setLoop(THREE.LoopOnce, 1);
        nextAction.clampWhenFinished = true;
      }

      nextAction.play();
    }

    this.currentAction = nextAction;
    this.currentActionName = name;
  }

  public playIdle(randomOffset = true): void {
    this.playClip('idle', { loop: true });
    if (randomOffset && this.currentAction) {
      const clip = this.currentAction.getClip();
      this.currentAction.time = Math.random() * (clip?.duration ?? 1.0);
    }
  }

  public playRun(): void {
    this.playClip('run', { loop: true, crossFadeDuration: 0.15 });
  }

  public playPitch(onFinished?: () => void): void {
    this.playClip('pitch', { loop: false, crossFadeDuration: 0.1, onFinished });
  }

  public playSwing(startTime = 0.18, timeScale = 1.3, onFinished?: () => void): void {
    this.playClip('swing', { loop: false, startTime, timeScale, crossFadeDuration: 0.08, onFinished });
  }

  public playDefeated(): void {
    this.playClip('defeated', { loop: false, crossFadeDuration: 0.2 });
  }

  public playCheer(): void {
    this.playClip('cheer', { loop: false, crossFadeDuration: 0.15 });
  }

  public playClap(): void {
    this.playClip('clap', { loop: false, crossFadeDuration: 0.15 });
  }

  public playDive(onFinished?: () => void): void {
    this.playClip('dive', { loop: false, crossFadeDuration: 0.15, onFinished });
  }

  public playSlide(onFinished?: () => void): void {
    this.playClip('slide', { loop: false, crossFadeDuration: 0.15, onFinished });
  }

  public update(dt: number): void {
    this.instance.mixer.update(dt);
  }
}
