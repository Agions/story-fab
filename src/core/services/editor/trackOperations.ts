/**
 * Track Operations - 轨道操作
 *
 * @version 2.0 - 2026-05-03
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

/** 添加轨道 */
export function addTrack(
  timeline: Timeline,
  type: TrackType,
  name?: string
): Timeline {
  const newTrack: TimelineTrack = {
    id: `${type}_${Date.now()}`,
    type,
    name: name || `${type} Track`,
    clips: [],
    muted: false,
    locked: false,
    visible: true,
    height: 60,
    volume: type === 'audio' ? 1 : undefined,
  };

  const newTracks = [...timeline.tracks, newTrack];
  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    updatedAt: new Date().toISOString(),
  });
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
