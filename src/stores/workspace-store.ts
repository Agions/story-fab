import { createPersistedStore } from './create-persisted-store';
import { createJSONStorage } from 'zustand/middleware';
import { createHistory } from './create-history';
import type { TimelineTrack, TimelineClip, AnimationKeyframe, TrackType } from '@/types';

// Inlined from editor-types.ts (single-consumer module, dead EditorState/EditorActions/EditorStore removed)
export interface VideoData {
  id: string;
  url: string;
  duration: number;
}

export interface ScriptData {
  id: string;
  content: string;
}

export interface VoiceData {
  id: string;
  url: string;
}

export type EditorPanel = 'video' | 'script' | 'voice' | 'subtitles' | 'settings';

export interface TimelineSelection {
  segmentId?: string;
  multipleIds: string[];
}

export const DEFAULT_SNAP_THRESHOLD_MS = 100;
export const DEFAULT_ZOOM = 1;
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 10;
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;

import {
  updateClipInTracks,
  addKeyframeToClip,
  removeKeyframeFromClip,
  updateKeyframeInClip,
} from './timeline-helpers';

export interface WorkspaceState {
  video: VideoData | null;
  script: ScriptData | null;
  voice: VoiceData | null;
  activePanel: EditorPanel;
  previewPlaying: boolean;
  currentTime: number;
  volume: number;
  muted: boolean;
  selection: TimelineSelection;
  zoom: number;
  scrollPosition: number;
  timelineTracks: TimelineTrack[];
  playheadMs: number;
  timelineDuration: number;
  snapEnabled: boolean;
  snapThreshold: number;
  selectedClipId?: string;
  selectedTrackId?: string;
  selectedMultipleIds?: string[];
  inPointMs?: number;
  outPointMs?: number;
  setVideo: (video: VideoData | null) => void;
  setScript: (script: ScriptData | null) => void;
  setVoice: (voice: VoiceData | null) => void;
  setActivePanel: (panel: EditorPanel) => void;
  setPreviewPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setSelection: (selection: Partial<TimelineSelection>) => void;
  clearSelection: () => void;
  setZoom: (zoom: number) => void;
  setScrollPosition: (position: number) => void;
  reset: () => void;
  setPlayheadMs: (ms: number) => void;
  setTimelineTracks: (tracks: TimelineTrack[]) => void;
  addTimelineTrack: (type: TrackType, name?: string) => string;
  removeTimelineTrack: (trackId: string) => void;
  updateTimelineTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  addClipToTrack: (trackId: string, clipData: Omit<TimelineClip, 'id' | 'trackId'>) => string;
  removeClipFromTrack: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<TimelineClip>) => void;
  moveClip: (clipId: string, targetTrackId: string, newStartMs: number, newEndMs?: number, skipHistory?: boolean) => void;
  splitClip: (clipId: string, splitMs: number) => void;
  addKeyframe: (clipId: string, kfData: Omit<AnimationKeyframe, 'id'>) => string;
  removeKeyframe: (clipId: string, keyframeId: string) => void;
  updateKeyframe: (clipId: string, keyframeId: string, updates: Partial<AnimationKeyframe>) => void;
  setTimelineSelection: (clipId?: string, trackId?: string) => void;
  clearTimelineSelection: () => void;
  setInPoint: () => void;
  setOutPoint: () => void;
  selectAllClips: () => void;
  setTimelineDuration: (ms: number) => void;
  setSnapEnabled: (enabled: boolean) => void;
  saveTrackHistory: () => void;
  undoTrack: () => void;
  redoTrack: () => void;
  canUndoTrack: () => boolean;
  canRedoTrack: () => boolean;
}

const MAX_HISTORY_SIZE = 19;
const trackHistory = createHistory<TimelineTrack[]>({ maxSize: MAX_HISTORY_SIZE });

export const __resetTrackHistoryForTest = () => trackHistory.clear();

const initialEditorState = {
  video: null as VideoData | null,
  script: null as ScriptData | null,
  voice: null as VoiceData | null,
  activePanel: 'video' as EditorPanel,
  previewPlaying: false,
  currentTime: 0,
  volume: 1,
  muted: false,
  selection: { segmentId: undefined, multipleIds: [] } as TimelineSelection,
  zoom: DEFAULT_ZOOM,
  scrollPosition: 0,
};

const initialTimelineState = {
  timelineTracks: [] as TimelineTrack[],
  playheadMs: 0,
  timelineDuration: 60000,
  snapEnabled: true,
  snapThreshold: DEFAULT_SNAP_THRESHOLD_MS,
  selectedClipId: undefined as string | undefined,
  selectedTrackId: undefined as string | undefined,
  selectedMultipleIds: undefined as string[] | undefined,
  inPointMs: undefined as number | undefined,
  outPointMs: undefined as number | undefined,
};

export const useWorkspaceStore = createPersistedStore<WorkspaceState>({
  name: 'StoryFab-workspace',
  devtoolsName: 'WorkspaceStore',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    video: state.video,
    zoom: state.zoom,
    volume: state.volume,
    muted: state.muted,
    snapEnabled: state.snapEnabled,
    snapThreshold: state.snapThreshold,
  }),
  state: (set, get) => ({
    ...initialEditorState,
    ...initialTimelineState,

    setVideo: (video) => set({ video }),
    setScript: (script) => set({ script }),
    setVoice: (voice) => set({ voice }),
    setActivePanel: (activePanel) => set({ activePanel }),
    setPreviewPlaying: (previewPlaying) => set({ previewPlaying }),
    setCurrentTime: (currentTime) => set({ currentTime }),
    setVolume: (volume) => set({ volume: Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, volume)) }),
    setMuted: (muted) => set({ muted }),
    setSelection: (selection) => set((s) => ({ selection: { ...s.selection, ...selection } })),
    clearSelection: () => set({ selection: { segmentId: undefined, multipleIds: [] } }),
    setZoom: (zoom) => set({ zoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom)) }),
    setScrollPosition: (scrollPosition) => set({ scrollPosition }),
    reset: () => set({
      ...initialEditorState,
      ...initialTimelineState,
    }),

    setPlayheadMs: (ms) => set({ playheadMs: Math.max(0, ms) }),
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

    setTimelineSelection: (clipId, trackId) =>
      set({ selectedClipId: clipId, selectedTrackId: trackId }),

    clearTimelineSelection: () =>
      set({ selectedClipId: undefined, selectedTrackId: undefined }),

    setInPoint: () => set({ inPointMs: get().playheadMs }),
    setOutPoint: () => set({ outPointMs: get().playheadMs }),

    selectAllClips: () => {
      const allClipIds = get().timelineTracks.flatMap((t) => t.clips.map((c) => c.id));
      if (allClipIds.length === 0) return;
      const [firstId, ...restIds] = allClipIds;
      const firstTrack = get().timelineTracks.find((t) => t.clips.some((c) => c.id === firstId));
      set({
        selectedClipId: firstId,
        selectedTrackId: firstTrack?.id,
        selectedMultipleIds: restIds,
      });
    },

    setTimelineDuration: (ms) => set({ timelineDuration: Math.max(0, ms) }),
    setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),

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
});
