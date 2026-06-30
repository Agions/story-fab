/**
 * StoryFab — Typography Design Tokens
 *
 * Font families, sizes, weights, and line-heights.
 * Values are also exposed as CSS custom properties in globals.css.
 */

export const fonts = {
  display: ['"Space Grotesk"', '"Outfit"', 'system-ui', 'sans-serif'] as const,
  sans: ['"Inter"', '"Geist Variable"', 'system-ui', 'sans-serif'] as const,
  mono: ['"JetBrains Mono"', '"SF Mono"', '"Fira Code"', 'monospace'] as const,
} as const;

export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.8125rem',  // 13px
  base: '0.875rem', // 14px
  md: '1rem',       // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem',// 30px
  '4xl': '2.25rem', // 36px
} as const;

export const fontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;
