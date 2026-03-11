import { Container, Graphics } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import { Airplane } from './airplane';

/**
 * Trail renderer – draws colored smoke behind the airplane.
 */
export class TrailRenderer {
  container = new Container();

  draw(airplane: Airplane) {
    this.container.removeChildren();
    const g = new Graphics();
    const trail = airplane.trail;

    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      if (t.alpha <= 0) continue;
      const size = (1 - i / trail.length) * 8;
      const color = airplane.boosting ? this.rainbowColor(i) : 0xb3e5fc;
      g.circle(t.x, t.y, size).fill({ color, alpha: Math.max(0, t.alpha * 0.6) });
    }
    this.container.addChild(g);
  }

  private rainbowColor(idx: number): number {
    const colors = [0xff1744, 0xff9100, 0xffea00, 0x00e676, 0x00b0ff, 0xd500f9];
    return colors[idx % colors.length];
  }
}

/**
 * Speed lines effect during boost.
 */
export class SpeedLines {
  container = new Container();
  private lines: { x: number; y: number; len: number; speed: number }[] = [];

  show() {
    if (this.lines.length < 20) {
      for (let i = 0; i < 20; i++) {
        this.lines.push({
          x: GAME_WIDTH + Math.random() * 200,
          y: Math.random() * GAME_HEIGHT,
          len: 30 + Math.random() * 60,
          speed: 10 + Math.random() * 15,
        });
      }
    }
  }

  hide() {
    this.lines = [];
    this.container.removeChildren();
  }

  update() {
    this.container.removeChildren();
    if (this.lines.length === 0) return;

    const g = new Graphics();
    for (const l of this.lines) {
      l.x -= l.speed;
      if (l.x < -l.len) {
        l.x = GAME_WIDTH + Math.random() * 100;
        l.y = Math.random() * GAME_HEIGHT;
      }
      g.moveTo(l.x, l.y).lineTo(l.x + l.len, l.y).stroke({ color: 0xffffff, width: 1, alpha: 0.4 });
    }
    this.container.addChild(g);
  }
}

/**
 * Confetti particle effect for goal.
 */
export class Confetti {
  container = new Container();
  private particles: { x: number; y: number; vx: number; vy: number; color: number; size: number; life: number }[] = [];

  burst(cx: number, cy: number) {
    const colors = [0xff1744, 0xffd600, 0x00e676, 0x2979ff, 0xd500f9, 0xff6d00];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
        life: 1,
      });
    }
  }

  update() {
    this.container.removeChildren();
    if (this.particles.length === 0) return;

    const g = new Graphics();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.life -= 0.01;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      g.rect(p.x, p.y, p.size, p.size * 0.6).fill({ color: p.color, alpha: p.life });
    }
    this.container.addChild(g);
  }

  get active() { return this.particles.length > 0; }

  reset() { this.particles = []; this.container.removeChildren(); }
}

/**
 * Screen shake effect.
 */
export class ScreenShake {
  private intensity = 0;
  private timer = 0;

  trigger(intensity = 4, duration = 300) {
    this.intensity = intensity;
    this.timer = duration;
  }

  update(stage: Container, dt: number) {
    if (this.timer <= 0) return;
    this.timer -= dt;
    const ox = (Math.random() - 0.5) * this.intensity;
    const oy = (Math.random() - 0.5) * this.intensity;
    stage.position.set(ox, oy);
    if (this.timer <= 0) stage.position.set(0, 0);
  }
}

/**
 * Flash overlay for goal screenshot effect.
 */
export class FlashOverlay {
  container = new Container();
  private rect: Graphics;
  private timer = 0;

  constructor() {
    this.rect = new Graphics();
    this.rect.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill(0xffffff);
    this.rect.alpha = 0;
    this.container.addChild(this.rect);
  }

  flash() {
    this.rect.alpha = 1;
    this.timer = 400;
  }

  update(dt: number) {
    if (this.timer > 0) {
      this.timer -= dt;
      this.rect.alpha = Math.max(0, this.timer / 400);
    }
  }

  reset() {
    this.rect.alpha = 0;
    this.timer = 0;
  }
}
