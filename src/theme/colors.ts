/**
 * story-fab 统一色彩系统 - TypeScript
 *
 * 基于 globals.css OKLCH 语义化分层（设计系统入口）
 *
 * 使用方式：
 *   import { colors } from '@/theme';
 *
 * 架构说明：
 * - globals.css :root {} — 运行时 CSS 入口（main.tsx 已导入）
 * - colors.ts（TypeScript）— OKLCH 原始值
 * - variables.less — 被 _mixins.less 引用，编译时使用
 * - design-system.css — 已删除（从未作为 CSS 加载）
 * - _film-variables.less — 已删除（从未被 @import）
 */

// =============================================
// 🎨 色彩 Token（OKLCH 语义化分层）
// 与 globals.css :root {} 保持数值一致（OKLCH + hex 双重定义）
// =============================================

export const colors = {
  // --- 主色：琥珀色（电影胶片感）---
  primary: 'oklch(65% 0.18 70)',
  primaryHover: 'oklch(72% 0.18 70)',
  primaryActive: 'oklch(58% 0.18 70)',

  // --- 功能色 ---
  success: 'oklch(65% 0.20 145)',
  successBg: 'oklch(65% 0.20 145 / 0.12)',
  warning: 'oklch(75% 0.16 85)',
  warningBg: 'oklch(75% 0.16 85 / 0.12)',
  error: 'oklch(60% 0.22 25)',
  errorBg: 'oklch(60% 0.22 25 / 0.12)',
  info: 'oklch(70% 0.14 200)',

  // --- 科技霓虹色（StoryFab 特色保留）---
  neonBlue: '#00d2ff',
  neonPurple: '#a855f7',
  neonPink: '#ec4899',
  neonGreen: '#10b981',
  neonOrange: '#f97316',
  accentCyan: '#06b6d4',
  accentPink: '#f43f5e',
  accentBlue: '#3b82f6',

  // --- 文字色（暗黑背景）---
  textPrimary: 'oklch(95% 0.01 70)',
  textSecondary: 'oklch(70% 0.02 70)',
  textTertiary: 'oklch(55% 0.02 70)',
  textDisabled: 'oklch(45% 0.01 70)',
  textInverse: 'oklch(15% 0.02 70)',

  // --- 背景色（科技暗黑层级）---
  bgBase: 'oklch(10% 0.02 70)',
  bgPrimary: 'oklch(8% 0.02 70)',
  bgSecondary: 'oklch(14% 0.02 70)',
  bgTertiary: 'oklch(18% 0.02 70)',
  bgElevated: 'oklch(22% 0.02 70)',
  bgHover: 'oklch(26% 0.02 70)',
  bgOverlay: 'oklch(5% 0.02 70 / 0.85)',

  // --- 边框 ---
  borderDefault: 'oklch(25% 0.02 70)',
  borderSecondary: 'oklch(30% 0.02 70)',
  borderActive: 'oklch(40% 0.02 70)',
  borderFocus: 'oklch(65% 0.18 70)',

  // --- 渐变 ---
  gradientPrimary: 'linear-gradient(135deg, oklch(65% 0.18 70) 0%, oklch(55% 0.22 280) 100%)',
  gradientHero: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #a855f7 100%)',
  gradientCyber: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
  gradientNeonPink: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
  gradientSurface: 'linear-gradient(180deg, oklch(18% 0.02 70) 0%, oklch(14% 0.02 70) 100%)',

  // --- 发光效果 ---
  glowPrimary: '0 0 20px oklch(65% 0.18 70 / 0.45)',
  glowCyan: '0 0 20px oklch(70% 0.14 200 / 0.4)',
  glowPink: '0 0 20px oklch(65% 0.22 25 / 0.4)',
  glowPurple: '0 0 20px oklch(60% 0.22 280 / 0.4)',
  glowNeonBlue: '0 0 10px rgba(0, 210, 255, 0.3), 0 0 20px rgba(0, 210, 255, 0.2)',
  glowNeonPurple: '0 0 10px rgba(168, 85, 247, 0.3), 0 0 20px rgba(168, 85, 247, 0.2)',
  glowNeonPink: '0 0 10px rgba(236, 72, 153, 0.3), 0 0 20px rgba(236, 72, 153, 0.2)',

  // --- 玻璃拟态 ---
  glassBg: 'oklch(14% 0.02 70 / 0.8)',
  glassBorder: 'oklch(100% 0 0 / 0.1)',
  glassBlur: 'blur(10px)',
} as const;

// =============================================
// 工具函数
// =============================================

/**
 * 将 OKLCH 颜色转换为 HEX（用于某些需要 hex 的场景）
 * 注意：这是近似转换，OKLCH 到 RGB/HEX 不是无损的
 */
export function oklchToHex(oklch: string): string {
  // 如果已经是 hex 则直接返回
  if (oklch.startsWith('#')) return oklch;

  // 这里可以添加 OKLCH -> RGB -> HEX 的转换逻辑
  // 目前 design-system.css 中有些颜色仍是 hex，可以逐步迁移
  return oklch;
}

/**
 * 获取 CSS 变量引用
 */
export function getCssVar(name: string): string {
  return `var(--${name})`;
}

// 重新导出 design-system.css 中的主 CSS 变量名（供 TypeScript 使用）
export const cssVarNames = {
  colorPrimary: '--color-primary',
  colorSuccess: '--color-success',
  colorWarning: '--color-warning',
  colorError: '--color-error',
  colorBgBase: '--color-bg-base',
  colorBgSecondary: '--color-bg-secondary',
  colorBgElevated: '--color-bg-elevated',
  colorTextPrimary: '--color-text-primary',
  colorBorderDefault: '--color-border-default',
  glowPrimary: '--glow-primary',
  glassBg: '--glass-bg',
} as const;
