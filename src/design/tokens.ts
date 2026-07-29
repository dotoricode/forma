/**
 * Forma Design System — token definitions.
 *
 * The palettes are traceable to VS Code's built-in Light+ and Dark+ themes:
 * workbench defaults provide the surfaces and UI states, while the theme
 * files provide the chart series hues. Components still consume semantic
 * custom properties only; these source values never leak into block CSS.
 */

export interface FormaColorPalette {
  canvas: string;
  surface: string;
  surfaceRaised: string;
  text: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentStrong: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  successText: string;
  warningText: string;
  dangerText: string;
  infoText: string;
  chartBlue: string;
  chartCyan: string;
  chartYellow: string;
  chartPurple: string;
  chartOrange: string;
  chartGreen: string;
}

export const vscodeLight: FormaColorPalette = {
  canvas: "#FFFFFF",
  surface: "#F3F3F3",
  surfaceRaised: "#F0F0F0",
  text: "#333333",
  textMuted: "#616161",
  border: "#D4D4D4",
  borderStrong: "#C4C4C4",
  accent: "#007ACC",
  accentStrong: "#006AB1",
  onAccent: "#FFFFFF",
  success: "#388A34",
  warning: "#BF8803",
  danger: "#E51400",
  info: "#0063D3",
  // Darker than charts because these values are also used as body text.
  successText: "#277A2E",
  warningText: "#855F00",
  dangerText: "#A1260D",
  infoText: "#0063D3",
  chartBlue: "#0070C1",
  chartCyan: "#267F99",
  chartYellow: "#795E26",
  chartPurple: "#AF00DB",
  chartOrange: "#A31515",
  chartGreen: "#388A34",
};

export const vscodeDark: FormaColorPalette = {
  canvas: "#1E1E1E",
  surface: "#252526",
  surfaceRaised: "#2A2D2E",
  text: "#CCCCCC",
  textMuted: "#969696",
  border: "#3C3C3C",
  borderStrong: "#5A5D5E",
  accent: "#3794FF",
  accentStrong: "#4FC1FF",
  onAccent: "#1E1E1E",
  success: "#89D185",
  warning: "#CCA700",
  danger: "#F14C4C",
  info: "#59A4F9",
  successText: "#89D185",
  warningText: "#DCDCAA",
  dangerText: "#F48771",
  infoText: "#75BEFF",
  chartBlue: "#4FC1FF",
  chartCyan: "#4EC9B0",
  chartYellow: "#DCDCAA",
  chartPurple: "#C586C0",
  chartOrange: "#CE9178",
  chartGreen: "#89D185",
};

export const spacing = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.5rem", // 24px
  6: "2rem", // 32px
  7: "3rem", // 48px
  8: "4rem", // 64px
  9: "6rem", // 96px
} as const;

export const radius = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
} as const;

export const breakpoint = {
  mobile: "390px",
  tablet: "1024px",
  desktop: "1440px",
  wide: "1920px",
} as const;

export const motion = {
  durationFast: "120ms",
  durationBase: "180ms",
  durationSlow: "240ms",
  easeStandard: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

/**
 * Reading widths, in rem rather than ch.
 *
 * `ch` is the advance width of the "0" glyph, which makes it wrong here
 * twice over. It scales with the element's own font-size, so the same
 * `70ch` resolved to 743px on body text but only 603px inside the
 * smaller-typed source-note, giving each block a different width for no
 * design reason. And CJK glyphs are roughly twice as wide as "0", so a
 * measure tuned for English fits about half as much Korean per line.
 * rem is font-size independent and behaves the same in both scripts.
 */
export const measure = {
  prose: "42rem", // ~672px: comfortable for both Latin and Hangul body text
  wide: "min(100%, 72rem)", // ~1152px: tables, code, diagrams on wide displays
};

/**
 * Semantic tokens — CSS custom property names emitted into `:root` and
 * `[data-theme="dark"]`. Component CSS must only reference these names.
 */
export const semanticTokenNames = [
  "--color-canvas",
  "--color-surface",
  "--color-surface-raised",
  "--color-text",
  "--color-text-muted",
  "--color-border",
  "--color-border-strong",
  "--color-accent",
  "--color-accent-strong",
  "--color-on-accent",
  "--color-success",
  "--color-warning",
  "--color-danger",
  "--color-info",
  "--color-success-text",
  "--color-warning-text",
  "--color-danger-text",
  "--color-info-text",
  "--color-chart-1",
  "--color-chart-2",
  "--color-chart-3",
  "--color-chart-4",
  "--color-chart-5",
  "--color-chart-6",
] as const;
