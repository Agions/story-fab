/**
 * Timeline Helpers - 时间线辅助函数
 *
 * @version 2.0 - 2026-05-03
 */

import type {
  Timeline,
  TimelineTrack,
  TimelineClip,
} from '../../types/timeline';

/** 根据 trackId 查找轨道索引 */
export function findTrackIndex(tracks: TimelineTrack[], trackId: string): number {
  return tracks.findIndex((t) => t.id === trackId);
}

/** 在所有轨道中查找包含指定 clipId 的轨道 */
export function findClipInTracks(
  tracks: TimelineTrack[],
  clipId: string
): { track: TimelineTrack; clipIndex: number; trackIndex: number } | null {
  for (let ti = 0; ti < tracks.length; ti++) {
    const track = tracks[ti];
    const clipIndex = track.clips.findIndex((c) => c.id === clipId);
    if (clipIndex !== -1) {
      return { track, clipIndex, trackIndex: ti };
    }
  }
  return null;
}

/** 更新轨道中的片段并重新排序 */
export function updateClipInTrack(track: TimelineTrack, clipIndex: number, updatedClip: TimelineClip): TimelineTrack {
  const newClips = [...track.clips];
  newClips[clipIndex] = updatedClip;
  return {
    ...track,
    clips: newClips.sort((a, b) => a.startMs - b.startMs),
  };
}

/** 计算时间线总时长 */
export function calculateDuration(tracks: TimelineTrack[]): number {
  let maxEndMs = 0;
  for (const track of tracks) {
    for (const clip of track.clips) {
      if (clip.endMs > maxEndMs) maxEndMs = clip.endMs;
    }
  }
  return maxEndMs;
}
