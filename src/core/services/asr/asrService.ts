/**
 * ASR（自动语音识别）服务
 * 编排多个 ASR Provider：RustWhisper → WebSpeech → Mock
 * 策略模式实现：每种识别方案独立为 Provider，可独立测试和替换
 */
import { BaseService } from '../providers/base.service';
import { logger } from '../../../shared/utils/logging';
import { tauri } from '../../tauri';
import { AppError } from '@/core/errors';
import type { VideoInfo } from '@/core/types';
import {
  DEFAULT_ASR_OPTIONS,
  type ASRResult,
  type ASROptions,
} from './asrTypes';
import { RustWhisperASRProvider } from './providers/whisperRustProvider';
import { WebSpeechASRProvider } from './providers/webSpeechProvider';
import { MockASRProvider } from './providers/mockProvider';
import type { IASRProvider } from './providers/types';

/**
 * ASR 服务（编排器）
 * 单一职责：管理 Provider 链，按优先级依次尝试直到成功
 */
export class ASRService extends BaseService {
  // @ts-expect-error - _isInitialized 预留用于未来懒加载状态跟踪
  private _isInitialized = false;

  /** Provider 链：按优先级排序 */
  private readonly _providers: IASRProvider[];

  constructor() {
    super('ASRService', { timeout: 60000, retries: 2 });
    this._providers = [
      new RustWhisperASRProvider(),
      new WebSpeechASRProvider(),
      new MockASRProvider(),
    ];
  }

  /**
   * 视频路径转字幕 — SubtitleEditor 专用入口
   * 构造最小 VideoInfo 后调用 recognizeSpeech
   */
  async transcribeVideo(
    videoPath: string,
    duration: number,
    options?: ASROptions
  ): Promise<ASRResult> {
    const videoInfo: VideoInfo = {
      id: crypto.randomUUID(),
      name: videoPath.split('/').pop() ?? videoPath,
      path: videoPath,
      duration,
      width: 0,
      height: 0,
      size: 0,
      fps: 0,
      format: '',
    };
    return await this.recognizeSpeech(videoInfo, options);
  }

  /**
   * 语音识别 - 将音频转换为文字
   * 按 Provider 链依次尝试，返回第一个成功结果
   */
  async recognizeSpeech(
    videoInfo: VideoInfo,
    options?: ASROptions
  ): Promise<ASRResult> {
    return this.executeRequest(async () => {
      const opts = { ...DEFAULT_ASR_OPTIONS, ...options };

      logger.info(`[ASRService] 开始语音识别:`, {
        videoId: videoInfo.id,
        language: opts.language,
        duration: videoInfo.duration,
      });

      const result = await this._runProviderChain(videoInfo, opts);

      logger.info(`[ASRService] 语音识别完成: provider=${result.provider}, segments=${result.segments.length}`, {
        videoId: videoInfo.id,
        textLength: result.text.length,
        segmentCount: result.segments.length,
        provider: result.provider,
      });

      return result;
    }, '语音识别失败');
  }

  /**
   * 批量语音识别
   */
  async recognizeBatch(
    videos: VideoInfo[],
    options?: ASROptions
  ): Promise<ASRResult[]> {
    return this.executeRequest(async () => {
      const results: ASRResult[] = [];
      for (const video of videos) {
        const result = await this.recognizeSpeech(video, options);
        results.push(result);
      }
      return results;
    }, '批量语音识别失败');
  }

  /**
   * 获取音频峰值（用于配合 ASR 做高光检测）
   */
  async getAudioPeaks(
    videoInfo: VideoInfo,
    options?: { threshold?: number; minInterval?: number }
  ): Promise<Array<{ timestamp: number; intensity: number }>> {
    return this.executeRequest(async () => {
      const { threshold = 0.7, minInterval = 1000 } = options || {};

      if (!videoInfo.path) {
        logger.warn('[ASRService] getAudioPeaks: videoInfo.path is empty, fallback to empty peaks');
        return [];
      }

      // 调用 Rust ZCR 爆裂检测（过零率 → 音频能量指标）
      const bursts = await tauri.detectZCRBursts(videoInfo.path, {
        threshold: 2.5,
      });

      return this._convertBurstsToPeaks(bursts, threshold, minInterval);
    }, '音频峰值检测失败');
  }

  /**
   * 按顺序尝试 Provider 链，返回第一个成功结果
   * 所有 Provider 不可用时降级到 Mock
   */
  private async _runProviderChain(
    videoInfo: VideoInfo,
    opts: Required<ASROptions>
  ): Promise<ASRResult> {
    for (const provider of this._providers) {
      try {
        const result = await provider.transcribe(videoInfo, opts);
        if (result) {
          return result;
        }
      } catch (err) {
        logger.warn(`[ASRService] ${provider.name} 不可用:`, String(err));
      }
    }

    // 永远不会到达这里（Mock Provider 永远成功）
    throw new AppError('APP_ASR_NO_RESULT', 'No ASR provider returned a result', {
      userMessage: '语音识别失败，请重试',
      retryable: true,
    });
  }

  /** 将 ZCR burst 转换为峰值格式（毫秒→秒，归一化强度） */
  private _convertBurstsToPeaks(
    bursts: Array<{ start_ms: number; end_ms: number; score: number }>,
    threshold: number,
    minInterval: number
  ): Array<{ timestamp: number; intensity: number }> {
    const peaks: Array<{ timestamp: number; intensity: number }> = [];

    for (const burst of bursts) {
      const midMs = (burst.start_ms + burst.end_ms) / 2;
      const intensity = Math.min((burst.score - 1) / (burst.score + 0.001), 1);

      if (intensity >= (threshold - 0.3)) {
        const lastPeak = peaks[peaks.length - 1];
        if (!lastPeak || midMs - lastPeak.timestamp * 1000 >= minInterval) {
          peaks.push({ timestamp: midMs / 1000, intensity });
        }
      }
    }

    return peaks;
  }
}

// 导出单例
export const asrService = new ASRService();
export default asrService;
