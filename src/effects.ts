import { Container, Graphics, Text, TextStyle } from 'pixi.js';
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
  emoji: string;
  size: number;
  life: number;
  spin: number;
  spinSpeed: number;
  wobble: number;
  wobbleSpeed: number;
  delay: number;
}

const CUTE_EMOJIS = ['⭐', '💖', '🌟', '🎵', '✨', '🌈', '💫', '🎀', '🩷', '🫧'];

export class Confetti {
  container = new Container();
  private particles: CuteParticle[] = [];
  private textPool: Text[] = [];
  private timer = 0;

  burst(cx: number, cy: number) {
    // Wave 1: big burst from center
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: -1.5 - Math.random() * 2.5,
        emoji: CUTE_EMOJIS[Math.floor(Math.random() * CUTE_EMOJIS.length)],
        size: 18 + Math.random() * 20,
        life: 1,
        spin: Math.random() * 0.3 - 0.15,
        spinSpeed: (Math.random() - 0.5) * 0.08,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.04,
        delay: 0,
      });
    }
    // Wave 2: delayed shower from top
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: Math.random() * GAME_WIDTH,
        y: -20 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.5 + Math.random() * 1.2,
        emoji: CUTE_EMOJIS[Math.floor(Math.random() * CUTE_EMOJIS.length)],
        size: 14 + Math.random() * 16,
        life: 1,
        spin: 0,
        spinSpeed: (Math.random() - 0.5) * 0.05,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        delay: 400 + Math.random() * 600,
      });
    }
    // Wave 3: side bursts
    for (let i = 0; i < 10; i++) {
      const fromLeft = i < 5;
      this.particles.push({
        x: fromLeft ? -10 : GAME_WIDTH + 10,
        y: GAME_HEIGHT * 0.3 + Math.random() * GAME_HEIGHT * 0.4,
        vx: fromLeft ? 1.5 + Math.random() * 2 : -1.5 - Math.random() * 2,
        vy: -1 - Math.random() * 1.5,
        emoji: CUTE_EMOJIS[Math.floor(Math.random() * CUTE_EMOJIS.length)],
        size: 20 + Math.random() * 14,
        life: 1,
        spin: 0,
        spinSpeed: (Math.random() - 0.5) * 0.06,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.03,
        delay: 200 + Math.random() * 400,
      });
    }
    this.timer = 0;
  }

  update() {
    this.container.removeChildren();
    if (this.particles.length === 0) return;

    this.timer += 16; // approx dt

    // draw sparkle background ring (fades out)
    if (this.timer < 800) {
      const ringAlpha = Math.max(0, 1 - this.timer / 800) * 0.3;
      const ringScale = 1 + this.timer / 200;
      const g = new Graphics();
      g.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 40 * ringScale)
        .stroke({ color: 0xffd700, width: 3, alpha: ringAlpha });
      g.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 25 * ringScale)
        .stroke({ color: 0xff80ab, width: 2, alpha: ringAlpha * 0.7 });
      this.container.addChild(g);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // delay handling
      if (p.delay > 0) {
        p.delay -= 16;
        continue;
      }

      // physics: gentle float with wobble
      p.wobble += p.wobbleSpeed;
      p.x += p.vx + Math.sin(p.wobble) * 0.6;
      p.y += p.vy;
      p.vy *= 0.995; // gentle deceleration
      p.vx *= 0.99;
      p.spin += p.spinSpeed;
      p.life -= 0.006;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const txt = new Text({
        text: p.emoji,
        style: new TextStyle({ fontSize: p.size }),
      });
      txt.anchor.set(0.5);
      txt.position.set(p.x, p.y);
      txt.rotation = p.spin;
      txt.alpha = Math.min(1, p.life * 2); // fade out last 50%
      // gentle scale pulse
      const pulse = 1 + Math.sin(p.wobble * 2) * 0.1;
      txt.scale.set(pulse);

      this.container.addChild(txt);
    }
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
