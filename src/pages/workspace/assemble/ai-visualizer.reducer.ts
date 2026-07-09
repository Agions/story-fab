/**
 * AIVisualizer Reducer — 状态机化 useState 集合
 *
 * 6 个 useState → 1 个 reducer:
 * - analyzing: 是否分析中
 * - progress: 进度 0-100
 * - currentTaskKey: 当前任务 key ('' 表示无)
 * - completedTasks: 已完成任务 key 数组
 * - visibleTasks: 已可见任务 key 数组 (动画)
 * - config: 分析配置 (5 个 boolean)
 *
 * 复合 actions (关键设计点):
 * - RESET_FOR_RUN: 5 个 setter 一次性重置 (原 runAnalysis 顶部 5 行 → 1 dispatch)
 * - APPEND_COMPLETED_TASK: completedTasks prev → [...prev, x] (Pitfall 23 模式)
 * - APPEND_VISIBLE_TASK: visibleTasks prev → [...prev, x]
 * - TOGGLE_CONFIG: setConfig(prev => ({...prev, [key]: !prev[key]}))
 * - INCREMENT_PROGRESS: completedCount / total 原子化 (Pitfall 23 复合模式)
 *
 * 改造: 用 createReducer 工厂 + handler map 自动生成。
 * action 统一 payload 包装: { type: 'SET_X'; payload: T }。
 */
import { createReducer } from '@/shared/hooks/create-reducer';

interface AIAnalyzeConfig {
  sceneDetection: boolean;
  objectDetection: boolean;
  emotionAnalysis: boolean;
  ocrEnabled: boolean;
  asrEnabled: boolean;
}

export interface AIVisualizerState {
  analyzing: boolean;
  progress: number;
  currentTaskKey: string;
  completedTasks: string[];
  visibleTasks: string[];
  config: AIAnalyzeConfig;
}

export type AIVisualizerAction =
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_PROGRESS'; payload: number }
  | { type: 'SET_CURRENT_TASK_KEY'; payload: string }
  | { type: 'SET_COMPLETED_TASKS'; payload: string[] }
  | { type: 'SET_VISIBLE_TASKS'; payload: string[] }
  | { type: 'SET_CONFIG'; payload: AIAnalyzeConfig }
  | { type: 'TOGGLE_CONFIG'; payload: string }
  | { type: 'APPEND_COMPLETED_TASK'; payload: string }
  | { type: 'APPEND_VISIBLE_TASK'; payload: string }
  | { type: 'RESET_FOR_RUN'; payload: undefined }
  | { type: 'INCREMENT_PROGRESS'; payload: { completed: number; total: number } };

export const initialAIVisualizerState: AIVisualizerState = {
  analyzing: false,
  progress: 0,
  currentTaskKey: '',
  completedTasks: [],
  visibleTasks: [],
  config: {
    sceneDetection: true,
    objectDetection: true,
    emotionAnalysis: true,
    ocrEnabled: true,
    asrEnabled: true,
  },
};

const handlers = {
  SET_ANALYZING: (s: AIVisualizerState, v: boolean) => ({ ...s, analyzing: v }),
  SET_PROGRESS: (s: AIVisualizerState, v: number) => ({ ...s, progress: v }),
  SET_CURRENT_TASK_KEY: (s: AIVisualizerState, v: string) => ({ ...s, currentTaskKey: v }),
  SET_COMPLETED_TASKS: (s: AIVisualizerState, v: string[]) => ({ ...s, completedTasks: v }),
  SET_VISIBLE_TASKS: (s: AIVisualizerState, v: string[]) => ({ ...s, visibleTasks: v }),
  SET_CONFIG: (s: AIVisualizerState, v: AIAnalyzeConfig) => ({ ...s, config: v }),
  TOGGLE_CONFIG: (s: AIVisualizerState, v: string) => {
    const k = v as keyof AIAnalyzeConfig;
    return {
      ...s,
      config: {
        ...s.config,
        [k]: !s.config[k],
      },
    };
  },
  APPEND_COMPLETED_TASK: (s: AIVisualizerState, v: string) => ({
    ...s,
    completedTasks: [...s.completedTasks, v],
  }),
  APPEND_VISIBLE_TASK: (s: AIVisualizerState, v: string) => ({
    ...s,
    visibleTasks: [...s.visibleTasks, v],
  }),
  RESET_FOR_RUN: (s: AIVisualizerState) => ({
    ...s,
    analyzing: true,
    progress: 0,
    completedTasks: [],
    visibleTasks: [],
    currentTaskKey: '',
  }),
  INCREMENT_PROGRESS: (s: AIVisualizerState, p: { completed: number; total: number }) => ({
    ...s,
    progress: Math.round((p.completed / p.total) * 100),
  }),
};

export const [aiVisualizerReducer] = createReducer<AIVisualizerState, typeof handlers>(
  'AI_VISUALIZER',
  handlers,
  initialAIVisualizerState,
);
