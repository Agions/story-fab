import { invoke, TauriCommand } from '../invoke';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

interface ZCRProgress {
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
      videoPath,
      ...options,
    });
  },

  /**
   * 基于 ZCR 爆点的检测
   */
  async detectZCRBursts(
    videoPath: string,
    options: { threshold?: number; minDurationMs?: number; topN?: number } = {},
    onProgress?: (progress: ZCRProgress) => void,
  ): Promise<Array<{ startMs: number; endMs: number; score: number }>> {
    let unlisten: UnlistenFn | null = null;
    if (onProgress) {
      unlisten = await listen<ZCRProgress>('detect-zcr-progress', (event) => {
        onProgress(event.payload);
      });
    }
    try {
      return (await invoke(TauriCommand.DETECT_ZCR_BURSTS, {
        videoPath,
        ...options,
      })) as Array<{ startMs: number; endMs: number; score: number }>;
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
      videoPath,
      ...options,
    });
  },
};
