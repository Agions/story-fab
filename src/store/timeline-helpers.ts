/**
 * 时间轴操作工具函数
 * 单一职责：封装 tracks 数组的不可变更新操作
 *
 * 优化说明：
 * - 从 timelineStore.ts 提取，消除业务 Store 与工具函数的耦合
 * - 纯函数集合，无副作用，便于单测
 * - 所有函数都返回新的 tracks 数组（不可变更新）
 */
import type { TimelineTrack, TimelineClip, AnimationKeyframe } from '../core/types/timeline';

/**
 * 更新指定 clip 的数据
 * @param tracks 当前轨道列表
 * @param clipId 要更新的 clip ID
 * @param clipUpdates 要更新的字段
 * @returns 新的轨道列表（不可变更新）
 */
export function updateClipInTracks(
  tracks: TimelineTrack[],
  clipId: string,
  clipUpdates: Partial<TimelineClip>,
): TimelineTrack[] {
  return tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...clipUpdates } : c)),
  }));
}

/**
 * 向指定 clip 添加关键帧
 * @param tracks 当前轨道列表
 * @param clipId 目标 clip ID
 * @param keyframe 要添加的关键帧
 * @returns 新的轨道列表（不可变更新）
 */
export function addKeyframeToClip(
  tracks: TimelineTrack[],
  clipId: string,
  keyframe: AnimationKeyframe,
): TimelineTrack[] {
  return tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) =>
      c.id === clipId ? { ...c, keyframes: [...(c.keyframes || []), keyframe] } : c,
    ),
  }));
}

/**
 * 从指定 clip 删除关键帧
 * @param tracks 当前轨道列表
 * @param clipId 目标 clip ID
 * @param keyframeId 要删除的关键帧 ID
 * @returns 新的轨道列表（不可变更新）
 */
export function removeKeyframeFromClip(
  tracks: TimelineTrack[],
  clipId: string,
  keyframeId: string,
): TimelineTrack[] {
  return tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) =>
      c.id === clipId
        ? { ...c, keyframes: (c.keyframes || []).filter((kf) => kf.id !== keyframeId) }
        : c,
    ),
  }));
}

/**
 * 更新指定 clip 中的关键帧数据
 * @param tracks 当前轨道列表
 * @param clipId 目标 clip ID
 * @param keyframeId 要更新的关键帧 ID
 * @param keyframeUpdates 要更新的字段
 * @returns 新的轨道列表（不可变更新）
 */
export function updateKeyframeInClip(
  tracks: TimelineTrack[],
  clipId: string,
  keyframeId: string,
  keyframeUpdates: Partial<AnimationKeyframe>,
): TimelineTrack[] {
  return tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) =>
      c.id === clipId
        ? {
            ...c,
            keyframes: (c.keyframes || []).map((kf) =>
              kf.id === keyframeId ? { ...kf, ...keyframeUpdates } : kf,
            ),
          }
        : c,
    ),
  }));
}
