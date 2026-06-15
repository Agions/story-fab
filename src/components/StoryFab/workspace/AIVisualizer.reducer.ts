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
 */
export interface AIAnalyzeConfig {
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
  | { type: 'SET_ANALYZING'; analyzing: boolean }
  | { type: 'SET_PROGRESS'; progress: number }
  | { type: 'SET_CURRENT_TASK_KEY'; currentTaskKey: string }
  | { type: 'SET_COMPLETED_TASKS'; completedTasks: string[] }
  | { type: 'SET_VISIBLE_TASKS'; visibleTasks: string[] }
  | { type: 'SET_CONFIG'; config: AIAnalyzeConfig }
  | { type: 'TOGGLE_CONFIG'; key: string }
  | { type: 'APPEND_COMPLETED_TASK'; taskKey: string }
  | { type: 'APPEND_VISIBLE_TASK'; taskKey: string }
  | { type: 'RESET_FOR_RUN' }
  | { type: 'INCREMENT_PROGRESS'; completed: number; total: number };

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

export function aiVisualizerReducer(
  state: AIVisualizerState,
  action: AIVisualizerAction,
): AIVisualizerState {
  switch (action.type) {
    case 'SET_ANALYZING':
      return { ...state, analyzing: action.analyzing };
    case 'SET_PROGRESS':
      return { ...state, progress: action.progress };
    case 'SET_CURRENT_TASK_KEY':
      return { ...state, currentTaskKey: action.currentTaskKey };
    case 'SET_COMPLETED_TASKS':
      return { ...state, completedTasks: action.completedTasks };
    case 'SET_VISIBLE_TASKS':
      return { ...state, visibleTasks: action.visibleTasks };
    case 'SET_CONFIG':
      return { ...state, config: action.config };
    case 'TOGGLE_CONFIG': {
      const k = action.key as keyof AIAnalyzeConfig;
      return {
        ...state,
        config: {
          ...state.config,
          [k]: !state.config[k],
        },
      };
    }
    case 'APPEND_COMPLETED_TASK':
      return {
        ...state,
        completedTasks: [...state.completedTasks, action.taskKey],
      };
    case 'APPEND_VISIBLE_TASK':
      return {
        ...state,
        visibleTasks: [...state.visibleTasks, action.taskKey],
      };
    case 'RESET_FOR_RUN':
      return {
        ...state,
        analyzing: true,
        progress: 0,
        completedTasks: [],
        visibleTasks: [],
        currentTaskKey: '',
      };
    case 'INCREMENT_PROGRESS':
      return {
        ...state,
        progress: Math.round((action.completed / action.total) * 100),
      };
    default:
      return state;
  }
}
