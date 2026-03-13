import { Application, Container, Graphics } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, COURSE_LENGTH, LEVEL_THRESHOLDS, WIND_TUNNEL_DURATION, BASE_SPEED, MAX_SPEED, BOOST_MULTIPLIER, BOOST_DURATION, BARREL_ROLL_DURATION } from './constants';
import { GameState, SaveData, loadSave, writeSave } from './state';
import { InputManager } from './input';
import { Airplane } from './airplane';
import { Background } from './background';
import { CoinManager, WindTunnelManager } from './objects';
import { HUD } from './hud';
import { TrailRenderer, SpeedLines, Confetti, ScreenShake, FlashOverlay } from './effects';
import { TitleScreen, CountdownOverlay, ResultScreen } from './screens';
import { TouchControls } from './touch';
import { startBGM, stopBGM, setBGMSpeed, sfxCoin, sfxBoost, sfxBarrelRoll, sfxGoal, sfxWindTunnel, sfxCountdown, resumeAudio } from './audio';

async function main() {
  // Wait for Google Fonts to load before rendering any text
  await document.fonts.ready;

  const app = new Application();
  await app.init({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: 0x87ceeb,
    antialias: true,
    resolution: Math.max(window.devicePixelRatio || 1, 2),
    autoDensity: true,
  });
  document.body.appendChild(app.canvas);

  // Prevent default touch behaviors (text selection, callout, etc.) on iPad
  for (const evt of ['touchstart', 'touchmove', 'touchend'] as const) {
    app.canvas.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
  }

  // Responsive scaling
  function resize() {
    const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
    const canvas = app.canvas;
    canvas.style.width = `${GAME_WIDTH * scale}px`;
    canvas.style.height = `${GAME_HEIGHT * scale}px`;
    canvas.style.position = 'absolute';
    canvas.style.left = `${(window.innerWidth - GAME_WIDTH * scale) / 2}px`;
    canvas.style.top = `${(window.innerHeight - GAME_HEIGHT * scale) / 2}px`;
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Game objects ---
  const input = new InputManager();
  const background = new Background();
  const airplane = new Airplane();
  const coinMgr = new CoinManager();
  const windMgr = new WindTunnelManager();
  const hud = new HUD();
  const trail = new TrailRenderer();
  const speedLines = new SpeedLines();
  const confetti = new Confetti();
  const shake = new ScreenShake();
  const flash = new FlashOverlay();

  // --- Screens ---
  const titleScreen = new TitleScreen();
  const countdown = new CountdownOverlay();
  const resultScreen = new ResultScreen();

  // --- Touch ---
  const touchControls = new TouchControls(input);

  // --- Scene containers ---
  const gameLayer = new Container();
  gameLayer.addChild(
    background.container,
    windMgr.container,
    coinMgr.container,
    trail.container,
    airplane.container,
    speedLines.container,
    confetti.container,
    flash.container,
    hud.container,
    touchControls.container,
  );

  app.stage.addChild(gameLayer);
  app.stage.addChild(countdown.container);
  app.stage.addChild(titleScreen.container);
  app.stage.addChild(resultScreen.container);

  // --- State ---
  let state: GameState = 'title';
  let worldX = 0;
  let raceTime = 0;
  let windTunnelActive = 0;
  let prevCoins = 0;
  let save: SaveData = loadSave();

  // compute level
  function computeLevel(totalStars: number): number {
    let lv = 0;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalStars >= LEVEL_THRESHOLDS[i]) { lv = i; break; }
    }
    return lv;
  }

  function showTitle() {
    state = 'title';
    stopBGM();
    titleScreen.container.visible = true;
    gameLayer.visible = false;
    resultScreen.hide();
    countdown.container.visible = false;

    // recreate title to update records
    titleScreen.container.removeChildren();
    const newTitle = new TitleScreen();
    newTitle.setOnStart(startGame);
    for (const child of newTitle.container.children) {
      titleScreen.container.addChild(child);
    }
  }

  function startGame() {
    save = loadSave();
    airplane.setLevel(computeLevel(save.totalStars));
    airplane.reset();
    background.reset();
    coinMgr.reset();
    windMgr.reset();
    confetti.reset();
    flash.reset();
    speedLines.hide();
    worldX = 0;
    raceTime = 0;
    windTunnelActive = 0;
    prevCoins = 0;

    titleScreen.container.visible = false;
    resultScreen.hide();
    gameLayer.visible = true;

    state = 'countdown';
    resumeAudio();
    countdown.start(() => {
      state = 'race';
      startBGM();
    });
  }

  function goalReached() {
    state = 'goal';
    stopBGM();
    sfxGoal();
    flash.flash();
    confetti.burst(GAME_WIDTH / 2, GAME_HEIGHT / 2);
    shake.trigger(6, 400);

    // save
    save = loadSave();
    const isNewBest = save.bestTime === 0 || raceTime < save.bestTime;
    const stars = raceTime <= 60 ? 3 : raceTime <= 75 ? 2 : 1;

    if (isNewBest) save.bestTime = raceTime;
    if (coinMgr.collected > save.bestCoins) save.bestCoins = coinMgr.collected;
    save.totalStars += stars;
    save.playCount++;
    writeSave(save);

    // show result after confetti settles
    setTimeout(() => {
      state = 'result';
      resultScreen.show(raceTime, coinMgr.collected, isNewBest);
    }, 2000);
  }

  // --- Callbacks ---
  titleScreen.setOnStart(startGame);
  resultScreen.setCallbacks(startGame, showTitle);
  hud.setOnHome(showTitle);

  // --- Main loop ---
  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS;

    switch (state) {
      case 'countdown':
        countdown.update(dt);
        break;

      case 'race': {
        airplane.update(input, dt);
        const scrollSpeed = airplane.speed;
        worldX += scrollSpeed;

        const progress = worldX / COURSE_LENGTH;
        background.update(scrollSpeed, progress, dt);

        // wind tunnel
        if (windMgr.update(worldX, airplane.container.y)) {
          airplane.windTunnelBurst();
          shake.trigger(3, 200);
          sfxWindTunnel();
          windTunnelActive = WIND_TUNNEL_DURATION;
        }
        if (windTunnelActive > 0) windTunnelActive -= dt;

        windMgr.draw(worldX);
        coinMgr.update(worldX, airplane.container.y);
        coinMgr.draw(worldX);
        trail.draw(airplane);

        // coin collect sound
        if (coinMgr.collected > prevCoins) {
          sfxCoin();
          prevCoins = coinMgr.collected;
        }

        // boost / barrel roll sounds
        if (airplane.boosting && airplane.boostTimer > BOOST_DURATION - 50) {
          sfxBoost();
        }
        if (airplane.rolling && airplane.rollTimer > BARREL_ROLL_DURATION - 50) {
          sfxBarrelRoll();
        }

        // speed lines during boost
        if (airplane.boosting) {
          speedLines.show();
        } else {
          speedLines.hide();
        }
        speedLines.update();

        // BGM speed sync
        const bgmTempo = 200 - (airplane.speed - BASE_SPEED) / (MAX_SPEED * BOOST_MULTIPLIER - BASE_SPEED) * 80;
        setBGMSpeed(bgmTempo);

        raceTime += dt / 1000;
        hud.update(airplane.speed, progress, coinMgr.collected, raceTime, airplane.boostCooldown, airplane.boosting);
        shake.update(gameLayer, dt);

        // goal check
        if (progress >= 1) {
          goalReached();
        }
        break;
      }

      case 'goal':
        confetti.update();
        flash.update(dt);
        shake.update(gameLayer, dt);
        break;

      case 'result':
        confetti.update();
        break;
    }
  });

  // init
  showTitle();

  // Force return to title when Safari restores page from cache (bfcache)
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) showTitle();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state !== 'title') {
      showTitle();
    }
  });
}

main().catch(console.error);
