/**
 * CutDeck 时间线模型 - 统一类型定义 v2.0
 *
 * 设计原则:
 * 1. TimelineTrack 是唯一的轨道类型，通过 type 字段区分 video/audio/text/effect
 * 2. TimelineClip 是唯一的片段类型，所有时间字段统一使用 startMs/endMs
 * 3. Timeline 是根容器，使用统一的 tracks 数组
 * 4. 旧类型 (VideoClip/VideoTrack 等) 作为别名保留，仅用于向后兼容
 *
 * @version 2.0 - 2026-05-03
 */

// ============================================================
// 枚举与联合类型
// ============================================================

/** 轨道类型枚举 */
export type TrackType = 'video' | 'audio' | 'text' | 'subtitle' | 'effect';

/** 时间线工具 */
export type TimelineTool = 'select' | 'razor' | 'hand';

/** 拖拽操作类型 */
export type DragType = 'move' | 'start' | 'end';

// ============================================================
// 核心Clip类型 (新统一类型)
// ============================================================

/**
 * 时间线片段 - 轨道上的一个剪辑
 * 时间字段统一使用 Ms (毫秒) 后缀
 */
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
  keyframes?: AnimationKeyframe[];
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
  startMs?: number;
  endMs?: number;
}

/** 关键帧 */
export interface AnimationKeyframe {
  id: string;
  timeOffset: number;
  property: string;
  value: number | string | boolean;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// ============================================================
// 核心Track类型 (新统一类型)
// ============================================================

/**
 * 时间线轨道 - 统一的轨道接口
 * 通过 type 字段区分轨道类型
 */
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
  /** 转场列表 (仅 video track) */
  transitions?: Transition[];
}

/** 时间线标记 */
export interface TimelineMarker {
  id: string;
  time: number;
  label?: string;
}

// ============================================================
// 时间线容器 (新统一类型)
// ============================================================

/**
 * 时间线完整数据 - 统一容器
 * 使用 tracks 数组替代分离的 videoTracks/audioTracks 等
 */
export interface Timeline {
  id: string;
  /** 统一轨道数组 (推荐) */
  tracks: TimelineTrack[];
  /** 总时长 (ms) */
  duration: number;
  /** 时间线标记 */
  markers: TimelineMarker[];
  createdAt: string;
  updatedAt: string;

  // ============================================================
  // ⚠️ 遗留字段 - 仅用于向后兼容，新代码应使用 tracks
  // 这些字段在未来的 major 版本中将被移除
  // ============================================================
  /** @deprecated 请使用 tracks */
  videoTracks: VideoTrack[];
  /** @deprecated 请使用 tracks */
  audioTracks: AudioTrack[];
  /** @deprecated 请使用 tracks */
  textTracks: TextTrack[];
  /** @deprecated 请使用 tracks */
  effectTracks: EffectTrack[];
}

// ============================================================
// 遗留类型别名 - 向后兼容
// ============================================================
// 以下类型保留用于兼容旧代码，推荐逐步迁移到新的 TimelineClip/TimelineTrack
// 旧代码使用 startTime/endTime，新代码统一使用 startMs/endMs

/** @deprecated 请使用 TimelineClip */
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

/** @deprecated 请使用 TimelineClip */
export interface AudioClip {
  id: string;
  sourceId?: string;
  startTime: number;
  endTime: number;
  duration?: number;
}

/** @deprecated 请使用 TimelineTrack */
export interface VideoTrack {
  id: string;
  name: string;
  clips: VideoClip[];
  transitions?: Transition[];
  visible: boolean;
  locked: boolean;
}

/** @deprecated 请使用 TimelineTrack */
export interface AudioTrack {
  id: string;
  name: string;
  clips: AudioClip[];
  visible: boolean;
  locked: boolean;
  volume: number;
}

/** @deprecated 请使用 TimelineClip */
export interface TextItem {
  id: string;
  content: string;
  startTime: number;
  endTime: number;
  duration?: number;
  style?: Record<string, unknown>;
}

/** @deprecated 请使用 TimelineTrack */
export interface TextTrack {
  id: string;
  name: string;
  items: TextItem[];
  visible: boolean;
  locked: boolean;
}

/** @deprecated 请使用 TimelineTrack */
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

// ============================================================
// 编辑器状态相关
// ============================================================

/** 时间线状态 */
export interface TimelineState {
  tracks: TimelineTrack[];
  playheadMs: number;
  zoom: number;
  scrollX: number;
  duration: number;
  snapEnabled: boolean;
  snapThreshold: number;
}

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
  keyframes: AnimationKeyframe[];
}

// ============================================================
// 动作相关 - EditorAction
// ============================================================

/**
/** 编辑器动作类型 - 统一的命令模式
 * 所有时间字段使用 startMs/endMs
 *
 * 注意: clip/text/audio 等字段在 ADD_* action 中是输入数据，
 * 不包含 id/trackId（由操作函数生成）
 */
export type EditorAction =
  // 片段操作
  | { type: 'ADD_CLIP'; trackId: string; clip: Omit<TimelineClip, 'id' | 'trackId'>; position: number }
  | { type: 'REMOVE_CLIP'; trackId: string; clipId: string }
  | { type: 'MOVE_CLIP'; trackId: string; clipId: string; newPosition: number }
  | { type: 'TRIM_CLIP'; clipId: string; startMs: number; endMs: number }
  | { type: 'SPLIT_CLIP'; clipId: string; splitMs: number }
  | { type: 'COPY_CLIP'; clipId: string }

  // 效果操作
  | { type: 'ADD_TRANSITION'; fromClipId: string; toClipId: string; transitionType: string; duration: number }
  | { type: 'ADD_EFFECT'; clipId: string; effect: string; params: Record<string, unknown> }
  | { type: 'ADJUST_SPEED'; clipId: string; speed: number }
  | { type: 'ADJUST_VOLUME'; trackId: string; volume: number }

  // 内容操作 (legacy types 用于兼容)
  | { type: 'ADD_TEXT'; trackId: string; text: TextItem; position: number }
  | { type: 'ADD_AUDIO'; trackId: string; audio: AudioClip; position: number }

  // 历史操作
  | { type: 'UNDO' }
  | { type: 'REDO' };

/** 编辑器历史记录 */
export interface EditorHistory {
  past: Timeline[];
  present: Timeline;
  future: Timeline[];
}

// ============================================================
// 配置相关
// ============================================================

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

// ============================================================
// 类型守卫与工具函数
// ============================================================

/** 判断是否为视频轨道 */
export function isVideoTrack(track: TimelineTrack): boolean {
  return track.type === 'video';
}

/** 判断是否为音频轨道 */
export function isAudioTrack(track: TimelineTrack): boolean {
  return track.type === 'audio';
}

/** 判断片段是否选中 */
export function isClipSelected(clip: TimelineClip): boolean {
  return clip.selected === true;
}

/** 计算片段时长 */
export function getClipDuration(clip: TimelineClip): number {
  return clip.endMs - clip.startMs;
}

/** 创建空时间线 */
export function createEmptyTimeline(): Timeline {
  const now = new Date().toISOString();
  return {
    id: `timeline_${Date.now()}`,
    tracks: [],
    duration: 0,
    markers: [],
    createdAt: now,
    updatedAt: now,
    // 遗留字段初始化为空数组
    videoTracks: [],
    audioTracks: [],
    textTracks: [],
    effectTracks: [],
  };
}

/**
 * 从 tracks 同步更新 legacy track arrays
 * 用于保持向后兼容性
 */
export function syncLegacyTracks(timeline: Timeline): Timeline {
  const videoTracks: VideoTrack[] = [];
  const audioTracks: AudioTrack[] = [];
  const textTracks: TextTrack[] = [];
  const effectTracks: EffectTrack[] = [];

  for (const track of timeline.tracks) {
    switch (track.type) {
      case 'video':
        videoTracks.push(track as unknown as VideoTrack);
        break;
      case 'audio':
        audioTracks.push(track as unknown as AudioTrack);
        break;
      case 'subtitle':
        textTracks.push(track as unknown as TextTrack);
        break;
      case 'effect':
        effectTracks.push(track as unknown as EffectTrack);
        break;
    }
  }

  return {
    ...timeline,
    videoTracks,
    audioTracks,
    textTracks,
    effectTracks,
  };
}
