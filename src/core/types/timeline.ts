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
} from '@/types';

export {
  createEmptyTimeline,
} from '@/types';
