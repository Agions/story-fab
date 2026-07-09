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
 *
 * 改造: 两个 reducer 均用 createReducer 工厂 + handler map 自动生成。
 * action 统一 payload 包装: { type: 'SET_X'; payload: T }。
 */

import { createReducer } from '@/shared/hooks/create-reducer';

export interface SegmentRowState {
  editing: boolean;
  text: string;
}

export type SegmentRowAction =
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_TEXT'; payload: string }
  | { type: 'START_EDIT'; payload: string }
  | { type: 'COMMIT_EDIT'; payload: undefined };

export const initialSegmentRowState: SegmentRowState = {
  editing: false,
  text: '',
};

const segmentRowHandlers = {
  SET_EDITING: (s: SegmentRowState, v: boolean) => ({ ...s, editing: v }),
  SET_TEXT: (s: SegmentRowState, v: string) => ({ ...s, text: v }),
  START_EDIT: (s: SegmentRowState, v: string) => ({ ...s, editing: true, text: v }),
  COMMIT_EDIT: (s: SegmentRowState) => ({ ...s, editing: false }),
};

export const [segmentRowReducer] = createReducer<SegmentRowState, typeof segmentRowHandlers>(
  'SEGMENT_ROW',
  segmentRowHandlers,
  initialSegmentRowState,
);

// ─── 主组件 reducer ────────────────────────────────────────────────────

export interface ScriptEditorState {
  copied: boolean;
}

export type ScriptEditorAction =
  | { type: 'SET_COPIED'; payload: boolean }
  | { type: 'MARK_COPIED'; payload: undefined }
  | { type: 'RESET_COPIED'; payload: undefined };

export const initialScriptEditorState: ScriptEditorState = {
  copied: false,
};

const scriptEditorHandlers = {
  SET_COPIED: (s: ScriptEditorState, v: boolean) => ({ ...s, copied: v }),
  MARK_COPIED: (s: ScriptEditorState) => ({ ...s, copied: true }),
  RESET_COPIED: (s: ScriptEditorState) => ({ ...s, copied: false }),
};

export const [scriptEditorReducer] = createReducer<ScriptEditorState, typeof scriptEditorHandlers>(
  'SCRIPT_EDITOR',
  scriptEditorHandlers,
  initialScriptEditorState,
);
