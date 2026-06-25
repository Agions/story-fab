/**
 * WorkflowEditor Reducer — 状态机化 useState 集合
 *
 * 4 个 useState → 1 个 reducer:
 * - activeTab: 当前 tab (content/segments/scenes)
 * - editedContent: 编辑中内容 (form 字段)
 * - editedTitle: 编辑中标题 (form 字段)
 * - aiModalVisible: AI 优化模态框显示
 *
 * 设计点 (Pitfall 16/17 验证):
 * - formValues 原子化: editedContent + editedTitle 一组 form 字段, 保持独立 setter
 *   (不强制复合 setFieldValue, 因为 2 字段简单, 主组件 2 处 set 调用清楚)
 * - Dialog 受控保留: aiModalVisible 必须暴露 setter 给 Dialog onOpenChange 用
 * - SYNC_FROM_SCRIPT 复合 action: 替代原 useEffect 顶部 2 行 setEditedContent/setEditedTitle
 */
export interface WorkflowEditorState {
  activeTab: string;
  editedContent: string;
  editedTitle: string;
  aiModalVisible: boolean;
}

export type WorkflowEditorAction =
  | { type: 'SET_ACTIVE_TAB'; activeTab: string }
  | { type: 'SET_EDITED_CONTENT'; editedContent: string }
  | { type: 'SET_EDITED_TITLE'; editedTitle: string }
  | { type: 'SET_AI_MODAL_VISIBLE'; aiModalVisible: boolean }
  | { type: 'SYNC_FROM_SCRIPT'; content: string; title: string };

export const initialWorkflowEditorState: WorkflowEditorState = {
  activeTab: 'content',
  editedContent: '',
  editedTitle: '',
  aiModalVisible: false,
};

export function workflowEditorReducer(
  state: WorkflowEditorState,
  action: WorkflowEditorAction,
): WorkflowEditorState {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.activeTab };
    case 'SET_EDITED_CONTENT':
      return { ...state, editedContent: action.editedContent };
    case 'SET_EDITED_TITLE':
      return { ...state, editedTitle: action.editedTitle };
    case 'SET_AI_MODAL_VISIBLE':
      return { ...state, aiModalVisible: action.aiModalVisible };
    case 'SYNC_FROM_SCRIPT':
      return {
        ...state,
        editedContent: action.content,
        editedTitle: action.title,
      };
    default:
      return state;
  }
}
