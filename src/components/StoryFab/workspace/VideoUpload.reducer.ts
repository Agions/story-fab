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
 */
type UploadStatus = 'idle' | 'uploading' | 'paused' | 'completed';

export interface VideoUploadState {
  uploading: boolean;
  uploadProgress: number;
  dragActive: boolean;
  uploadStatus: UploadStatus;
  currentFile: File | null;
}

type VideoUploadAction =
  | { type: 'SET_UPLOADING'; uploading: boolean }
  | { type: 'SET_UPLOAD_PROGRESS'; uploadProgress: number }
  | { type: 'SET_DRAG_ACTIVE'; dragActive: boolean }
  | { type: 'SET_UPLOAD_STATUS'; uploadStatus: UploadStatus }
  | { type: 'SET_CURRENT_FILE'; currentFile: File | null }
  | { type: 'START_UPLOAD'; file: File }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'COMPLETE_UPLOAD' }
  | { type: 'RESET' };

export const initialVideoUploadState: VideoUploadState = {
  uploading: false,
  uploadProgress: 0,
  dragActive: false,
  uploadStatus: 'idle',
  currentFile: null,
};

export function videoUploadReducer(
  state: VideoUploadState,
  action: VideoUploadAction,
): VideoUploadState {
  switch (action.type) {
    case 'SET_UPLOADING':
      return { ...state, uploading: action.uploading };
    case 'SET_UPLOAD_PROGRESS':
      return { ...state, uploadProgress: action.uploadProgress };
    case 'SET_DRAG_ACTIVE':
      return { ...state, dragActive: action.dragActive };
    case 'SET_UPLOAD_STATUS':
      return { ...state, uploadStatus: action.uploadStatus };
    case 'SET_CURRENT_FILE':
      return { ...state, currentFile: action.currentFile };
    case 'START_UPLOAD':
      return {
        ...state,
        uploading: true,
        uploadProgress: 0,
        uploadStatus: 'uploading',
        currentFile: action.file,
      };
    case 'TOGGLE_PAUSE':
      return {
        ...state,
        uploadStatus: state.uploadStatus === 'uploading' ? 'paused' : 'uploading',
      };
    case 'COMPLETE_UPLOAD':
      return {
        ...state,
        uploadProgress: 100,
        uploadStatus: 'completed',
      };
    case 'RESET':
      return {
        ...state,
        uploading: false,
        uploadProgress: 0,
        uploadStatus: 'idle',
        currentFile: null,
      };
    default:
      return state;
  }
}
