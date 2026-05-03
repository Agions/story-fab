/**
 * Editor Service Interface - 编辑器服务接口
 * 
 * 定义编辑器核心操作的接口契约
 */

import type { Timeline, EditorAction, EditorConfig, EditorExportSettings } from '../types/timeline';

// ============================================================
// 订阅者模式
// ============================================================

export type TimelineSubscriber = (timeline: Timeline) => void;

// ============================================================
// 编辑器服务接口
// ============================================================

export interface IEditorService {
  // 状态访问
  getTimeline(): Timeline;
  
  // 订阅机制
  subscribe(listener: TimelineSubscriber): () => void;
  
  // 操作分发
  dispatch(action: EditorAction): void;
  
  // 历史记录
  undo(): Timeline;
  redo(): Timeline;
  canUndo(): boolean;
  canRedo(): boolean;
  
  // 轨道管理
  createTrack(type: 'video' | 'audio' | 'text' | 'effect'): string;
  
  // 脚本生成
  generateTimelineFromScript(
    scriptSegments: Array<{ startTime: number; endTime: number; text: string }>,
    videoSegments: Array<{ sourceId: string; startTime: number; endTime: number }>
  ): Timeline;
  
  // 导出
  exportTimeline(settings?: Partial<EditorExportSettings>): Promise<Blob>;
  getExportPreview(): { duration: number; resolution: string; estimatedSize: string };
  
  // 持久化
  loadFromStorage(): boolean;
  clear(): void;
  destroy(): void;
}

// ============================================================
// 动作处理器接口 (策略模式)
// ============================================================

export interface IActionHandler {
  /** 处理动作，返回新的时间线状态 */
  handle(timeline: Timeline): Timeline;
  
  /** 是否能处理此动作 (某些handler可能需要额外条件判断) */
  canHandle(action: EditorAction): boolean;
}

/**
 * 动作处理器映射类型
 * key: EditorAction['type']
 * value: 对应的处理器实例
 */
export type ActionHandlerMap = Map<EditorAction['type'], IActionHandler>;
