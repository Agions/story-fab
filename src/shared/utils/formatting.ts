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
 * 格式化秒数为 SRT 字幕时间码 (HH:MM:SS,mmm)
 * @param seconds 秒数
 * @returns SRT 时间码格式
 */
export const formatSrtTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
};

/**
 * 格式化秒数为 VTT 字幕时间码 (HH:MM:SS.mmm)
 * @param seconds 秒数
 * @returns VTT 时间码格式
 */
export const formatVttTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};
