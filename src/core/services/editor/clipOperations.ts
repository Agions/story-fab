/**
 * Clip Operations - 片段操作
 *
 * @version 2.0 - 2026-05-03
 */

import type {
  Timeline,
  TimelineClip,
} from '../../types/timeline';
import { syncLegacyTracks } from '../../types/timeline';
import {
  findTrackIndex,
  findClipInTracks,
  updateClipInTrack,
  calculateDuration,
} from './timelineHelpers';

/** 添加片段到轨道 */
export function addClip(
  timeline: Timeline,
  trackId: string,
  clip: Omit<TimelineClip, 'id' | 'trackId'>,
  position: number
): Timeline {
  const trackIndex = findTrackIndex(timeline.tracks, trackId);
  if (trackIndex === -1) return timeline;

  const duration = clip.endMs - clip.startMs;
  const newClip: TimelineClip = {
    ...clip,
    id: crypto.randomUUID(),
    trackId,
    startMs: position,
    endMs: position + duration,
  };

  const updatedTrack = {
    ...timeline.tracks[trackIndex],
    clips: [...timeline.tracks[trackIndex].clips, newClip].sort((a, b) => a.startMs - b.startMs),
  };

  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = updatedTrack;
  const newDuration = Math.max(timeline.duration, newClip.endMs);

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    duration: newDuration,
    updatedAt: new Date().toISOString(),
  });
}

/** 移除片段 */
export function removeClip(timeline: Timeline, trackId: string, clipId: string): Timeline {
  const trackIndex = findTrackIndex(timeline.tracks, trackId);
  if (trackIndex === -1) return timeline;

  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = {
    ...timeline.tracks[trackIndex],
    clips: timeline.tracks[trackIndex].clips.filter((c) => c.id !== clipId),
  };

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    duration: calculateDuration(newTracks),
    updatedAt: new Date().toISOString(),
  });
}

/** 移动片段 */
export function moveClip(
  timeline: Timeline,
  trackId: string,
  clipId: string,
  newPosition: number
): Timeline {
  const found = findClipInTracks(timeline.tracks, clipId);
  if (!found) return timeline;

  const { track, clipIndex, trackIndex } = found;
  const clip = track.clips[clipIndex];
  const duration = clip.endMs - clip.startMs;

  const movedClip: TimelineClip = {
    ...clip,
    startMs: newPosition,
    endMs: newPosition + duration,
  };

  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = updateClipInTrack(track, clipIndex, movedClip);

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    duration: calculateDuration(newTracks),
    updatedAt: new Date().toISOString(),
  });
}

/** 裁剪片段 */
export function trimClip(
  timeline: Timeline,
  clipId: string,
  startMs: number,
  endMs: number
): Timeline {
  const found = findClipInTracks(timeline.tracks, clipId);
  if (!found) return timeline;

  const { track, clipIndex, trackIndex } = found;
  const trimmedClip: TimelineClip = {
    ...track.clips[clipIndex],
    startMs,
    endMs,
  };

  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = updateClipInTrack(track, clipIndex, trimmedClip);

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    duration: calculateDuration(newTracks),
    updatedAt: new Date().toISOString(),
  });
}

/** 分割片段 */
export function splitClip(timeline: Timeline, clipId: string, splitMs: number): Timeline {
  const found = findClipInTracks(timeline.tracks, clipId);
  if (!found) return timeline;

  const { track, clipIndex, trackIndex } = found;
  const clip = track.clips[clipIndex];

  if (splitMs <= clip.startMs || splitMs >= clip.endMs) return timeline;

  const firstPart: TimelineClip = {
    ...clip,
    id: crypto.randomUUID(),
    endMs: splitMs,
  };

  const secondPart: TimelineClip = {
    ...clip,
    id: crypto.randomUUID(),
    startMs: splitMs,
  };

  const newClips = [...track.clips];
  newClips.splice(clipIndex, 1, firstPart, secondPart);

  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = {
    ...track,
    clips: newClips.sort((a, b) => a.startMs - b.startMs),
  };

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    updatedAt: new Date().toISOString(),
  });
}

/** 复制片段 */
export function copyClip(timeline: Timeline, clipId: string): Timeline {
  const found = findClipInTracks(timeline.tracks, clipId);
  if (!found) return timeline;

  const { track, clipIndex, trackIndex } = found;
  const clip = track.clips[clipIndex];
  const duration = clip.endMs - clip.startMs;

  const newClip: TimelineClip = {
    ...clip,
    id: crypto.randomUUID(),
    startMs: clip.endMs,
    endMs: clip.endMs + duration,
  };

  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = {
    ...track,
    clips: [...track.clips, newClip].sort((a, b) => a.startMs - b.startMs),
  };

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    duration: Math.max(timeline.duration, newClip.endMs),
    updatedAt: new Date().toISOString(),
  });
}
