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

import type { EditorStore, EditorState, VideoData, ScriptData, VoiceData, VideoSegment, EditorPanel } from './editorTypes';
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
const initialState = {
  video: null as VideoData | null,
  script: null as ScriptData | null,
  voice: null as VoiceData | null,
  segments: [] as VideoSegment[],
  activePanel: 'video' as EditorPanel,
  previewPlaying: false,
  currentTime: 0,
  volume: 1,
  muted: false,
  selection: { segmentId: undefined, multipleIds: [] },
  zoom: DEFAULT_ZOOM,
  scrollPosition: 0,
  history: { past: [], future: [] },
};

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

      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,

      reset: () => set({ video: null, script: null, voice: null, segments: [], activePanel: 'video', previewPlaying: false, currentTime: 0, volume: 1, muted: false, selection: { segmentId: undefined, multipleIds: [] }, zoom: DEFAULT_ZOOM, scrollPosition: 0, history: { past: [], future: [] } }),
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
