import type { RepurposingClip, PipelineStage } from '@/core/services/pipeline/clip-pipeline/pipeline';
import type { SocialPlatform, AspectRatio } from '../shared/clip-rippling-config';
import { createReducer } from '@/shared/hooks/create-reducer';

export interface ClipRipplingState {
  platform: SocialPlatform;
  selectedFormats: AspectRatio[];
  targetCount: number;
  running: boolean;
  progress: number;
  stage: PipelineStage | '';
  results: RepurposingClip[];
  selectedClips: Set<string>;
  exporting: boolean;
  exportedPaths: string[];
}

export type ClipRipplingAction =
  | { type: 'SET_PLATFORM'; payload: SocialPlatform }
  | { type: 'SET_SELECTED_FORMATS'; payload: AspectRatio[] }
  | { type: 'TOGGLE_SELECTED_FORMAT'; payload: AspectRatio }
  | { type: 'SET_TARGET_COUNT'; payload: number }
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_STAGE'; payload: PipelineStage | '' }
  | { type: 'SET_RESULTS'; payload: RepurposingClip[] }
  | { type: 'SET_SELECTED_CLIPS'; payload: Set<string> }
  | { type: 'TOGGLE_CLIP'; payload: string }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'SET_EXPORTED_PATHS'; payload: string[] }
  | { type: 'RESET_RUN'; payload: undefined };

export const initialClipRipplingState: ClipRipplingState = {
  platform: 'douyin',
  selectedFormats: ['9:16', '1:1'],
  targetCount: 5,
  running: false,
  progress: 0,
  stage: '',
  results: [],
  selectedClips: new Set(),
  exporting: false,
  exportedPaths: [],
};

const handlers = {
  SET_PLATFORM: (s: ClipRipplingState, v: SocialPlatform) => ({ ...s, platform: v }),
  SET_SELECTED_FORMATS: (s: ClipRipplingState, v: AspectRatio[]) => ({ ...s, selectedFormats: v }),
  TOGGLE_SELECTED_FORMAT: (s: ClipRipplingState, v: AspectRatio) => {
    const exists = s.selectedFormats.includes(v);
    return {
      ...s,
      selectedFormats: exists
        ? s.selectedFormats.filter((f) => f !== v)
        : [...s.selectedFormats, v],
    };
  },
  SET_TARGET_COUNT: (s: ClipRipplingState, v: number) => ({ ...s, targetCount: v }),
  SET_RUNNING: (s: ClipRipplingState, v: boolean) => ({ ...s, running: v }),
  SET_PROGRESS: (s: ClipRipplingState, v: number) => ({ ...s, progress: v }),
  SET_STAGE: (s: ClipRipplingState, v: PipelineStage | '') => ({ ...s, stage: v }),
  SET_RESULTS: (s: ClipRipplingState, v: RepurposingClip[]) => ({ ...s, results: v }),
  SET_SELECTED_CLIPS: (s: ClipRipplingState, v: Set<string>) => ({ ...s, selectedClips: v }),
  TOGGLE_CLIP: (s: ClipRipplingState, v: string) => {
    const next = new Set(s.selectedClips);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    return { ...s, selectedClips: next };
  },
  SET_EXPORTING: (s: ClipRipplingState, v: boolean) => ({ ...s, exporting: v }),
  SET_EXPORTED_PATHS: (s: ClipRipplingState, v: string[]) => ({ ...s, exportedPaths: v }),
  RESET_RUN: (s: ClipRipplingState) => ({
    ...s,
    running: true,
    progress: 0,
    results: [],
    exportedPaths: [],
  }),
};

export const [clipRipplingReducer] = createReducer<ClipRipplingState, typeof handlers>(
  'CLIP_RIPPLING',
  handlers,
  initialClipRipplingState,
);
