/**
 * Editor Store
 *
 * Phase 7: 清理 - Timeline/segments 状态已迁移到 timelineStore
 *
 * 保留职责：
 * - Media state      : video, script, voice data
 * - UI state        : zoom, volume, panel, playback, selection
 *
 * Timeline 相关状态请使用 useTimelineStore
 */
import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';

import type { EditorStore, VideoData, ScriptData, VoiceData, EditorPanel } from './editorTypes';
import {
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
  activePanel: 'video' as EditorPanel,
  previewPlaying: false,
  currentTime: 0,
  volume: 1,
  muted: false,
  selection: { segmentId: undefined, multipleIds: [] },
  zoom: DEFAULT_ZOOM,
  scrollPosition: 0,
};

// =========================================
// Store
// =========================================
export const useEditorStore = create<EditorStore>()(
  devtools(
    persist(
      (set) => ({
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

      // ─── UI ─────────────────────────────────────────────────────────────────
      setSelection: (selection) =>
        set((s) => ({ selection: { ...s.selection, ...selection } })),

      clearSelection: () => set({ selection: { segmentId: undefined, multipleIds: [] } }),

      setZoom: (zoom) => set({ zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) }),
      setScrollPosition: (scrollPosition) => set({ scrollPosition }),

      reset: () => set({ video: null, script: null, voice: null, activePanel: 'video', previewPlaying: false, currentTime: 0, volume: 1, muted: false, selection: { segmentId: undefined, multipleIds: [] }, zoom: DEFAULT_ZOOM, scrollPosition: 0 }),
    }),
    {
      name: 'StoryFab-editor',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        video: state.video,
        zoom: state.zoom,
        volume: state.volume,
        muted: state.muted,
      }),
    }
    ),
    { name: 'EditorStore' }
  )
);

// Re-export types for consumers
export type { TimelineSelection } from './editorTypes';