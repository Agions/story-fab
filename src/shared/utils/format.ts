/**
 * 格式化工具 — 兼容层
 * 核心实现在 ./formatting.ts，本文件仅作路径兼容导出
 */

// Re-export 所有格式化函数 (唯一实现在 formatting.ts)
export {
  formatTime,
  formatDuration,
  formatDurationChinese,
  formatFriendlyDuration,
  formatFileSize,
  formatDate,
  formatDateTime,
  formatDateCustom,
  formatRelativeTime,
  formatNumber,
  formatPercent,
  truncateText,
  capitalize,
  MS_PER_SECOND,
  now,
  nowISO,
  clamp,
  formatTimecodeMs,
  formatSrtTime,
  formatVttTime,
} from './formatting';
