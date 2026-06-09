/**
 * 导出进度阶段推断工具
 * 单一职责：根据百分比推断当前阶段描述
 */

/** 阶段阈值常量 */
export const EXPORT_STAGE_THRESHOLDS = {
  VIDEO_ENCODING: 30,
  AUDIO_ENCODING: 60,
  FILE_GENERATION: 90,
} as const;

/** 阶段文案 */
export const EXPORT_STAGE_MESSAGES = {
  VIDEO_ENCODING: '🎬 视频编码中...',
  AUDIO_ENCODING: '🔊 音频编码中...',
  FILE_GENERATION: '💾 生成文件...',
  COMPLETE: '✨ 导出完成！',
} as const;

/**
 * 根据导出进度推断当前阶段文案
 * @param percent 0-100 的进度百分比
 * @returns 阶段描述
 */
export function inferExportStage(percent: number): string {
  if (percent < EXPORT_STAGE_THRESHOLDS.VIDEO_ENCODING) return EXPORT_STAGE_MESSAGES.VIDEO_ENCODING;
  if (percent < EXPORT_STAGE_THRESHOLDS.AUDIO_ENCODING) return EXPORT_STAGE_MESSAGES.AUDIO_ENCODING;
  if (percent < EXPORT_STAGE_THRESHOLDS.FILE_GENERATION) return EXPORT_STAGE_MESSAGES.FILE_GENERATION;
  return EXPORT_STAGE_MESSAGES.COMPLETE;
}
