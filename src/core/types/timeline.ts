/**
 * @deprecated 请从 @/types 导入时间线相关类型
 * 此文件为向后兼容的重导出层，将在后续版本移除
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
  Timeline,
  VideoClip,
  AudioClip,
  VideoTrack,
  AudioTrack,
  TextItem,
  TextTrack,
  EffectTrack,
  Transition,
  TimelineState,
  DragState,
  TimelineSelection,
  ClipProperties,
  EditorAction,
  EditorHistory,
  EditorExportSettings,
  EditorConfig,
} from '@/types';

export {
  DEFAULT_EDITOR_CONFIG,
  createEmptyTimeline,
  syncLegacyTracks,
} from '@/types';
