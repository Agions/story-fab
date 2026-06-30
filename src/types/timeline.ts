/**
 * 时间线模型 - 统一类型定义 v2.0
 * 直接迁移自 core/types/timeline.ts（已设计良好，无需修改）
 *
 * @version 2.0 - 2026-05-03
 */

// ─── 枚举与联合类型 ───

export type TrackType = 'video' | 'audio' | 'text' | 'subtitle' | 'effect';
export type TimelineTool = 'select' | 'razor' | 'hand';
export type DragType = 'move' | 'start' | 'end';

// ─── 核心 Clip 类型 ───

export interface TimelineClip {
  id: string;
  trackId: string;
  startMs: number;
  endMs: number;
  sourceStartMs: number;
  sourceEndMs: number;
  name: string;
  color?: string;
  type?: string;
  selected?: boolean;
  keyframes?: AnimationKeyframe[];
  effects?: ClipEffect[];
  speed?: number;
  volume?: number;
  opacity?: number;
}

export interface ClipEffect {
  id: string;
  type: string;
  params: Record<string, unknown>;
  startMs?: number;
  endMs?: number;
}

export interface AnimationKeyframe {
  id: string;
  timeOffset: number;
  property: string;
  value: number | string | boolean;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// ─── 核心 Track 类型 ───

export interface TimelineTrack {
  id: string;
  type: TrackType;
  name: string;
  clips: TimelineClip[];
  muted: boolean;
  locked: boolean;
  visible: boolean;
  height: number;
  color?: string;
  volume?: number;
  transitions?: Transition[];
}

export interface TimelineMarker {
  id: string;
  time: number;
  label?: string;
}

export interface Transition {
  id: string;
  fromClipId: string;
  toClipId: string;
  type: string;
  duration: number;
}

// ─── 时间线容器 ───

export interface Timeline {
  id: string;
  tracks: TimelineTrack[];
  duration: number;
  markers: TimelineMarker[];
  createdAt: string;
  updatedAt: string;
}

// ─── 编辑器状态 ───

export interface TimelineState {
  tracks: TimelineTrack[];
  playheadMs: number;
  zoom: number;
  scrollX: number;
  duration: number;
  snapEnabled: boolean;
  snapThreshold: number;
}

export interface DragState {
  clipId: string;
  trackId: string;
  type: DragType;
  startX: number;
  originalStartMs: number;
  originalEndMs: number;
}

export interface TimelineSelection {
  clipId?: string;
  trackId?: string;
  multipleIds: string[];
  keyframeId?: string;
}

export interface ClipProperties {
  clipId: string;
  name: string;
  startMs: number;
  endMs: number;
  sourceStartMs: number;
  sourceEndMs: number;
  volume?: number;
  speed?: number;
  opacity?: number;
  color?: string;
  keyframes: AnimationKeyframe[];
}

// ─── 编辑器动作（命令模式）───

export type EditorAction =
  | { type: 'ADD_CLIP'; trackId: string; clip: Omit<TimelineClip, 'id' | 'trackId'>; position: number }
  | { type: 'REMOVE_CLIP'; trackId: string; clipId: string }
  | { type: 'MOVE_CLIP'; trackId: string; clipId: string; newPosition: number }
  | { type: 'TRIM_CLIP'; clipId: string; startMs: number; endMs: number }
  | { type: 'SPLIT_CLIP'; clipId: string; splitMs: number }
  | { type: 'COPY_CLIP'; clipId: string }
  | { type: 'ADD_TRANSITION'; fromClipId: string; toClipId: string; transitionType: string; duration: number }
  | { type: 'ADD_EFFECT'; clipId: string; effect: string; params: Record<string, unknown> }
  | { type: 'ADJUST_SPEED'; clipId: string; speed: number }
  | { type: 'ADJUST_VOLUME'; trackId: string; volume: number }
  | { type: 'UNDO' }
  | { type: 'REDO' };

export interface EditorHistory {
  past: Timeline[];
  present: Timeline;
  future: Timeline[];
}

// ─── 编辑器配置 ───

export interface EditorExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'mkv';
  resolution: '720p' | '1080p' | '2k' | '4k';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps: number;
  bitrate: string;
}

export interface EditorConfig {
  maxVideoTracks: number;
  maxAudioTracks: number;
  maxTextTracks: number;
  maxEffectTracks: number;
  previewQuality: 'low' | 'medium' | 'high';
  autoSave: boolean;
  autoSaveInterval: number;
  defaultExportSettings: EditorExportSettings;
}

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  maxVideoTracks: 4,
  maxAudioTracks: 4,
  maxTextTracks: 2,
  maxEffectTracks: 2,
  previewQuality: 'medium',
  autoSave: true,
  autoSaveInterval: 30,
  defaultExportSettings: {
    format: 'mp4',
    resolution: '1080p',
    quality: 'high',
    fps: 30,
    bitrate: '8M',
  },
};

// ─── 工具函数 ───

export function createEmptyTimeline(): Timeline {
  const now = new Date().toISOString();
  return {
    id: `timeline_${Date.now()}`,
    tracks: [],
    duration: 0,
    markers: [],
    createdAt: now,
    updatedAt: now,
  };
}
