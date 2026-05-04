/**
 * Operation Base - 基础操作处理
 *
 * 提供编辑操作的通用模式：
 * - 轨道查找与验证
 * - 轨道更新模式
 * - 时间线同步
 *
 * @version 2.0 - 2026-05-04
 */

import type { Timeline, TimelineClip, TimelineTrack } from '../../types/timeline';
import { syncLegacyTracks } from '../../types/timeline';
import { findTrackIndex } from './timelineHelpers';

/**
 * 轨道不存在时的错误处理类型
 */
export type NotFoundBehavior = 'return-original' | 'throw';

/**
 * 通用轨道查找结果
 */
export interface TrackLookupResult {
  track: TimelineTrack;
  trackIndex: number;
}

/**
 * 查找轨道并验证存在性
 */
export function lookupTrack(
  timeline: Timeline,
  trackId: string,
  onNotFound?: () => Timeline
): TrackLookupResult | null {
  const trackIndex = findTrackIndex(timeline.tracks, trackId);
  if (trackIndex === -1) {
    return null;
  }
  return {
    track: timeline.tracks[trackIndex],
    trackIndex,
  };
}

/**
 * 通用轨道更新函数
 */
export function updateTrackClips(
  timeline: Timeline,
  trackIndex: number,
  newClips: TimelineClip[]
): Timeline {
  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = {
    ...timeline.tracks[trackIndex],
    clips: newClips.sort((a, b) => a.startMs - b.startMs),
  };

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * 添加片段到轨道的通用模式
 * 消除 clipOperations, mediaOperations 间的 addClip/addText/addAudio 重复
 */
export function addClipToTrack(
  timeline: Timeline,
  trackId: string,
  clipBuilder: (track: TimelineTrack) => TimelineClip
): Timeline {
  const result = lookupTrack(timeline, trackId);
  if (!result) return timeline;

  const { track, trackIndex } = result;
  const newClip = clipBuilder(track);
  const newClips = [...track.clips, newClip];

  return updateTrackClips(timeline, trackIndex, newClips);
}

/**
 * 通用时间线更新（无轨道变化）
 */
export function updateTimeline(timeline: Timeline): Timeline {
  return syncLegacyTracks({
    ...timeline,
    updatedAt: new Date().toISOString(),
  });
}
