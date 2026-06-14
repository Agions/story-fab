import { invoke, TauriCommand } from '../TauriBridge';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export interface ZCRProgress {
  stage: 'extract' | 'analyze' | 'done';
  percent: number;
}

export const highlightDetection = {
  /** 基于视觉+音频高光检测（Rust highlight_detector） */
  async detectHighlights(
    videoPath: string,
    options: {
      threshold?: number;
      minDurationMs?: number;
      topN?: number;
      windowMs?: number;
    } = {},
  ) {
    return invoke(TauriCommand.DETECT_HIGHLIGHTS, {
      video_path: videoPath,
      ...options,
    });
  },

  /**
   * 基于 ZCR 爆点的检测
   *
   * Backed by an async Tauri command running on a dedicated blocking thread
   * (see src-tauri commands/ai/detection.rs) — the Tauri main thread and
   * Tokio worker pool stay responsive while ffmpeg decodes the audio PCM.
   *
   * Pass `onProgress` to receive `{ stage, percent }` updates emitted on the
   * `detect-zcr-progress` event channel. The returned unlisten function
   * detaches the listener — callers should invoke it on completion.
   */
  async detectZCRBursts(
    videoPath: string,
    options: { threshold?: number; minDurationMs?: number; topN?: number } = {},
    onProgress?: (progress: ZCRProgress) => void,
  ): Promise<Array<{ start_ms: number; end_ms: number; score: number }>> {
    let unlisten: UnlistenFn | null = null;
    if (onProgress) {
      unlisten = await listen<ZCRProgress>('detect-zcr-progress', (event) => {
        onProgress(event.payload);
      });
    }
    try {
      return (await invoke(TauriCommand.DETECT_ZCR_BURSTS, {
        video_path: videoPath,
        ...options,
      })) as Promise<Array<{ start_ms: number; end_ms: number; score: number }>>;
    } finally {
      if (unlisten) unlisten();
    }
  },

  /** 智能分段（场景检测 + 语义） */
  async detectSmartSegments(
    videoPath: string,
    options: Record<string, unknown> = {},
  ) {
    return invoke(TauriCommand.DETECT_SMART_SEGMENTS, {
      video_path: videoPath,
      ...options,
    });
  },
};