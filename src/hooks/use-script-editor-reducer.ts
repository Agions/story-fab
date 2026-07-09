/**
 * useOriginalEditor reducer — 集中 12 useState 状态机
 * 来源: refactor/original-editor-usereducer (v3.4 §A2 范式)
 * 模式: 1 hook + 1 .reducer.ts + createAutoSetters + Updater<T>
 */
import type { ScriptSegment } from '@/types';
import type { Updater } from '@/shared/hooks/use-auto-setters';
import { genericUpdateReducer } from '@/shared/hooks/use-auto-setters';

export interface SegmentFormValues {
  start: number;
  end: number;
  type: string;
  content: string;
}

export interface OriginalEditorState {
  // data
  segments: ScriptSegment[];
  editingIndex: number | null;
  formValues: SegmentFormValues;
  formError: string;
  // preview
  previewVisible: boolean;
  previewSrc: string;
  previewLoading: boolean;
  // ui
  aiModalVisible: boolean;
  exportMenuOpen: boolean;
  deleteConfirmOpen: boolean;
  deleteTargetIndex: number | null;
  // derived
  totalDuration: number;
}

export const initialOriginalEditorState = (
  initialSegments: ScriptSegment[],
): OriginalEditorState => ({
  segments: initialSegments,
  editingIndex: null,
  formValues: { start: 0, end: 30, type: 'narration', content: '' },
  formError: '',
  previewVisible: false,
  previewSrc: '',
  previewLoading: false,
  aiModalVisible: false,
  exportMenuOpen: false,
  deleteConfirmOpen: false,
  deleteTargetIndex: null,
  totalDuration: 0,
});

export type OriginalEditorAction = {
  type: 'update';
  key: keyof OriginalEditorState;
  updater: Updater<unknown>;
};

export const originalEditorReducer = genericUpdateReducer<OriginalEditorState>;
