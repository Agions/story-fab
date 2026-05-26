/**
 * story-fab Theme System
 *
 * 统一色彩管理
 *
 * 架构说明：
 *   - globals.css :root {}      ← 真实运行时 CSS 入口（main.tsx 已导入）
 *   - colors.ts   OKLCH         ← TypeScript 层，映射 globals.css 变量
 *   - _mixins.less + variables.less    ← 被 9+ 组件 LESS 文件引用（CSS Modules 编译）
 *   - design-system.css           ← 已删除（从未作为 CSS 加载）
 *   - _film-variables.less        ← 已删除（从未被 @import）
 *
 * 使用方式：
 *   import { colors } from '@/theme';
 */

export { colors } from './colors';
