import { Container, Graphics, Text } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, TOTAL_COINS, STAR3_TIME, STAR2_TIME, UI_COLORS } from './constants';
import { SaveData, loadSave } from './state';
import {
  STYLE_TITLE, STYLE_BUTTON, STYLE_COUNTDOWN, STYLE_RECORD, STYLE_SUBLABEL,
  STYLE_RESULT_HEADING, STYLE_RESULT_BODY, STYLE_RESULT_ACCENT, STYLE_RESULT_TITLE,
  STYLE_STARS, STYLE_PHOTO_LABEL,
} from './styles';
import { sfxClick, sfxCountdown, resumeAudio } from './audio';

/* ========= TITLE SCREEN ========= */
export class TitleScreen {
  container = new Container();
  private onStart: (() => void) | null = null;

  constructor() {
    // bg – gradient-like sky
    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill(0x87ceeb);
    // upper lighter band
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.4).fill({ color: 0xb3e5fc, alpha: 0.5 });
    this.container.addChild(bg);

    // decorative clouds with soft edges
    for (let i = 0; i < 8; i++) {
      const c = new Graphics();
      const w = 50 + Math.random() * 50;
      const h = 18 + Math.random() * 14;
      // shadow
      c.ellipse(2, 2, w, h).fill({ color: 0x000000, alpha: 0.08 });
      // cloud body
      c.ellipse(0, 0, w, h).fill({ color: 0xffffff, alpha: 0.75 + Math.random() * 0.25 });
      // highlight
      c.ellipse(-w * 0.15, -h * 0.25, w * 0.6, h * 0.5).fill({ color: 0xffffff, alpha: 0.3 });
      c.position.set(60 + Math.random() * (GAME_WIDTH - 120), 30 + Math.random() * 130);
      this.container.addChild(c);
    }

    // title
    const title = new Text({ text: '✈️ そらの おさんぽフライト', style: STYLE_TITLE });
    title.anchor.set(0.5);
    title.position.set(GAME_WIDTH / 2, GAME_HEIGHT * 0.25);
    this.container.addChild(title);

    // records
    const save = loadSave();
    if (save.bestTime > 0) {
      const rec = new Text({
        text: `🏆 ベストタイム: ${save.bestTime.toFixed(1)}びょう\n⭐ ほし さいだい: ${save.bestCoins}こ`,
        style: STYLE_RECORD,
      });
      rec.anchor.set(0.5);
      rec.position.set(GAME_WIDTH / 2, GAME_HEIGHT * 0.42);
      this.container.addChild(rec);
    }

    // play button with better shadow/depth
    const btn = new Container();
    const btnBg = new Graphics();
    // shadow
    btnBg.roundRect(-118, -26, 240, 60, 30).fill({ color: 0x000000, alpha: 0.2 });
    // base
    btnBg.roundRect(-120, -30, 240, 60, 30).fill(0xe65100);
    // front face
    btnBg.roundRect(-120, -30, 240, 56, 30).fill(0xff9800);
    // highlight
    btnBg.roundRect(-110, -26, 220, 24, 20).fill({ color: 0xffffff, alpha: 0.2 });
    btn.addChild(btnBg);

    const btnText = new Text({ text: '✈️ あそぶ', style: STYLE_BUTTON });
    btnText.anchor.set(0.5);
    btn.addChild(btnText);
    btn.position.set(GAME_WIDTH / 2, GAME_HEIGHT * 0.62);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => {
      sfxClick();
      resumeAudio();
      if (this.onStart) this.onStart();
    });
    this.container.addChild(btn);

    // sound button
    const sndBtn = new Text({ text: '🔊 おと ON', style: STYLE_SUBLABEL });
    sndBtn.anchor.set(0.5);
    sndBtn.position.set(GAME_WIDTH / 2, GAME_HEIGHT * 0.80);
    sndBtn.eventMode = 'static';
    sndBtn.cursor = 'pointer';
    this.container.addChild(sndBtn);

    // level display
    const lv = this.calcLevel(save.totalStars);
    const lvText = new Text({ text: `🛩️ ひこうき Lv.${lv + 1}`, style: STYLE_SUBLABEL });
    lvText.anchor.set(0.5);
    lvText.position.set(GAME_WIDTH / 2, GAME_HEIGHT * 0.88);
    this.container.addChild(lvText);
  }

  private calcLevel(totalStars: number): number {
    const thresholds = [0, 30, 80, 160, 300];
    let lv = 0;
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (totalStars >= thresholds[i]) { lv = i; break; }
    }
    return lv;
  }

  setOnStart(fn: () => void) { this.onStart = fn; }
}

/* ========= COUNTDOWN OVERLAY ========= */
export class CountdownOverlay {
  container = new Container();
  private texts = ['3', '2', '1', 'GO!'];
  private currentIdx = 0;
  private timer = 0;
  private label: Text;
  private callback: (() => void) | null = null;
  done = false;

  constructor() {
    this.label = new Text({ text: '', style: STYLE_COUNTDOWN });
    this.label.anchor.set(0.5);
    this.label.position.set(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    this.container.addChild(this.label);
  }

  start(cb: () => void) {
    this.callback = cb;
    this.currentIdx = 0;
    this.done = false;
    this.timer = 800;
    this.label.text = this.texts[0];
    this.label.scale.set(1.5);
    this.container.visible = true;
    sfxCountdown(false);
  }

  update(dt: number) {
    if (this.done) return;
    this.timer -= dt;

    // scale animation
    const progress = 1 - this.timer / 800;
    this.label.scale.set(1.5 - progress * 0.5);
    this.label.alpha = this.timer < 200 ? this.timer / 200 : 1;

    if (this.timer <= 0) {
      this.currentIdx++;
      if (this.currentIdx >= this.texts.length) {
        this.done = true;
        this.container.visible = false;
        if (this.callback) this.callback();
        return;
      }
      this.label.text = this.texts[this.currentIdx];
      this.label.alpha = 1;
      this.label.scale.set(1.5);
      this.timer = this.currentIdx === 3 ? 600 : 800;
      sfxCountdown(this.currentIdx === 3);
    }
  }
}

/* ========= RESULT SCREEN ========= */
export class ResultScreen {
  container = new Container();
  private onRetry: (() => void) | null = null;
  private onTitle: (() => void) | null = null;

  show(time: number, coins: number, isNewBest: boolean) {
    this.container.removeChildren();

    const bg = new Graphics();
    bg.rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.6 });
    this.container.addChild(bg);

    // panel with shadow
    const panel = new Graphics();
    // shadow
    panel.roundRect(GAME_WIDTH / 2 - 216, 46, 440, GAME_HEIGHT - 80, 24).fill({ color: 0x000000, alpha: 0.2 });
    // panel body
    panel.roundRect(GAME_WIDTH / 2 - 220, 40, 440, GAME_HEIGHT - 80, 24).fill(0xffffff);
    // subtle top highlight
    panel.roundRect(GAME_WIDTH / 2 - 218, 42, 436, 30, 22).fill({ color: 0xffffff, alpha: 0.5 });
    // border
    panel.roundRect(GAME_WIDTH / 2 - 220, 40, 440, GAME_HEIGHT - 80, 24).stroke({ color: 0xe0e0e0, width: 1 });
    this.container.addChild(panel);

    // Home button (top-right of panel)
    const homeBtn = new Container();
    const homeBg = new Graphics();
    homeBg.roundRect(0, 0, 40, 40, 12).fill({ color: 0x000000, alpha: 0.08 });
    homeBg.roundRect(0, 0, 40, 40, 12).stroke({ color: 0xcccccc, width: 1 });
    homeBtn.addChild(homeBg);
    const homeIcon = new Text({ text: '🏠', style: { fontSize: 22 } });
    homeIcon.anchor.set(0.5);
    homeIcon.position.set(20, 20);
    homeBtn.addChild(homeIcon);
    homeBtn.position.set(GAME_WIDTH / 2 + 170, 48);
    homeBtn.eventMode = 'static';
    homeBtn.cursor = 'pointer';
    homeBtn.on('pointerdown', () => {
      sfxClick();
      if (this.onTitle) this.onTitle();
    });
    this.container.addChild(homeBtn);

    // goal text
    const goalText = new Text({ text: '🏆 ゴール！', style: STYLE_RESULT_HEADING });
    goalText.anchor.set(0.5, 0);
    goalText.position.set(GAME_WIDTH / 2, 65);
    this.container.addChild(goalText);

    // star rating
    const stars = time <= STAR3_TIME ? 3 : time <= STAR2_TIME ? 2 : 1;
    const starEmoji = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const titles = [
      '☁️ のんびりフライト♪',
      '✈️ はやい！すごい！',
      '🏆 スカイマスター！',
    ];

    const starText = new Text({ text: starEmoji, style: STYLE_STARS });
    starText.anchor.set(0.5, 0);
    starText.position.set(GAME_WIDTH / 2, 120);
    this.container.addChild(starText);

    const titleText = new Text({ text: titles[stars - 1], style: STYLE_RESULT_TITLE });
    titleText.anchor.set(0.5, 0);
    titleText.position.set(GAME_WIDTH / 2, 168);
    this.container.addChild(titleText);

    // time
    const timeLabel = new Text({ text: `⏱️ ${time.toFixed(1)} びょう`, style: STYLE_RESULT_BODY });
    timeLabel.anchor.set(0.5, 0);
    timeLabel.position.set(GAME_WIDTH / 2, 210);
    this.container.addChild(timeLabel);

    if (isNewBest) {
      const newBest = new Text({ text: '🎉 きろく こうしん！', style: STYLE_RESULT_ACCENT });
      newBest.anchor.set(0.5, 0);
      newBest.position.set(GAME_WIDTH / 2, 242);
      this.container.addChild(newBest);
    }

    // coins
    const coinLabel = new Text({ text: `⭐ ほし: ${coins} / ${TOTAL_COINS}`, style: STYLE_RESULT_BODY });
    coinLabel.anchor.set(0.5, 0);
    coinLabel.position.set(GAME_WIDTH / 2, isNewBest ? 275 : 252);
    this.container.addChild(coinLabel);

    // screenshot placeholder with polished frame
    const photoFrame = new Graphics();
    const fy = isNewBest ? 310 : 290;
    // shadow
    photoFrame.roundRect(GAME_WIDTH / 2 - 78, fy + 3, 160, 90, 8).fill({ color: 0x000000, alpha: 0.15 });
    // frame
    photoFrame.roundRect(GAME_WIDTH / 2 - 82, fy - 2, 168, 98, 10).fill(0xffd700);
    // inner
    photoFrame.roundRect(GAME_WIDTH / 2 - 78, fy + 2, 160, 90, 6).fill(0xf5f5f5);
    this.container.addChild(photoFrame);
    const photoLabel = new Text({ text: '📸 きねんしゃしん', style: STYLE_PHOTO_LABEL });
    photoLabel.anchor.set(0.5, 0);
    photoLabel.position.set(GAME_WIDTH / 2, fy + 98);
    this.container.addChild(photoLabel);

    // buttons
    const retryBtn = this.makeButton('🔄 もういちど', GAME_WIDTH / 2, GAME_HEIGHT - 100, 0x4caf50, () => {
      if (this.onRetry) this.onRetry();
    });
    this.container.addChild(retryBtn);

    const titleBtn = this.makeButton('🏠 タイトルへ', GAME_WIDTH / 2, GAME_HEIGHT - 50, 0x2196f3, () => {
      if (this.onTitle) this.onTitle();
    });
    this.container.addChild(titleBtn);

    this.container.visible = true;
  }

  private makeButton(label: string, x: number, y: number, color: number, onClick: () => void): Container {
    const btn = new Container();
    const bg = new Graphics();
    // shadow
    bg.roundRect(-98, -15, 200, 38, 19).fill({ color: 0x000000, alpha: 0.2 });
    // dark base (depth)
    const darkerColor = darken(color, 0.3);
    bg.roundRect(-100, -18, 200, 38, 19).fill(darkerColor);
    // front face
    bg.roundRect(-100, -18, 200, 34, 19).fill(color);
    // highlight
    bg.roundRect(-90, -15, 180, 12, 10).fill({ color: 0xffffff, alpha: 0.2 });
    btn.addChild(bg);
    const txt = new Text({
      text: label,
      style: {
        fontFamily: '"Zen Maru Gothic", "Hiragino Maru Gothic Pro", sans-serif',
        fontSize: 20,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: { color: darken(color, 0.5).toString(16).padStart(6, '0').replace(/^/, '#'), width: 2 },
        dropShadow: { alpha: 0.3, angle: Math.PI / 4, blur: 2, color: '#000000', distance: 1 },
      },
    });
    txt.anchor.set(0.5);
    btn.addChild(txt);
    btn.position.set(x, y);
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => { sfxClick(); onClick(); });
    return btn;
  }

  setCallbacks(onRetry: () => void, onTitle: () => void) {
    this.onRetry = onRetry;
    this.onTitle = onTitle;
  }

  hide() { this.container.visible = false; }
}

/* ---- helpers ---- */
function darken(color: number, amount: number): number {
  const r = Math.max(0, Math.round(((color >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((color >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((color & 0xff) * (1 - amount)));
  return (r << 16) | (g << 8) | b;
}
