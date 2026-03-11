import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';
import { InputManager } from './input';

const FONT_FAMILY = '"Zen Maru Gothic", "Hiragino Maru Gothic Pro", sans-serif';

/**
 * Virtual touch controller for iPad / tablet
 * Left: D-Pad | Right: Boost + Barrel Roll buttons
 */
export class TouchControls {
  container = new Container();
  private input: InputManager;
  private visible = false;

  constructor(input: InputManager) {
    this.input = input;

    // only show on touch devices
    if (!('ontouchstart' in window)) return;
    this.visible = true;

    this.createDPad();
    this.createActionButtons();
    this.container.alpha = 0.55;
  }

  private createDPad() {
    const cx = 90;
    const cy = GAME_HEIGHT - 100;
    const size = 40;
    const gap = 4;

    // base circle shadow
    const baseShadow = new Graphics();
    baseShadow.circle(cx + 2, cy + 3, 72).fill({ color: 0x000000, alpha: 0.15 });
    this.container.addChild(baseShadow);

    // base circle
    const base = new Graphics();
    base.circle(cx, cy, 70).fill({ color: 0x000000, alpha: 0.18 });
    base.circle(cx, cy, 70).stroke({ color: 0xffffff, width: 2, alpha: 0.15 });
    this.container.addChild(base);

    // Up
    this.makeDPadBtn(cx - size / 2, cy - size - gap - size / 2, size, size, '▲', () => {
      this.input.touchUp = true;
    }, () => { this.input.touchUp = false; });

    // Down
    this.makeDPadBtn(cx - size / 2, cy + gap + size / 2, size, size, '▼', () => {
      this.input.touchDown = true;
    }, () => { this.input.touchDown = false; });

    // Left
    this.makeDPadBtn(cx - size - gap - size / 2, cy - size / 2, size, size, '◀', () => {
      this.input.touchLeft = true;
    }, () => { this.input.touchLeft = false; });

    // Right
    this.makeDPadBtn(cx + gap + size / 2, cy - size / 2, size, size, '▶', () => {
      this.input.touchRight = true;
    }, () => { this.input.touchRight = false; });
  }

  private drawDPadBg(bg: Graphics, w: number, h: number, alpha: number) {
    // shadow
    bg.roundRect(1, 2, w, h, 10).fill({ color: 0x000000, alpha: alpha * 0.3 });
    // main
    bg.roundRect(0, 0, w, h, 10).fill({ color: 0xffffff, alpha });
    // highlight top
    bg.roundRect(2, 1, w - 4, h / 3, 8).fill({ color: 0xffffff, alpha: alpha * 0.4 });
  }

  private makeDPadBtn(x: number, y: number, w: number, h: number, label: string, onDown: () => void, onUp: () => void) {
    const btn = new Container();
    const bg = new Graphics();
    this.drawDPadBg(bg, w, h, 0.5);
    btn.addChild(bg);

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: FONT_FAMILY,
        fontSize: 18,
        fontWeight: 'bold',
        fill: '#555555',
        stroke: { color: '#ffffff', width: 2 },
        dropShadow: { alpha: 0.2, angle: Math.PI / 4, blur: 1, color: '#000000', distance: 1 },
      }),
    });
    txt.anchor.set(0.5);
    txt.position.set(w / 2, h / 2);
    btn.addChild(txt);

    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.on('pointerdown', () => {
      onDown();
      bg.clear();
      this.drawDPadBg(bg, w, h, 0.85);
    });
    btn.on('pointerup', () => {
      onUp();
      bg.clear();
      this.drawDPadBg(bg, w, h, 0.5);
    });
    btn.on('pointerupoutside', () => {
      onUp();
      bg.clear();
      this.drawDPadBg(bg, w, h, 0.5);
    });

    this.container.addChild(btn);
  }

  private createActionButtons() {
    const bx = GAME_WIDTH - 50;
    const by = GAME_HEIGHT - 240;

    // Boost button (large)
    this.makeActionBtn(bx, by, 36, '🔥', 0xff9800, () => {
      this.input.touchBoost = true;
    });

    // Barrel Roll button (small, below boost)
    this.makeActionBtn(bx, by + 80, 24, '🌀', 0x7c4dff, () => {
      this.input.touchBarrel = true;
    });
  }

  private drawActionBg(bg: Graphics, radius: number, color: number, alpha: number) {
    // outer shadow
    bg.circle(2, 3, radius + 2).fill({ color: 0x000000, alpha: alpha * 0.25 });
    // main fill
    bg.circle(0, 0, radius).fill({ color, alpha });
    // border
    bg.circle(0, 0, radius).stroke({ color: 0xffffff, width: 2.5, alpha: alpha * 0.6 });
    // inner highlight
    bg.circle(0, -radius * 0.25, radius * 0.65).fill({ color: 0xffffff, alpha: alpha * 0.2 });
  }

  private makeActionBtn(x: number, y: number, radius: number, emoji: string, color: number, onTap: () => void) {
    const btn = new Container();
    const bg = new Graphics();
    this.drawActionBg(bg, radius, color, 0.6);
    btn.addChild(bg);

    const txt = new Text({
      text: emoji,
      style: new TextStyle({
        fontSize: radius * 0.85,
        dropShadow: { alpha: 0.3, angle: Math.PI / 4, blur: 2, color: '#000000', distance: 1 },
      }),
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);

    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.on('pointerdown', () => {
      onTap();
      bg.clear();
      this.drawActionBg(bg, radius, color, 0.9);
    });
    btn.on('pointerup', () => {
      bg.clear();
      this.drawActionBg(bg, radius, color, 0.6);
    });
    btn.on('pointerupoutside', () => {
      bg.clear();
      this.drawActionBg(bg, radius, color, 0.6);
    });

    this.container.addChild(btn);
  }
}
