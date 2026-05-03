/**
 * Timeline Store - 专门管理时间线相关状态
 *
 * Phase 3: Store 拆分 - 将 timeline 相关状态从 editorStore 中分离
 *
 * 包含：
 * - timelineTracks: 多轨道时间线数据
 * - playheadMs: 播放头位置
 * - timelineDuration: 时间线总时长
 * - snapEnabled/snapThreshold: 吸附配置
 * - selectedClipId/selectedTrackId: 当前选中
 * - trackHistory: 时间线历史记录（undo/redo）
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TimelineTrack, TimelineClip, AnimationKeyframe, TrackType } from '../core/types/timeline';

// =========================================
// Types
// =========================================

export interface TimelineState {
  // Core timeline data
  timelineTracks: TimelineTrack[];
  playheadMs: number;
  timelineDuration: number;

  // Snap configuration
  snapEnabled: boolean;
  snapThreshold: number; // ms

  // Selection
  selectedClipId?: string;
  selectedTrackId?: string;
  selectedMultipleIds?: string[];
  inPointMs?: number;
  outPointMs?: number;

  // History
  trackHistory: { past: TimelineTrack[][]; future: TimelineTrack[][] };
}

export interface TimelineActions {
  // Playhead
  setPlayheadMs: (ms: number) => void;

  // Track management
  setTimelineTracks: (tracks: TimelineTrack[]) => void;
  addTimelineTrack: (type: TrackType, name?: string) => string;
  removeTimelineTrack: (trackId: string) => void;
  updateTimelineTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;

  // Clip management
  addClipToTrack: (trackId: string, clipData: Omit<TimelineClip, 'id' | 'trackId'>) => string;
  removeClipFromTrack: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  moveClip: (clipId: string, targetTrackId: string, newStartMs: number, newEndMs?: number) => void;
  splitClip: (clipId: string, splitMs: number) => void;

  // Keyframe management
  addKeyframe: (clipId: string, kfData: Omit<AnimationKeyframe, 'id'>) => string;
  removeKeyframe: (clipId: string, keyframeId: string) => void;
  updateKeyframe: (clipId: string, keyframeId: string, updates: Partial<AnimationKeyframe>) => void;

  // Selection
  setTimelineSelection: (clipId?: string, trackId?: string) => void;
  clearTimelineSelection: () => void;
  setInPoint: () => void;
  setOutPoint: () => void;
  selectAllClips: () => void;

  // Timeline config
  setTimelineDuration: (ms: number) => void;
  setSnapEnabled: (enabled: boolean) => void;

  // History
  saveTrackHistory: () => void;
  undoTrack: () => void;
  redoTrack: () => void;
  canUndoTrack: () => boolean;
  canRedoTrack: () => boolean;
}

export type TimelineStore = TimelineState & TimelineActions;

// =========================================
// Constants
// =========================================

const DEFAULT_SNAP_THRESHOLD_MS = 100;
const MAX_HISTORY_SIZE = 19;

// =========================================
// Helper functions
// =========================================

const updateClipInTracks = (
  tracks: TimelineTrack[],
  clipId: string,
  clipUpdates: Partial<TimelineClip>
): TimelineTrack[] =>
  tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...clipUpdates } : c)),
  }));

const addKeyframeToClip = (
  tracks: TimelineTrack[],
  clipId: string,
  keyframe: AnimationKeyframe
): TimelineTrack[] =>
  tracks.map((t) => ({
    ...t,
    clips: t.clips.map((c) =>
      c.id === clipId ? { ...c, keyframes: [...(c.keyframes || []), keyframe] } : c
    ),
  }));

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

const updateKeyframeInClip = (
  tracks: TimelineTrack[],
  clipId: string,
  keyframeId: string,
  keyframeUpdates: Partial<AnimationKeyframe>
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
// Initial State
// =========================================

const initialState: TimelineState = {
  timelineTracks: [],
  playheadMs: 0,
  timelineDuration: 60000,
  snapEnabled: true,
  snapThreshold: DEFAULT_SNAP_THRESHOLD_MS,
  selectedClipId: undefined,
  selectedTrackId: undefined,
  inPointMs: undefined,
  outPointMs: undefined,
  trackHistory: { past: [], future: [] },
};

// =========================================
// Store
// =========================================

export const useTimelineStore = create<TimelineStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ─── Playhead ────────────────────────────────────────────────────────────
      setPlayheadMs: (ms) => set({ playheadMs: Math.max(0, ms) }),

      // ─── Track Management ────────────────────────────────────────────────────
      setTimelineTracks: (tracks) => {
        get().saveTrackHistory();
        set({ timelineTracks: tracks });
      },

      addTimelineTrack: (type, name) => {
        const id = crypto.randomUUID();
        const typeNames: Record<string, string> = {
          video: '视频',
          audio: '音频',
          subtitle: '字幕',
          effect: '效果',
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

      // ─── Clip Management ─────────────────────────────────────────────────────
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

      updateClip: (clipId, updates) => {
        get().saveTrackHistory();
        set((s) => ({
          timelineTracks: updateClipInTracks(s.timelineTracks, clipId, updates),
        }));
      },

      moveClip: (clipId, targetTrackId, newStartMs, newEndMs) => {
        get().saveTrackHistory();
        set((s) => {
          let clipToMove: TimelineClip | undefined;
          const afterRemove = s.timelineTracks.map((t) => {
            const clip = t.clips.find((c) => c.id === clipId);
            if (clip) {
              clipToMove = { ...clip, trackId: targetTrackId };
            }
            return clip ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t;
          });
          if (!clipToMove) return s;
          const duration = clipToMove.endMs - clipToMove.startMs;
          const updatedSourceEndMs =
            newEndMs !== undefined
              ? clipToMove.sourceStartMs + (newEndMs - newStartMs)
              : clipToMove.sourceEndMs;
          return {
            timelineTracks: afterRemove.map((t) =>
              t.id === targetTrackId
                ? {
                    ...t,
                    clips: [
                      ...t.clips,
                      {
                        ...clipToMove!,
                        startMs: newStartMs,
                        endMs: newEndMs ?? newStartMs + duration,
                        sourceEndMs: updatedSourceEndMs,
                      },
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

      // ─── Keyframe Management ────────────────────────────────────────────────
      addKeyframe: (clipId, kfData) => {
        get().saveTrackHistory();
        const id = crypto.randomUUID();
        const keyframe: AnimationKeyframe = { ...kfData, id };
        set((s) => ({
          timelineTracks: addKeyframeToClip(s.timelineTracks, clipId, keyframe),
        }));
        return id;
      },

      removeKeyframe: (clipId, keyframeId) => {
        get().saveTrackHistory();
        set((s) => ({
          timelineTracks: removeKeyframeFromClip(s.timelineTracks, clipId, keyframeId),
        }));
      },

      updateKeyframe: (clipId, keyframeId, updates) => {
        get().saveTrackHistory();
        set((s) => ({
          timelineTracks: updateKeyframeInClip(s.timelineTracks, clipId, keyframeId, updates),
        }));
      },

      // ─── Selection ───────────────────────────────────────────────────────────
      setTimelineSelection: (clipId, trackId) =>
        set({ selectedClipId: clipId, selectedTrackId: trackId }),

      clearTimelineSelection: () =>
        set({ selectedClipId: undefined, selectedTrackId: undefined }),

      setInPoint: () => set({ inPointMs: get().playheadMs }),
      setOutPoint: () => set({ outPointMs: get().playheadMs }),

      selectAllClips: () => {
        const allClipIds = get().timelineTracks.flatMap((t) => t.clips.map((c) => c.id));
        if (allClipIds.length === 0) return;
        // 选中所有 clip: 第一个作为主要选中，其余放入 multipleIds
        const [firstId, ...restIds] = allClipIds;
        const firstTrack = get().timelineTracks.find((t) => t.clips.some((c) => c.id === firstId));
        set({
          selectedClipId: firstId,
          selectedTrackId: firstTrack?.id,
          selectedMultipleIds: restIds,
        });
      },

      // ─── Timeline Config ─────────────────────────────────────────────────────
      setTimelineDuration: (ms) => set({ timelineDuration: Math.max(0, ms) }),
      setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),

      // ─── History ─────────────────────────────────────────────────────────────
      saveTrackHistory: () =>
        set((s) => ({
          trackHistory: {
            past: [...s.trackHistory.past.slice(-MAX_HISTORY_SIZE), s.timelineTracks],
            future: [],
          },
        })),

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
          if (s.trackHistory.future.length === 0) return {};
          const next = s.trackHistory.future[0];
          return {
            timelineTracks: next,
            trackHistory: {
              past: [...s.trackHistory.past, s.timelineTracks],
              future: s.trackHistory.future.slice(1),
            },
          };
        }),

      canUndoTrack: () => get().trackHistory.past.length > 0,
      canRedoTrack: () => get().trackHistory.future.length > 0,
    }),
    {
      name: 'cutdeck-timeline',
      storage: createJSONStorage(() => localStorage),
      // Don't persist timeline data - it's project-specific
      partialize: (state) => ({
        snapEnabled: state.snapEnabled,
        snapThreshold: state.snapThreshold,
      }),
    }
  )
);

// Re-export types
export type { TimelineTrack, TimelineClip, AnimationKeyframe, TrackType } from '../core/types/timeline';
