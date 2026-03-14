/**
 * DOM-based UI layer: Title screen, Countdown, HUD, and Result screen.
 * Renders on top of the PixiJS canvas for crisp text, native emoji, and smooth CSS styling.
 */
import {
  GAME_WIDTH, GAME_HEIGHT, COURSE_LENGTH, TOTAL_COINS, STAR3_TIME, STAR2_TIME,
  MAX_SPEED, BOOST_MULTIPLIER, BOOST_COOLDOWN, LEVEL_THRESHOLDS,
} from './constants';
import { SaveData, loadSave } from './state';
import { sfxClick, sfxCountdown, resumeAudio } from './audio';

/* ===== Utility ===== */
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

function setVisible(el: HTMLElement, show: boolean) {
  el.classList.toggle('hidden', !show);
}

/* ===== TITLE SCREEN ===== */
export class DomTitleScreen {
  private root = $('title-screen');
  private onStart: (() => void) | null = null;

  constructor() {
    this.generateClouds();

    $('title-play-btn').addEventListener('pointerdown', () => {
      sfxClick();
      resumeAudio();
      if (this.onStart) this.onStart();
    });
  }

  private generateClouds() {
    const container = this.root.querySelector('.title-clouds') as HTMLElement;
    container.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const c = document.createElement('div');
      c.className = 'title-cloud';
      const w = 80 + Math.random() * 80;
      const h = 28 + Math.random() * 22;
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      c.style.left = `${40 + Math.random() * (GAME_WIDTH - 160)}px`;
      c.style.top = `${20 + Math.random() * 120}px`;
      container.appendChild(c);
    }
  }

  show() {
    const save = loadSave();
    // update record display
    const recEl = this.root.querySelector('.title-record') as HTMLElement;
    if (save.bestTime > 0) {
      recEl.textContent = `🏆 ベストタイム: ${save.bestTime.toFixed(1)}びょう\n⭐ ほし さいだい: ${save.bestCoins}こ`;
      recEl.style.whiteSpace = 'pre-line';
    } else {
      recEl.textContent = '';
    }

    // update level
    const lv = this.calcLevel(save.totalStars);
    $('title-level').textContent = `🛩️ ひこうき Lv.${lv + 1}`;

    this.generateClouds();
    setVisible(this.root, true);
  }

  hide() {
    setVisible(this.root, false);
  }

  setOnStart(fn: () => void) { this.onStart = fn; }

  private calcLevel(totalStars: number): number {
    let lv = 0;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalStars >= LEVEL_THRESHOLDS[i]) { lv = i; break; }
    }
    return lv;
  }
}

/* ===== COUNTDOWN ===== */
export class DomCountdown {
  private root = $('countdown-overlay');
  private textEl = $('countdown-text');
  private steps = ['3', '2', '1', 'GO!'];
  private currentIdx = 0;
  private timer = 0;
  private callback: (() => void) | null = null;
  done = false;

  start(cb: () => void) {
    this.callback = cb;
    this.currentIdx = 0;
    this.done = false;
    this.timer = 800;
    this.textEl.textContent = this.steps[0];
    this.textEl.style.transform = 'scale(1.5)';
    this.textEl.style.opacity = '1';
    setVisible(this.root, true);
    sfxCountdown(false);
  }

  update(dt: number) {
    if (this.done) return;
    this.timer -= dt;

    const progress = 1 - this.timer / 800;
    const scale = 1.5 - progress * 0.5;
    const alpha = this.timer < 200 ? this.timer / 200 : 1;
    this.textEl.style.transform = `scale(${scale})`;
    this.textEl.style.opacity = `${alpha}`;

    if (this.timer <= 0) {
      this.currentIdx++;
      if (this.currentIdx >= this.steps.length) {
        this.done = true;
        setVisible(this.root, false);
        if (this.callback) this.callback();
        return;
      }
      this.textEl.textContent = this.steps[this.currentIdx];
      this.textEl.style.transform = 'scale(1.5)';
      this.textEl.style.opacity = '1';
      this.timer = this.currentIdx === 3 ? 600 : 800;
      sfxCountdown(this.currentIdx === 3);
    }
  }

  hide() {
    setVisible(this.root, false);
  }
}

/* ===== HUD ===== */
export class DomHUD {
  private root = $('hud-layer');
  private timerEl = $('hud-timer');
  private coinsEl = $('hud-coins');
  private progressFill = $('hud-progress-fill');
  private boostFill = $('hud-boost-fill');
  private boostIcon = $('hud-boost-icon');
  private needle = document.getElementById('speedo-needle') as unknown as SVGLineElement;
  private onHome: (() => void) | null = null;

  constructor() {
    $('hud-home-btn').addEventListener('pointerdown', () => {
      sfxClick();
      if (this.onHome) this.onHome();
    });

    // Draw speedometer arc and ticks
    this.drawSpeedoArc();
  }

  private drawSpeedoArc() {
    const svg = this.root.querySelector('.hud-speedo svg') as SVGSVGElement;
    const cx = 40, cy = 40, r = 32;
    // arc from 144° to 396° (same as PI*0.8 to PI*2.2)
    const startAngle = 0.8 * Math.PI;
    const endAngle = 2.2 * Math.PI;
    const x1 = cx + Math.cos(startAngle) * r;
    const y1 = cy + Math.sin(startAngle) * r;
    const x2 = cx + Math.cos(endAngle) * r;
    const y2 = cy + Math.sin(endAngle) * r;
    const arcEl = document.getElementById('speedo-arc') as unknown as SVGPathElement;
    arcEl.setAttribute('d', `M ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2}`);

    // tick marks
    for (let i = 0; i <= 10; i++) {
      const a = startAngle + (i / 10) * (endAngle - startAngle);
      const inner = 28, outer = 32;
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', `${cx + Math.cos(a) * inner}`);
      tick.setAttribute('y1', `${cy + Math.sin(a) * inner}`);
      tick.setAttribute('x2', `${cx + Math.cos(a) * outer}`);
      tick.setAttribute('y2', `${cy + Math.sin(a) * outer}`);
      tick.setAttribute('stroke', '#fff');
      tick.setAttribute('stroke-width', i % 5 === 0 ? '2' : '1');
      tick.setAttribute('opacity', '0.5');
      svg.appendChild(tick);
    }
  }

  show() { setVisible(this.root, true); }
  hide() { setVisible(this.root, false); }
  setOnHome(fn: () => void) { this.onHome = fn; }

  update(speed: number, progress: number, coins: number, time: number, boostCooldown: number, boosting: boolean) {
    // timer
    this.timerEl.textContent = `${time.toFixed(1)} びょう`;

    // coins
    this.coinsEl.textContent = `⭐ ${coins} / ${TOTAL_COINS}`;

    // progress bar
    const pct = Math.min(progress, 1) * 100;
    this.progressFill.style.width = `${pct}%`;

    // speedometer needle
    const maxDisplay = MAX_SPEED * BOOST_MULTIPLIER;
    const ratio = Math.min(speed / maxDisplay, 1);
    const startAngle = 0.8 * Math.PI;
    const needleAngle = startAngle + ratio * 1.4 * Math.PI;
    const cx = 40, cy = 40, len = 26;
    const nx = cx + Math.cos(needleAngle) * len;
    const ny = cy + Math.sin(needleAngle) * len;
    this.needle.setAttribute('x2', `${nx}`);
    this.needle.setAttribute('y2', `${ny}`);
    this.needle.setAttribute('stroke', boosting ? '#ff1744' : '#ffd700');

    // boost gauge
    if (boosting) {
      this.boostFill.className = 'hud-boost-fill active';
      this.boostFill.style.width = '100%';
      this.boostIcon.style.opacity = '1';
    } else if (boostCooldown > 0) {
      const cd = 1 - boostCooldown / BOOST_COOLDOWN;
      this.boostFill.className = 'hud-boost-fill cooldown';
      this.boostFill.style.width = `${cd * 100}%`;
      this.boostIcon.style.opacity = '0.4';
    } else {
      this.boostFill.className = 'hud-boost-fill ready';
      this.boostFill.style.width = '100%';
      this.boostIcon.style.opacity = '1';
    }
  }
}

/* ===== RESULT SCREEN ===== */
export class DomResultScreen {
  private root = $('result-screen');
  private onRetry: (() => void) | null = null;
  private onTitle: (() => void) | null = null;

  constructor() {
    $('result-retry-btn').addEventListener('pointerdown', () => {
      sfxClick();
      if (this.onRetry) this.onRetry();
    });
    $('result-title-btn').addEventListener('pointerdown', () => {
      sfxClick();
      if (this.onTitle) this.onTitle();
    });
    $('result-home-btn').addEventListener('pointerdown', () => {
      sfxClick();
      if (this.onTitle) this.onTitle();
    });
  }

  show(time: number, coins: number, isNewBest: boolean) {
    const stars = time <= STAR3_TIME ? 3 : time <= STAR2_TIME ? 2 : 1;
    const starEmoji = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    const titles = [
      '☁️ のんびりフライト♪',
      '✈️ はやい！すごい！',
      '🏆 スカイマスター！',
    ];

    $('result-stars').textContent = starEmoji;
    $('result-title-text').textContent = titles[stars - 1];
    $('result-time').textContent = `⏱️ ${time.toFixed(1)} びょう`;
    $('result-coins').textContent = `⭐ ほし: ${coins} / ${TOTAL_COINS}`;

    const newBestEl = $('result-newbest');
    if (isNewBest) {
      newBestEl.textContent = '🎉 きろく こうしん！';
      setVisible(newBestEl, true);
    } else {
      setVisible(newBestEl, false);
    }

    setVisible(this.root, true);
  }

  hide() {
    setVisible(this.root, false);
  }

  setCallbacks(onRetry: () => void, onTitle: () => void) {
    this.onRetry = onRetry;
    this.onTitle = onTitle;
  }
}
