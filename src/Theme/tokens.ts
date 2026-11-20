/**
 * Team RW admin — single source of truth for the black / charcoal / antique-gold
 * design system. These values are mirrored as CSS custom properties in index.css
 * so plain CSS files can use var(--rw-*) while MUI components use these tokens.
 */
export const tokens = Object.freeze({
  // Surfaces
  bg: '#0B0A09', // main workspace background
  sidebar: '#090909',
  topbar: '#090909',
  panel: '#141310', // cards, panels, modals, drawers
  panelAlt: '#181611', // secondary panels, table headers, dropdowns
  input: '#1B1915', // inputs, textareas, selects
  hover: '#211D16', // hover backgrounds
  border: '#30291D', // subtle borders

  // Brand
  gold: '#C39B53',
  goldHover: '#D6B66F',
  goldSoft: 'rgba(195,155,83,0.12)',

  // Text
  text: '#F5F2EC',
  textMuted: '#A49B90',
  textWhite: '#FFFFFF',

  // Overlays on the black shell
  overlay: 'rgba(245,242,236,0.06)',
  overlayStrong: 'rgba(245,242,236,0.10)',

  // Semantic statuses
  success: '#2E7D52',
  successSoft: 'rgba(46,125,82,0.16)',
  successText: '#6FC39A',
  warning: '#D6A03C',
  warningSoft: 'rgba(214,160,60,0.14)',
  warningText: '#E7BD6E',
  danger: '#C6452A',
  dangerSoft: 'rgba(198,69,42,0.15)',
  dangerText: '#E58C77',
  info: '#4C8FC7',
  infoSoft: 'rgba(76,143,199,0.14)',
  infoText: '#8CBEE6',

  // Restrained elevation
  shadowSoft: '0 4px 16px rgba(0,0,0,0.32)',
  shadow: '0 12px 34px rgba(0,0,0,0.45)',
  shadowStrong: '0 24px 56px rgba(0,0,0,0.55)',

  // Legacy aliases (kept so every existing import keeps compiling)
  black: '#0B0A09',
  ink: '#141310',
  paper: '#0B0A09',
  card: '#141310',
  cream: '#F5F2EC',
  goldDark: '#D6B66F',
  goldText: '#D6B66F',
  goldLight: '#D6B66F',
  muted: '#A49B90',
  mutedAlt: '#A49B90',
  line: '#30291D',
  lineStrong: '#4A3F2C',
  surface: '#141310',
  surfaceAlt: '#181611',
  surfaceRaised: '#1B1915',
  surfaceHover: '#211D16',

  // Retained for any floating layer; not used on tables, cards or inputs
  glass: 'rgba(20,19,16,0.90)',
  glassStrong: 'rgba(9,9,9,0.94)',
  glassBorder: '#30291D',
  glassBlur: 'blur(18px)',
} as const);

export const GOLD = tokens.gold;
export const GOLD_HOVER = tokens.goldHover;
export const GOLD_DARK = tokens.goldDark;
export const GOLD_TEXT = tokens.goldText;
export const GOLD_SOFT = tokens.goldSoft;
export const GOLD_LIGHT = tokens.goldLight;
export const BLACK = tokens.black;
export const INK = tokens.ink;
export const PAPER = tokens.paper;
export const CARD = tokens.card;
export const CREAM = tokens.cream;
export const TEXT = tokens.text;
export const TEXT_MUTED = tokens.textMuted;
export const MUTED = tokens.muted;
export const MUTED_ALT = tokens.mutedAlt;
export const LINE = tokens.line;
export const LINE_STRONG = tokens.lineStrong;
export const SURFACE = tokens.surface;
export const SURFACE_ALT = tokens.surfaceAlt;
export const SURFACE_RAISED = tokens.surfaceRaised;
export const SURFACE_HOVER = tokens.surfaceHover;
export const GLASS = tokens.glass;
export const GLASS_STRONG = tokens.glassStrong;
export const GLASS_BORDER = tokens.glassBorder;
export const GLASS_BLUR = tokens.glassBlur;

/** Flat mapping used to declare the same palette as CSS custom properties. */
export const cssVariables = {
  '--rw-bg': tokens.bg,
  '--rw-sidebar': tokens.sidebar,
  '--rw-topbar': tokens.topbar,
  '--rw-panel': tokens.panel,
  '--rw-panel-alt': tokens.panelAlt,
  '--rw-input': tokens.input,
  '--rw-hover': tokens.hover,
  '--rw-border': tokens.border,
  '--rw-gold': tokens.gold,
  '--rw-gold-hover': tokens.goldHover,
  '--rw-text': tokens.text,
  '--rw-text-muted': tokens.textMuted,
  '--rw-overlay': tokens.overlay,
  '--rw-success': tokens.success,
  '--rw-warning': tokens.warning,
  '--rw-danger': tokens.danger,
  '--rw-info': tokens.info,
} as const;

export const glassSx = {
  backgroundColor: tokens.glass,
  backdropFilter: tokens.glassBlur,
  WebkitBackdropFilter: tokens.glassBlur,
  border: `1px solid ${tokens.glassBorder}`,
  boxShadow: '0 18px 44px rgba(0,0,0,0.45)',
};
export const glassStrongSx = {
  backgroundColor: tokens.glassStrong,
  backdropFilter: tokens.glassBlur,
  WebkitBackdropFilter: tokens.glassBlur,
  border: `1px solid ${tokens.glassBorder}`,
  boxShadow: '0 24px 56px rgba(0,0,0,0.55)',
};
