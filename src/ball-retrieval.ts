/**
 * ball-retrieval.ts - Manages cosmetic ball handling:
 * 1. Attaching ball to bowler's right hand before release.
 * 2. Nearest fielder chase, pickup (slide/dive), throw (pitch), and ball return arc.
 */

import { CONFIG } from './config.ts';
import type { GameState } from './types.ts';
import type { CharacterController3D } from './character-controller.ts';

type RetrievalPhase = 'IDLE' | 'RUN_TO_BALL' | 'PICKUP' | 'THROW' | 'BALL_ARC' | 'RETURN_HOME';

export class BallRetrievalManager {
  private phase: RetrievalPhase = 'IDLE';
  private timer = 0;
  private chaserKey: 'fielder1' | 'fielder2' | 'fielder3' = 'fielder1';
  private targetPos = { x: 0, y: 0 };
  private startFielderPos = { x: 0, y: 0 };
  private throwStartPos = { x: 0, y: 0 };
  private isBallHidden = false;
  private loggedBowlerBone = false;

  public update(
    dt: number,
    state: GameState,
    characters: Map<string, CharacterController3D>
  ): void {
    const bowler = characters.get('bowler');

    // 1. Bowler holds ball before delivery release
    if (state.state === 'BOWLING' && !state.isBallReleased && bowler) {
      const handPos = bowler.getBone2DPosition('mixamorig:RightHand') || bowler.getBone2DPosition('RightHand');
      if (handPos) {
        if (!this.loggedBowlerBone) {
          const bone = bowler.instance.group.getObjectByName('mixamorigRightHand') ||
            bowler.instance.group.getObjectByName('mixamorig:RightHand');
          console.log(`[3D] Attached ball to bowler bone: "${bone?.name ?? 'mixamorig:RightHand'}"`);
          this.loggedBowlerBone = true;
        }
        state.ball.x = handPos.x;
        state.ball.y = handPos.y;
        state.ball.active = true;
      }
      return;
    }

    // 2. Fielder retrieval sequence
    if (this.phase === 'IDLE') return;

    this.timer += dt;
    const chaser = characters.get(this.chaserKey);
    const home = CONFIG.layout[this.chaserKey];
    const bowlerHome = CONFIG.layout.bowler;
    if (!chaser) return;

    switch (this.phase) {
      case 'RUN_TO_BALL': {
        const progress = Math.min(1, this.timer / 0.5);
        chaser.setYaw(this.targetPos.x > chaser.group.position.x ? -Math.PI / 2 : Math.PI / 2);
        const curX = this.startFielderPos.x + (this.targetPos.x - this.startFielderPos.x) * progress;
        const curY = this.startFielderPos.y + (this.targetPos.y - this.startFielderPos.y) * progress;
        chaser.setPosition(curX, curY);

        if (this.isBallHidden) {
          state.ball.active = false;
        }

        if (progress >= 1) {
          this.phase = 'PICKUP';
          this.timer = 0;
          chaser.playClip('slide', { loop: false, crossFadeDuration: 0.1 });
        }
        break;
      }

      case 'PICKUP': {
        if (this.timer >= 0.35) {
          this.phase = 'THROW';
          this.timer = 0;
          // Face bowler
          chaser.setYaw(bowlerHome.x > chaser.group.position.x ? -Math.PI / 2 : Math.PI / 2);
          chaser.playPitch(1.4, 2.0);
        }
        break;
      }

      case 'THROW': {
        if (this.timer >= 0.35) {
          this.phase = 'BALL_ARC';
          this.timer = 0;
          const handPos = chaser.getBone2DPosition('mixamorig:RightHand') || chaser.getBone2DPosition('RightHand');
          this.throwStartPos = handPos ? { ...handPos } : { x: chaser.group.position.x, y: 800 - chaser.group.position.y };
          state.ball.active = true;
        }
        break;
      }

      case 'BALL_ARC': {
        const arcProgress = Math.min(1, this.timer / 0.6);
        const bHand = bowler?.getBone2DPosition('mixamorig:RightHand') || bowlerHome;
        state.ball.x = this.throwStartPos.x + (bHand.x - this.throwStartPos.x) * arcProgress;
        state.ball.y = this.throwStartPos.y + (bHand.y - this.throwStartPos.y) * arcProgress - 75 * 4 * arcProgress * (1 - arcProgress);

        if (arcProgress >= 1) {
          this.phase = 'RETURN_HOME';
          this.timer = 0;
          state.ball.x = bHand.x;
          state.ball.y = bHand.y;
          state.isWaitingForBall = false;
          chaser.setYaw(home.x > chaser.group.position.x ? -Math.PI / 2 : Math.PI / 2);
          chaser.playClip('run', { loop: true });
        }
        break;
      }

      case 'RETURN_HOME': {
        const progress = Math.min(1, this.timer / 0.45);
        const curX = this.targetPos.x + (home.x - this.targetPos.x) * progress;
        const curY = this.targetPos.y + (home.y - this.targetPos.y) * progress;
        chaser.setPosition(curX, curY);

        if (progress >= 1) {
          chaser.setPosition(home.x, home.y);
          chaser.setYaw(CONFIG.characters3D[this.chaserKey]?.yaw ?? -Math.PI / 2);
          chaser.playIdle(true);
          this.phase = 'IDLE';
        }
        break;
      }
    }
  }

  public triggerRetrieval(
    state: GameState,
    characters: Map<string, CharacterController3D>
  ): void {
    const outcome = state.lastResult?.outcome;
    if (!outcome) return;

    // Trigger for hits: FOUR, SIX, SINGLE, WINDOW, CAR_GLASS, SCOOTER
    const hitOutcomes = ['FOUR', 'SIX', 'SINGLE', 'WINDOW', 'CAR_GLASS', 'SCOOTER'];
    if (!hitOutcomes.includes(outcome)) return;

    const rawTarget = state.ball.target ?? { x: state.ball.x, y: state.ball.y };
    // Clamp landing point within accessible asphalt lane
    this.targetPos = {
      x: Math.max(200, Math.min(1400, rawTarget.x)),
      y: Math.max(665, Math.min(745, rawTarget.y)),
    };

    // Pick nearest fielder
    const fielders: ('fielder1' | 'fielder2' | 'fielder3')[] = ['fielder1', 'fielder2', 'fielder3'];
    let bestDist = Infinity;
    let chosen: 'fielder1' | 'fielder2' | 'fielder3' = 'fielder1';

    for (const key of fielders) {
      const home = CONFIG.layout[key];
      const d = Math.hypot(home.x - this.targetPos.x, home.y - this.targetPos.y);
      if (d < bestDist) {
        bestDist = d;
        chosen = key;
      }
    }

    this.chaserKey = chosen;
    const chaser = characters.get(chosen);
    if (!chaser) return;

    const home = CONFIG.layout[chosen];
    this.startFielderPos = { x: home.x, y: home.y };
    this.isBallHidden = outcome === 'SIX' || outcome === 'WINDOW' || outcome === 'CAR_GLASS' || outcome === 'SCOOTER';

    this.phase = 'RUN_TO_BALL';
    this.timer = 0;
    state.isWaitingForBall = true;
    chaser.playClip('run', { loop: true });
  }

  public isRetrievalActive(): boolean {
    return this.phase !== 'IDLE';
  }
}
