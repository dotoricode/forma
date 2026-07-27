/**
 * Forma Design System — token definitions.
 * Primitive tokens are raw OKLCH values; semantic tokens are the only ones
 * the renderer's CSS is allowed to reference. See DESIGN.md for rationale.
 */

export const primitiveColor = {
  // Neutral ramp (near-achromatic, a touch warm) — used for canvas/surface/text.
  neutral0: "oklch(100% 0 0)",
  neutral50: "oklch(98.5% 0.002 90)",
  neutral100: "oklch(96.5% 0.003 90)",
  neutral200: "oklch(92% 0.004 90)",
  neutral300: "oklch(85% 0.005 90)",
  neutral400: "oklch(70% 0.006 90)",
  neutral500: "oklch(55% 0.006 90)",
  neutral600: "oklch(42% 0.006 90)",
  neutral700: "oklch(30% 0.006 90)",
  neutral800: "oklch(20% 0.005 90)",
  neutral900: "oklch(13% 0.004 90)",
  neutral950: "oklch(9% 0.003 90)",

  // Single accent: restrained, ink-blue. Used sparingly (links, focus, decision).
  accent400: "oklch(62% 0.11 250)",
  accent500: "oklch(54% 0.13 250)",
  accent600: "oklch(46% 0.13 250)",

  // Status colors — meaning-bound only, never decorative.
  success500: "oklch(58% 0.13 152)",
  warning500: "oklch(72% 0.15 80)",
  danger500: "oklch(58% 0.18 25)",
  info500: "oklch(60% 0.10 235)",
} as const;

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

export const measure = {
  prose: "70ch",
  wide: "min(100%, 96ch)",
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
] as const;
