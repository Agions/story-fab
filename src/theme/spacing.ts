/**
 * StoryFab — Spacing Design Tokens
 *
 * 4px base grid system. Values are also exposed as CSS custom properties
 * in globals.css so they can be used in plain CSS / LESS modules.
 */

export const space = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

export type Space = typeof space;
