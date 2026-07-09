/**
 * VideoUpload Reducer — 状态机化 useState 集合
 *
 * 5 个 useState → 1 个 reducer:
 * - uploading: 是否上传中
 * - uploadProgress: 上传进度 0-100
 * - dragActive: 拖拽 UI 高亮
 * - uploadStatus: 状态机 'idle' | 'uploading' | 'paused' | 'completed'
 * - currentFile: 当前上传文件引用
 *
 * 设计点 (Pitfall 23 复合 action 模式):
 * - START_UPLOAD 复合 action: 替代 handleUpload 顶部 5 行 setter (uploading + uploadProgress 0 + uploadStatus 'uploading' + currentFile + 后续状态)
 * - HANDLE_DELETE 复合 action: 替代 handleDelete 4 行 setter (uploadProgress 0 + uploadStatus 'idle' + currentFile null)
 * - TOGGLE_PAUSE 复合 action: handlePauseResume 切换 'uploading' ↔ 'paused'
 *
 * 改造: 用 createReducer 工厂 + handler map 自动生成。
 * action 统一 payload 包装: { type: 'SET_X'; payload: T }。
 */
import { createReducer } from '@/shared/hooks/create-reducer';

type UploadStatus = 'idle' | 'uploading' | 'paused' | 'completed';

export interface VideoUploadState {
  uploading: boolean;
  uploadProgress: number;
  dragActive: boolean;
  uploadStatus: UploadStatus;
  currentFile: File | null;
}

export type VideoUploadAction =
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_UPLOAD_PROGRESS'; payload: number }
  | { type: 'SET_DRAG_ACTIVE'; payload: boolean }
  | { type: 'SET_UPLOAD_STATUS'; payload: UploadStatus }
  | { type: 'SET_CURRENT_FILE'; payload: File | null }
  | { type: 'START_UPLOAD'; payload: File }
  | { type: 'TOGGLE_PAUSE'; payload: undefined }
  | { type: 'COMPLETE_UPLOAD'; payload: undefined }
  | { type: 'RESET'; payload: undefined };

export const initialVideoUploadState: VideoUploadState = {
  uploading: false,
  uploadProgress: 0,
  dragActive: false,
  uploadStatus: 'idle',
  currentFile: null,
};

const handlers = {
  SET_UPLOADING: (s: VideoUploadState, v: boolean) => ({ ...s, uploading: v }),
  SET_UPLOAD_PROGRESS: (s: VideoUploadState, v: number) => ({ ...s, uploadProgress: v }),
  SET_DRAG_ACTIVE: (s: VideoUploadState, v: boolean) => ({ ...s, dragActive: v }),
  SET_UPLOAD_STATUS: (s: VideoUploadState, v: UploadStatus) => ({ ...s, uploadStatus: v }),
  SET_CURRENT_FILE: (s: VideoUploadState, v: File | null) => ({ ...s, currentFile: v }),
  START_UPLOAD: (s: VideoUploadState, v: File): VideoUploadState => ({
    ...s,
    uploading: true,
    uploadProgress: 0,
    uploadStatus: 'uploading',
    currentFile: v,
  }),
  TOGGLE_PAUSE: (s: VideoUploadState): VideoUploadState => ({
    ...s,
    uploadStatus: s.uploadStatus === 'uploading' ? 'paused' : 'uploading',
  }),
  COMPLETE_UPLOAD: (s: VideoUploadState): VideoUploadState => ({
    ...s,
    uploadProgress: 100,
    uploadStatus: 'completed',
  }),
  RESET: (s: VideoUploadState): VideoUploadState => ({
    ...s,
    uploading: false,
    uploadProgress: 0,
    uploadStatus: 'idle',
    currentFile: null,
  }),
};

export const [videoUploadReducer] = createReducer<VideoUploadState, typeof handlers>(
  'VIDEO_UPLOAD',
  handlers,
  initialVideoUploadState,
);
