import { invoke, TauriCommand } from '../TauriBridge';

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

  /** 基于 ZCR 爆点的检测 */
  async detectZCRBursts(
    videoPath: string,
    options: { threshold?: number; minDurationMs?: number; topN?: number } = {},
  ): Promise<Array<{ start_ms: number; end_ms: number; score: number }>> {
    return invoke(TauriCommand.DETECT_ZCR_BURSTS, {
      video_path: videoPath,
      ...options,
    }) as Promise<Array<{ start_ms: number; end_ms: number; score: number }>>;
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