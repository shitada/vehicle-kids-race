import { Container, Graphics, Text } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, TOTAL_COINS, COURSE_LENGTH, WIND_TUNNEL_POSITIONS } from './constants';

/* ================= COINS ================= */

export interface CoinData {
  x: number;   // world x
  y: number;   // screen y
  collected: boolean;
}

export class CoinManager {
  container = new Container();
  coins: CoinData[] = [];
  collected = 0;

  // sparkle pool
  private sparkles: Graphics[] = [];

  constructor() {
    this.generate();
  }

  generate() {
    this.coins = [];
    this.collected = 0;
    this.container.removeChildren();

    const spacing = COURSE_LENGTH / (TOTAL_COINS + 2);
    for (let i = 0; i < TOTAL_COINS; i++) {
      const baseX = spacing * (i + 1) + (Math.random() - 0.5) * spacing * 0.3;
      // create patterns
      const patternType = i % 5;
      let y: number;
      if (patternType < 3) {
        // straight line or gentle wave
        y = 80 + Math.sin(i * 0.5) * 120 + GAME_HEIGHT / 2 - 120;
      } else {
        // arch pattern
        const archProgress = (i % 3) / 2;
        y = GAME_HEIGHT / 2 - Math.sin(archProgress * Math.PI) * 150;
      }
      y = Math.max(60, Math.min(GAME_HEIGHT - 100, y));
      this.coins.push({ x: baseX, y, collected: false });
    }
  }

  update(worldX: number, playerY: number) {
    for (const coin of this.coins) {
      if (coin.collected) continue;
      const screenX = coin.x - worldX;
      // check if visible
      if (screenX < -50 || screenX > GAME_WIDTH + 50) continue;
      // collision with player
      const dx = screenX - (GAME_WIDTH * 0.28);
      const dy = coin.y - playerY;
      if (Math.abs(dx) < 35 && Math.abs(dy) < 30) {
        coin.collected = true;
        this.collected++;
        this.spawnSparkle(screenX, coin.y);
      }
    }
  }

  draw(worldX: number) {
    // clear and redraw visible coins
    this.container.removeChildren();
    for (const coin of this.coins) {
      if (coin.collected) continue;
      const screenX = coin.x - worldX;
      if (screenX < -50 || screenX > GAME_WIDTH + 50) continue;

      const g = new Graphics();
      // star shape
      const cx = screenX;
      const cy = coin.y;
      drawStar(g, cx, cy, 12, 6, 5, 0xffd700);
      // glow
      g.circle(cx, cy, 14).fill({ color: 0xffeb3b, alpha: 0.3 });
      this.container.addChild(g);
    }

    // draw sparkles
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.alpha -= 0.05;
      s.scale.set(s.scale.x * 1.05);
      if (s.alpha <= 0) {
        s.destroy();
        this.sparkles.splice(i, 1);
      }
    }
  }

  private spawnSparkle(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      const s = new Graphics();
      const angle = (Math.PI * 2 * i) / 6;
      const dist = 8;
      s.circle(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, 3).fill(0xffeb3b);
      s.alpha = 1;
      this.container.addChild(s);
      this.sparkles.push(s);
    }
  }

  reset() {
    this.generate();
  }
}

/* ================= WIND TUNNELS ================= */

export class WindTunnelManager {
  container = new Container();
  tunnels: { x: number; triggered: boolean }[] = [];

  constructor() {
    this.generate();
  }

  generate() {
    this.tunnels = WIND_TUNNEL_POSITIONS.map(ratio => ({
      x: ratio * COURSE_LENGTH,
      triggered: false,
    }));
  }

  update(worldX: number, playerY: number): boolean {
    let hit = false;
    for (const t of this.tunnels) {
      if (t.triggered) continue;
      const screenX = t.x - worldX;
      if (Math.abs(screenX - GAME_WIDTH * 0.28) < 40) {
        t.triggered = true;
        hit = true;
      }
    }
    return hit;
  }

  draw(worldX: number) {
    this.container.removeChildren();
    for (const t of this.tunnels) {
      if (t.triggered) continue;
      const screenX = t.x - worldX;
      if (screenX < -80 || screenX > GAME_WIDTH + 80) continue;

      const g = new Graphics();
      // glowing ring
      g.circle(screenX, GAME_HEIGHT / 2, 50).stroke({ color: 0x00e5ff, width: 4, alpha: 0.8 });
      g.circle(screenX, GAME_HEIGHT / 2, 42).stroke({ color: 0x18ffff, width: 2, alpha: 0.5 });
      g.circle(screenX, GAME_HEIGHT / 2, 55).fill({ color: 0x00e5ff, alpha: 0.1 });
      this.container.addChild(g);
    }
  }

  reset() {
    this.generate();
  }
}

/* ================= HELPERS ================= */

function drawStar(g: Graphics, cx: number, cy: number, outerR: number, innerR: number, points: number, color: number) {
  const step = Math.PI / points;
  g.moveTo(cx + outerR, cy);
  for (let i = 1; i <= points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = i * step - Math.PI / 2;
    g.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
  g.closePath().fill(color);
}
