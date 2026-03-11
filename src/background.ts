import { Container, Graphics, Text } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, ZONES, COURSE_LENGTH } from './constants';
import { STYLE_TELOP } from './styles';

/**
 * Parallax multi-layer scrolling background with zone transitions.
 * All art is procedurally generated with Graphics.
 */
export class Background {
  container = new Container();

  private skyLayer: Graphics;
  private farLayer: Container;   // clouds (slow)
  private midLayer: Container;   // mountains / buildings (medium)
  private nearLayer: Container;  // ground (fast)

  private farItems: Graphics[] = [];
  private midItems: Graphics[] = [];
  private nearItems: Graphics[] = [];

  // zone telop
  private telop: Container;
  private telopText: Text;
  private telopTimer = 0;
  private lastZoneIdx = -1;

  private currentSkyColor: number = ZONES[0].skyColor;
  private targetSkyColor: number = ZONES[0].skyColor;

  constructor() {
    // Sky
    this.skyLayer = new Graphics();
    this.drawSky(ZONES[0].skyColor);
    this.container.addChild(this.skyLayer);

    // Parallax layers
    this.farLayer = new Container();
    this.midLayer = new Container();
    this.nearLayer = new Container();
    this.container.addChild(this.farLayer, this.midLayer, this.nearLayer);

    this.initClouds();
    this.initMountains();
    this.initGround();

    // Zone telop
    this.telop = new Container();
    this.telop.visible = false;
    this.telopText = new Text({ text: '', style: STYLE_TELOP });
    this.telopText.anchor.set(0.5);
    this.telopText.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
    this.telop.addChild(this.telopText);
    this.container.addChild(this.telop);
  }

  /* ---------- procedural art ---------- */

  private drawSky(color: number) {
    this.skyLayer.clear();
    this.skyLayer.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill(color);
    // smooth gradient bands (multiple thin strips to avoid hard edges)
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const h = GAME_HEIGHT * (0.35 - i * 0.05);
      const a = 0.04 + (steps - i) * 0.012;
      this.skyLayer.rect(0, 0, GAME_WIDTH, h).fill({ color: 0xffffff, alpha: a });
    }
  }

  private initClouds() {
    for (let i = 0; i < 12; i++) {
      const c = new Graphics();
      const w = 60 + Math.random() * 80;
      const h = 20 + Math.random() * 20;
      // soft shadow
      c.ellipse(3, 4, w + 2, h + 1).fill({ color: 0x000000, alpha: 0.06 });
      // main cloud body
      c.ellipse(0, 0, w, h).fill({ color: 0xffffff, alpha: 0.75 + Math.random() * 0.25 });
      // inner highlight bump (upper-left)
      c.ellipse(-w * 0.2, -h * 0.25, w * 0.5, h * 0.5).fill({ color: 0xffffff, alpha: 0.5 });
      c.position.set(Math.random() * GAME_WIDTH * 1.5, 20 + Math.random() * (GAME_HEIGHT * 0.5));
      this.farItems.push(c);
      this.farLayer.addChild(c);
    }
  }

  private initMountains() {
    for (let i = 0; i < 8; i++) {
      const m = new Graphics();
      const bw = 200 + Math.random() * 150;
      const bh = 80 + Math.random() * 60;
      const x = i * (GAME_WIDTH / 3);
      // shadow behind
      m.moveTo(4, bh + 3).lineTo(bw / 2 + 4, 3).lineTo(bw + 4, bh + 3).closePath().fill({ color: 0x000000, alpha: 0.1 });
      // main body
      m.moveTo(0, bh).lineTo(bw / 2, 0).lineTo(bw, bh).closePath().fill(0x81c784);
      // lighter left face
      m.moveTo(0, bh).lineTo(bw / 2, 0).lineTo(bw * 0.45, bh).closePath().fill({ color: 0xffffff, alpha: 0.08 });
      // snow cap
      m.moveTo(bw / 2 - 12, bh * 0.15).lineTo(bw / 2, 0).lineTo(bw / 2 + 12, bh * 0.15).closePath().fill({ color: 0xffffff, alpha: 0.6 });
      m.position.set(x, GAME_HEIGHT - bh - 60);
      this.midItems.push(m);
      this.midLayer.addChild(m);
    }
  }

  private initGround() {
    for (let i = 0; i < 6; i++) {
      const g = new Graphics();
      const w = GAME_WIDTH / 2 + 40;
      // shadow strip
      g.rect(0, -2, w, 4).fill({ color: 0x000000, alpha: 0.1 });
      // main ground
      g.rect(0, 0, w, 60).fill(0x4caf50);
      // highlight strip at top
      g.rect(0, 0, w, 4).fill({ color: 0xffffff, alpha: 0.12 });
      // tree trunk
      g.roundRect(18, -22, 6, 24, 2).fill(0x6d4c41);
      // tree crown
      g.circle(21, -28, 14).fill(0x388e3c);
      g.circle(21, -28, 10).fill({ color: 0xffffff, alpha: 0.08 });
      g.position.set(i * (GAME_WIDTH / 2.5), GAME_HEIGHT - 60);
      this.nearItems.push(g);
      this.nearLayer.addChild(g);
    }
  }

  /* ---------- per-zone palette ---------- */

  private zonePalette(idx: number) {
    switch (idx) {
      case 0: return { ground: 0x4caf50, mountain: 0x81c784 }; // city green
      case 1: return { ground: 0x1565c0, mountain: 0x42a5f5 }; // ocean blue
      case 2: return { ground: 0x6d4c41, mountain: 0xbcaaa4 }; // mountain brown
      case 3: return { ground: 0x1a237e, mountain: 0x3949ab }; // night indigo
      default: return { ground: 0x4caf50, mountain: 0x81c784 };
    }
  }

  /* ---------- update ---------- */

  update(scrollSpeed: number, progress: number, _dt: number) {
    // Determine zone
    const zoneIdx = progress < 0.25 ? 0 : progress < 0.50 ? 1 : progress < 0.75 ? 2 : 3;

    // Zone change
    if (zoneIdx !== this.lastZoneIdx) {
      this.targetSkyColor = ZONES[zoneIdx].skyColor;
      if (this.lastZoneIdx >= 0) {
        this.showTelop(`${ZONES[zoneIdx].emoji} ${ZONES[zoneIdx].name}`);
      }
      // recolor mid/near
      const pal = this.zonePalette(zoneIdx);
      this.midItems.forEach(m => { m.clear(); const bw = 200 + Math.random() * 150; const bh = 80 + Math.random() * 60; m.moveTo(0, bh).lineTo(bw / 2, 0).lineTo(bw, bh).closePath().fill(pal.mountain); });
      this.nearItems.forEach(g => { g.clear(); g.rect(0, 0, GAME_WIDTH / 2 + 40, 60).fill(pal.ground); g.rect(10, -10, 20, 30).fill(pal.ground); });
      this.lastZoneIdx = zoneIdx;
    }

    // Lerp sky color
    this.currentSkyColor = lerpColor(this.currentSkyColor, this.targetSkyColor, 0.02);
    this.drawSky(this.currentSkyColor);

    // Scroll layers at different rates
    const far = scrollSpeed * 0.2;
    const mid = scrollSpeed * 0.5;
    const near = scrollSpeed * 1.0;

    this.scrollItems(this.farItems, far, GAME_WIDTH * 1.5);
    this.scrollItems(this.midItems, mid, GAME_WIDTH * 1.2);
    this.scrollItems(this.nearItems, near, GAME_WIDTH);

    // telop timer
    if (this.telopTimer > 0) {
      this.telopTimer -= _dt;
      const alpha = Math.min(1, this.telopTimer / 500);
      this.telop.alpha = this.telopTimer > 1200 ? Math.min(1, (1800 - this.telopTimer) / 300) : alpha;
      if (this.telopTimer <= 0) this.telop.visible = false;
    }
  }

  private scrollItems(items: Graphics[], speed: number, resetWidth: number) {
    for (const item of items) {
      item.x -= speed;
      if (item.x < -resetWidth / 2) {
        item.x += resetWidth * 2 + Math.random() * 200;
      }
    }
  }

  private showTelop(text: string) {
    this.telopText.text = text;
    this.telop.visible = true;
    this.telop.alpha = 0;
    this.telopTimer = 1800; // ms
  }

  reset() {
    this.lastZoneIdx = -1;
    this.currentSkyColor = ZONES[0].skyColor;
    this.targetSkyColor = ZONES[0].skyColor;
    this.drawSky(ZONES[0].skyColor);
    this.telop.visible = false;
  }
}

/* ---------- helpers ---------- */

function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bv = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bv;
}
