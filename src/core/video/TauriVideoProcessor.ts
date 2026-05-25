/**
 * TauriVideoProcessor - 基于 Tauri invoke 的视频处理实现
 *
 * 继承 BaseVideoProcessor，只实现 Tauri 平台相关方法。
 * 错误归一化、FFmpeg 缓存、参数校验等通用逻辑由基类处理。
 */
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { v4 as uuidv4 } from 'uuid';
import { BaseVideoProcessor } from './BaseVideoProcessor';
import { invoke, TauriCommand } from '../tauri/TauriBridge';
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
    const result = await invoke(TauriCommand.CHECK_FFMPEG, {}) as [boolean, string | null];
    return { installed: result[0], version: result[1] || undefined };
  }

  protected async doGetHardwareAcceleration(): Promise<string | null> {
    // get_hw_acceleration is an internal Rust util not exposed as a tauri command
    return null;
  }

  // ---------- Analysis ----------

  protected async doAnalyze(videoPath: string): Promise<VideoMetadata> {
    return await invoke(TauriCommand.ANALYZE_VIDEO, { path: videoPath }) as Promise<VideoMetadata>;
  }

  // ---------- Extraction ----------

  protected async doExtractKeyFrames(
    videoPath: string,
    options: ExtractKeyFramesOptions,
    duration?: number,
  ): Promise<KeyFrame[]> {
    const { maxFrames: _maxFrames = 10, sceneThreshold: _sceneThreshold = 0.3 } = options ?? {};
    // extract_key_frames not exposed as tauri command — skip for now, return empty
    const framePaths: string[] = [];
    const totalDuration = duration ?? 0;
    const interval = framePaths.length > 0 ? totalDuration / framePaths.length : 0;
    return framePaths.map((path, index) => ({
      id: uuidv4(),
      timestamp: index * interval,
      path,
      description: '',
    }));
  }

  protected async doGenerateThumbnail(_videoPath: string, _time: number): Promise<string> {
    // generate_thumbnail is a VideoProcessor internal method, not a tauri command
    return '';
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
      return await invoke(TauriCommand.CUT_VIDEO, {
        inputPath,
        outputPath,
        segments: segments.map(s => ({ start: s.start, end: s.end })),
        useHwAccel: options?.transcode?.hwAccel ?? false,
      }) as string;
    } finally {
      unlisten?.();
    }
  }

  protected async doPreview(inputPath: string, segment: VideoSegment): Promise<string> {
    return await invoke(TauriCommand.GENERATE_PREVIEW, {
      inputPath,
      segment: {
        start: segment.start,
        end: segment.end,
      },
    }) as string;
  }
}

// 单例
export const videoProcessor = new TauriVideoProcessor();
