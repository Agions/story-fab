/**
 * Rust Whisper ASR Provider
 * 通过 Tauri 后端调用 Rust faster-whisper 进行语音识别
 * 优点：本地推理，准确率高，支持中文/英文，断网可用
 */
import { logger } from '../../../../shared/utils/logging';
import { tauri } from '../../../tauri/TauriBridge';
import type { VideoInfo } from '../../../types';
import type { ASRResult, ASRSegment, ASROptions, RustWhisperSegment } from '../asrTypes';
import type { IASRProvider } from './types';

/**
 * Rust Whisper 策略实现
 * 本地推理，准确率高，支持中文/英文，断网可用
 */
export class RustWhisperASRProvider implements IASRProvider {
  readonly name = 'rust-whisper';

  async transcribe(videoInfo: VideoInfo, opts: Required<ASROptions>): Promise<ASRResult | null> {
    try {
      logger.info('[RustWhisperASR] 尝试 Rust Whisper ASR:', {
        path: videoInfo.path,
        language: opts.language,
      });

      const whisperResult = await tauri.transcribeAudio(
        videoInfo.path,
        opts.model,
        opts.language === 'zh_cn' ? 'zh' : opts.language === 'en_us' ? 'en' : undefined,
      );

      if (!whisperResult || !whisperResult.segments || whisperResult.segments.length === 0) {
        logger.warn('[RustWhisperASR] Rust Whisper 返回空结果');
        return null;
      }

      const segments = this._convertSegments(whisperResult.segments);

      logger.info(`[RustWhisperASR] Rust Whisper 完成: ${segments.length} 段`, {
        language: whisperResult.language,
      });

      return {
        text: segments.map(s => s.text).join(' '),
        segments,
        language: opts.language,
        confidence: whisperResult.language_probability ?? 0.9,
        fullResult: opts.enableTimestamp
          ? segments.map(s => ({
              start: s.startTime,
              end: s.endTime,
              text: s.text,
              confidence: s.confidence,
            }))
          : undefined,
        provider: this.name,
      };
    } catch (err) {
      logger.warn('[RustWhisperASR] Rust Whisper 调用失败:', String(err));
      return null;
    }
  }

  /** 转换 Rust Whisper 原始分段时间单位（毫秒→秒）并添加 UUID */
  private _convertSegments(rawSegments: RustWhisperSegment[]): ASRSegment[] {
    return rawSegments.map(seg => ({
      id: crypto.randomUUID(),
      startTime: seg.start_ms / 1000,
      endTime: seg.end_ms / 1000,
      text: seg.text.trim(),
      confidence: seg.probability ?? 0.95,
      words: seg.words?.map(w => ({
        word: w.word,
        startTime: w.start_ms / 1000,
        endTime: w.end_ms / 1000,
        confidence: w.probability,
      })),
    }));
  }
}
