/**
 * StoryForge 设计系统
 * 电影级视频创作平台的视觉语言
 * 
 * 设计理念：Cinematic Dark - 深邃的电影级界面
 * - 主色调：深蓝与琥珀金的碰撞
 * - 风格：专业、沉浸、富有创造力
 * - 细节：胶片质感、微光效果、电影摄影美学
 */

// ============================================================================
// 颜色系统
// ============================================================================

export const colors = {
  // 主色 - 深邃的午夜蓝
  primary: {
    50: '#e6f4ff',
    100: '#bae0ff',
    200: '#91c5ff',
    300: '#69abff',
    400: '#4a94ff',  // 明亮蓝
    500: '#2563eb',  // 主色 - Royal Blue
    600: '#1d4ed8',
    700: '#1e40af',
    800: '#1e3a8a',
    900: '#172554',
  },
  
  // 强调色 - 琥珀金 (温暖、专业)
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',  // 亮金
    500: '#f59e0b',  // 主金
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // 功能色
  success: '#10b981',    // 翡翠绿
  warning: '#f59e0b',    // 琥珀
  error: '#ef4444',      // 红色
  info: '#3b82f6',      // 蓝色
  
  // 中性色 - 偏向暖灰
  gray: {
    50: '#fafaf9',     // 石白
    100: '#f5f5f4',    // 暖灰
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',    // 近黑
  },
  
  // 背景色 - 层次感
  bg: {
    base: '#0c0a09',       // 最深
    primary: '#111110',    // 深色背景
    secondary: '#1a1918',  // 卡片背景
    tertiary: '#272524',   // 悬浮/高亮
    elevated: '#312e2b',    // 模态/弹窗
  },
  
  // 边框色
  border: {
    subtle: '#292524',
    default: '#3f3a36',
    strong: '#57534e',
  },
  
  // 文字色
  text: {
    primary: '#fafaf9',     // 石白 - 主要文字
    secondary: '#a8a29e',   // 暖灰 - 次要文字
    tertiary: '#78716c',    // 深灰 - 辅助文字
    disabled: '#57534e',
    inverse: '#0c0a09',     // 反色文字
  },
  
  // 特效色
  glow: {
    blue: 'rgba(37, 99, 235, 0.4)',   // 蓝色光晕
    gold: 'rgba(245, 158, 11, 0.4)',    // 金色光晕
    purple: 'rgba(139, 92, 246, 0.4)', // 紫色光晕
  },
  
  // 渐变色
  gradient: {
    hero: 'linear-gradient(135deg, #111110 0%, #1e3a8a 50%, #111110 100%)',
    card: 'linear-gradient(180deg, #1a1918 0%, #111110 100%)',
    accent: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    cinematic: 'linear-gradient(to bottom, transparent 0%, rgba(12, 10, 9, 0.8) 100%)',
  },
};

// 暗色模式（与亮色模式相同，因为主设计是暗色）
export const darkColors = colors;

// 亮色模式（可选）
export const lightColors = {
  primary: colors.primary,
  accent: colors.accent,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
  info: colors.info,
  
  bg: {
    base: '#fafaf9',
    primary: '#ffffff',
    secondary: '#f5f5f4',
    tertiary: '#e7e5e4',
    elevated: '#ffffff',
  },
  
  text: {
    primary: '#1c1917',
    secondary: '#57534e',
    tertiary: '#78716c',
    disabled: '#a8a29e',
    inverse: '#fafaf9',
  },
  
  border: {
    subtle: '#e7e5e4',
    default: '#d6d3d1',
    strong: '#a8a29e',
  },
};

// ============================================================================
// 字体系统
// ============================================================================

export const typography = {
  fontFamily: {
    // 标题字体 - 独特的几何无衬线
    display: '"Outfit", "SF Pro Display", -apple-system, sans-serif',
    // 正文字体 - 清晰的阅读字体
    body: '"Inter", "SF Pro Text", -apple-system, sans-serif',
    // 等宽字体 - 代码和技术内容
    mono: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
    // 手写/特殊字体
    handwriting: '"Caveat", "Patrick Hand", cursive',
  },
  
  fontSize: {
    '2xs': '10px',
    xs: '11px',
    sm: '12px',
    base: '14px',
    lg: '15px',
    xl: '16px',
    '2xl': '18px',
    '3xl': '20px',
    '4xl': '24px',
    '5xl': '30px',
    '6xl': '36px',
    '7xl': '48px',
    '8xl': '60px',
  },
  
  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  
  lineHeight: {
    none: 1,
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// ============================================================================
// 间距系统
// ============================================================================

export const spacing = {
  '0': 0,
  'px': 1,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
  '28': 112,
  '32': 128,
  '36': 144,
  '40': 160,
  '44': 176,
  '48': 192,
  '52': 208,
  '56': 224,
  '60': 240,
  '64': 256,
  '72': 288,
  '80': 320,
};

// ============================================================================
// 圆角系统
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '4px',
  DEFAULT: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '20px',
  full: '9999px',
};

// ============================================================================
// 阴影系统
// ============================================================================

export const shadows = {
  // 微妙的层叠阴影
  subtle: '0 1px 2px rgba(0, 0, 0, 0.3)',
  
  // 卡片阴影
  sm: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
  DEFAULT: '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
  md: '0 6px 10px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
  lg: '0 10px 20px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 40px rgba(0, 0, 0, 0.5), 0 8px 16px rgba(0, 0, 0, 0.3)',
  
  // 发光效果
  glow: {
    blue: '0 0 20px rgba(37, 99, 235, 0.3), 0 0 40px rgba(37, 99, 235, 0.1)',
    gold: '0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(245, 158, 11, 0.1)',
    purple: '0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(139, 92, 246, 0.1)',
  },
  
  // 内阴影
  inner: {
    subtle: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
    light: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
    strong: 'inset 0 4px 8px rgba(0, 0, 0, 0.3)',
  },
};

// ============================================================================
// 动画系统
// ============================================================================

export const transitions = {
  // 时长
  duration: {
    instant: '50ms',
    fast: '100ms',
    DEFAULT: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '800ms',
  },
  
  // 缓动函数
  easing: {
    DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    // 弹性效果
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};

// 关键帧动画
export const keyframes = {
  // 淡入
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  
  // 向上滑入
  slideUp: {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  
  // 缩放弹入
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.95)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  
  // 发光脉冲
  glowPulse: {
    '0%, 100%': { boxShadow: '0 0 5px rgba(37, 99, 235, 0.3)' },
    '50%': { boxShadow: '0 0 20px rgba(37, 99, 235, 0.6)' },
  },
  
  // 加载旋转
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  
  // 骨架屏闪烁
  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: '200% 0' },
  },
};

// ============================================================================
// Z-Index 层级
// ============================================================================

export const zIndex = {
  hide: -1,
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
};

// ============================================================================
// 断点系统
// ============================================================================

export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================================================
// 组件特定变量
// ============================================================================

export const components = {
  // 按钮
  button: {
    padding: {
      sm: '6px 12px',
      md: '8px 16px',
      lg: '12px 24px',
    },
    fontSize: {
      sm: '12px',
      md: '14px',
      lg: '16px',
    },
    borderRadius: {
      sm: '6px',
      md: '8px',
      lg: '10px',
    },
  },
  
  // 输入框
  input: {
    padding: '10px 14px',
    fontSize: '14px',
    borderRadius: '8px',
    borderWidth: '1px',
  },
  
  // 卡片
  card: {
    padding: '20px',
    borderRadius: '12px',
    borderWidth: '1px',
  },
  
  // 模态框
  modal: {
    padding: '24px',
    borderRadius: '16px',
    maxWidth: '500px',
  },
};

// ============================================================================
// 默认主题配置
// ============================================================================

const theme = {
  colors,
  darkColors,
  lightColors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  keyframes,
  zIndex,
  breakpoints,
  components,
};

export default theme;

// CSS 变量导出（用于在 CSS 中使用）
export const cssVariables = {
  // 颜色
  '--color-primary': colors.primary[500],
  '--color-primary-hover': colors.primary[600],
  '--color-primary-active': colors.primary[700],
  '--color-accent': colors.accent[500],
  '--color-accent-hover': colors.accent[600],
  '--color-success': colors.success,
  '--color-warning': colors.warning,
  '--color-error': colors.error,
  '--color-info': colors.info,
  
  // 背景
  '--bg-base': colors.bg.base,
  '--bg-primary': colors.bg.primary,
  '--bg-secondary': colors.bg.secondary,
  '--bg-tertiary': colors.bg.tertiary,
  '--bg-elevated': colors.bg.elevated,
  
  // 文字
  '--text-primary': colors.text.primary,
  '--text-secondary': colors.text.secondary,
  '--text-tertiary': colors.text.tertiary,
  
  // 边框
  '--border-subtle': colors.border.subtle,
  '--border-default': colors.border.default,
  '--border-strong': colors.border.strong,
  
  // 字体
  '--font-display': typography.fontFamily.display,
  '--font-body': typography.fontFamily.body,
  '--font-mono': typography.fontFamily.mono,
  
  // 圆角
  '--radius-sm': borderRadius.sm,
  '--radius-md': borderRadius.md,
  '--radius-lg': borderRadius.lg,
  '--radius-xl': borderRadius.xl,
  '--radius-full': borderRadius.full,
  
  // 阴影
  '--shadow-sm': shadows.sm,
  '--shadow-md': shadows.DEFAULT,
  '--shadow-lg': shadows.lg,
  '--shadow-xl': shadows.xl,
  
  // 动画
  '--transition-fast': transitions.duration.fast,
  '--transition-default': transitions.duration.DEFAULT,
  '--transition-slow': transitions.duration.slow,
};
