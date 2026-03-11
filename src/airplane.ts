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
  private rollTimer = 0;

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
    // fuselage
    g.ellipse(0, 0, 32, 14).fill(colors.main);
    // cockpit
    g.ellipse(12, -4, 10, 8).fill(0xb3e5fc);
    // wings
    g.moveTo(-8, 0).lineTo(-20, -22).lineTo(8, -2).closePath().fill(colors.wing);
    g.moveTo(-8, 0).lineTo(-20, 22).lineTo(8, 2).closePath().fill(colors.wing);
    // tail
    g.moveTo(-28, 0).lineTo(-38, -14).lineTo(-24, 0).closePath().fill(colors.tail);

    // level decorations
    if (this.level >= 1) {
      // stickers on wing
      g.circle(-10, -12, 3).fill(0xffeb3b);
      g.circle(-10, 12, 3).fill(0xffeb3b);
    }
    if (this.level >= 2) {
      // wing stripe
      g.moveTo(-6, -16).lineTo(4, -4).lineTo(6, -5).lineTo(-4, -17).closePath().fill(0xff5722);
      g.moveTo(-6, 16).lineTo(4, 4).lineTo(6, 5).lineTo(-4, 17).closePath().fill(0xff5722);
    }
    if (this.level >= 3) {
      // engine glow
      g.circle(-30, 0, 5).fill({ color: 0x00bcd4, alpha: 0.6 });
    }
    if (this.level >= 4) {
      // outline glow
      g.ellipse(0, 0, 35, 17).stroke({ color: 0xffd700, width: 2, alpha: 0.7 });
    }
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
    p.moveTo(0, -8).lineTo(2, 8).lineTo(-2, 8).lineTo(0, -8).closePath().fill(0x616161);
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
