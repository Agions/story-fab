/**
 * Media Operations - 文本与音频操作 (legacy types 兼容)
 *
 * @version 2.0 - 2026-05-03
 */

import type {
  Timeline,
  TimelineClip,
  TextItem,
  AudioClip,
  VideoClip,
} from '../../types/timeline';
import { syncLegacyTracks } from '../../types/timeline';
import { findTrackIndex } from './timelineHelpers';

/** 添加文本项 */
export function addText(
  timeline: Timeline,
  trackId: string,
  text: TextItem,
  position: number
): Timeline {
  const trackIndex = findTrackIndex(timeline.tracks, trackId);
  if (trackIndex === -1) return timeline;

  const duration = text.duration ?? 5;
  const legacyClip: VideoClip = {
    id: `text_${Date.now()}`,
    sourceId: undefined,
    startTime: position,
    endTime: position + duration,
  };

  const newClip: TimelineClip = {
    id: legacyClip.id,
    trackId,
    startMs: position,
    endMs: position + duration,
    sourceStartMs: 0,
    sourceEndMs: duration,
    name: text.content.substring(0, 20),
    type: 'text',
    effects: [],
    keyframes: [],
  };

  const track = timeline.tracks[trackIndex];
  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = {
    ...track,
    clips: [...track.clips, newClip].sort((a, b) => a.startMs - b.startMs),
  };

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    updatedAt: new Date().toISOString(),
  });
}

/** 添加音频片段 */
export function addAudio(
  timeline: Timeline,
  trackId: string,
  audio: AudioClip,
  position: number
): Timeline {
  const trackIndex = findTrackIndex(timeline.tracks, trackId);
  if (trackIndex === -1) return timeline;

  const duration = audio.duration ?? 5;
  const newClip: TimelineClip = {
    id: `audio_${Date.now()}`,
    trackId,
    startMs: position,
    endMs: position + duration,
    sourceStartMs: 0,
    sourceEndMs: duration,
    name: 'Audio',
    type: 'audio',
    volume: 1,
    effects: [],
    keyframes: [],
  };

  const track = timeline.tracks[trackIndex];
  const newTracks = [...timeline.tracks];
  newTracks[trackIndex] = {
    ...track,
    clips: [...track.clips, newClip].sort((a, b) => a.startMs - b.startMs),
  };

  return syncLegacyTracks({
    ...timeline,
    tracks: newTracks,
    updatedAt: new Date().toISOString(),
  });
}
