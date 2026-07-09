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
 *
 * 改造: 用 createReducer 工厂 + handler map 自动生成。
 * action 统一 payload 包装: { type: 'SET_X'; payload: T }。
 */
import { createReducer } from '@/shared/hooks/create-reducer';

export interface WorkflowEditorState {
  activeTab: string;
  editedContent: string;
  editedTitle: string;
  aiModalVisible: boolean;
}

export type WorkflowEditorAction =
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_EDITED_CONTENT'; payload: string }
  | { type: 'SET_EDITED_TITLE'; payload: string }
  | { type: 'SET_AI_MODAL_VISIBLE'; payload: boolean }
  | { type: 'SYNC_FROM_SCRIPT'; payload: { content: string; title: string } };

export const initialWorkflowEditorState: WorkflowEditorState = {
  activeTab: 'content',
  editedContent: '',
  editedTitle: '',
  aiModalVisible: false,
};

const handlers = {
  SET_ACTIVE_TAB: (s: WorkflowEditorState, v: string) => ({ ...s, activeTab: v }),
  SET_EDITED_CONTENT: (s: WorkflowEditorState, v: string) => ({ ...s, editedContent: v }),
  SET_EDITED_TITLE: (s: WorkflowEditorState, v: string) => ({ ...s, editedTitle: v }),
  SET_AI_MODAL_VISIBLE: (s: WorkflowEditorState, v: boolean) => ({ ...s, aiModalVisible: v }),
  SYNC_FROM_SCRIPT: (s: WorkflowEditorState, p: { content: string; title: string }) => ({
    ...s,
    editedContent: p.content,
    editedTitle: p.title,
  }),
};

export const [workflowEditorReducer] = createReducer<WorkflowEditorState, typeof handlers>(
  'WORKFLOW_EDITOR',
  handlers,
  initialWorkflowEditorState,
);
