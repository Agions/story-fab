/**
 * Highlights Reducer — 状态机化 useState 集合
 *
 * 6 个 useState → 1 个 reducer:
 * - highlights: 检测结果列表
 * - detected: 是否已检测
 * - loading: 是否检测中
 * - error: 错误信息
 * - threshold: 阈值 (1.0~3.0)
 * - topN: Top N (3~30)
 *
 * 复合 actions:
 * - START_DETECT: loading=true + error=null + detected=false
 * - DETECT_SUCCESS: highlights=value + detected=true + loading=false
 * - DETECT_FAILURE: error=msg + loading=false
 * - FINISH_DETECT: loading=false (用于 finally 块)
 */
export interface Highlight {
  startTime: number;
  endTime: number;
  score: number;
  reason: string;
  audioScore?: number;
  sceneScore?: number;
  motionScore?: number;
}

export interface HighlightsState {
  highlights: Highlight[];
  detected: boolean;
  loading: boolean;
  error: string | null;
  threshold: number;
  topN: number;
}

type HighlightsAction =
  | { type: 'SET_HIGHLIGHTS'; highlights: Highlight[] }
  | { type: 'SET_DETECTED'; detected: boolean }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_THRESHOLD'; threshold: number }
  | { type: 'SET_TOPN'; topN: number }
  | { type: 'START_DETECT' }
  | { type: 'DETECT_SUCCESS'; highlights: Highlight[] }
  | { type: 'DETECT_FAILURE'; error: string }
  | { type: 'FINISH_DETECT' };

export const initialHighlightsState: HighlightsState = {
  highlights: [],
  detected: false,
  loading: false,
  error: null,
  threshold: 1.5,
  topN: 10,
};

export function highlightsReducer(
  state: HighlightsState,
  action: HighlightsAction,
): HighlightsState {
  switch (action.type) {
    case 'SET_HIGHLIGHTS':
      return { ...state, highlights: action.highlights };
    case 'SET_DETECTED':
      return { ...state, detected: action.detected };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_THRESHOLD':
      return { ...state, threshold: action.threshold };
    case 'SET_TOPN':
      return { ...state, topN: action.topN };
    case 'START_DETECT':
      return { ...state, loading: true, error: null };
    case 'DETECT_SUCCESS':
      return {
        ...state,
        highlights: action.highlights,
        detected: true,
        loading: false,
      };
    case 'DETECT_FAILURE':
      return { ...state, error: action.error, loading: false };
    case 'FINISH_DETECT':
      return { ...state, loading: false };
    default:
      return state;
  }
}
