/**
 * 时间轴工具函数
 * 格式化、计算等
 */

import { TIMELINE_CONFIG } from './timelineConstants';

/**
 * 格式化时间 (秒 -> mm:ss 或 hh:mm:ss)
 */
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 格式化时间标尺
 */
export const formatTimeRuler = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 格式化毫秒
 */
export const formatMs = (ms: number): string => {
  return formatTime(ms / 1000);
};

/**
 * 时间转像素位置
 */
export const timeToPixel = (
  time: number,
  zoom: number,
  pixelsPerSecond: number = 100
): number => {
  return time * pixelsPerSecond * zoom;
};

/**
 * 像素位置转时间
 */
export const pixelToTime = (
  pixel: number,
  zoom: number,
  pixelsPerSecond: number = 100
): number => {
  return pixel / (pixelsPerSecond * zoom);
};

/**
 * 计算缩放后的时间间隔
 */
export const calculateTimeInterval = (zoom: number): number => {
  if (zoom < 0.2) return 60; // 1分钟
  if (zoom < 0.5) return 30; // 30秒
  if (zoom < 1) return 10; // 10秒
  if (zoom < 2) return 5; // 5秒
  if (zoom < 5) return 1; // 1秒
  return 0.5; // 0.5秒
};

/**
 * 吸附到时间点
 */
export const snapToPoint = (
  time: number,
  snapPoints: number[],
  threshold: number = TIMELINE_CONFIG.snapThreshold / 100
): number => {
  for (const point of snapPoints) {
    if (Math.abs(time - point) < threshold) {
      return point;
    }
  }
  return time;
};

/**
 * 裁剪时间范围
 */
export const clampTime = (
  time: number,
  min: number = 0,
  max: number = TIMELINE_CONFIG.maxClipDuration
): number => {
  return Math.max(min, Math.min(max, time));
};

/**
 * 计算片段重叠
 */
export const checkOverlap = (
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean => {
  return start1 < end2 && end1 > start2;
};

/**
 * 格式化时长为友好显示
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}秒`;
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}小时${mins}分` : `${hours}小时`;
};
