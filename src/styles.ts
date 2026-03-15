/**
 * Shared text style presets for crisp, beautiful rendering.
 * All text uses Zen Maru Gothic (Google Fonts) with proper
 * stroke, dropShadow, and high-resolution settings.
 */
import { TextStyle, TextStyleOptions } from 'pixi.js';

const FONT_FAMILY = '"Zen Maru Gothic", "Hiragino Maru Gothic Pro", "BIZ UDGothic", sans-serif';

/** Merge defaults into any style options */
function makeStyle(opts: Partial<TextStyleOptions>): TextStyle {
  return new TextStyle({
    fontFamily: FONT_FAMILY,
    fontWeight: 'bold',
    fill: '#ffffff',
    stroke: { color: '#000000', width: 4 },
    dropShadow: {
      alpha: 0.35,
      angle: Math.PI / 4,
      blur: 4,
      color: '#000000',
      distance: 3,
    },
    ...opts,
  });
}

/* ---- Preset styles ---- */

/** Giant title on title screen */
export const STYLE_TITLE = makeStyle({
  fontSize: 48,
  fontWeight: '900' as any,
  fill: '#ffffff',
  stroke: { color: '#1565c0', width: 8 },
  dropShadow: { alpha: 0.5, angle: Math.PI / 4, blur: 6, color: '#0d47a1', distance: 4 },
  letterSpacing: 2,
});

/** Big button labels (e.g. "あそぶ") */
export const STYLE_BUTTON = makeStyle({
  fontSize: 32,
  fontWeight: '900' as any,
  fill: '#ffffff',
  stroke: { color: '#e65100', width: 5 },
  dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 3, color: '#bf360c', distance: 3 },
});

/** Countdown numbers (3, 2, 1, GO!) */
export const STYLE_COUNTDOWN = makeStyle({
  fontSize: 120,
  fontWeight: '900' as any,
  fill: '#ffffff',
  stroke: { color: '#ff6d00', width: 10 },
  dropShadow: { alpha: 0.6, angle: Math.PI / 4, blur: 8, color: '#e65100', distance: 5 },
});

/** Zone telop (e.g. "🌊 うみの うえ") */
export const STYLE_TELOP = makeStyle({
  fontSize: 52,
  fontWeight: '900' as any,
  fill: '#ffffff',
  stroke: { color: '#000000', width: 7 },
  dropShadow: { alpha: 0.5, angle: Math.PI / 4, blur: 6, color: '#000000', distance: 4 },
});

/** HUD coin counter / timer */
export const STYLE_HUD = makeStyle({
  fontSize: 22,
  fontWeight: '700' as any,
  fill: '#ffffff',
  stroke: { color: '#000000', width: 4 },
  dropShadow: { alpha: 0.4, angle: Math.PI / 6, blur: 2, color: '#000000', distance: 2 },
});

/** HUD coin counter (gold) */
export const STYLE_HUD_COIN = makeStyle({
  fontSize: 22,
  fontWeight: '700' as any,
  fill: '#FFD700',
  stroke: { color: '#5d4037', width: 4 },
  dropShadow: { alpha: 0.4, angle: Math.PI / 6, blur: 2, color: '#3e2723', distance: 2 },
});

/** Small labels (speed label, info) */
export const STYLE_SMALL = makeStyle({
  fontSize: 12,
  fontWeight: '700' as any,
  fill: '#ffffff',
  stroke: { color: '#000000', width: 2 },
  dropShadow: { alpha: 0.3, angle: Math.PI / 4, blur: 1, color: '#000000', distance: 1 },
});

/** Result screen heading */
export const STYLE_RESULT_HEADING = makeStyle({
  fontSize: 46,
  fontWeight: '900' as any,
  fill: '#ff6d00',
  stroke: { color: '#ffffff', width: 6 },
  dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 5, color: '#e65100', distance: 3 },
});

/** Result screen body text */
export const STYLE_RESULT_BODY = makeStyle({
  fontSize: 22,
  fontWeight: '700' as any,
  fill: '#333333',
  stroke: { color: '#ffffff', width: 3 },
  dropShadow: { alpha: 0.2, angle: Math.PI / 4, blur: 2, color: '#999999', distance: 1 },
});

/** Result screen accent (record, new best) */
export const STYLE_RESULT_ACCENT = makeStyle({
  fontSize: 22,
  fontWeight: '900' as any,
  fill: '#ff1744',
  stroke: { color: '#ffffff', width: 3 },
  dropShadow: { alpha: 0.3, angle: Math.PI / 4, blur: 3, color: '#b71c1c', distance: 2 },
});

/** Star rating display */
export const STYLE_STARS = makeStyle({
  fontSize: 40,
  stroke: undefined,
  dropShadow: { alpha: 0.3, angle: Math.PI / 4, blur: 4, color: '#000000', distance: 2 },
});

/** Record display on title */
export const STYLE_RECORD = makeStyle({
  fontSize: 20,
  fontWeight: '700' as any,
  fill: '#ffffff',
  stroke: { color: '#000000', width: 3 },
  dropShadow: { alpha: 0.4, angle: Math.PI / 4, blur: 3, color: '#000000', distance: 2 },
  align: 'center',
  lineHeight: 30,
});

/** Sub-label in title (sound, level) */
export const STYLE_SUBLABEL = makeStyle({
  fontSize: 18,
  fontWeight: '700' as any,
  fill: '#ffffff',
  stroke: { color: '#000000', width: 3 },
  dropShadow: { alpha: 0.3, angle: Math.PI / 4, blur: 2, color: '#000000', distance: 2 },
});

/** Result evaluations title (スカイマスター etc) */
export const STYLE_RESULT_TITLE = makeStyle({
  fontSize: 26,
  fontWeight: '900' as any,
  fill: '#333333',
  stroke: { color: '#ffffff', width: 4 },
  dropShadow: { alpha: 0.25, angle: Math.PI / 4, blur: 3, color: '#999999', distance: 2 },
});

