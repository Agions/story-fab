/**
 * 公共格式化工具函数
 * 统一时间、时间戳等格式化逻辑，避免重复实现
 */

/**
 * 格式化秒数为 MM:SS 格式
 * @param seconds 秒数
 * @returns MM:SS 格式字符串
 */
export const formatTime = (seconds: number): string => {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

/**
 * 格式化秒数为更详细的格式 (HH:MM:SS 或 MM:SS)
 * @param seconds 秒数
 * @returns 格式化后的字符串
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 格式化时间戳为秒数 (用于 AI 提示词)
 * 与 formatTime 相同，但语义上用于时间戳转换
 * @param seconds 秒数
 * @returns MM:SS 格式字符串
 */
export const formatTimestamp = formatTime;

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
