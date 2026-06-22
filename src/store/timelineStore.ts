/**
 * Timeline Store - 专门管理时间线相关状态
 *
 * Phase 3: Store 拆分 - 将 timeline 相关状态从 editorStore 中分离
 * Phase B: history 内联抽离到 createHistory 泛型模块（消除 5 个 action 重复）
 *
 * 包含：
 * - timelineTracks: 多轨道时间线数据
 * - playheadMs: 播放头位置
 * - timelineDuration: 时间线总时长
 * - snapEnabled/snapThreshold: 吸附配置
 * - selectedClipId/selectedTrackId: 当前选中
 * - history: undo/redo 由 createHistory 模块托管（不再存到 state）
 */
import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';
import { createHistory } from './createHistory';
import type { TimelineTrack, TimelineClip, AnimationKeyframe, TrackType } from '../core/types/timeline';
import { DEFAULT_SNAP_THRESHOLD_MS } from './editorTypes';
import {
  updateClipInTracks,
  addKeyframeToClip,
  removeKeyframeFromClip,
  updateKeyframeInClip,
} from './timelineHelpers';

const MAX_HISTORY_SIZE = 19;

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
}

interface TimelineActions {
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
  moveClip: (clipId: string, targetTrackId: string, newStartMs: number, newEndMs?: number, skipHistory?: boolean) => void;
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

  // History（由 createHistory 模块托管，不入 state）
  saveTrackHistory: () => void;
  undoTrack: () => void;
  redoTrack: () => void;
  canUndoTrack: () => boolean;
  canRedoTrack: () => boolean;
}

type TimelineStore = TimelineState & TimelineActions;

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
};

// History controller（模块作用域，闭包内存储 past/future）
// 不入 React state，避免持久化和无谓重渲染
const trackHistory = createHistory<TimelineTrack[]>({ maxSize: MAX_HISTORY_SIZE });

// 仅供测试使用：vitest 的 beforeEach 需要在每个 case 前重置模块闭包内的 past/future
// 内部 action 不暴露此入口
export const __resetTrackHistoryForTest = () => trackHistory.clear();

// =========================================
// Store
// =========================================

export const useTimelineStore = create<TimelineStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ─── Playhead ────────────────────────────────────────────────────────
        setPlayheadMs: (ms) => set({ playheadMs: Math.max(0, ms) }),

        // ─── Track Management ────────────────────────────────────────────────
        setTimelineTracks: (tracks) => {
          trackHistory.save(get().timelineTracks);
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
          trackHistory.save(get().timelineTracks);
          set((s) => ({ timelineTracks: s.timelineTracks.filter((t) => t.id !== trackId) }));
        },

        updateTimelineTrack: (trackId, updates) =>
          set((s) => ({
            timelineTracks: s.timelineTracks.map((t) =>
              t.id === trackId ? { ...t, ...updates } : t
            ),
          })),

        // ─── Clip Management ─────────────────────────────────────────────────
        addClipToTrack: (trackId, clipData) => {
          const id = crypto.randomUUID();
          const clip: TimelineClip = { ...clipData, id, trackId };
          trackHistory.save(get().timelineTracks);
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
          trackHistory.save(get().timelineTracks);
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
          trackHistory.save(get().timelineTracks);
          set((s) => ({
            timelineTracks: updateClipInTracks(s.timelineTracks, clipId, updates),
          }));
        },

        moveClip: (clipId, targetTrackId, newStartMs, newEndMs, skipHistory) => {
          if (!skipHistory) trackHistory.save(get().timelineTracks);
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
          trackHistory.save(get().timelineTracks);
          set((s) => ({
            timelineTracks: s.timelineTracks.map((t) => {
              const index = t.clips.findIndex((c) => c.id === clipId);
              if (index === -1) return t;
              const clip = t.clips[index];
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
              newClips.splice(index, 1, leftClip, rightClip);
              return { ...t, clips: newClips };
            }),
          }));
        },

        // ─── Keyframe Management ─────────────────────────────────────────────
        addKeyframe: (clipId, kfData) => {
          trackHistory.save(get().timelineTracks);
          const id = crypto.randomUUID();
          const keyframe: AnimationKeyframe = { ...kfData, id };
          set((s) => ({
            timelineTracks: addKeyframeToClip(s.timelineTracks, clipId, keyframe),
          }));
          return id;
        },

        removeKeyframe: (clipId, keyframeId) => {
          trackHistory.save(get().timelineTracks);
          set((s) => ({
            timelineTracks: removeKeyframeFromClip(s.timelineTracks, clipId, keyframeId),
          }));
        },

        updateKeyframe: (clipId, keyframeId, updates) => {
          trackHistory.save(get().timelineTracks);
          set((s) => ({
            timelineTracks: updateKeyframeInClip(s.timelineTracks, clipId, keyframeId, updates),
          }));
        },

        // ─── Selection ───────────────────────────────────────────────────────
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

        // ─── Timeline Config ─────────────────────────────────────────────────
        setTimelineDuration: (ms) => set({ timelineDuration: Math.max(0, ms) }),
        setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),

        // ─── History（createHistory 模块驱动） ──────────────────────────────
        saveTrackHistory: () => trackHistory.save(get().timelineTracks),
        undoTrack: () => {
          const prev = trackHistory.undo(get().timelineTracks);
          if (prev !== undefined) set({ timelineTracks: prev });
        },
        redoTrack: () => {
          const next = trackHistory.redo(get().timelineTracks);
          if (next !== undefined) set({ timelineTracks: next });
        },
        canUndoTrack: () => trackHistory.canUndo(),
        canRedoTrack: () => trackHistory.canRedo(),
      }),
      {
        name: 'StoryFab-timeline',
        storage: createJSONStorage(() => localStorage),
        // Don't persist timeline data - it's project-specific
        partialize: (state) => ({
          snapEnabled: state.snapEnabled,
          snapThreshold: state.snapThreshold,
        }),
      }
    ),
    { name: 'TimelineStore' }
  )
);

// Re-export types
export type { TimelineTrack, TimelineClip, AnimationKeyframe, TrackType } from '../core/types/timeline';
