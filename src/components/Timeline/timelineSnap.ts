/**
 * 时间轴吸附工具
 * 单一职责：根据其他 clip 边界和总时长计算吸附点
 */
import { SNAP_THRESHOLD_PX } from './constants';
import type { TimelineTrack } from '../../core/types/timeline';

/**
 * 计算所有可吸附的时间点
 * 包括：起点、终点、其他 clip 边界
 * @param excludeClipId 排除自身的 clip id（避免吸附到自己）
 */
function calculateSnapPoints(
  tracks: TimelineTrack[],
  duration: number,
  excludeClipId: string,
): number[] {
  const points: number[] = [0, duration];

  tracks.forEach((track) => {
    track.clips.forEach((clip) => {
      if (clip.id !== excludeClipId) {
        points.push(clip.startMs, clip.endMs);
      }
    });
  });

  // 去重并排序
  return [...new Set(points)].sort((a, b) => a - b);
}

/**
 * 将时间吸附到最近的边界点
 * @param ms 目标时间（毫秒）
 * @param excludeClipId 排除自身的 clip id
 * @param msPerPixel 每像素对应的毫秒数（缩放相关）
 * @param snapEnabled 是否启用吸附
 * @returns 吸附后时间（ms）
 */
export function snapToBoundary(
  ms: number,
  excludeClipId: string,
  tracks: TimelineTrack[],
  duration: number,
  msPerPixel: number,
  snapEnabled: boolean,
): number {
  if (!snapEnabled) return ms;

  const points = calculateSnapPoints(tracks, duration, excludeClipId);
  const threshold = SNAP_THRESHOLD_PX * msPerPixel;

  for (const point of points) {
    if (Math.abs(ms - point) <= threshold) {
      return point;
    }
  }
  return ms;
}
