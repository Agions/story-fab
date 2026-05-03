/**
 * 核心类型定义 - 统一导出
 *
 * 时间线相关类型: ./timeline.ts (统一单一来源)
 * 其他类型: ../types.ts
 */
export * from '@/core/types';
export * from './jianying';

// Timeline types - explicit re-export to avoid Keyframe conflict
export type {
  Timeline,
  TimelineTrack,
  TimelineMarker,
  TimelineClip,
  TimelineState,
  TimelineSelection,
  TimelineTool,
  ClipProperties,
  TrackType,
  VideoTrack,
  AudioTrack,
  TextTrack,
  EffectTrack,
  VideoClip,
  AudioClip,
  TextItem,
  Transition,
  ClipEffect,
  AnimationKeyframe,
  DragType,
  DragState,
  EditorAction,
  EditorHistory,
  EditorExportSettings,
  EditorConfig,
  DEFAULT_EDITOR_CONFIG,
} from './timeline';
