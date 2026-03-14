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
 * Cute celebration effect for goal — stars, hearts, notes float up with sparkle.
 */

interface CuteParticle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  life: number;
  spin: number;
  spinSpeed: number;
  color: number;
  delay: number;
}

const STAR_COLORS = [0xffd700, 0xffeb3b, 0xffc107, 0xfff176, 0xffe082];

export class Confetti {
  container = new Container();
  private particles: CuteParticle[] = [];
  private timer = 0;

  burst(cx: number, cy: number) {
    // Wave 1: small burst of stars from center (12 particles)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 1.5 + Math.random() * 2;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 30,
        y: cy + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 6 + Math.random() * 8,
        life: 1,
        spin: Math.random() * Math.PI,
        spinSpeed: (Math.random() - 0.5) * 0.06,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        delay: 0,
      });
    }
    // Wave 2: gentle rain from top (8 particles, delayed)
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: 100 + Math.random() * (GAME_WIDTH - 200),
        y: -10 - Math.random() * 30,
        vx: (Math.random() - 0.5) * 0.5,
        vy: 0.4 + Math.random() * 0.8,
        size: 5 + Math.random() * 6,
        life: 1,
        spin: Math.random() * Math.PI,
        spinSpeed: (Math.random() - 0.5) * 0.04,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        delay: 300 + Math.random() * 500,
      });
    }
    this.timer = 0;
  }

  update() {
    this.container.removeChildren();
    if (this.particles.length === 0) return;

    this.timer += 16;

    const g = new Graphics();

    // expanding ring (fades quickly)
    if (this.timer < 600) {
      const ringAlpha = Math.max(0, 1 - this.timer / 600) * 0.25;
      const ringScale = 1 + this.timer / 250;
      g.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 30 * ringScale)
        .stroke({ color: 0xffd700, width: 2, alpha: ringAlpha });
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.delay > 0) { p.delay -= 16; continue; }

      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.spin += p.spinSpeed;
      p.life -= 0.01;

      if (p.life <= 0) { this.particles.splice(i, 1); continue; }

      const alpha = Math.min(1, p.life * 2.5);
      this.drawStar(g, p.x, p.y, p.size, p.spin, p.color, alpha);
    }

    this.container.addChild(g);
  }

  /** Draw a 4-point star shape using Graphics */
  private drawStar(g: Graphics, x: number, y: number, r: number, rotation: number, color: number, alpha: number) {
    const points = 4;
    const innerR = r * 0.4;
    const coords: number[] = [];
    for (let i = 0; i < points * 2; i++) {
      const angle = rotation + (i * Math.PI) / points;
      const radius = i % 2 === 0 ? r : innerR;
      coords.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    g.moveTo(coords[0], coords[1]);
    for (let i = 2; i < coords.length; i += 2) {
      g.lineTo(coords[i], coords[i + 1]);
    }
    g.closePath().fill({ color, alpha });
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
