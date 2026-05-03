/**
 * Track Manager - 轨道管理器
 *
 * 统一使用新的 TimelineTrack 类型
 *
 * @version 2.0 - 2026-05-03
 */

import type { Timeline, TimelineTrack, TrackType } from '../../types/timeline';
import { syncLegacyTracks } from '../../types/timeline';
import type { EditorConfig } from './types';

/** 轨道类型到 TrackType 的映射 */
const TRACK_TYPE_MAP: Record<string, TrackType> = {
  video: 'video',
  audio: 'audio',
  text: 'subtitle',
  effect: 'effect',
} as const;

/**
 * 创建新轨道
 */
export function createTrack(
  timeline: Timeline,
  type: 'video' | 'audio' | 'text' | 'effect',
  config: EditorConfig
): { timeline: Timeline; trackId: string } {
  const trackType: TrackType = TRACK_TYPE_MAP[type] ?? type;
  const id = `${type}_${Date.now()}`;

  // 检查轨道数量限制
  const trackCountOfType = timeline.tracks.filter((t) => t.type === trackType).length;
  const maxKey = `max${type.charAt(0).toUpperCase() + type.slice(1)}Tracks` as keyof EditorConfig;
  const maxCount = config[maxKey] as number;

  if (trackCountOfType >= maxCount) {
    return { timeline, trackId: '' };
  }

  const newTrack: TimelineTrack = {
    id,
    type: trackType,
    name: `${type} Track`,
    clips: [],
    muted: false,
    locked: false,
    visible: true,
    height: 60,
    volume: type === 'audio' ? 1 : undefined,
    transitions: type === 'video' ? [] : undefined,
  };

  const newTracks = [...timeline.tracks, newTrack];

  return {
    timeline: syncLegacyTracks({
      ...timeline,
      tracks: newTracks,
      updatedAt: new Date().toISOString(),
    }),
    trackId: id,
  };
}

/**
 * 从脚本生成时间线 (legacy 函数，保留兼容)
 * @deprecated 使用新的 createTrack + addClip 组合
 */
export function generateTimelineFromScript(
  _scriptSegments: Array<{ content: string }>,
  _videoSegments: Array<{ id: string; startTime: number; endTime: number }>,
  _createTrackFn: (type: 'video' | 'text') => string,
  _addClipFn: (
    trackId: string,
    clip: {
      id: string;
      sourceId: string;
      sourceStart: number;
      sourceEnd: number;
      startTime: number;
      endTime: number;
      effects: unknown[];
    },
    position: number
  ) => void,
  _addTextFn: (
    trackId: string,
    text: {
      id: string;
      content: string;
      startTime: number;
      endTime: number;
      style: Record<string, unknown>;
    },
    position: number
  ) => void
): Timeline {
  // 遗留函数，保持原接口签名，内部实现已不推荐使用
  return createEmptyTimelineLegacy();
}

function createEmptyTimelineLegacy(): Timeline {
  const now = new Date().toISOString();
  return {
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
}
