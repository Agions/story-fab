import type { RepurposingClip, PipelineStage } from '../../../core/services/pipeline/clip-pipeline/pipeline';
import type { SocialPlatform, AspectRatio } from './clip-rippling-config';

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
  | { type: 'SET_PLATFORM'; platform: SocialPlatform }
  | { type: 'SET_SELECTED_FORMATS'; selectedFormats: AspectRatio[] }
  | { type: 'TOGGLE_SELECTED_FORMAT'; format: AspectRatio }
  | { type: 'SET_TARGET_COUNT'; targetCount: number }
  | { type: 'SET_RUNNING'; running: boolean }
  | { type: 'SET_PROGRESS'; progress: number }
  | { type: 'SET_STAGE'; stage: PipelineStage | '' }
  | { type: 'SET_RESULTS'; results: RepurposingClip[] }
  | { type: 'SET_SELECTED_CLIPS'; selectedClips: Set<string> }
  | { type: 'TOGGLE_CLIP'; id: string }
  | { type: 'SET_EXPORTING'; exporting: boolean }
  | { type: 'SET_EXPORTED_PATHS'; exportedPaths: string[] }
  | { type: 'RESET_RUN' };

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

export function clipRipplingReducer(
  state: ClipRipplingState,
  action: ClipRipplingAction,
): ClipRipplingState {
  switch (action.type) {
    case 'SET_PLATFORM':
      return { ...state, platform: action.platform };
    case 'SET_SELECTED_FORMATS':
      return { ...state, selectedFormats: action.selectedFormats };
    case 'TOGGLE_SELECTED_FORMAT': {
      const exists = state.selectedFormats.includes(action.format);
      return {
        ...state,
        selectedFormats: exists
          ? state.selectedFormats.filter((f) => f !== action.format)
          : [...state.selectedFormats, action.format],
      };
    }
    case 'SET_TARGET_COUNT':
      return { ...state, targetCount: action.targetCount };
    case 'SET_RUNNING':
      return { ...state, running: action.running };
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress };
    case 'SET_STAGE':
      return { ...state, stage: action.stage };
    case 'SET_RESULTS':
      return { ...state, results: action.results };
    case 'SET_SELECTED_CLIPS':
      return { ...state, selectedClips: action.selectedClips };
    case 'TOGGLE_CLIP': {
      const next = new Set(state.selectedClips);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, selectedClips: next };
    }
    case 'SET_EXPORTING':
      return { ...state, exporting: action.exporting };
    case 'SET_EXPORTED_PATHS':
      return { ...state, exportedPaths: action.exportedPaths };
    case 'RESET_RUN':
      return { ...state, running: true, progress: 0, results: [], exportedPaths: [] };
    default:
      return state;
  }
}
