import { Container, Graphics, Text } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, MAX_SPEED, BOOST_MULTIPLIER, BOOST_COOLDOWN, TOTAL_COINS, ZONES, COURSE_LENGTH } from './constants';
import { STYLE_HUD, STYLE_HUD_COIN, STYLE_SMALL } from './styles';

/** HUD: speedometer, progress bar, coin counter, timer, boost gauge */
export class HUD {
  container = new Container();

  private meterBg: Graphics;
  private meterNeedle: Graphics;
  private meterCenter: { x: number; y: number };

  private progressBg: Graphics;
  private progressFill: Graphics;
  private progressPlane: Graphics;
  private zoneMarkers: Graphics;

  private coinText: Text;
  private timerText: Text;

  private boostBg: Graphics;
  private boostFill: Graphics;
  private boostIcon: Text;

  constructor() {
    // --- Speedometer (bottom-right) ---
    const meterX = GAME_WIDTH - 80;
    const meterY = GAME_HEIGHT - 70;
    this.meterCenter = { x: meterX, y: meterY };

    this.meterBg = new Graphics();
    // outer ring shadow
    this.meterBg.circle(meterX + 2, meterY + 2, 52).fill({ color: 0x000000, alpha: 0.3 });
    // dark bg
    this.meterBg.circle(meterX, meterY, 52).fill({ color: 0x1a1a2e, alpha: 0.85 });
    // inner ring
    this.meterBg.circle(meterX, meterY, 48).stroke({ color: 0x444466, width: 2, alpha: 0.6 });
    // arc scale
    this.meterBg.arc(meterX, meterY, 42, Math.PI * 0.8, Math.PI * 2.2).stroke({ color: 0xffffff, width: 3, alpha: 0.7 });
    // tick marks
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * 0.8 + (i / 10) * Math.PI * 1.4;
      const inner = 36;
      const outer = 42;
      this.meterBg.moveTo(meterX + Math.cos(a) * inner, meterY + Math.sin(a) * inner)
        .lineTo(meterX + Math.cos(a) * outer, meterY + Math.sin(a) * outer)
        .stroke({ color: 0xffffff, width: i % 5 === 0 ? 2 : 1, alpha: 0.5 });
    }
    // center dot
    this.meterBg.circle(meterX, meterY, 4).fill(0xffd700);
    this.container.addChild(this.meterBg);

    const meterLabel = new Text({ text: 'スピード', style: STYLE_SMALL });
    meterLabel.anchor.set(0.5);
    meterLabel.position.set(meterX, meterY + 22);
    this.container.addChild(meterLabel);

    this.meterNeedle = new Graphics();
    this.container.addChild(this.meterNeedle);

    // --- Progress bar (top) ---
    const pbY = 16;
    this.progressBg = new Graphics();
    // shadow
    this.progressBg.roundRect(61, pbY + 1, GAME_WIDTH - 120, 16, 8).fill({ color: 0x000000, alpha: 0.25 });
    // bg
    this.progressBg.roundRect(60, pbY, GAME_WIDTH - 120, 16, 8).fill({ color: 0x1a1a2e, alpha: 0.5 });
    this.progressBg.roundRect(60, pbY, GAME_WIDTH - 120, 16, 8).stroke({ color: 0xffffff, width: 1, alpha: 0.2 });
    this.container.addChild(this.progressBg);

    // zone markers
    this.zoneMarkers = new Graphics();
    for (const z of ZONES) {
      const zx = 60 + (GAME_WIDTH - 120) * z.start;
      this.zoneMarkers.rect(zx, pbY, 2, 16).fill({ color: 0xffffff, alpha: 0.5 });
    }
    this.container.addChild(this.zoneMarkers);

    this.progressFill = new Graphics();
    this.container.addChild(this.progressFill);

    this.progressPlane = new Graphics();
    // bigger, cleaner plane icon
    this.progressPlane.moveTo(0, -6).lineTo(12, 0).lineTo(0, 6).lineTo(2, 0).closePath().fill(0xffd700);
    this.progressPlane.moveTo(0, -6).lineTo(12, 0).lineTo(0, 6).lineTo(2, 0).closePath().stroke({ color: 0xe65100, width: 1 });
    this.container.addChild(this.progressPlane);

    // --- Coin counter (top-left) ---
    this.coinText = new Text({ text: '⭐ 0 / ' + TOTAL_COINS, style: STYLE_HUD_COIN });
    this.coinText.position.set(14, 38);
    this.container.addChild(this.coinText);

    // --- Timer (top-center) ---
    this.timerText = new Text({ text: '0.0 びょう', style: STYLE_HUD });
    this.timerText.anchor.set(0.5, 0);
    this.timerText.position.set(GAME_WIDTH / 2, 38);
    this.container.addChild(this.timerText);

    // --- Boost gauge (bottom-left) ---
    const bgX = 20;
    const bgY = GAME_HEIGHT - 50;
    this.boostBg = new Graphics();
    // shadow
    this.boostBg.roundRect(bgX + 1, bgY + 1, 100, 22, 11).fill({ color: 0x000000, alpha: 0.3 });
    this.boostBg.roundRect(bgX, bgY, 100, 22, 11).fill({ color: 0x1a1a2e, alpha: 0.6 });
    this.boostBg.roundRect(bgX, bgY, 100, 22, 11).stroke({ color: 0xffffff, width: 1, alpha: 0.2 });
    this.container.addChild(this.boostBg);

    this.boostFill = new Graphics();
    this.container.addChild(this.boostFill);

    this.boostIcon = new Text({ text: '🔥', style: { fontSize: 24 } });
    this.boostIcon.position.set(bgX - 2, bgY - 6);
    this.container.addChild(this.boostIcon);
  }

  update(speed: number, progress: number, coins: number, time: number, boostCooldown: number, boosting: boolean) {
    // speedometer needle
    const maxDisplay = MAX_SPEED * BOOST_MULTIPLIER;
    const ratio = Math.min(speed / maxDisplay, 1);
    const angle = Math.PI * 0.8 + ratio * Math.PI * 1.4;
    const cx = this.meterCenter.x;
    const cy = this.meterCenter.y;
    this.meterNeedle.clear();
    // needle shadow
    this.meterNeedle.moveTo(cx + 1, cy + 1)
      .lineTo(cx + 1 + Math.cos(angle) * 36, cy + 1 + Math.sin(angle) * 36)
      .stroke({ color: 0x000000, width: 4, alpha: 0.3 });
    // needle
    const needleColor = boosting ? 0xff1744 : 0xffd700;
    this.meterNeedle.moveTo(cx, cy)
      .lineTo(cx + Math.cos(angle) * 36, cy + Math.sin(angle) * 36)
      .stroke({ color: needleColor, width: 3 });
    // glow tip
    this.meterNeedle.circle(cx + Math.cos(angle) * 36, cy + Math.sin(angle) * 36, 3)
      .fill({ color: needleColor, alpha: 0.8 });

    // progress bar
    const barW = (GAME_WIDTH - 120) * Math.min(progress, 1);
    this.progressFill.clear();
    if (barW > 2) {
      this.progressFill.roundRect(60, 16, barW, 16, 8).fill(0x4fc3f7);
      // highlight stripe
      this.progressFill.roundRect(60, 16, barW, 6, 4).fill({ color: 0xffffff, alpha: 0.25 });
    }
    this.progressPlane.position.set(60 + barW, 24);

    // coins
    this.coinText.text = `⭐ ${coins} / ${TOTAL_COINS}`;

    // timer
    this.timerText.text = `${time.toFixed(1)} びょう`;

    // boost gauge
    const bgX = 20;
    const bgY = GAME_HEIGHT - 50;
    this.boostFill.clear();
    if (boosting) {
      this.boostFill.roundRect(bgX, bgY, 100, 22, 11).fill({ color: 0xff9800, alpha: 0.85 });
      this.boostFill.roundRect(bgX, bgY, 100, 8, 5).fill({ color: 0xffffff, alpha: 0.2 });
      this.boostIcon.alpha = 1;
    } else if (boostCooldown > 0) {
      const cd = 1 - boostCooldown / BOOST_COOLDOWN;
      const fillW = 100 * cd;
      if (fillW > 2) {
        this.boostFill.roundRect(bgX, bgY, fillW, 22, 11).fill({ color: 0x9e9e9e, alpha: 0.6 });
      }
      this.boostIcon.alpha = 0.4;
    } else {
      this.boostFill.roundRect(bgX, bgY, 100, 22, 11).fill({ color: 0x4caf50, alpha: 0.75 });
      this.boostFill.roundRect(bgX, bgY, 100, 8, 5).fill({ color: 0xffffff, alpha: 0.2 });
      this.boostIcon.alpha = 1;
    }
  }
}
