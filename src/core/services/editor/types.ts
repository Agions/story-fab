/**
 * Editor Service Types - 统一到 core/types/timeline.ts
 * 此文件保留用于兼容旧代码，最终应删除
 *
 * @deprecated 请从 'core/types/timeline' 导入
 */

// Re-export canonical types from core/types/timeline
export type {
  // Timeline 模型
  Timeline,
  TimelineTrack,
  TimelineMarker,
  TimelineClip,
  TimelineState,
  TimelineSelection,
  TimelineTool,
  ClipProperties,
  // 类型
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
  Keyframe,
  DragType,
  DragState,
  // 配置
  EditorExportSettings,
  EditorConfig,
  // 动作
  EditorAction,
  EditorHistory,
} from '../../types/timeline';

// Value export (cannot use 'export type')
export { DEFAULT_EDITOR_CONFIG } from '../../types/timeline';

// Legacy re-exports (from ../../types)
export type { VideoSegment, ScriptSegment } from '../../types';
