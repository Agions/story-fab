/**
 * useVideoEditor reducer — 集中 16 useState 状态机
 * 来源: refactor/video-editor-usereducer (v3.4 §A2 范式)
 * 模式: 1 hook + 1 .reducer.ts + makeSetter<K> + Updater<T>
 */
import type { SimpleVideoSegment } from '@/core/video';

export interface VideoEditorState {
  videoSrc: string;
  loading: boolean;
  analyzing: boolean;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  segments: SimpleVideoSegment[];
  keyframes: string[];
  selectedSegmentIndex: number;
  editHistory: SimpleVideoSegment[][];
  historyIndex: number;
  outputFormat: string;
  videoQuality: string;
  isSaving: boolean;
  isExporting: boolean;
}

export const initialVideoEditorState: VideoEditorState = {
  videoSrc: '',
  loading: false,
  analyzing: false,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  segments: [],
  keyframes: [],
  selectedSegmentIndex: -1,
  editHistory: [],
  historyIndex: -1,
  outputFormat: 'mp4',
  videoQuality: 'medium',
  isSaving: false,
  isExporting: false,
};

export type Updater<T> = T | ((prev: T) => T);

export type VideoEditorAction = {
  type: 'update';
  key: keyof VideoEditorState;
  updater: Updater<unknown>;
};

export const videoEditorReducer = (
  state: VideoEditorState,
  action: VideoEditorAction,
): VideoEditorState => {
  if (action.type === 'update') {
    const current = state[action.key];
    const next =
      typeof action.updater === 'function'
        ? (action.updater as (prev: typeof current) => typeof current)(current)
        : action.updater;
    return { ...state, [action.key]: next };
  }
  return state;
};
