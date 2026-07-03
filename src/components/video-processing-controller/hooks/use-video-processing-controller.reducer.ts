/**
 * useVideoProcessingController reducer — 集中 14 useState 状态机
 * 来源: refactor/video-processing-usereducer (v3.4 §A2 范式)
 * 模式: 1 hook + 1 .reducer.ts + makeSetter<K> + Updater<T>
 */
import type { QualityValue, FormatValue, TransitionValue, AudioProcessValue } from '../constants';

export interface BatchItem {
  id: string;
  videoPath: string;
  segments: Array<{ start: number; end: number; type?: string; content?: string }>;
  name: string;
  completed: boolean;
}

export interface CustomQualitySettings {
  resolution: string;
  bitrate: number;
  framerate: number;
  useHardwareAcceleration: boolean;
}

export interface VideoProcessingState {
  // settings
  videoQuality: QualityValue;
  exportFormat: FormatValue;
  transitionType: TransitionValue;
  transitionDuration: number;
  audioProcess: AudioProcessValue;
  audioVolume: number;
  useSubtitles: boolean;
  // batch
  processingBatch: boolean;
  currentBatchItem: number;
  batchProgress: number;
  batchItems: BatchItem[];
  // object
  customSettings: CustomQualitySettings;
  // ui
  activePanels: string[];
}

export const initialVideoProcessingState: VideoProcessingState = {
  videoQuality: 'medium',
  exportFormat: 'mp4',
  transitionType: 'fade',
  transitionDuration: 1,
  audioProcess: 'original',
  audioVolume: 100,
  useSubtitles: true,
  processingBatch: false,
  currentBatchItem: 0,
  batchProgress: 0,
  batchItems: [],
  customSettings: {
    resolution: '1920x1080',
    bitrate: 4000,
    framerate: 30,
    useHardwareAcceleration: true,
  },
  activePanels: ['basic'],
};

export type Updater<T> = T | ((prev: T) => T);

export type VideoProcessingAction = {
  type: 'update';
  key: keyof VideoProcessingState;
  updater: Updater<unknown>;
};

export const videoProcessingReducer = (
  state: VideoProcessingState,
  action: VideoProcessingAction,
): VideoProcessingState => {
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
