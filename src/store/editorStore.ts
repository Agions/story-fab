/**
 * Editor Store
 *
 * Phase 3: Store 拆分 - Timeline 相关状态已迁移到 timelineStore
 *
 * 保留职责：
 * - Media state      : video, script, voice data
 * - Segment state    : single-track clips (legacy, deprecated)
 * - UI state        : zoom, volume, panel, playback
 *
 * Timeline 相关状态请使用 useTimelineStore
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { EditorStore, EditorState, VideoData, ScriptData, VoiceData } from './editorTypes';
import {
  MAX_HISTORY_SIZE,
  DEFAULT_ZOOM,
  ZOOM_MIN,
  ZOOM_MAX,
  VOLUME_MIN,
  VOLUME_MAX,
} from './editorTypes';

// =========================================
// Initial state
// =========================================
const initialState: EditorState = {
  video: null,
  script: null,
  voice: null,
  segments: [],
  activePanel: 'video',
  previewPlaying: false,
  currentTime: 0,
  volume: 1,
  muted: false,
  selection: { segmentId: undefined, multipleIds: [] },
  zoom: DEFAULT_ZOOM,
  scrollPosition: 0,
  // Timeline 相关状态已迁移到 timelineStore
  playheadMs: 0,
  timelineTracks: [],
  timelineDuration: 60000,
  snapEnabled: true,
  snapThreshold: 100,
  selectedClipId: undefined,
  selectedTrackId: undefined,
  inPointMs: undefined,
  outPointMs: undefined,
  history: { past: [], future: [] },
  trackHistory: { past: [], future: [] },
} as const;

// =========================================
// Store
// =========================================
export const useEditorStore = create<EditorStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ─── Media ─────────────────────────────────────────────────────────────
      setVideo: (video) => set({ video }),
      setScript: (script) => set({ script }),
      setVoice: (voice) => set({ voice }),
      setActivePanel: (activePanel) => set({ activePanel }),
      setPreviewPlaying: (previewPlaying) => set({ previewPlaying }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setVolume: (volume) =>
        set({ volume: Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume)) }),
      setMuted: (muted) => set({ muted }),

      // ─── Segments (Legacy) ─────────────────────────────────────────────────
      addSegment: (segment) => {
        get().saveHistory();
        set((s) => ({ segments: [...s.segments, segment] }));
      },

      updateSegment: (id, data) => {
        get().saveHistory();
        set((s) => ({
          segments: s.segments.map((seg) => (seg.id === id ? { ...seg, ...data } : seg)),
        }));
      },

      deleteSegment: (id) => {
        get().saveHistory();
        set((s) => ({ segments: s.segments.filter((seg) => seg.id !== id) }));
      },

      reorderSegments: (fromIndex, toIndex) => {
        get().saveHistory();
        set((s) => {
          const segments = [...s.segments];
          const [removed] = segments.splice(fromIndex, 1);
          segments.splice(toIndex, 0, removed);
          return { segments };
        });
      },

      clearSegments: () => {
        get().saveHistory();
        set({ segments: [] });
      },

      // ─── UI ─────────────────────────────────────────────────────────────────
      setSelection: (selection) =>
        set((s) => ({ selection: { ...s.selection, ...selection } })),

      clearSelection: () => set({ selection: { segmentId: undefined, multipleIds: [] } }),

      setZoom: (zoom) => set({ zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) }),
      setScrollPosition: (scrollPosition) => set({ scrollPosition }),

      // ─── Timeline (Deprecated - 使用 useTimelineStore) ───────────────────
      // 以下方法已废弃，仅为兼容旧代码保留
      // 请使用 useTimelineStore 中的对应方法

      setPlayheadMs: (_ms) => {
        console.warn('setPlayheadMs is deprecated, use useTimelineStore.setPlayheadMs');
      },

      setTimelineTracks: (_tracks) => {
        console.warn('setTimelineTracks is deprecated, use useTimelineStore.setTimelineTracks');
      },

      addTimelineTrack: (_type, _name) => {
        console.warn('addTimelineTrack is deprecated, use useTimelineStore.addTimelineTrack');
        return '';
      },

      removeTimelineTrack: (_trackId) => {
        console.warn('removeTimelineTrack is deprecated, use useTimelineStore.removeTimelineTrack');
      },

      updateTimelineTrack: (_trackId, _updates) => {
        console.warn('updateTimelineTrack is deprecated, use useTimelineStore.updateTimelineTrack');
      },

      addClipToTrack: (_trackId, _clipData) => {
        console.warn('addClipToTrack is deprecated, use useTimelineStore.addClipToTrack');
        return '';
      },

      removeClipFromTrack: (_clipId) => {
        console.warn('removeClipFromTrack is deprecated, use useTimelineStore.removeClipFromTrack');
      },

      updateClip: (_clipId, _updates) => {
        console.warn('updateClip is deprecated, use useTimelineStore.updateClip');
      },

      moveClip: (_clipId, _targetTrackId, _newStartMs, _newEndMs) => {
        console.warn('moveClip is deprecated, use useTimelineStore.moveClip');
      },

      splitClip: (_clipId, _splitMs) => {
        console.warn('splitClip is deprecated, use useTimelineStore.splitClip');
      },

      addKeyframe: (_clipId, _kfData) => {
        console.warn('addKeyframe is deprecated, use useTimelineStore.addKeyframe');
        return '';
      },

      removeKeyframe: (_clipId, _keyframeId) => {
        console.warn('removeKeyframe is deprecated, use useTimelineStore.removeKeyframe');
      },

      updateKeyframe: (_clipId, _keyframeId, _updates) => {
        console.warn('updateKeyframe is deprecated, use useTimelineStore.updateKeyframe');
      },

      setTimelineSelection: (_clipId, _trackId) => {
        console.warn('setTimelineSelection is deprecated, use useTimelineStore.setTimelineSelection');
      },

      clearTimelineSelection: () => {
        console.warn('clearTimelineSelection is deprecated, use useTimelineStore.clearTimelineSelection');
      },

      setInPoint: () => {
        console.warn('setInPoint is deprecated, use useTimelineStore.setInPoint');
      },

      setOutPoint: () => {
        console.warn('setOutPoint is deprecated, use useTimelineStore.setOutPoint');
      },

      selectAllClips: () => {
        console.warn('selectAllClips is deprecated, use useTimelineStore.selectAllClips');
      },

      setTimelineDuration: (_ms) => {
        console.warn('setTimelineDuration is deprecated, use useTimelineStore.setTimelineDuration');
      },

      setSnapEnabled: (_enabled) => {
        console.warn('setSnapEnabled is deprecated, use useTimelineStore.setSnapEnabled');
      },

      // ─── History (Legacy segments) ─────────────────────────────────────────
      saveHistory: () =>
        set((s) => ({
          history: {
            past: [...s.history.past.slice(-MAX_HISTORY_SIZE), s.segments],
            future: [],
          },
        })),

      saveTrackHistory: () => {
        // No-op - timeline history now managed by timelineStore
      },

      undo: () =>
        set((s) => {
          if (s.history.past.length === 0) return {};
          const previous = s.history.past[s.history.past.length - 1];
          return {
            segments: previous ?? [],
            history: { past: s.history.past.slice(0, -1), future: [s.segments, ...s.history.future] },
          };
        }),

      redo: () =>
        set((s) => {
          if (s.history.future.length === 0) return {};
          const next = s.history.future[0];
          return {
            segments: next ?? s.segments,
            history: { past: [...s.history.past, s.segments], future: s.history.future.slice(1) },
          };
        }),

      undoTrack: () => {
        console.warn('undoTrack is deprecated, use useTimelineStore.undoTrack');
      },

      redoTrack: () => {
        console.warn('redoTrack is deprecated, use useTimelineStore.redoTrack');
      },

      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,
      canUndoTrack: () => false,
      canRedoTrack: () => false,

      reset: () => set({ ...initialState } as EditorStore),
    }),
    {
      name: 'cutdeck-editor',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        video: state.video,
        zoom: state.zoom,
        volume: state.volume,
        muted: state.muted,
      }),
    }
  )
);

// Re-export types for consumers
export type { TimelineSelection } from './editorTypes';
