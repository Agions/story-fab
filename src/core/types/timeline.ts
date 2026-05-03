/**
 * CutDeck 时间线模型 - 统一类型定义
 *
 * 所有时间线相关的核心类型都在此文件中定义，确保单一来源。
 * 这是 CutDeck 编辑器的核心数据模型。
 */

// ==================== 轨道相关类型 ====================

/** 轨道类型枚举 */
export type TrackType = 'video' | 'audio' | 'subtitle' | 'effect';

/** 时间线片段 - 轨道上的一个剪辑 */
export interface TimelineClip {
  id: string;
  trackId: string;
  /** 片段在轨道上的开始时间 (ms) */
  startMs: number;
  /** 片段在轨道上的结束时间 (ms) */
  endMs: number;
  /** 源素材开始时间 (ms) */
  sourceStartMs: number;
  /** 源素材结束时间 (ms) */
  sourceEndMs: number;
  /** 片段名称 */
  name: string;
  /** 片段颜色 */
  color?: string;
  /** 片段类型 */
  type?: string;
  /** 是否选中 (UI状态) */
  selected?: boolean;
  /** 关键帧动画 */
  keyframes?: Keyframe[];
  /** 特效 */
  effects?: ClipEffect[];
  /** 播放速度 (1 = 正常) */
  speed?: number;
  /** 音量 (0-1) */
  volume?: number;
  /** 透明度 (0-1) */
  opacity?: number;
}

/** 片段特效 */
export interface ClipEffect {
  id: string;
  type: string;
  params: Record<string, unknown>;
  /** 效果开始时间（相对片段开始）(ms) */
  startMs?: number;
  /** 效果结束时间 (ms) */
  endMs?: number;
}

/** 关键帧 */
export interface Keyframe {
  id: string;
  /** 关键帧在片段内的时间偏移 (ms) */
  timeOffset: number;
  property: string;
  value: number | string | boolean;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

/** 时间线轨道 */
export interface TimelineTrack {
  id: string;
  type: TrackType;
  name: string;
  clips: TimelineClip[];
  /** 静音 */
  muted: boolean;
  /** 锁定 */
  locked: boolean;
  /** 可见 */
  visible: boolean;
  /** 轨道高度 (px) */
  height: number;
  /** 轨道颜色 */
  color?: string;
  /** 音量 (仅 audio track) */
  volume?: number;
}

/** 时间线标记 */
export interface TimelineMarker {
  id: string;
  time: number;
  label?: string;
}

// ==================== 时间线容器 ====================

/** 时间线完整数据 */
export interface Timeline {
  id: string;
  duration: number;
  videoTracks: VideoTrack[];
  audioTracks: AudioTrack[];
  textTracks: TextTrack[];
  effectTracks: EffectTrack[];
  markers: TimelineMarker[];
  createdAt: string;
  updatedAt: string;
}

// ==================== 遗留类型（兼容旧代码）====================
// 以下类型保留用于兼容旧代码，最终应迁移到新的 TimelineClip/TimelineTrack

/** 视频轨道 */
export interface VideoTrack {
  id: string;
  name: string;
  clips: VideoClip[];
  transitions?: Transition[];
  visible: boolean;
  locked: boolean;
}

/** 视频片段 */
export interface VideoClip {
  id: string;
  sourceId?: string;
  sourceStart?: number;
  sourceEnd?: number;
  startTime: number;
  endTime: number;
  speed?: number;
  effects?: Array<{ type: string; params: Record<string, unknown> }>;
}

/** 音频轨道 */
export interface AudioTrack {
  id: string;
  name: string;
  clips: AudioClip[];
  visible: boolean;
  locked: boolean;
  volume: number;
}

/** 音频片段 */
export interface AudioClip {
  id: string;
  sourceId?: string;
  startTime: number;
  endTime: number;
  duration?: number;
}

/** 文本轨道 */
export interface TextTrack {
  id: string;
  name: string;
  items: TextItem[];
  visible: boolean;
  locked: boolean;
}

/** 文本项 */
export interface TextItem {
  id: string;
  content: string;
  startTime: number;
  endTime: number;
  duration?: number;
  style?: Record<string, unknown>;
}

/** 特效轨道 */
export interface EffectTrack {
  id: string;
  name: string;
  effects: Array<Record<string, unknown>>;
  visible: boolean;
  locked: boolean;
}

/** 转场 */
export interface Transition {
  id: string;
  fromClipId: string;
  toClipId: string;
  type: string;
  duration: number;
}

// ==================== 编辑器状态相关 ====================

/** 时间线状态 */
export interface TimelineState {
  tracks: TimelineTrack[];
  playheadMs: number;
  zoom: number;
  scrollX: number;
  duration: number;
  snapEnabled: boolean;
  snapThreshold: number; // ms
}

/** 拖拽操作类型 */
export type DragType = 'move' | 'start' | 'end';

/** 拖拽状态 */
export interface DragState {
  clipId: string;
  trackId: string;
  type: DragType;
  startX: number;
  originalStartMs: number;
  originalEndMs: number;
}

/** 时间线选择 */
export interface TimelineSelection {
  clipId?: string;
  trackId?: string;
  multipleIds: string[];
  keyframeId?: string;
}

/** 片段属性面板数据 */
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
  keyframes: Keyframe[];
}

/** 时间线工具 */
export type TimelineTool = 'select' | 'razor' | 'hand';

// ==================== 动作相关 ====================

/** 编辑器动作类型 */
export type EditorAction =
  | { type: 'ADD_CLIP'; trackId: string; clip: VideoClip; position: number }
  | { type: 'REMOVE_CLIP'; trackId: string; clipId: string }
  | { type: 'MOVE_CLIP'; trackId: string; clipId: string; newPosition: number }
  | { type: 'TRIM_CLIP'; clipId: string; startTime: number; endTime: number }
  | { type: 'SPLIT_CLIP'; clipId: string; splitTime: number }
  | { type: 'ADD_TRANSITION'; fromClipId: string; toClipId: string; transitionType: string; duration: number }
  | { type: 'ADD_EFFECT'; clipId: string; effect: string; params: Record<string, unknown> }
  | { type: 'ADD_TEXT'; trackId: string; text: TextItem; position: number }
  | { type: 'ADD_AUDIO'; trackId: string; audio: AudioClip; position: number }
  | { type: 'ADJUST_SPEED'; clipId: string; speed: number }
  | { type: 'ADJUST_VOLUME'; trackId: string; volume: number }
  | { type: 'COPY_CLIP'; clipId: string }
  | { type: 'UNDO' }
  | { type: 'REDO' };

/** 编辑器历史记录 */
export interface EditorHistory {
  past: Timeline[];
  present: Timeline;
  future: Timeline[];
}

// ==================== 配置相关 ====================

/** 导出设置 */
export interface EditorExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'mkv';
  resolution: '720p' | '1080p' | '2k' | '4k';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps: number;
  bitrate: string;
}

/** 编辑器配置 */
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

/** 默认编辑器配置 */
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
    bitrate: '8M'
  }
};
