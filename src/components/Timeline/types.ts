/**
 * Timeline Types - 统一到 core/types/timeline.ts
 * 此文件保留用于兼容旧代码，最终应删除
 *
 * @deprecated 请从 'core/types/timeline' 导入
 */

// Re-export for backward compatibility
export {
  TimelineClip,
  TimelineTrack,
  TimelineState,
  TimelineSelection,
  TimelineTool,
  ClipProperties,
  Keyframe,
  ClipEffect,
  TrackType,
  DragType,
  DragState,
} from '../../core/types/timeline';
