/**
 * Track Operations - 轨道操作
 *
 * @version 2.0 - 2026-05-04
 */

import type {
  Timeline,
  TimelineTrack,
  TrackType,
} from '../../types/timeline';
import { syncLegacyTracks } from '../../types/timeline';
import { calculateDuration } from './timelineHelpers';

/** 创建空时间线 */
export function createEmptyTimeline(): Timeline {
  const now = new Date().toISOString();
  const timeline: Timeline = {
    id: `timeline_${Date.now()}`,
    tracks: [],
    duration: 0,
    markers: [],
    createdAt: now,
    updatedAt: now,
    videoTracks: [],
    audioTracks: [],
    textTracks: [],
    effectTracks: [],
  };
  return timeline;
}

/** 通过 clipId 查找所在的 trackId */
export function findTrackByClipId(timeline: Timeline, clipId: string): string | undefined {
  for (const track of timeline.tracks) {
    if (track.clips.some(c => c.id === clipId)) {
      return track.id;
    }
  }
  return undefined;
}

/** 通用轨道创建配置 */
export interface CreateTrackOptions {
  type: TrackType;
  name?: string;
  height?: number;
}

/**
 * 通用轨道创建工厂函数
 * 消除 trackOperations vs trackManager 间的 12 行轨道管理重复模式
 */
export function createTrack(
  timeline: Timeline,
  options: CreateTrackOptions
): Timeline {
  const { type, name, height = 60 } = options;
  const newTrack: TimelineTrack = {
    id: `${type}_${Date.now()}`,
    type,
    name: name || `${type} Track`,
    clips: [],
    muted: false,
    locked: false,
    visible: true,
    height,
    volume: type === 'audio' ? 1 : undefined,
  };

  const newTracks = [...timeline.tracks, newTrack];
  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    updatedAt: new Date().toISOString(),
  });
}

/** 添加轨道 */
export function addTrack(
  timeline: Timeline,
  type: TrackType,
  name?: string
): Timeline {
  return createTrack(timeline, { type, name });
}

/** 移除轨道 */
export function removeTrack(timeline: Timeline, trackId: string): Timeline {
  const newTracks = timeline.tracks.filter((t) => t.id !== trackId);
  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    duration: calculateDuration(newTracks),
    updatedAt: new Date().toISOString(),
  });
}
