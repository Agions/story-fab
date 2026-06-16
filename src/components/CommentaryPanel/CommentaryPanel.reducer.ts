/**
 * CommentaryPanel Reducer — 状态机化 useState 集合
 *
 * 5 个 useState → 1 个 reducer:
 * - activeTab: 当前 tab (script/style/voice/timeline)
 * - planConfirmOpen: 计划确认弹窗
 * - reviseOpen: 修订弹窗 (原代码 _reviseOpen 死代码, 保留 state 字段以备未来使用, Pitfall 12)
 * - apiKey: 用户 API key
 * - selectedStyle: 当前选中风格预设
 */
import type { ScriptStylePreset } from '@/core/services/commentary';

export type CommentaryTab = 'script' | 'style' | 'voice' | 'timeline';

export interface CommentaryPanelState {
  activeTab: CommentaryTab;
  planConfirmOpen: boolean;
  reviseOpen: boolean;
  apiKey: string;
  selectedStyle: ScriptStylePreset;
}

export type CommentaryPanelAction =
  | { type: 'SET_ACTIVE_TAB'; activeTab: CommentaryTab }
  | { type: 'SET_PLAN_CONFIRM_OPEN'; planConfirmOpen: boolean }
  | { type: 'SET_API_KEY'; apiKey: string }
  | { type: 'SET_SELECTED_STYLE'; selectedStyle: ScriptStylePreset };

export const initialCommentaryPanelState: CommentaryPanelState = {
  activeTab: 'script',
  planConfirmOpen: false,
  reviseOpen: false,
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
