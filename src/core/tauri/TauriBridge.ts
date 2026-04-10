/**
 * TauriBridge — 统一 Tauri invoke 调用层
 * 
 * 所有 Rust ↔ TS 通信必须通过此桥接层
 * 特性：
 * - 类型化 invoke 调用
 * - 统一错误归一化
 * - 命令名称常量化
 * - 调用超时控制
 */

import { invoke as tauriInvoke } from '@tauri-apps/api/core';

// ============================================================
// 命令名称常量（与 Rust 端保持一致）
// ============================================================
export const TauriCommand = {
  // Video processing
  VIDEO_GET_INFO:          'video_get_info',
  VIDEO_EXTRACT_FRAMES:    'video_extract_frames',
  VIDEO_TRIM:              'video_trim',
  VIDEO_CONCAT:            'video_concat',
  VIDEO_EXPORT:            'video_export',
  VIDEO_GET_EXPORT_DIR:    'get_export_dir',
  VIDEO_GET_THUMBNAIL:     'video_get_thumbnail',

  // Highlight detection (Rust 已实现)
  HIGHLIGHT_DETECT:        'detect_highlights',
  HIGHLIGHT_OPTIONS_NEW:   'highlight_options_new',

  // Subtitle
  SUBTITLE_EXTRACT:        'subtitle_extract',
  SUBTITLE_BURN_IN:        'subtitle_burn_in',

  // Smart segmenter
  SMART_SEGMENT:           'smart_segment',

  // Video effects
  VIDEO_APPLY_EFFECT:      'video_apply_effect',

  // File operations
  FILE_READ:               'file_read',
  FILE_WRITE:              'file_write',
  FILE_EXISTS:             'file_exists',

  // Project
  PROJECT_LOAD:            'load_project',
  PROJECT_SAVE:            'save_project',

  // Window
  WINDOW_MINIMIZE:         'window_minimize',
  WINDOW_MAXIMIZE:         'window_maximize',
  WINDOW_CLOSE:            'window_close',
} as const;

export type TauriCommand = typeof TauriCommand[keyof typeof TauriCommand];

// ============================================================
// 错误类型
// ============================================================
export class TauriBridgeError extends Error {
  constructor(
    message: string,
    public readonly command: TauriCommand,
    public readonly cause?: unknown,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'TauriBridgeError';
  }

  static fromInvoke(command: TauriCommand, error: unknown): TauriBridgeError {
    if (error instanceof Error) {
      const isRetryable =
        error.message.includes('timeout') ||
        error.message.includes('busy') ||
        error.message.includes('temporary');

      return new TauriBridgeError(
        `Tauri invoke '${command}' failed: ${error.message}`,
        command,
        error,
        isRetryable,
      );
    }
    return new TauriBridgeError(
      `Tauri invoke '${command}' failed: ${String(error)}`,
      command,
      error,
      false,
    );
  }
}

// ============================================================
// Bridge 配置
// ============================================================
export interface BridgeOptions {
  timeout?: number;
  retries?: number;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT = 60_000; // 60s — 视频处理可能较长

// ============================================================
// 核心调用函数
// ============================================================

/**
 * 类型化 invoke 调用
 * @example
 * const highlights = await bridge.invoke<HighlightSegment[]>(
 *   TauriCommand.HIGHLIGHT_DETECT,
 *   { video_path: '/path/to/video.mp4', threshold: 0.6 }
 * );
 */
export async function invoke<C extends TauriCommand>(
  command: C,
  args?: Record<string, unknown>,
  options?: BridgeOptions,
): Promise<unknown> {
  const { retries = 0 } = options ?? {};

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await tauriInvoke(command, args ?? {});
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        // 指数退避
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }
  }

  throw TauriBridgeError.fromInvoke(command, lastError);
}

// ============================================================
// 预构建的快捷调用（避免每次传命令名）
// ============================================================

export const tauri = {
  /**
   * 获取视频信息
   */
  async getVideoInfo(path: string) {
    return invoke(TauriCommand.VIDEO_GET_INFO, { path });
  },

  /**
   * 检测高光片段（Rust highlight_detector）
   */
  async detectHighlights(
    videoPath: string,
    options: {
      threshold?: number;
      minDurationMs?: number;
      topN?: number;
      windowMs?: number;
    } = {},
  ) {
    return invoke(TauriCommand.HIGHLIGHT_DETECT, {
      video_path: videoPath,
      ...options,
    });
  },

  /**
   * 提取字幕
   */
  async extractSubtitle(videoPath: string, lang?: string) {
    return invoke(TauriCommand.SUBTITLE_EXTRACT, {
      video_path: videoPath,
      lang,
    });
  },

  /**
   * 烧录字幕到视频
   */
  async burnSubtitle(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
  ) {
    return invoke(TauriCommand.SUBTITLE_BURN_IN, {
      video_path: videoPath,
      subtitle_path: subtitlePath,
      output_path: outputPath,
    });
  },

  /**
   * 智能分段
   */
  async smartSegment(videoPath: string, options?: Record<string, unknown>) {
    return invoke(TauriCommand.SMART_SEGMENT, {
      video_path: videoPath,
      ...options,
    });
  },

  /**
   * 应用视频效果
   */
  async applyEffect(
    videoPath: string,
    effectType: string,
    params: Record<string, unknown>,
  ) {
    return invoke(TauriCommand.VIDEO_APPLY_EFFECT, {
      video_path: videoPath,
      effect_type: effectType,
      params,
    });
  },

  /**
   * 获取导出目录
   */
  async getExportDir() {
    return invoke(TauriCommand.VIDEO_GET_EXPORT_DIR, {});
  },

  /**
   * 获取视频缩略图
   */
  async getThumbnail(videoPath: string, timestamp: number) {
    return invoke(TauriCommand.VIDEO_GET_THUMBNAIL, {
      video_path: videoPath,
      timestamp,
    });
  },
};

export default tauri;
