/**
 * Media Operations - 文本与音频操作 (legacy types 兼容)
 *
 * @version 2.0 - 2026-05-04
 */

import type {
  Timeline,
  TimelineClip,
  TextItem,
  AudioClip,
} from '../../types/timeline';
import { syncLegacyTracks } from '../../types/timeline';
import { lookupTrack } from './operationBase';

/**
 * 创建基础 TimelineClip 的配置
 */
interface ClipConfig {
  id: string;
  trackId: string;
  startMs: number;
  endMs: number;
  name: string;
  type: 'text' | 'audio';
  volume?: number;
}

/**
 * 通用添加片段到轨道的工厂函数
 * 消除 addText/addAudio 间的内部重复 (原 17 行重复 [82-99] vs [43-60])
 */
function addMediaClip(
  timeline: Timeline,
  trackId: string,
  config: ClipConfig
): Timeline {
  const result = lookupTrack(timeline, trackId);
  if (!result) return timeline;

  const { track, trackIndex } = result;
  const newClip: TimelineClip = {
    id: config.id,
    trackId: config.trackId,
    startMs: config.startMs,
    endMs: config.endMs,
    sourceStartMs: 0,
    sourceEndMs: config.endMs - config.startMs,
    name: config.name,
    type: config.type,
    effects: [],
    keyframes: [],
    ...(config.type === 'audio' && config.volume !== undefined ? { volume: config.volume } : {}),
  };

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

/** 添加文本项 */
export function addText(
  timeline: Timeline,
  trackId: string,
  text: TextItem,
  position: number
): Timeline {
  const duration = text.duration ?? 5;
  return addMediaClip(timeline, trackId, {
    id: `text_${Date.now()}`,
    trackId,
    startMs: position,
    endMs: position + duration,
    name: text.content.substring(0, 20),
    type: 'text',
  });
}

/** 添加音频片段 */
export function addAudio(
  timeline: Timeline,
  trackId: string,
  audio: AudioClip,
  position: number
): Timeline {
  const duration = audio.duration ?? 5;
  return addMediaClip(timeline, trackId, {
    id: `audio_${Date.now()}`,
    trackId,
    startMs: position,
    endMs: position + duration,
    name: 'Audio',
    type: 'audio',
    volume: 1,
  });
}
