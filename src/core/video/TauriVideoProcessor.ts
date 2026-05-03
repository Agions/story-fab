/**
 * TauriVideoProcessor - 基于 Tauri invoke 的视频处理实现
 *
 * 继承 BaseVideoProcessor，只实现 Tauri 平台相关方法。
 * 错误归一化、FFmpeg 缓存、参数校验等通用逻辑由基类处理。
 */
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { v4 as uuidv4 } from 'uuid';
import { BaseVideoProcessor } from './BaseVideoProcessor';
import type {
  VideoMetadata,
  KeyFrame,
  VideoSegment,
  ExtractKeyFramesOptions,
  CutOptions,
  FFmpegStatus,
  ProcessingProgress,
} from './types';

export class TauriVideoProcessor extends BaseVideoProcessor {

  // ---------- FFmpeg ----------

  protected async doCheckStatus(): Promise<FFmpegStatus> {
    const result = await invoke<[boolean, string | null]>('check_ffmpeg');
    return { installed: result[0], version: result[1] || undefined };
  }

  protected async doGetHardwareAcceleration(): Promise<string | null> {
    return await invoke<string | null>('get_hw_acceleration');
  }

  // ---------- Analysis ----------

  protected async doAnalyze(videoPath: string): Promise<VideoMetadata> {
    return await invoke<VideoMetadata>('analyze_video', { path: videoPath });
  }

  // ---------- Extraction ----------

  protected async doExtractKeyFrames(
    videoPath: string,
    options: ExtractKeyFramesOptions
  ): Promise<KeyFrame[]> {
    const { maxFrames = 10, sceneThreshold = 0.3 } = options ?? {};
    const framePaths = await invoke<string[]>('extract_key_frames', {
      path: videoPath,
      count: maxFrames,
      threshold: sceneThreshold,
    });
    const metadata = await invoke<VideoMetadata>('analyze_video', { path: videoPath });
    const interval = metadata.duration / (framePaths.length || maxFrames);
    return framePaths.map((path, index) => ({
      id: uuidv4(),
      timestamp: index * interval,
      path,
      description: '',
    }));
  }

  protected async doGenerateThumbnail(videoPath: string, time: number): Promise<string> {
    return await invoke<string>('generate_thumbnail', { path: videoPath, time });
  }

  // ---------- Editing ----------

  protected async doCut(
    inputPath: string,
    outputPath: string,
    segments: VideoSegment[],
    options: CutOptions
  ): Promise<string> {
    let unlisten: UnlistenFn | null = null;

    if (options?.onProgress) {
      unlisten = await listen<ProcessingProgress>('processing-progress', (event) => {
        options.onProgress?.(event.payload);
      });
    }

    try {
      return await invoke<string>('cut_video', {
        inputPath,
        outputPath,
        segments: segments.map(s => ({ start: s.start, end: s.end })),
        useHwAccel: options?.transcode?.hwAccel ?? false,
      });
    } finally {
      unlisten?.();
    }
  }

  protected async doPreview(inputPath: string, segment: VideoSegment): Promise<string> {
    return await invoke<string>('generate_preview', {
      inputPath,
      segment: {
        start: segment.start,
        end: segment.end,
      },
    });
  }
}

// 单例
export const videoProcessor = new TauriVideoProcessor();
