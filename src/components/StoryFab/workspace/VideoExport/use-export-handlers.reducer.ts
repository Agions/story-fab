/**
 * useExportHandlers reducer — 集中 14 useState 状态机
 * 来源: refactor/export-handlers-usereducer (v3.4 §A2 范式)
 * 模式: 1 hook + 1 .reducer.ts + makeSetter<K> + Updater<T>
 */
import type { ExportSettings } from '@/types';

export interface ExportHandlersState {
  // progress
  exporting: boolean;
  progress: number;
  progressStage: string;
  etaSeconds: number | null;
  // result
  exported: boolean;
  exportedFile: string | null;
  exportError: string | null;
  // timing
  startTime: number;
  // platform
  selectedPlatform: string | null;
  batchMode: boolean;
  selectedPlatforms: string[];
  // id
  currentExportId: string | null;
  // config
  config: ExportSettings;
}

export const initialExportHandlersState = (state: {
  exportSettings?: Partial<ExportSettings>;
}): ExportHandlersState => ({
  exporting: false,
  progress: 0,
  progressStage: '',
  etaSeconds: null,
  exported: false,
  exportedFile: null,
  exportError: null,
  startTime: Date.now(),
  selectedPlatform: null,
  batchMode: false,
  selectedPlatforms: [],
  currentExportId: null,
  config: {
    format: state.exportSettings?.format || 'mp4',
    quality: state.exportSettings?.quality || 'high',
    resolution: state.exportSettings?.resolution || '1080p',
    fps: state.exportSettings?.fps || 30,
    includeSubtitles: state.exportSettings?.includeSubtitles ?? true,
    burnSubtitles: state.exportSettings?.burnSubtitles ?? true,
    includeWatermark: state.exportSettings?.includeWatermark ?? false,
  },
});

export type Updater<T> = T | ((prev: T) => T);

export type ExportHandlersAction = {
  type: 'update';
  key: keyof ExportHandlersState;
  updater: Updater<unknown>;
};

export const exportHandlersReducer = (
  state: ExportHandlersState,
  action: ExportHandlersAction,
): ExportHandlersState => {
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
