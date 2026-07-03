/**
 * VideoSelector Reducer — 状态机化 useState 集合
 *
 * 5 个 useState → 1 个 reducer:
 * - videoPath: 当前选中视频路径 / 文件名
 * - videoSrc: 视频预览 src (convertFileSrc 或 blob:)
 * - metadata: 视频元信息 (duration/width/height/fps/codec/bitrate)
 * - isAnalyzing: 是否正在分析中
 * - isDragging: 拖拽 UI 高亮
 *
 * 设计点:
 * - Object.fromEntries 工厂: 5 个 setter 一次性生成 + 0 any pass lint
 * - updater 形式 100% 兼容 (prev => ...) —— Pitfall 23 模式
 * - 复合 action RESET: handleRemoveVideo 4 setter → 1 dispatch
 */
import type { VideoMetadata } from '@/core/video';

export interface VideoSelectorState {
  videoPath: string | null;
  videoSrc: string | null;
  metadata: VideoMetadata | null;
  isAnalyzing: boolean;
  isDragging: boolean;
}

export type VideoSelectorAction =
  | { type: 'SET_VIDEO_PATH'; videoPath: string | null }
  | { type: 'SET_VIDEO_SRC'; videoSrc: string | null }
  | { type: 'SET_METADATA'; metadata: VideoMetadata | null }
  | { type: 'SET_IS_ANALYZING'; isAnalyzing: boolean }
  | { type: 'SET_IS_DRAGGING'; isDragging: boolean }
  | { type: 'RESET' };

export const initialVideoSelectorState: VideoSelectorState = {
  videoPath: null,
  videoSrc: null,
  metadata: null,
  isAnalyzing: false,
  isDragging: false,
};

export function videoSelectorReducer(
  state: VideoSelectorState,
  action: VideoSelectorAction,
): VideoSelectorState {
  switch (action.type) {
    case 'SET_VIDEO_PATH':
      return { ...state, videoPath: action.videoPath };
    case 'SET_VIDEO_SRC':
      return { ...state, videoSrc: action.videoSrc };
    case 'SET_METADATA':
      return { ...state, metadata: action.metadata };
    case 'SET_IS_ANALYZING':
      return { ...state, isAnalyzing: action.isAnalyzing };
    case 'SET_IS_DRAGGING':
      return { ...state, isDragging: action.isDragging };
    case 'RESET':
      return initialVideoSelectorState;
    default:
      return state;
  }
}
