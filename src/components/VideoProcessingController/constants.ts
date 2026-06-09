/**
 * VideoProcessingController 常量
 *
 * 【优化思路】将散落在组件内的选项常量统一收敛到此处，
 * 消除内联重复定义，便于跨组件复用和统一维护。
 */

export type QualityValue = 'low' | 'medium' | 'high' | 'ultra' | 'custom';
export type FormatValue = 'mp4' | 'webm' | 'mov' | 'mkv' | 'gif';
export type TransitionValue = 'none' | 'fade' | 'dissolve' | 'slide' | 'wipe' | 'wiperight' | 'wipeleft' | 'wipeup' | 'wipedown';
export type AudioProcessValue = 'original' | 'none' | 'normalize' | 'denoise' | 'enhance';

/** 视频质量选项 */
export const QUALITY_OPTIONS: Array<{ value: QualityValue; label: string; description: string }> = [
  { value: 'low', label: '低质量 (720p)', description: '适合快速预览或网络分享' },
  { value: 'medium', label: '中等质量 (1080p)', description: '平衡文件大小和清晰度' },
  { value: 'high', label: '高质量 (原始分辨率)', description: '保持原始视频质量' },
  { value: 'ultra', label: '超清 (4K)', description: '最高画质输出' },
  { value: 'custom', label: '自定义', description: '设置自定义的编码参数' },
];

/** 导出格式选项 */
export const FORMAT_OPTIONS: Array<{ value: FormatValue; label: string; description: string }> = [
  { value: 'mp4', label: 'MP4', description: '通用兼容性最佳' },
  { value: 'mov', label: 'MOV', description: '适合苹果设备' },
  { value: 'webm', label: 'WebM', description: '网页视频，体积小' },
  { value: 'gif', label: 'GIF', description: '适合短循环动画' },
  { value: 'mkv', label: 'MKV', description: '多音轨支持' },
];

/** 转场效果选项 */
export const TRANSITION_OPTIONS: Array<{ value: TransitionValue; label: string }> = [
  { value: 'none', label: '无转场' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'dissolve', label: '交叉溶解' },
  { value: 'slide', label: '滑动效果' },
  { value: 'wipe', label: '擦除效果' },
  { value: 'wiperight', label: '右擦除' },
  { value: 'wipeleft', label: '左擦除' },
  { value: 'wipeup', label: '上擦除' },
  { value: 'wipedown', label: '下擦除' },
];

/** 音频处理选项 */
export const AUDIO_PROCESS_OPTIONS: Array<{ value: AudioProcessValue; label: string }> = [
  { value: 'original', label: '保持原始音频' },
  { value: 'normalize', label: '音量标准化' },
  { value: 'denoise', label: '降噪处理' },
  { value: 'enhance', label: '音质增强' },
  { value: 'none', label: '无音频 (静音)' },
];

/** 自定义质量默认参数 */
export const DEFAULT_CUSTOM_SETTINGS = {
  resolution: '1920x1080',
  bitrate: 4000,
  framerate: 30,
  useHardwareAcceleration: true,
};
