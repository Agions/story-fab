/**
 * CommentaryPanel Reducer — 状态机化 useState 集合
 *
 * 4 个 useState → 1 个 reducer:
 * - activeTab: 当前 tab (script/style/voice/timeline)
 * - planConfirmOpen: 计划确认弹窗
 * - apiKey: 用户 API key
 * - selectedStyle: 当前选中风格预设
 *
 * 清理说明: reviseOpen 死代码已移除 (原 _reviseOpen 0 引用, 2026-06-16 cleanup)
 *
 * 改造: 用 createReducer 工厂 + handler map 自动生成。
 * action 统一 payload 包装: { type: 'SET_X'; payload: T }。
 */
import type { ScriptStylePreset } from '@/core/services/commentary';
import { createReducer } from '@/shared/hooks/create-reducer';

export type CommentaryTab = 'script' | 'style' | 'voice' | 'timeline';

export interface CommentaryPanelState {
  activeTab: CommentaryTab;
  planConfirmOpen: boolean;
  apiKey: string;
  selectedStyle: ScriptStylePreset;
}

export type CommentaryPanelAction =
  | { type: 'SET_ACTIVE_TAB'; payload: CommentaryTab }
  | { type: 'SET_PLAN_CONFIRM_OPEN'; payload: boolean }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_SELECTED_STYLE'; payload: ScriptStylePreset };

export const initialCommentaryPanelState: CommentaryPanelState = {
  activeTab: 'script',
  planConfirmOpen: false,
  apiKey: '',
  selectedStyle: 'conversational',
};

const handlers = {
  SET_ACTIVE_TAB: (s: CommentaryPanelState, v: CommentaryTab) => ({ ...s, activeTab: v }),
  SET_PLAN_CONFIRM_OPEN: (s: CommentaryPanelState, v: boolean) => ({ ...s, planConfirmOpen: v }),
  SET_API_KEY: (s: CommentaryPanelState, v: string) => ({ ...s, apiKey: v }),
  SET_SELECTED_STYLE: (s: CommentaryPanelState, v: ScriptStylePreset) => ({ ...s, selectedStyle: v }),
};

export const [commentaryPanelReducer] = createReducer<CommentaryPanelState, typeof handlers>(
  'COMMENTARY_PANEL',
  handlers,
  initialCommentaryPanelState,
);
