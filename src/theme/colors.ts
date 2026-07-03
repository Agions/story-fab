/**
 * StoryFab — Cinematic Darkroom Color System (TypeScript)
 *
 * A warm, film-editing-suite palette. Deep charcoal bases with amber/gold
 * accents that evoke film projector light. Every surface has a subtle warm
 * undertone — this is NOT cold tech-dark.
 *
 * Architecture:
 * - globals.css :root {} — runtime CSS entry (design system source of truth)
 * - colors.ts (this file) — programmatic color values for JS/TS usage
 * - tailwind.config.ts — Tailwind utility classes
 * - variables.less — Less compile-time variables
 */

export const colors = {
  /* ═══ Primary: Amber/Gold Cinema ═══ */
  primary:       '#c8956c',
  primaryHover:  '#d4a574',
  primaryActive: '#a07040',
  primaryDim:    '#8a6848',

  gold:  '#d4a574',
  amber: '#c49660',
  warm:  '#b8856a',

  /* ═══ Functional Colors ═══ */
  success:    '#5a9e6f',
  successBg:  'rgba(90, 158, 111, 0.12)',
  warning:    '#c49660',
  warningBg:  'rgba(196, 150, 96, 0.12)',
  error:      '#c75050',
  errorBg:    'rgba(199, 80, 80, 0.12)',
  info:       '#6b8cce',
  infoBg:     'rgba(107, 140, 206, 0.12)',

  /* ═══ Secondary Accent Colors ═══ */
  accentBlue:   '#6b8cce',
  accentPurple: '#8b7ec8',
  accentCyan:   '#5a9e9e',
  accentRose:   '#c77080',

  /* ═══ Text Colors ═══ */
  textPrimary:   '#f0eee8',
  textSecondary: '#9a9690',
  textTertiary:  '#6b6760',
  textDisabled:  '#4a4742',
  textInverse:   '#1a1814',

  /* ═══ Background Colors (Warm Dark Layering) ═══ */
  bgBase:     '#08080a',
  bgPrimary:  '#0c0c0e',
  bgSecondary:'#111114',
  bgTertiary: '#161619',
  bgElevated: '#1a1a1e',
  bgHover:    '#1f1f24',
  bgActive:   '#26262c',
  bgOverlay:  'rgba(8, 8, 10, 0.85)',

  /* ═══ Borders ═══ */
  borderSubtle:  '#1e1e23',
  borderDefault: '#2a2a31',
  borderStrong:  '#38383f',
  borderActive:  '#4a4a52',

  /* ═══ Timeline Track Colors ═══ */
  timelineVideo:    '#8b7ec8',
  timelineAudio:    '#5a9e9e',
  timelineSubtitle: '#c49660',

  /* ═══ Gradients ═══ */
  gradientHero: `linear-gradient(135deg, #c8956c 0%, #d4a574 35%, #b8856a 70%, #8a6848 100%)`,
  gradientSurface: `linear-gradient(180deg, #111114 0%, #0c0c0e 100%)`,
  gradientLightLeak: `linear-gradient(90deg,
    rgba(200,149,108,0) 0%,
    rgba(200,149,108,0.08) 15%,
    rgba(212,165,116,0.15) 40%,
    rgba(196,150,96,0.12) 65%,
    rgba(184,133,106,0.06) 85%,
    rgba(184,133,106,0) 100%
  )`,
  gradientAmber: `linear-gradient(135deg, #c8956c 0%, #d4a574 100%)`,
  gradientGold:  `linear-gradient(135deg, #d4a574 0%, #c49660 100%)`,

  /* ═══ Glow Effects ═══ */
  glowAmber:   '0 0 20px rgba(200, 149, 108, 0.3), 0 0 40px rgba(200, 149, 108, 0.1)',
  glowAmberSm: '0 0 8px rgba(200, 149, 108, 0.2)',
  glowBlue:    '0 0 20px rgba(107, 140, 206, 0.25)',
  glowPurple:  '0 0 20px rgba(139, 126, 200, 0.25)',
  glowSuccess: '0 0 12px rgba(90, 158, 111, 0.3)',

  /* ═══ Glass Morphism ═══ */
  glassBg:     'rgba(17, 17, 20, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.06)',
  glassBlur:   'blur(10px)',

  /* ═══ Brand (Logo) Palette ═══ */
  brand: {
    purple:      '#7C3AED',
    pink:        '#EC4899',
    amber:       '#F59E0B',
    gold:        '#d4a574',
    darkBg:      '#0B0F1F',
    darkBgLight: '#1A1F3A',
  } as const,
} as const;
