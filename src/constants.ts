/** Game-wide constants */

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** Course / physics */
export const BASE_SPEED = 3; // normal horizontal scroll speed (px/frame)
export const MAX_SPEED = 6;
export const BOOST_MULTIPLIER = 2;
export const BOOST_DURATION = 2500; // ms
export const BOOST_COOLDOWN = 5000; // ms
export const PLAYER_MOVE_SPEED = 4; // vertical movement px/frame
export const ACCEL_AMOUNT = 0.8; // forward/backward nudge per frame
export const COURSE_LENGTH = 18000; // total distance in logical px (≈65 s at base speed)

/** Player boundaries */
export const PLAYER_X = GAME_WIDTH * 0.28; // fixed screen X
export const PLAYER_MIN_Y = 40;
export const PLAYER_MAX_Y = GAME_HEIGHT - 80;

/** Zones – each spans a portion of COURSE_LENGTH */
export const ZONES = [
  { name: 'まちの うえ', emoji: '🏙️', start: 0, skyColor: 0x87ceeb },
  { name: 'うみの うえ', emoji: '🌊', start: 0.25, skyColor: 0x4fc3f7 },
  { name: 'やまごえ',   emoji: '🏔️', start: 0.50, skyColor: 0xff8a65 },
  { name: 'よぞら',     emoji: '🌙', start: 0.75, skyColor: 0x1a237e },
] as const;

/** coins */
export const TOTAL_COINS = 40;

/** Wind tunnels */
export const WIND_TUNNEL_POSITIONS = [0.15, 0.35, 0.55, 0.72, 0.88]; // as ratio of COURSE_LENGTH
export const WIND_TUNNEL_SPEED_BOOST = 2.5;
export const WIND_TUNNEL_DURATION = 400; // ms

/** Barrel roll */
export const BARREL_ROLL_DURATION = 500; // ms

/** Level thresholds – cumulative stars */
export const LEVEL_THRESHOLDS = [0, 30, 80, 160, 300]; // Lv1-5

/** Timing for star rating */
export const STAR3_TIME = 60; // seconds – under this => 3 stars
export const STAR2_TIME = 75; //  under this  => 2 stars

/** Colors */
export const UI_COLORS = {
  primary: 0x2196f3,
  accent: 0xff9800,
  success: 0x4caf50,
  bg: 0xf5f5f5,
  text: 0x333333,
  gold: 0xffd700,
};
