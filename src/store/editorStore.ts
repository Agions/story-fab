/**
 * Editor Store
 *
 * Domains:
 * - Media state      : video, script, voice data
 * - Segment state    : single-track clips (legacy)
 * - Timeline state   : multi-track clips, playhead, snap
 * - History          : undo/redo for segments and timeline
 *
 * All types are defined in ./editorTypes.ts
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { EditorStore, EditorState, VideoData, ScriptData, VoiceData, TimelineSelection } from './editorTypes';
import type { TimelineTrack, TimelineClip, Keyframe, TrackType } from '../components/Timeline/types';
import {
  MAX_HISTORY_SIZE,
  DEFAULT_SNAP_THRESHOLD_MS,
  DEFAULT_ZOOM,
  ZOOM_MIN,
  ZOOM_MAX,
  VOLUME_MIN,
  VOLUME_MAX,
} from './editorTypes';

// =========================================
// Helper functions
// =========================================

/**
 * 在 timelineTracks 中更新指定 clip 的属性
 */
const updateClipInTracks = (
  tracks: TimelineTrack[],
  clipId: string,
  clipUpdates: Partial<TimelineClip>
): TimelineTrack[] =>
  tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...clipUpdates } : c)),
  }));

/**
 * 在 timelineTracks 中为指定 clip 添加 keyframe
 */
const addKeyframeToClip = (
  tracks: TimelineTrack[],
  clipId: string,
  keyframe: Keyframe
): TimelineTrack[] =>
  tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) =>
      c.id === clipId ? { ...c, keyframes: [...(c.keyframes || []), keyframe] } : c
    ),
  }));

/**
 * 在 timelineTracks 中移除指定 clip 的 keyframe
 */
const removeKeyframeFromClip = (
  tracks: TimelineTrack[],
  clipId: string,
  keyframeId: string
): TimelineTrack[] =>
  tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) =>
      c.id === clipId
        ? { ...c, keyframes: (c.keyframes || []).filter((kf) => kf.id !== keyframeId) }
        : c
    ),
  }));

/**
 * 在 timelineTracks 中更新指定 clip 的 keyframe
 */
const updateKeyframeInClip = (
  tracks: TimelineTrack[],
  clipId: string,
  keyframeId: string,
  keyframeUpdates: Partial<Keyframe>
): TimelineTrack[] =>
  tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) =>
      c.id === clipId
        ? {
            ...c,
            keyframes: (c.keyframes || []).map((kf) =>
              kf.id === keyframeId ? { ...kf, ...keyframeUpdates } : kf
            ),
          }
        : c
    ),
  }));

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
  playheadMs: 0,
  timelineTracks: [],
  timelineDuration: 60000,
  snapEnabled: true,
  snapThreshold: DEFAULT_SNAP_THRESHOLD_MS,
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

      // ─── Segments ───────────────────────────────────────────────────────────
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

      // ─── Timeline ───────────────────────────────────────────────────────────
      setPlayheadMs: (ms) => set({ playheadMs: Math.max(0, ms) }),

      setTimelineTracks: (tracks) => {
        get().saveTrackHistory();
        set({ timelineTracks: tracks });
      },

      addTimelineTrack: (type, name) => {
        const id = crypto.randomUUID();
        const typeNames: Record<string, string> = {
          video: '视频', audio: '音频', subtitle: '字幕', effect: '效果',
        };
        const count = get().timelineTracks.filter((t) => t.type === type).length;
        const track: TimelineTrack = {
          id,
          type,
          name: name || `${typeNames[type] || type}轨道 ${count + 1}`,
          clips: [],
          muted: false,
          locked: false,
          visible: true,
          height: type === 'subtitle' ? 50 : 60,
        };
        set((s) => ({ timelineTracks: [...s.timelineTracks, track] }));
        return id;
      },

      removeTimelineTrack: (trackId) => {
        get().saveTrackHistory();
        set((s) => ({ timelineTracks: s.timelineTracks.filter((t) => t.id !== trackId) }));
      },

      updateTimelineTrack: (trackId, updates) =>
        set((s) => ({
          timelineTracks: s.timelineTracks.map((t) =>
            t.id === trackId ? { ...t, ...updates } : t
          ),
        })),

      addClipToTrack: (trackId, clipData) => {
        const id = crypto.randomUUID();
        const clip: TimelineClip = { ...clipData, id, trackId };
        get().saveTrackHistory();
        set((s) => ({
          timelineTracks: s.timelineTracks.map((t) =>
            t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
          ),
          selectedClipId: id,
          selectedTrackId: trackId,
        }));
        return id;
      },

      removeClipFromTrack: (clipId) => {
        get().saveTrackHistory();
        set((s) => ({
          timelineTracks: s.timelineTracks.map((t) => ({
            ...t,
            clips: t.clips.filter((c) => c.id !== clipId),
          })),
          selectedClipId: s.selectedClipId === clipId ? undefined : s.selectedClipId,
          selectedTrackId: s.selectedClipId === clipId ? undefined : s.selectedTrackId,
        }));
      },

      updateClip: (clipId, updates) =>
        set((s) => ({
          timelineTracks: updateClipInTracks(s.timelineTracks, clipId, updates),
        })),

      moveClip: (clipId, targetTrackId, newStartMs, newEndMs) => {
        get().saveTrackHistory();
        set((s) => {
          let clipToMove: TimelineClip | undefined;
          const afterRemove = s.timelineTracks.map((t) => {
            const clip = t.clips.find((c) => c.id === clipId);
            if (clip) { clipToMove = { ...clip, trackId: targetTrackId }; }
            return clip ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t;
          });
          if (!clipToMove) return s;
          const duration = clipToMove.endMs - clipToMove.startMs;
          // Keep source timing in sync when resizing
          const updatedSourceEndMs = newEndMs !== undefined
            ? clipToMove.sourceStartMs + (newEndMs - newStartMs)
            : clipToMove.sourceEndMs;
          return {
            timelineTracks: afterRemove.map((t) =>
              t.id === targetTrackId
                ? {
                    ...t,
                    clips: [
                      ...t.clips,
                      { ...clipToMove!, startMs: newStartMs, endMs: newEndMs ?? newStartMs + duration, sourceEndMs: updatedSourceEndMs },
                    ],
                  }
                : t
            ),
          };
        });
      },

      splitClip: (clipId, splitMs) => {
        get().saveTrackHistory();
        set((s) => ({
          timelineTracks: s.timelineTracks.map((t) => {
            const idx = t.clips.findIndex((c) => c.id === clipId);
            if (idx === -1) return t;
            const clip = t.clips[idx];
            if (splitMs <= clip.startMs || splitMs >= clip.endMs) return t;
            const offset = splitMs - clip.startMs;
            const sourceSplit = clip.sourceStartMs + offset;
            const leftClip: TimelineClip = { ...clip, endMs: splitMs, sourceEndMs: sourceSplit };
            const rightClip: TimelineClip = {
              ...clip,
              id: crypto.randomUUID(),
              startMs: splitMs,
              endMs: clip.endMs,
              sourceStartMs: sourceSplit,
            };
            const newClips = [...t.clips];
            newClips.splice(idx, 1, leftClip, rightClip);
            return { ...t, clips: newClips };
          }),
        }));
      },

      addKeyframe: (clipId, kfData) => {
        const id = crypto.randomUUID();
        const keyframe: Keyframe = { ...kfData, id };
        set((s) => ({
          timelineTracks: addKeyframeToClip(s.timelineTracks, clipId, keyframe),
        }));
        return id;
      },

      removeKeyframe: (clipId, keyframeId) =>
        set((s) => ({
          timelineTracks: removeKeyframeFromClip(s.timelineTracks, clipId, keyframeId),
        })),

      updateKeyframe: (clipId, keyframeId, updates) =>
        set((s) => ({
          timelineTracks: updateKeyframeInClip(s.timelineTracks, clipId, keyframeId, updates),
        })),

      setTimelineSelection: (clipId, trackId) =>
        set({ selectedClipId: clipId, selectedTrackId: trackId }),

      clearTimelineSelection: () =>
        set({ selectedClipId: undefined, selectedTrackId: undefined }),

      setInPoint: () => set({ inPointMs: get().playheadMs }),
      setOutPoint: () => set({ outPointMs: get().playheadMs }),

      selectAllClips: () => {
        const allClipIds = get().timelineTracks.flatMap((t) => t.clips.map((c) => c.id));
        if (allClipIds.length === 0) return;
        const firstId = allClipIds[0];
        const firstTrack = get().timelineTracks.find((t) => t.clips.some((c) => c.id === firstId));
        set({ selectedClipId: firstId, selectedTrackId: firstTrack?.id });
      },

      setTimelineDuration: (ms) => set({ timelineDuration: Math.max(0, ms) }),
      setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),

      // ─── History ────────────────────────────────────────────────────────────
      saveHistory: () =>
        set((s) => ({
          history: {
            past: [...s.history.past.slice(-MAX_HISTORY_SIZE), s.segments],
            future: [],
          },
        })),

      saveTrackHistory: () =>
        set((s) => ({
          trackHistory: {
            past: [...s.trackHistory.past.slice(-MAX_HISTORY_SIZE), s.timelineTracks],
            future: [],
          },
        })),

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

      undoTrack: () =>
        set((s) => {
          if (s.trackHistory.past.length === 0) return {};
          const previous = s.trackHistory.past[s.trackHistory.past.length - 1];
          return {
            timelineTracks: previous ?? s.timelineTracks,
            trackHistory: {
              past: s.trackHistory.past.slice(0, -1),
              future: [s.timelineTracks, ...s.trackHistory.future],
            },
          };
        }),

      redoTrack: () =>
        set((s) => {
          if (s.trackHistory.future.length === 0) return s;
          const next = s.trackHistory.future[0];
          return {
            timelineTracks: next,
            trackHistory: {
              past: [...s.trackHistory.past, s.timelineTracks],
              future: s.trackHistory.future.slice(1),
            },
          };
        }),

      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,
      canUndoTrack: () => get().trackHistory.past.length > 0,
      canRedoTrack: () => get().trackHistory.future.length > 0,

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
