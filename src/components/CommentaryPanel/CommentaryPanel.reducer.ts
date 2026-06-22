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
 */
import type { ScriptStylePreset } from '@/core/services/commentary';

export type CommentaryTab = 'script' | 'style' | 'voice' | 'timeline';

export interface CommentaryPanelState {
  activeTab: CommentaryTab;
  planConfirmOpen: boolean;
  apiKey: string;
  selectedStyle: ScriptStylePreset;
}

type CommentaryPanelAction =
  | { type: 'SET_ACTIVE_TAB'; activeTab: CommentaryTab }
  | { type: 'SET_PLAN_CONFIRM_OPEN'; planConfirmOpen: boolean }
  | { type: 'SET_API_KEY'; apiKey: string }
  | { type: 'SET_SELECTED_STYLE'; selectedStyle: ScriptStylePreset };

export const initialCommentaryPanelState: CommentaryPanelState = {
  activeTab: 'script',
  planConfirmOpen: false,
  apiKey: '',
  selectedStyle: 'conversational',
};

export function commentaryPanelReducer(
  state: CommentaryPanelState,
  action: CommentaryPanelAction,
): CommentaryPanelState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.activeTab };
    case 'SET_PLAN_CONFIRM_OPEN':
      return { ...state, planConfirmOpen: action.planConfirmOpen };
    case 'SET_API_KEY':
      return { ...state, apiKey: action.apiKey };
    case 'SET_SELECTED_STYLE':
      return { ...state, selectedStyle: action.selectedStyle };
    default:
      return state;
  }
}
