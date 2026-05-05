/**
 * 公共格式化工具函数
 * 统一时间、时间戳等格式化逻辑，避免重复实现
 * 
 * 本文件作为兼容性导出层，核心实现在 format.ts
 */

// Re-export 所有通用格式化函数 from format.ts
export {
  formatTime,
  formatDuration,
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
} from './format';

// Re-export formatTime as formatTimestamp for AI service compatibility
export { formatTime as formatTimestamp } from './format';

/**
 * Shared factory for subtitle timecodes.
 * @param seconds Seconds as float
 * @param sep Separator between seconds and milliseconds (',' for SRT, '.' for VTT)
 */
const subtitle_time = (seconds: number, sep: string): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}${sep}${ms.toString().padStart(3, '0')}`;
};

/**
 * Format seconds as SRT timecode (HH:MM:SS,mmm)
 */
export const formatSrtTime = (seconds: number): string => subtitle_time(seconds, ',');

/**
 * Format seconds as VTT timecode (HH:MM:SS.mmm)
 */
export const formatVttTime = (seconds: number): string => subtitle_time(seconds, '.');
