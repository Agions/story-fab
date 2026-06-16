/**
 * VideoPlayer Reducer — 状态机化 useState 集合
 *
 * 5 个 useState → 1 个 reducer:
 * - isPlaying: 播放/暂停状态
 * - currentTime: 当前播放时间 (秒)
 * - duration: 总时长 (秒)
 * - volume: 音量 0-1
 * - showVolumeSlider: 音量滑块悬停显示
 *
 * 设计点:
 * - 直接 dispatch SET_* 模式 (同 AIVisualizer/VideoSelector 风格, 无 setter 包装工厂)
 * - 5 个独立 action 即可: 5 个 useState 关联度低, 不需要复合 action
 */
export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  showVolumeSlider: boolean;
}

export type VideoPlayerAction =
  | { type: 'SET_IS_PLAYING'; isPlaying: boolean }
  | { type: 'SET_CURRENT_TIME'; currentTime: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'SET_SHOW_VOLUME_SLIDER'; showVolumeSlider: boolean };

export const initialVideoPlayerState: VideoPlayerState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  showVolumeSlider: false,
};

export function videoPlayerReducer(
  state: VideoPlayerState,
  action: VideoPlayerAction,
): VideoPlayerState {
  switch (action.type) {
    case 'SET_IS_PLAYING':
      return { ...state, isPlaying: action.isPlaying };
    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.currentTime };
    case 'SET_DURATION':
      return { ...state, duration: action.duration };
    case 'SET_VOLUME':
      return { ...state, volume: action.volume };
    case 'SET_SHOW_VOLUME_SLIDER':
      return { ...state, showVolumeSlider: action.showVolumeSlider };
    default:
      return state;
  }
}
