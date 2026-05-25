/**
 * 公共格式化工具函数
 * 统一时间、时间戳等格式化逻辑，避免重复实现
 */

// ─── Time & Duration ─────────────────────────────────────────────────────────

/**
 * 格式化时间 (秒 -> mm:ss 或 hh:mm:ss)
 * 用于视频播放器时间显示
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Alias for AI service compatibility (defined locally to avoid circular re-export)
export const formatTimestamp = formatTime;

/**
 * 格式化时长 (秒 -> m:ss 或 h:mm:ss)
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 格式化时长（中文本地化版本）
 */
export function formatDurationChinese(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0秒';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}小时${mins}分${secs}秒`;
  if (mins > 0) return `${mins}分${secs}秒`;
  return `${secs}秒`;
}

/**
 * 格式化时长为友好显示（例如：2小时30分钟）
 */
export function formatFriendlyDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0秒';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  let result = '';
  if (hours > 0) result += `${hours}小时`;
  if (hours > 0 && minutes > 0) result += `${minutes}分钟`;
  else if (hours > 0) { /* skip zero minutes */ }
  else if (minutes > 0) result += `${minutes}分钟`;
  if (secs > 0 && hours === 0) result += `${secs}秒`;
  return result || '0秒';
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化日期 (YYYY-MM-DD)
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化日期时间 (YYYY-MM-DD HH:mm:ss)
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期（自定义格式）
 */
export function formatDateCustom(
  date: string | Date,
  format: string = 'YYYY-MM-DD HH:mm'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  const secs = d.getSeconds().toString().padStart(2, '0');
  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', mins)
    .replace('ss', secs);
}

/**
 * 格式化相对时间（今天、昨天、N天前）
 */
export function formatRelativeTime(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return '今天 ' + targetDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return '昨天 ' + targetDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays < 7) return `${diffDays} 天前`;
  return targetDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

/**
 * 格式化数字（千分位）
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals: number = 0): string {
  if (isNaN(value)) return '0%';
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 截断文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * 首字母大写
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Time conversion constants ───────────────────────────────────────────────
/** 毫秒每秒（用于 ms ↔ seconds 互转） */
export const MS_PER_SECOND = 1000;

/**
 * 获取当前时间戳（毫秒）
 */
export function now(): number {
  return Date.now();
}

/**
 * 获取当前时间的 ISO 8601 字符串
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * 限制数值在 [min, max] 范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 帧级时间码（毫秒 → MM:SS:FF @ 30fps）
 */
export function formatTimecodeMs(ms: number): string {
  const totalSeconds = ms / MS_PER_SECOND;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((ms % MS_PER_SECOND) / (MS_PER_SECOND / 30));
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
}

// ─── Subtitle timecodes ───────────────────────────────────────────────────────
/**
 * Shared factory for subtitle timecodes.
 * @param seconds Seconds as float
 * @param sep Separator between seconds and milliseconds (',' for SRT, '.' for VTT)
 */
const subtitleTime = (seconds: number, sep: string): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}${sep}${ms.toString().padStart(3, '0')}`;
};

/**
 * Format seconds as SRT timecode (HH:MM:SS,mmm)
 */
export const formatSrtTime = (seconds: number): string => subtitleTime(seconds, ',');

/**
 * Format seconds as VTT timecode (HH:MM:SS.mmm)
 */
export const formatVttTime = (seconds: number): string => subtitleTime(seconds, '.');
