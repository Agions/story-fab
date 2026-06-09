/**
 * Clip 拆条配置
 * 单一职责：封装拆条功能的所有常量和配置选项
 *
 * 优化说明：
 * - 从 ClipRippling.tsx 提取，消除 UI 组件与配置的耦合
 * - 集中管理阈值、选项等配置，便于维护
 */

/** 社交平台类型 */
export type SocialPlatform = 'douyin' | 'xiaohongshu' | 'bilibili' | 'youtube_shorts' | 'tiktok';

/** 画面比例 */
export type AspectRatio = '9:16' | '1:1' | '16:9';

/** 片段时长限制（秒） */
export const MIN_CLIP_DURATION_SECONDS = 15;
export const MAX_CLIP_DURATION_SECONDS = 120;

/** 评分阈值 */
export const SCORE_THRESHOLD_HIGH = 80;
export const SCORE_THRESHOLD_MEDIUM = 60;

/** 目标片段数量选项 */
export const TARGET_CLIP_COUNTS = [3, 5, 8, 10, 15] as const;

/** SEO 描述最大长度 */
export const SEO_DESCRIPTION_MAX_LENGTH = 80;

/** 标签最大数量 */
export const HASHTAGS_MAX_COUNT = 5;

/** 动画参数 */
export const MOTION_SCALE_HOVER = 1.01;
export const MOTION_SCALE_TAP = 0.99;

/** 默认帧率 */
export const DEFAULT_FPS = 30;

/** 平台选项 */
export const PLATFORM_OPTIONS: { value: SocialPlatform; label: string; emoji: string }[] = [
  { value: 'douyin', label: '抖音', emoji: '🎵' },
  { value: 'xiaohongshu', label: '小红书', emoji: '📕' },
  { value: 'bilibili', label: 'B站', emoji: '📺' },
  { value: 'youtube_shorts', label: 'YouTube Shorts', emoji: '▶️' },
  { value: 'tiktok', label: 'TikTok', emoji: '🌐' },
];

/** 导出格式选项 */
export const FORMAT_OPTIONS: { value: AspectRatio; label: string; emoji: string }[] = [
  { value: '9:16', label: '9:16 竖屏', emoji: '📱' },
  { value: '1:1', label: '1:1 方屏', emoji: '🖼️' },
  { value: '16:9', label: '16:9 横屏', emoji: '🖥️' },
];
