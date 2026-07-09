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
 *
 * 改造: 用 createReducer 工厂 + handler map 自动生成。
 * action 统一 payload 包装: { type: 'SET_X'; payload: T }。
 */
import { createReducer } from '@/shared/hooks/create-reducer';

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

export type HighlightsAction =
  | { type: 'SET_HIGHLIGHTS'; payload: Highlight[] }
  | { type: 'SET_DETECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_THRESHOLD'; payload: number }
  | { type: 'SET_TOPN'; payload: number }
  | { type: 'START_DETECT'; payload: undefined }
  | { type: 'DETECT_SUCCESS'; payload: Highlight[] }
  | { type: 'DETECT_FAILURE'; payload: string }
  | { type: 'FINISH_DETECT'; payload: undefined };

export const initialHighlightsState: HighlightsState = {
  highlights: [],
  detected: false,
  loading: false,
  error: null,
  threshold: 1.5,
  topN: 10,
};

const handlers = {
  SET_HIGHLIGHTS: (s: HighlightsState, v: Highlight[]) => ({ ...s, highlights: v }),
  SET_DETECTED: (s: HighlightsState, v: boolean) => ({ ...s, detected: v }),
  SET_LOADING: (s: HighlightsState, v: boolean) => ({ ...s, loading: v }),
  SET_ERROR: (s: HighlightsState, v: string | null) => ({ ...s, error: v }),
  SET_THRESHOLD: (s: HighlightsState, v: number) => ({ ...s, threshold: v }),
  SET_TOPN: (s: HighlightsState, v: number) => ({ ...s, topN: v }),
  START_DETECT: (s: HighlightsState) => ({ ...s, loading: true, error: null }),
  DETECT_SUCCESS: (s: HighlightsState, v: Highlight[]) => ({
    ...s,
    highlights: v,
    detected: true,
    loading: false,
  }),
  DETECT_FAILURE: (s: HighlightsState, v: string) => ({ ...s, error: v, loading: false }),
  FINISH_DETECT: (s: HighlightsState) => ({ ...s, loading: false }),
};

export const [highlightsReducer] = createReducer<HighlightsState, typeof handlers>(
  'HIGHLIGHTS',
  handlers,
  initialHighlightsState,
);
