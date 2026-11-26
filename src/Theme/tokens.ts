/**
 * Team RW admin — black / charcoal + antique-gold accents.
 * Surfaces and body text stay cool (readable). Gold is for brand / CTAs only,
 * not for page titles, table cells, or filter labels (those looked gold-on-gold).
 * Mirrored as CSS vars in index.css (var(--rw-*)).
 */
export const tokens = Object.freeze({
  // Cool charcoal shell (not warm brown-black — that read as gold wash)
  bg: '#0C0E12', // main workspace shell
  sidebar: '#0A0C10',
  topbar: '#0A0C10',
  panel: '#14181F', // cards, panels, modals, drawers
  panelAlt: '#1A1F27', // table headers, secondary panels
  input: '#1C222B', // inputs, textareas, selects
  hover: '#242B35', // hover backgrounds
  menu: '#1A1F27', // floating menus / popovers
  border: '#2E353F', // cool hairlines
  borderStrong: '#3E4652',

  // Brand (accent only)
  gold: '#C39B53',
  goldHover: '#D6B66F',
  goldSoft: 'rgba(195,155,83,0.12)',

  // Text — cool ink for readability on charcoal
  text: '#ECEEF2',
  textMuted: '#9AA1AB',
  textWhite: '#FFFFFF',

  // Overlays on the cool shell
  overlay: 'rgba(236,238,242,0.06)',
  overlayStrong: 'rgba(236,238,242,0.10)',

  // Semantic statuses
  success: '#2E7D52',
  successSoft: 'rgba(46,125,82,0.18)',
  successText: '#7DCEA6',
  warning: '#D6A03C',
  warningSoft: 'rgba(214,160,60,0.16)',
  warningText: '#EBC47A',
  danger: '#C6452A',
  dangerSoft: 'rgba(198,69,42,0.18)',
  dangerText: '#E99986',
  info: '#4C8FC7',
  infoSoft: 'rgba(76,143,199,0.18)',
  infoText: '#9AC6E8',

  // Restrained elevation
  shadowSoft: '0 4px 16px rgba(0,0,0,0.32)',
  shadow: '0 12px 34px rgba(0,0,0,0.45)',
  shadowStrong: '0 24px 56px rgba(0,0,0,0.55)',

  // Legacy aliases (kept so every existing import keeps compiling)
  black: '#0C0E12',
  ink: '#14181F',
  paper: '#0C0E12',
  card: '#14181F',
  cream: '#ECEEF2',
  goldDark: '#D6B66F',
  goldText: '#D6B66F', // brand accent only — prefer `text` for body / labels
  goldLight: '#D6B66F',
  muted: '#9AA1AB',
  mutedAlt: '#9AA1AB',
  line: '#2E353F',
  lineStrong: '#3E4652',
  surface: '#14181F',
  surfaceAlt: '#1A1F27',
  surfaceRaised: '#1C222B',
  surfaceHover: '#242B35',

  // Retained for any floating layer; not used on tables, cards or inputs
  glass: 'rgba(20,24,31,0.94)',
  glassStrong: 'rgba(10,12,16,0.96)',
  glassBorder: '#2E353F',
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
  '--rw-menu': tokens.menu,
  '--rw-border': tokens.border,
  '--rw-border-strong': tokens.borderStrong,
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
