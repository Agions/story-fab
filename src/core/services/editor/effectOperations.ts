/**
 * Effect Operations - 特效与转场操作
 *
 * @version 2.0 - 2026-05-03
 */

import type {
  Timeline,
  TimelineClip,
  Transition,
} from '../../types/timeline';
import { syncLegacyTracks } from '../../types/timeline';
import {
  findTrackIndex,
  findClipInTracks,
  updateClipInTrack,
  calculateDuration,
} from './timelineHelpers';

/** 添加转场 */
export function addTransition(
  timeline: Timeline,
  trackId: string,
  fromClipId: string,
  toClipId: string,
  transitionType: string,
  duration: number
): Timeline {
  const trackIndex = findTrackIndex(timeline.tracks, trackId);
  if (trackIndex === -1) return timeline;

  const newTransition: Transition = {
    id: `transition_${Date.now()}`,
    fromClipId,
    toClipId,
    type: transitionType,
    duration,
  };

  const track = timeline.tracks[trackIndex];
  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = {
    ...track,
    transitions: [...(track.transitions || []), newTransition],
  };

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    updatedAt: new Date().toISOString(),
  });
}

/** 添加特效 */
export function addEffect(
  timeline: Timeline,
  clipId: string,
  effectType: string,
  params: Record<string, unknown>
): Timeline {
  const found = findClipInTracks(timeline.tracks, clipId);
  if (!found) return timeline;

  const { track, clipIndex, trackIndex } = found;
  const newEffect = { id: `${effectType}_${Date.now()}`, type: effectType, params };

  const newClips = [...track.clips];
  newClips[clipIndex] = {
    ...track.clips[clipIndex],
    effects: [...(track.clips[clipIndex].effects || []), newEffect],
  };

  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = { ...track, clips: newClips };

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    updatedAt: new Date().toISOString(),
  });
}

/** 调整播放速度 */
export function adjustSpeed(timeline: Timeline, clipId: string, speed: number): Timeline {
  if (speed <= 0) return timeline;
  const found = findClipInTracks(timeline.tracks, clipId);
  if (!found) return timeline;

  const { track, clipIndex, trackIndex } = found;
  const clip = track.clips[clipIndex];
  const sourceDuration = clip.sourceEndMs - clip.sourceStartMs;

  const updatedClip: TimelineClip = {
    ...clip,
    speed,
    endMs: clip.startMs + sourceDuration / speed,
  };

  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = updateClipInTrack(track, clipIndex, updatedClip);

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    duration: calculateDuration(newTracks),
    updatedAt: new Date().toISOString(),
  });
}

/** 调整音量 */
export function adjustVolume(timeline: Timeline, trackId: string, volume: number): Timeline {
  const trackIndex = findTrackIndex(timeline.tracks, trackId);
  if (trackIndex === -1) return timeline;

  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = {
    ...timeline.tracks[trackIndex],
    volume: Math.max(0, Math.min(1, volume)),
  };

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    updatedAt: new Date().toISOString(),
  });
}
