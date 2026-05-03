export * from './types';
export * from './timelineOperations';
export * from './history';
export * from './trackManager';
export * from './export';
export * from './storage';

// Handlers (策略模式)
export * from './handlers';

import {
  createEmptyTimeline,
  addClip,
  removeClip,
  moveClip,
  copyClip,
  trimClip,
  splitClip,
  addTransition,
  addEffect,
  addText,
  addAudio,
  adjustSpeed,
  adjustVolume
} from './timelineOperations';
import { createHistory, pushHistory, undo, redo, canUndo, canRedo } from './history';
import { createTrack } from './trackManager';
import { exportTimeline, getExportPreview } from './export';
import { saveToStorage, loadFromStorage, clearStorage } from './storage';
import {
  DEFAULT_EDITOR_CONFIG,
  type EditorAction,
  type EditorConfig,
  type EditorExportSettings,
  type EditorHistory,
  type ScriptSegment,
  type Timeline,
  type VideoSegment
} from './types';

// ============================================================
// 动作处理器接口 (策略模式)
// ============================================================

/**
 * 动作处理器函数类型
 * 接收时间线和动作，返回新的时间线
 */
type ActionHandlerFn = (timeline: Timeline, action: EditorAction) => Timeline;

// ============================================================
// 动作处理器映射 (策略模式核心)
// ============================================================

const actionHandlers: Record<EditorAction['type'], ActionHandlerFn> = {
  ADD_CLIP: (timeline, action) => {
    if (action.type !== 'ADD_CLIP') return timeline;
    return addClip(timeline, action.trackId, action.clip, action.position);
  },
  
  REMOVE_CLIP: (timeline, action) => {
    if (action.type !== 'REMOVE_CLIP') return timeline;
    return removeClip(timeline, action.trackId, action.clipId);
  },
  
  MOVE_CLIP: (timeline, action) => {
    if (action.type !== 'MOVE_CLIP') return timeline;
    return moveClip(timeline, action.trackId, action.clipId, action.newPosition);
  },
  
  TRIM_CLIP: (timeline, action) => {
    if (action.type !== 'TRIM_CLIP') return timeline;
    return trimClip(timeline, action.clipId, action.startTime, action.endTime);
  },
  
  SPLIT_CLIP: (timeline, action) => {
    if (action.type !== 'SPLIT_CLIP') return timeline;
    return splitClip(timeline, action.clipId, action.splitTime);
  },
  
  COPY_CLIP: (timeline, action) => {
    if (action.type !== 'COPY_CLIP') return timeline;
    return copyClip(timeline, action.clipId);
  },
  
  ADD_TRANSITION: (timeline, action) => {
    if (action.type !== 'ADD_TRANSITION') return timeline;
    return addTransition(
      timeline,
      action.fromClipId,
      action.toClipId,
      action.transitionType,
      action.duration
    );
  },
  
  ADD_EFFECT: (timeline, action) => {
    if (action.type !== 'ADD_EFFECT') return timeline;
    return addEffect(timeline, action.clipId, action.effect, action.params);
  },
  
  ADD_TEXT: (timeline, action) => {
    if (action.type !== 'ADD_TEXT') return timeline;
    return addText(timeline, action.trackId, action.text, action.position);
  },
  
  ADD_AUDIO: (timeline, action) => {
    if (action.type !== 'ADD_AUDIO') return timeline;
    return addAudio(timeline, action.trackId, action.audio, action.position);
  },
  
  ADJUST_SPEED: (timeline, action) => {
    if (action.type !== 'ADJUST_SPEED') return timeline;
    return adjustSpeed(timeline, action.clipId, action.speed);
  },
  
  ADJUST_VOLUME: (timeline, action) => {
    if (action.type !== 'ADJUST_VOLUME') return timeline;
    return adjustVolume(timeline, action.trackId, action.volume);
  },
  
  // UNDO/REDO 由 dispatch 方法直接处理，因为它们需要修改内部 history 状态
  UNDO: () => { throw new Error('UNDO should be handled by dispatch()'); },
  REDO: () => { throw new Error('REDO should be handled by dispatch()'); },
};

// ============================================================
// EditorService - 使用策略模式重构
// ============================================================

export class EditorService {
  private config: EditorConfig;
  private history: EditorHistory;
  private listeners: Set<(timeline: Timeline) => void> = new Set();
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<EditorConfig> = {}) {
    this.config = { ...DEFAULT_EDITOR_CONFIG, ...config };
    this.history = createHistory(createEmptyTimeline());

    if (this.config.autoSave) {
      this.startAutoSave();
    }
  }

  getTimeline(): Timeline {
    return this.history.present;
  }

  subscribe(listener: (timeline: Timeline) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.history.present));
  }

  dispatch(action: EditorAction): void {
    // 策略模式：通过 action.type 直接从映射表获取处理器
    const handler = actionHandlers[action.type];
    
    if (!handler) {
      console.warn(`No handler registered for action type: ${action.type}`);
      return;
    }

    // UNDO/REDO 需要特殊处理（直接操作 history）
    if (action.type === 'UNDO' || action.type === 'REDO') {
      this.handleUndoRedo(action);
      return;
    }

    // 其他操作：调用 handler 获取新时间线，记录历史，通知订阅者
    const newTimeline = handler(this.history.present, action);
    this.history = pushHistory(this.history, newTimeline);
    this.notify();
  }

  /**
   * 处理 UNDO/REDO 操作
   * 这些操作需要直接访问和修改内部 history 状态
   */
  private handleUndoRedo(action: EditorAction): void {
    if (action.type === 'UNDO') {
      const result = undo(this.history);
      this.history = result.history;
      this.notify();
    } else if (action.type === 'REDO') {
      const result = redo(this.history);
      this.history = result.history;
      this.notify();
    }
  }

  undo(): Timeline {
    const result = undo(this.history);
    this.history = result.history;
    this.notify();
    return result.timeline;
  }

  redo(): Timeline {
    const result = redo(this.history);
    this.history = result.history;
    this.notify();
    return result.timeline;
  }

  canUndo(): boolean {
    return canUndo(this.history);
  }

  canRedo(): boolean {
    return canRedo(this.history);
  }

  createTrack(type: 'video' | 'audio' | 'text' | 'effect'): string {
    const result = createTrack(this.history.present, type, this.config);
    this.history.present = result.timeline;
    this.notify();
    return result.trackId;
  }

  generateTimelineFromScript(
    _scriptSegments: ScriptSegment[],
    _videoSegments: VideoSegment[]
  ): Timeline {
    const timeline = createEmptyTimeline();
    this.history.present = timeline;
    this.notify();
    return timeline;
  }

  async exportTimeline(settings?: Partial<EditorExportSettings>): Promise<Blob> {
    return exportTimeline(this.history.present, settings, this.config.defaultExportSettings);
  }

  getExportPreview(): { duration: number; resolution: string; estimatedSize: string } {
    return getExportPreview(this.history.present, this.config.defaultExportSettings);
  }

  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      saveToStorage(this.history.present);
    }, this.config.autoSaveInterval * 1000);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  loadFromStorage(): boolean {
    const data = loadFromStorage();
    if (data) {
      this.history.present = data;
      this.notify();
      return true;
    }
    return false;
  }

  clear(): void {
    this.history = createHistory(createEmptyTimeline());
    clearStorage();
    this.notify();
  }

  destroy(): void {
    this.stopAutoSave();
    this.listeners.clear();
  }

  /**
   * 获取已注册的动作处理器数量（用于测试/调试）
   */
  getRegisteredHandlerCount(): number {
    return Object.keys(actionHandlers).filter(k => k !== 'UNDO' && k !== 'REDO').length;
  }
}

export const editorService = new EditorService();
export default EditorService;
