export * from './types';
export * from './timelineOperations';
export * from './history';
export * from './trackManager';
export * from './export';
export * from './storage';
export * from './operationBase';

// Handlers (策略模式)
export * from '@/core/services/editor/handlers';

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
  adjustVolume,
  addTrack,
  findTrackByClipId,
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
  type VideoSegment,
  type TimelineClip,
  type TextItem,
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
    return trimClip(timeline, action.clipId, action.startMs, action.endMs);
  },

  SPLIT_CLIP: (timeline, action) => {
    if (action.type !== 'SPLIT_CLIP') return timeline;
    return splitClip(timeline, action.clipId, action.splitMs);
  },
  
  COPY_CLIP: (timeline, action) => {
    if (action.type !== 'COPY_CLIP') return timeline;
    return copyClip(timeline, action.clipId);
  },
  
  ADD_TRANSITION: (timeline, action) => {
    if (action.type !== 'ADD_TRANSITION') return timeline;
    // Derive trackId from the clip IDs (find which track contains fromClipId)
    const trackId = findTrackByClipId(timeline, action.fromClipId) ?? '';
    return addTransition(
      timeline,
      trackId,
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
      logger.warn(`No handler registered for action type: ${action.type}`);
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
    this.history = pushHistory(this.history, result.timeline);
    this.notify();
    return result.trackId;
  }

  /**
   * 从脚本和视频片段生成时间线
   * @version 2.0 - 使用统一的 TimelineTrack/TimelineClip 类型
   */
  generateTimelineFromScript(
    scriptSegments: ScriptSegment[],
    videoSegments: VideoSegment[]
  ): Timeline {
    // 使用统一的 tracks 数组
    let timeline = createEmptyTimeline();

    // 添加视频轨和文本轨
    timeline = addTrack(timeline, 'video');
    timeline = addTrack(timeline, 'text');

    const videoTrackIndex = timeline.tracks.findIndex(t => t.type === 'video');
    const textTrackIndex = timeline.tracks.findIndex(t => t.type === 'text');

    if (videoTrackIndex === -1 || textTrackIndex === -1) {
      return timeline;
    }

    const newTracks = [...timeline.tracks];
    const videoTrack = { ...newTracks[videoTrackIndex], clips: [...newTracks[videoTrackIndex].clips] };
    const textTrack = { ...newTracks[textTrackIndex], clips: [...newTracks[textTrackIndex].clips] };

    let currentMs = 0;

    for (let i = 0; i < Math.min(scriptSegments.length, videoSegments.length); i++) {
      const script = scriptSegments[i];
      const video = videoSegments[i];
      const duration = video.endTime - video.startTime;

      // 添加视频片段 (TimelineClip)
      const videoClip: TimelineClip = {
        id: crypto.randomUUID(),
        trackId: videoTrack.id,
        name: `clip_${i}`,
        startMs: currentMs,
        endMs: currentMs + duration,
        sourceStartMs: video.startTime,
        sourceEndMs: video.endTime,
        effects: [],
        volume: 1,
      };
      videoTrack.clips.push(videoClip);

      // 添加文本片段 (TextItem)
      const textItem: TextItem = {
        id: crypto.randomUUID(),
        content: script.text ?? script.content ?? '',
        startTime: currentMs,
        endTime: currentMs + duration,
        style: {
          fontSize: 24,
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0.5)',
          position: 'bottom',
        },
      };
      textTrack.clips.push(textItem as unknown as TimelineClip);

      currentMs += duration;
    }

    newTracks[videoTrackIndex] = videoTrack;
    newTracks[textTrackIndex] = textTrack;

    // 更新时长并推送历史
    timeline = { ...timeline, tracks: newTracks, duration: currentMs };
    this.history = pushHistory(this.history, timeline);
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
