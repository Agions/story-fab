/**
 * 配音混音服务
 * 通过 FFmpeg filter_complex 将 TTS 配音与原视频音轨混合
 *
 * 混音策略：
 * - 原视频音轨：volume 降低到 backgroundVolume（默认 0.3），保留环境音/背景乐
 * - TTS 配音：作为主音轨，覆盖在原音轨上方
 * - 如果原视频无音轨：直接使用 TTS 音频
 */
import { tauri } from '../../tauri';
import { logger } from '@/shared/utils/logging';

interface MixAudioOptions {
  /** TTS 配音文件路径 */
  ttsAudioPath: string;
  /** 原视频路径（保留其音轨作为背景音） */
  videoPath: string;
  /** 输出混音后视频路径 */
  outputPath: string;
  /** TTS 配音音量（0.0–1.0），默认 1.0 */
  ttsVolume?: number;
  /** 原视频背景音量（0.0–1.0），默认 0.3 */
  backgroundVolume?: number;
  /** TTS 音频在视频中的起始偏移（秒），默认 0 */
  offset?: number;
}

interface MixAudioResult {
  outputPath: string;
  duration: number;
}

/**
 * 使用 FFmpeg 将 TTS 配音与原视频音轨混合
 *
 * FFmpeg filter_complex 策略：
 * - [0:a] — 原视频原始音轨
 * - [1:a] — TTS 配音音轨
 * - amix=inputs=2 — 混合两个音轨
 * - 或使用 amerge+pan 做更精细的混音控制
 */
export async function mixTtsWithVideo(
  options: MixAudioOptions
): Promise<MixAudioResult> {
  const {
    ttsAudioPath,
    videoPath,
    outputPath,
    ttsVolume = 1.0,
    backgroundVolume = 0.3,
    offset = 0,
  } = options;

  logger.info('[AudioMix] Starting mix:', {
    videoPath,
    ttsAudioPath,
    outputPath,
    ttsVolume,
    backgroundVolume,
    offset,
  });

  try {
    const result = await tauri.mixAudio.mix({
      videoPath,
      ttsAudioPath,
      outputPath,
      ttsVolume,
      backgroundVolume,
      offsetSeconds: offset,
    });

    logger.info('[AudioMix] Mix complete:', result);
    return { outputPath: result, duration: 0 };
  } catch (error) {
    logger.error('[AudioMix] Mix failed:', error);
    throw error;
  }
}
