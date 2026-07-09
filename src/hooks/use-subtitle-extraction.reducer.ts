import { createReducer } from '@/shared/hooks/create-reducer';

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
  | { type: 'SET_FORMAT'; payload: SubtitleFormat }
  | { type: 'SET_TRANSLATE'; payload: boolean }
  | { type: 'SET_IS_EXTRACTING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'INCREMENT_PROGRESS'; payload: { delta: number; cap: number } }
  | { type: 'SET_EXTRACTED_SUBTITLES'; payload: SubtitleSegment[] }
  | { type: 'UPDATE_SUBTITLE_TEXT'; payload: { id: string; text: string } }
  | { type: 'SET_EDITING_ID'; payload: string | null }
  | { type: 'SET_EDITING_TEXT'; payload: string }
  | { type: 'SET_ACTIVE_SUB_ID'; payload: string | null }
  | { type: 'SET_VIDEO_DURATION'; payload: number }
  | { type: 'START_EDIT'; payload: SubtitleSegment }
  | { type: 'CANCEL_EDIT'; payload: undefined }
  | { type: 'RESET_FOR_EXTRACT'; payload: undefined };

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

const handlers = {
  SET_FORMAT: (s: SubtitleExtractorState, v: SubtitleFormat) => ({ ...s, format: v }),
  SET_TRANSLATE: (s: SubtitleExtractorState, v: boolean) => ({ ...s, translate: v }),
  SET_IS_EXTRACTING: (s: SubtitleExtractorState, v: boolean) => ({ ...s, isExtracting: v }),
  SET_PROGRESS: (s: SubtitleExtractorState, v: number) => ({ ...s, progress: v }),
  INCREMENT_PROGRESS: (s: SubtitleExtractorState, p: { delta: number; cap: number }) => ({
    ...s,
    progress: Math.min(s.progress + p.delta, p.cap),
  }),
  SET_EXTRACTED_SUBTITLES: (s: SubtitleExtractorState, v: SubtitleSegment[]) => ({
    ...s,
    extractedSubtitles: v,
  }),
  UPDATE_SUBTITLE_TEXT: (s: SubtitleExtractorState, p: { id: string; text: string }) => ({
    ...s,
    extractedSubtitles: s.extractedSubtitles.map((sub) =>
      sub.id === p.id ? { ...sub, text: p.text } : sub,
    ),
  }),
  SET_EDITING_ID: (s: SubtitleExtractorState, v: string | null) => ({ ...s, editingId: v }),
  SET_EDITING_TEXT: (s: SubtitleExtractorState, v: string) => ({ ...s, editingText: v }),
  SET_ACTIVE_SUB_ID: (s: SubtitleExtractorState, v: string | null) => ({ ...s, activeSubId: v }),
  SET_VIDEO_DURATION: (s: SubtitleExtractorState, v: number) => ({ ...s, videoDuration: v }),
  START_EDIT: (s: SubtitleExtractorState, v: SubtitleSegment) => ({
    ...s,
    editingId: v.id,
    editingText: v.text,
  }),
  CANCEL_EDIT: (s: SubtitleExtractorState) => ({ ...s, editingId: null, editingText: '' }),
  RESET_FOR_EXTRACT: (s: SubtitleExtractorState) => ({
    ...s,
    isExtracting: true,
    progress: 0,
    extractedSubtitles: [],
    activeSubId: null,
  }),
};

export const [subtitleExtractorReducer] = createReducer<SubtitleExtractorState, typeof handlers>(
  'SUBTITLE_EXTRACTOR',
  handlers,
  initialSubtitleExtractorState,
);
