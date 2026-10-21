/**
 * character-controller.ts - Controls an individual 3D character instance:
 * manages AnimationMixer transitions, cross-fades, yaw, scaling, and positioning.
 */

import * as THREE from 'three';
import { CONFIG } from './config.ts';
import { findBone, type LoadedCharacterInstance } from './model-loader.ts';

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
        this.playIdle();
      }
    });
  }

  public applyTransform(depthScale = 1.0): void {
    // 200 world units tall * configScale * depthScale
    const s = (200 * this.configScale * depthScale) / this.instance.baseHeight;
    this.group.scale.set(this.isLeftHanded ? -s : s, s, s);
    this.group.rotation.y = this.yaw;
  }

  public setPosition(worldX: number, worldY: number, z = 0): void {
    // Fielder y varies slightly for depth, and scale with a depth factor by y
    const depthScale = Math.max(0.7, 1.0 + (worldY - 690) * 0.0012);
    this.applyTransform(depthScale);
    const depthZ = z !== 0 ? z : (worldY - 690) * 0.45;
    this.group.position.set(worldX, 800 - worldY, depthZ);
  }

  public getBone2DPosition(boneName: string): { x: number; y: number } | null {
    const bone = findBone(this.group, boneName);
    if (!bone) return null;
    this.group.updateMatrixWorld(true);
    const pos = new THREE.Vector3();
    bone.getWorldPosition(pos);
    return { x: pos.x, y: 800 - pos.y };
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

  public playStance(): void {
    if (this.instance.actions.has('battingStance')) {
      this.playClip('battingStance', { loop: true, timeScale: 0.35, crossFadeDuration: 0.15 });
    } else {
      this.playIdle(false);
    }
  }

  public playIdle(randomOffset = true): void {
    this.playClip('idle', { loop: true, timeScale: 1.0, crossFadeDuration: 0.2 });
    if (randomOffset && this.currentAction) {
      const clip = this.currentAction.getClip();
      this.currentAction.time = Math.random() * (clip?.duration ?? 1.0);
    }
  }

  public playRun(): void {
    this.playClip('run', { loop: true, crossFadeDuration: 0.15 });
  }

  public playPitch(startTime = 0.0, timeScale = 1.9, onFinished?: () => void): void {
    this.playClip('pitch', {
      loop: false,
      startTime,
      timeScale,
      crossFadeDuration: 0.1,
      onFinished: () => {
        this.playIdle(true);
        if (onFinished) onFinished();
      },
    });
  }

  public playSwing(startTime = CONFIG.swingStartOffset, timeScale = CONFIG.swingTimeScale, onFinished?: () => void): void {
    this.playClip('swing', {
      loop: false,
      startTime,
      timeScale,
      crossFadeDuration: 0.01,
      onFinished: () => {
        this.playIdle(false);
        if (onFinished) onFinished();
      },
    });
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
