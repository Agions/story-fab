/**
 * 核心时间线类型统一导出
 * 从 @/types 重新导出，供 core/ 及其子域使用
 */
export type {
  TrackType,
  TimelineTool,
  DragType,
  TimelineClip,
  ClipEffect,
  AnimationKeyframe,
  TimelineTrack,
  TimelineMarker,
  Transition,
  Timeline,
  TimelineState,
  DragState,
  TimelineSelection,
  ClipProperties,
  EditorAction,
  EditorHistory,
  EditorExportSettings,
  EditorConfig,
  // 遗留类型（已废弃，保留向后兼容）
  VideoClip,
  AudioClip,
  VideoTrack,
  AudioTrack,
  TextItem,
  TextTrack,
  EffectTrack,
} from '@/types';

export {
  DEFAULT_EDITOR_CONFIG,
  createEmptyTimeline,
  syncLegacyTracks,
} from '@/types';
