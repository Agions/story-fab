/**
 * CommentaryScriptEditor Reducer — 状态机化 useState 集合
 *
 * 3 个 useState 分布在 2 个组件 → 2 个独立 reducer:
 *
 * ## SegmentRow 局部 reducer (2 useState → 1 reducer)
 * - editing: 是否编辑中
 * - text: 当前编辑文本 (prop 镜像, 编辑时 mutate)
 *
 * 复合 action START_EDIT: 进入编辑模式, 初始化 text 镜像当前 segment.text
 * 复合 action COMMIT_EDIT: 退出编辑, 保留 text 给 onChange 回调
 *
 * ## 主组件 reducer (1 useState → 1 reducer)
 * - copied: 是否已复制 (2 秒后自动重置)
 *
 * 复合 action MARK_COPIED/RESET_COPIED: 替代 setTimeout 2 秒重置逻辑
 */

export interface SegmentRowState {
  editing: boolean;
  text: string;
}

export type SegmentRowAction =
  | { type: 'SET_EDITING'; editing: boolean }
  | { type: 'SET_TEXT'; text: string }
  | { type: 'START_EDIT'; initialText: string }
  | { type: 'COMMIT_EDIT' };

export const initialSegmentRowState: SegmentRowState = {
  editing: false,
  text: '',
};

export function segmentRowReducer(
  state: SegmentRowState,
  action: SegmentRowAction,
): SegmentRowState {
  switch (action.type) {
    case 'SET_EDITING':
      return { ...state, editing: action.editing };
    case 'SET_TEXT':
      return { ...state, text: action.text };
    case 'START_EDIT':
      return { ...state, editing: true, text: action.initialText };
    case 'COMMIT_EDIT':
      return { ...state, editing: false };
    default:
      return state;
  }
}

// ─── 主组件 reducer ────────────────────────────────────────────────────

export interface ScriptEditorState {
  copied: boolean;
}

export type ScriptEditorAction =
  | { type: 'SET_COPIED'; copied: boolean }
  | { type: 'MARK_COPIED' }
  | { type: 'RESET_COPIED' };

export const initialScriptEditorState: ScriptEditorState = {
  copied: false,
};

export function scriptEditorReducer(
  state: ScriptEditorState,
  action: ScriptEditorAction,
): ScriptEditorState {
  switch (action.type) {
    case 'SET_COPIED':
      return { ...state, copied: action.copied };
    case 'MARK_COPIED':
      return { ...state, copied: true };
    case 'RESET_COPIED':
      return { ...state, copied: false };
    default:
      return state;
  }
}
