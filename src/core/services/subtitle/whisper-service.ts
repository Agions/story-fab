/**
 * Whisper 语音识别服务
 * 职责：集成 Rust faster-whisper 后端进行语音转文字
 *
 * 重构说明：
 * - 从原 subtitleService.ts (558行) 中提取独立服务
 * - 职责单一：Whisper 模型管理和语音转录
 */

import { logger } from '@/shared/utils/logging';

// ============================================
// Whisper 类型定义
// ============================================

export interface WhisperSegment {
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface WhisperResult {
  language: string;
  language_probability: number;
  duration_ms: number;
  segments: WhisperSegment[];
}

export interface WhisperProgress {
  stage: string;
  progress: number;
  current_segment?: number;
  total_segments?: number;
}

// ============================================
// Whisper 服务
// ============================================

export class WhisperService {
  /**
   * 检查 faster-whisper 是否已安装
   */
  async checkFasterWhisper(): Promise<boolean> {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<boolean>('check_faster_whisper');
    } catch {
      return false;
    }
  }

  /**
   * 使用 Whisper 转录音频/视频
   * @param audioPath 音频或视频文件路径
   * @param modelSize 模型大小: tiny, base, small, medium, large-v2, large-v3
   * @param language 语言代码，auto 为自动检测
   * @param onProgress 进度回调
   */
  async transcribe(
    audioPath: string,
    modelSize: string = 'base',
    language: string = 'auto',
    onProgress?: (progress: WhisperProgress) => void
  ): Promise<WhisperResult> {
    logger.info('[Whisper] 开始转录:', { audioPath, modelSize, language });

    let unlisten: (() => void) | undefined;
    if (onProgress) {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<WhisperProgress>('whisper-progress', (event) => {
          onProgress(event.payload);
        });
      } catch {
        // Event listening optional
      }
    }

    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke<WhisperResult>('transcribe_audio', {
        audioPath,
        modelSize,
        language,
      });

      logger.info('[Whisper] 转录完成:', {
        language: result.language,
        segments: result.segments.length,
        duration: result.duration_ms,
      });

      return result;
    } finally {
      unlisten?.();
    }
  }

  /**
   * 将 Whisper 结果转换为字幕格式
   * @param result Whisper 转录结果
   * @returns 标准化的字幕数据
   */
  toSubtitleFormat(result: WhisperResult): {
    language: string;
    entries: Array<{
      id: string;
      startTime: number;
      endTime: number;
      text: string;
    }>;
  } {
    return {
      language: result.language,
      entries: result.segments.map((seg, index) => ({
        id: `whisper-${index}`,
        startTime: seg.start_ms / 1000,
        endTime: seg.end_ms / 1000,
        text: seg.text,
      })),
    };
  }
}

// 导出单例
export const whisperService = new WhisperService();
