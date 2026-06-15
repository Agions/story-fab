export type SubtitleFormat = 'srt' | 'vtt' | 'txt';

export interface SubtitleSegment {
  id: string;
  startTime: number;
  endTime: number;
  start: string;
  end: string;
  text: string;
  quality?: 'high' | 'medium' | 'low';
}

export interface SubtitleExtractorState {
  format: SubtitleFormat;
  translate: boolean;
  isExtracting: boolean;
  progress: number;
  extractedSubtitles: SubtitleSegment[];
  editingId: string | null;
  editingText: string;
  activeSubId: string | null;
  videoDuration: number;
}

export type SubtitleExtractorAction =
  | { type: 'SET_FORMAT'; format: SubtitleFormat }
  | { type: 'SET_TRANSLATE'; translate: boolean }
  | { type: 'SET_IS_EXTRACTING'; isExtracting: boolean }
  | { type: 'SET_PROGRESS'; progress: number }
  | { type: 'INCREMENT_PROGRESS'; delta: number; cap: number }
  | { type: 'SET_EXTRACTED_SUBTITLES'; subtitles: SubtitleSegment[] }
  | { type: 'UPDATE_SUBTITLE_TEXT'; id: string; text: string }
  | { type: 'SET_EDITING_ID'; editingId: string | null }
  | { type: 'SET_EDITING_TEXT'; editingText: string }
  | { type: 'SET_ACTIVE_SUB_ID'; activeSubId: string | null }
  | { type: 'SET_VIDEO_DURATION'; videoDuration: number }
  | { type: 'START_EDIT'; sub: SubtitleSegment }
  | { type: 'CANCEL_EDIT' }
  | { type: 'RESET_FOR_EXTRACT' };

export const initialSubtitleExtractorState: SubtitleExtractorState = {
  format: 'srt',
  translate: false,
  isExtracting: false,
  progress: 0,
  extractedSubtitles: [],
  editingId: null,
  editingText: '',
  activeSubId: null,
  videoDuration: 0,
};

export function subtitleExtractorReducer(
  state: SubtitleExtractorState,
  action: SubtitleExtractorAction,
): SubtitleExtractorState {
  switch (action.type) {
    case 'SET_FORMAT':
      return { ...state, format: action.format };
    case 'SET_TRANSLATE':
      return { ...state, translate: action.translate };
    case 'SET_IS_EXTRACTING':
      return { ...state, isExtracting: action.isExtracting };
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress };
    case 'INCREMENT_PROGRESS':
      return { ...state, progress: Math.min(state.progress + action.delta, action.cap) };
    case 'SET_EXTRACTED_SUBTITLES':
      return { ...state, extractedSubtitles: action.subtitles };
    case 'UPDATE_SUBTITLE_TEXT':
      return {
        ...state,
        extractedSubtitles: state.extractedSubtitles.map((s) =>
          s.id === action.id ? { ...s, text: action.text } : s,
        ),
      };
    case 'SET_EDITING_ID':
      return { ...state, editingId: action.editingId };
    case 'SET_EDITING_TEXT':
      return { ...state, editingText: action.editingText };
    case 'SET_ACTIVE_SUB_ID':
      return { ...state, activeSubId: action.activeSubId };
    case 'SET_VIDEO_DURATION':
      return { ...state, videoDuration: action.videoDuration };
    case 'START_EDIT':
      return { ...state, editingId: action.sub.id, editingText: action.sub.text };
    case 'CANCEL_EDIT':
      return { ...state, editingId: null, editingText: '' };
    case 'RESET_FOR_EXTRACT':
      return { ...state, isExtracting: true, progress: 0, extractedSubtitles: [], activeSubId: null };
    default:
      return state;
  }
}
