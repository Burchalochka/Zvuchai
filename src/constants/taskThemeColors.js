/** Canonical task card fills (лимонний / червоний / білий / блакитний / м’ятний / ліловий). */
export const TASK_THEME_LEMON = '#FCFFC6';
export const TASK_THEME_RED = '#FFD9D9';
export const TASK_THEME_WHITE = '#FFFFFF';
export const TASK_THEME_SKY = '#CAECFF';
export const TASK_THEME_MINT = '#CEFFCD';
export const TASK_THEME_LILAC = '#F8CFFF';

export const TASK_THEME_PALETTE = [
  TASK_THEME_LEMON,
  TASK_THEME_RED,
  TASK_THEME_WHITE,
  TASK_THEME_SKY,
  TASK_THEME_MINT,
  TASK_THEME_LILAC,
];

export const DEFAULT_TASK_THEME_COLOR = TASK_THEME_LEMON;

const RED_ALIASES = new Set(['#FFD9D9', '#FFB3BA', '#FF6666']);
const WHITE_ALIASES = new Set(['#FFFFFF', '#FFF']);
const SKY_ALIASES = new Set(['#CAECFF']);
const MINT_ALIASES = new Set(['#CEFFCD']);
const LILAC_ALIASES = new Set(['#F8CFFF']);

/** Смуга для білої картки. */
export const TASK_THEME_WHITE_STRIP = '#CCCCCC';

/** Смуга для блакитної картки. */
export const TASK_THEME_SKY_STRIP = '#0007D2';

/** Смуга для м’ятної картки. */
export const TASK_THEME_MINT_STRIP = '#68B381';

/** Смуга для лілової картки. */
export const TASK_THEME_LILAC_STRIP = '#A100A4';

/**
 * Стилі картки: червоні аліаси → червоний; білий → білий; блакитний → sky; м’ятний → mint; ліловий → lilac; усе інше — лимон.
 */
export function resolveTaskCardBackground(themeColor) {
  const norm = String(themeColor || '')
    .trim()
    .toUpperCase();
  const hex = norm.startsWith('#') ? norm : `#${norm}`;
  if (RED_ALIASES.has(hex)) return TASK_THEME_RED;
  if (WHITE_ALIASES.has(hex)) return TASK_THEME_WHITE;
  if (SKY_ALIASES.has(hex)) return TASK_THEME_SKY;
  if (MINT_ALIASES.has(hex)) return TASK_THEME_MINT;
  if (LILAC_ALIASES.has(hex)) return TASK_THEME_LILAC;
  return TASK_THEME_LEMON;
}

export function resolveTaskStripColor(themeColor) {
  const bg = resolveTaskCardBackground(themeColor);
  if (bg === TASK_THEME_RED) return '#FF6666';
  if (bg === TASK_THEME_WHITE) return TASK_THEME_WHITE_STRIP;
  if (bg === TASK_THEME_SKY) return TASK_THEME_SKY_STRIP;
  if (bg === TASK_THEME_MINT) return TASK_THEME_MINT_STRIP;
  if (bg === TASK_THEME_LILAC) return TASK_THEME_LILAC_STRIP;
  return '#DDF622';
}

export function isLemonTaskTheme(themeColor) {
  return resolveTaskCardBackground(themeColor) === TASK_THEME_LEMON;
}

export function isWhiteTaskTheme(themeColor) {
  return resolveTaskCardBackground(themeColor) === TASK_THEME_WHITE;
}

export function isSkyTaskTheme(themeColor) {
  return resolveTaskCardBackground(themeColor) === TASK_THEME_SKY;
}

export function isMintTaskTheme(themeColor) {
  return resolveTaskCardBackground(themeColor) === TASK_THEME_MINT;
}

export function isLilacTaskTheme(themeColor) {
  return resolveTaskCardBackground(themeColor) === TASK_THEME_LILAC;
}
