export * from './types';
export * from './timelineOperations';
export * from './history';
export * from './trackManager';
export * from './export';
export * from './storage';

import {
  createEmptyTimeline,
  addClip,
  removeClip,
  moveClip,
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
import { DEFAULT_EDITOR_CONFIG, type EditorConfig, type EditorAction, type EditorHistory } from './types';
import type { Timeline, VideoSegment, ScriptSegment, ExportSettings } from '@/core/types';

class EditorService {
  private config: EditorConfig;
  private history: EditorHistory;
  private listeners: Set<(timeline: Timeline) => void> = new Set();
  private autoSaveTimer: NodeJS.Timeout | null = null;

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
    const newTimeline = this.applyAction(this.history.present, action);
    this.history = pushHistory(this.history, newTimeline);
    this.notify();
  }

  private applyAction(timeline: Timeline, action: EditorAction): Timeline {
    switch (action.type) {
      case 'ADD_CLIP':
        return addClip(timeline, action.trackId, action.clip, action.position);
      case 'REMOVE_CLIP':
        return removeClip(timeline, action.trackId, action.clipId);
      case 'MOVE_CLIP':
        return moveClip(timeline, action.trackId, action.clipId, action.newPosition);
      case 'TRIM_CLIP':
        return trimClip(timeline, action.clipId, action.startTime, action.endTime);
      case 'SPLIT_CLIP':
        return splitClip(timeline, action.clipId, action.splitTime);
      case 'ADD_TRANSITION':
        return addTransition(timeline, action.fromClipId, action.toClipId, action.type, action.duration);
      case 'ADD_EFFECT':
        return addEffect(timeline, action.clipId, action.effect, action.params);
      case 'ADD_TEXT':
        return addText(timeline, action.trackId, action.text, action.position);
      case 'ADD_AUDIO':
        return addAudio(timeline, action.trackId, action.audio, action.position);
      case 'ADJUST_SPEED':
        return adjustSpeed(timeline, action.clipId, action.speed);
      case 'ADJUST_VOLUME':
        return adjustVolume(timeline, action.trackId, action.volume);
      case 'UNDO':
        return this.undo();
      case 'REDO':
        return this.redo();
      default:
        return timeline;
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
    scriptSegments: ScriptSegment[],
    videoSegments: VideoSegment[]
  ): Timeline {
    // 简化的实现
    const timeline = createEmptyTimeline();
    this.history.present = timeline;
    this.notify();
    return timeline;
  }

  async exportTimeline(settings?: Partial<ExportSettings>): Promise<Blob> {
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
    this.notify();
  }

  destroy(): void {
    this.stopAutoSave();
    this.listeners.clear();
  }
}

export const editorService = new EditorService();
export default EditorService;
