import { Container, Graphics, Text } from 'pixi.js';
import {
  PLAYER_X, PLAYER_MIN_Y, PLAYER_MAX_Y,
  PLAYER_MOVE_SPEED, BASE_SPEED, MAX_SPEED, ACCEL_AMOUNT,
  BOOST_MULTIPLIER, BOOST_DURATION, BOOST_COOLDOWN,
  BARREL_ROLL_DURATION, GAME_HEIGHT,
} from './constants';
import { InputManager } from './input';

export class Airplane {
  container = new Container();
  body: Graphics;
  private propeller: Graphics;
  private propAngle = 0;

  // movement
  speed = BASE_SPEED;
  private targetSpeed = BASE_SPEED;

  // boost
  boosting = false;
  boostTimer = 0;
  boostCooldown = 0;

  // barrel roll
  rolling = false;
  rollTimer = 0;

  // trail
  trail: { x: number; y: number; alpha: number }[] = [];

  // sonic boom ring
  sonicRing: Graphics | null = null;
  private sonicTimer = 0;

  // level visual (0-4)
  level = 0;

  constructor() {
    this.body = new Graphics();
    this.propeller = new Graphics();
    this.drawBody();
    this.container.addChild(this.body, this.propeller);
    this.container.position.set(PLAYER_X, GAME_HEIGHT / 2);
  }

  drawBody() {
    const g = this.body;
    g.clear();

    const colors = this.getLevelColors();

    // ----- fuselage (rounded, cute) -----
    // body shadow
    g.ellipse(1, 3, 30, 14).fill({ color: 0x000000, alpha: 0.12 });
    // main body
    g.ellipse(0, 0, 30, 13).fill(colors.main);
    // body highlight (top)
    g.ellipse(-2, -5, 22, 5).fill({ color: 0xffffff, alpha: 0.25 });

    // ----- nose cone -----
    g.ellipse(26, 0, 8, 8).fill(colors.main);
    g.ellipse(26, -2, 6, 4).fill({ color: 0xffffff, alpha: 0.15 });

    // ----- cockpit window -----
    g.ellipse(14, -3, 8, 6).fill(0xb3e5fc);
    g.ellipse(14, -3, 8, 6).stroke({ color: 0x90caf9, width: 1.5 });
    // window shine
    g.ellipse(12, -5, 3, 2.5).fill({ color: 0xffffff, alpha: 0.7 });

    // ----- cute face -----
    // eyes (inside cockpit)
    g.circle(12, -2, 1.8).fill(0x333333);
    g.circle(17, -2, 1.8).fill(0x333333);
    // eye shine
    g.circle(12.8, -2.8, 0.8).fill(0xffffff);
    g.circle(17.8, -2.8, 0.8).fill(0xffffff);
    // blush cheeks
    g.ellipse(10, 2, 3, 1.8).fill({ color: 0xff8a80, alpha: 0.5 });
    g.ellipse(19, 2, 3, 1.8).fill({ color: 0xff8a80, alpha: 0.5 });
    // smile
    g.arc(14.5, 1, 3, 0.2, Math.PI - 0.2).stroke({ color: 0x555555, width: 1 });

    // ----- upper wing -----
    // wing shadow
    g.ellipse(-2, -15, 22, 5).fill({ color: 0x000000, alpha: 0.08 });
    // wing body
    g.ellipse(-2, -16, 22, 5).fill(colors.wing);
    g.ellipse(-2, -16, 22, 5).stroke({ color: colors.tail, width: 1, alpha: 0.3 });
    // wing highlight
    g.ellipse(-4, -18, 14, 2).fill({ color: 0xffffff, alpha: 0.2 });

    // ----- lower wing -----
    g.ellipse(-2, 15, 22, 5).fill({ color: 0x000000, alpha: 0.08 });
    g.ellipse(-2, 16, 22, 5).fill(colors.wing);
    g.ellipse(-2, 16, 22, 5).stroke({ color: colors.tail, width: 1, alpha: 0.3 });

    // ----- tail fin (vertical) -----
    // shadow
    g.moveTo(-24, 2).lineTo(-34, -16).lineTo(-28, -16).lineTo(-20, 0).closePath().fill({ color: 0x000000, alpha: 0.08 });
    // fin body
    g.moveTo(-24, 0).lineTo(-34, -18).lineTo(-28, -18).lineTo(-20, 0).closePath().fill(colors.tail);
    // fin border
    g.moveTo(-24, 0).lineTo(-34, -18).lineTo(-28, -18).lineTo(-20, 0).closePath().stroke({ color: colors.main, width: 1, alpha: 0.3 });
    // fin highlight
    g.moveTo(-23, -2).lineTo(-32, -16).lineTo(-30, -16).lineTo(-21, -1).closePath().fill({ color: 0xffffff, alpha: 0.15 });

    // ----- horizontal tail -----
    g.ellipse(-26, 0, 10, 3.5).fill(colors.tail);
    g.ellipse(-26, -1, 7, 1.5).fill({ color: 0xffffff, alpha: 0.12 });

    // ----- level decorations -----
    if (this.level >= 1) {
      // star stickers on wings
      this.drawMiniStar(g, -6, -16, 3, 0xffeb3b);
      this.drawMiniStar(g, -6, 16, 3, 0xffeb3b);
    }
    if (this.level >= 2) {
      // racing stripe on body
      g.ellipse(0, 0, 30, 13).stroke({ color: 0xff5722, width: 2, alpha: 0.6 });
    }
    if (this.level >= 3) {
      // engine glow behind
      g.circle(-28, 0, 6).fill({ color: 0x00bcd4, alpha: 0.4 });
      g.circle(-28, 0, 4).fill({ color: 0x80deea, alpha: 0.6 });
    }
    if (this.level >= 4) {
      // golden glow outline
      g.ellipse(0, 0, 34, 17).stroke({ color: 0xffd700, width: 2.5, alpha: 0.6 });
      g.ellipse(0, 0, 36, 19).stroke({ color: 0xffd700, width: 1, alpha: 0.3 });
    }
  }

  private drawMiniStar(g: Graphics, cx: number, cy: number, r: number, color: number) {
    const points = 5;
    const step = Math.PI / points;
    const inner = r * 0.45;
    const startAngle = -Math.PI / 2;
    g.moveTo(cx + Math.cos(startAngle) * r, cy + Math.sin(startAngle) * r);
    for (let i = 1; i <= points * 2; i++) {
      const rad = i % 2 === 0 ? r : inner;
      const angle = startAngle + i * step;
      g.lineTo(cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad);
    }
    g.closePath().fill(color);
  }

  private getLevelColors() {
    if (this.level >= 4) return { main: 0xffd700, wing: 0xffc107, tail: 0xffb300 }; // gold
    if (this.level >= 3) return { main: 0x2196f3, wing: 0x1976d2, tail: 0x1565c0 };
    if (this.level >= 2) return { main: 0x2196f3, wing: 0x1976d2, tail: 0x1565c0 };
    if (this.level >= 1) return { main: 0x42a5f5, wing: 0x1e88e5, tail: 0x1565c0 };
    return { main: 0x42a5f5, wing: 0x1e88e5, tail: 0x1565c0 }; // default blue
  }

  private drawPropeller() {
    const p = this.propeller;
    p.clear();
    p.position.set(34, 0);
    // blade 1
    p.ellipse(0, -5, 2.5, 6).fill({ color: 0x78909c, alpha: 0.8 });
    // blade 2
    p.ellipse(0, 5, 2.5, 6).fill({ color: 0x78909c, alpha: 0.8 });
    // spinner hub
    p.circle(0, 0, 3).fill(0xffd600);
    p.circle(0, 0, 3).stroke({ color: 0xf9a825, width: 0.8 });
    p.circle(-0.5, -0.8, 1).fill({ color: 0xffffff, alpha: 0.5 });
    p.rotation = this.propAngle;
  }

  update(input: InputManager, dt: number) {
    // vertical movement
    if (input.up) this.container.y -= PLAYER_MOVE_SPEED;
    if (input.down) this.container.y += PLAYER_MOVE_SPEED;
    this.container.y = Math.max(PLAYER_MIN_Y, Math.min(PLAYER_MAX_Y, this.container.y));

    // horizontal speed
    if (input.right) this.targetSpeed = Math.min(MAX_SPEED, this.targetSpeed + ACCEL_AMOUNT * 0.05);
    else if (input.left) this.targetSpeed = Math.max(BASE_SPEED * 0.5, this.targetSpeed - ACCEL_AMOUNT * 0.05);
    else this.targetSpeed += (BASE_SPEED - this.targetSpeed) * 0.02;

    // boost
    if (this.boostCooldown > 0) this.boostCooldown -= dt;
    if (input.consumeBoost() && this.boostCooldown <= 0 && !this.boosting) {
      this.boosting = true;
      this.boostTimer = BOOST_DURATION;
      this.spawnSonicRing();
    }
    if (this.boosting) {
      this.boostTimer -= dt;
      this.targetSpeed = MAX_SPEED * BOOST_MULTIPLIER;
      if (this.boostTimer <= 0) {
        this.boosting = false;
        this.boostCooldown = BOOST_COOLDOWN;
        this.targetSpeed = BASE_SPEED;
      }
    }

    this.speed += (this.targetSpeed - this.speed) * 0.1;

    // barrel roll
    if (input.consumeBarrel() && !this.rolling) {
      this.rolling = true;
      this.rollTimer = BARREL_ROLL_DURATION;
    }
    if (this.rolling) {
      this.rollTimer -= dt;
      const progress = 1 - this.rollTimer / BARREL_ROLL_DURATION;
      this.body.rotation = progress * Math.PI * 2;
      if (this.rollTimer <= 0) {
        this.rolling = false;
        this.body.rotation = 0;
      }
    }

    // propeller
    this.propAngle += 0.4 + this.speed * 0.05;
    this.drawPropeller();

    // slight tilt based on vertical movement
    if (!this.rolling) {
      if (input.up) this.body.rotation = -0.15;
      else if (input.down) this.body.rotation = 0.15;
      else this.body.rotation *= 0.9;
    }

    // trail
    this.trail.unshift({ x: this.container.x - 20, y: this.container.y, alpha: 1 });
    if (this.trail.length > 30) this.trail.pop();
    this.trail.forEach(t => (t.alpha -= 0.03));

    // sonic ring
    if (this.sonicRing) {
      this.sonicTimer -= dt;
      const p = 1 - this.sonicTimer / 500;
      this.sonicRing.scale.set(1 + p * 3);
      this.sonicRing.alpha = 1 - p;
      if (this.sonicTimer <= 0) {
        this.sonicRing.destroy();
        this.sonicRing = null;
      }
    }
  }

  private spawnSonicRing() {
    if (this.sonicRing) this.sonicRing.destroy();
    const ring = new Graphics();
    ring.circle(0, 0, 30).stroke({ color: 0xffffff, width: 4, alpha: 0.8 });
    ring.position.set(this.container.x, this.container.y);
    this.container.parent?.addChild(ring);
    this.sonicRing = ring;
    this.sonicTimer = 500;
  }

  /** Apply wind tunnel burst */
  windTunnelBurst() {
    this.targetSpeed = Math.min(this.targetSpeed + 3, MAX_SPEED * 2);
  }

  reset() {
    this.container.position.set(PLAYER_X, GAME_HEIGHT / 2);
    this.speed = BASE_SPEED;
    this.targetSpeed = BASE_SPEED;
    this.boosting = false;
    this.boostTimer = 0;
    this.boostCooldown = 0;
    this.rolling = false;
    this.body.rotation = 0;
    this.trail = [];
  }

  setLevel(lv: number) {
    this.level = lv;
    this.drawBody();
  }
}
