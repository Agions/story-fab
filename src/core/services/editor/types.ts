/**
 * Editor Service Types - 统一导出入口
 *
 * 所有类型统一从 core/types/timeline 导出
 * 此文件作为 editor 模块的公共类型索引
 *
 * @deprecated 仅用于向后兼容，新代码请直接从 'core/types/timeline' 导入
 */

export type {
  // 核心模型
  Timeline,
  TimelineTrack,
  TimelineClip,
  TimelineMarker,
  TrackType,
  TimelineTool,

  // 片段相关
  ClipEffect,
  AnimationKeyframe,
  ClipProperties,

  // 状态与选择
  TimelineState,
  TimelineSelection,
  DragState,
  DragType,

  // 轨道类型 (legacy aliases)
  VideoTrack,
  AudioTrack,
  TextTrack,
  EffectTrack,

  // 片段类型 (legacy aliases)
  VideoClip,
  AudioClip,
  TextItem,
  Transition,

  // 配置
  EditorConfig,
  EditorExportSettings,

  // 动作与历史
  EditorAction,
  EditorHistory,
} from '../../types/timeline';

export { DEFAULT_EDITOR_CONFIG } from '../../types/timeline';

// Legacy re-exports from ../../types
export type { VideoSegment, ScriptSegment } from '@/core/types';
