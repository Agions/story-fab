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
  // FFprobe / Video analysis
  CHECK_FFMPEG:            'check_ffmpeg',
  ANALYZE_VIDEO:           'analyze_video',
  GET_EXPORT_DIR:          'get_export_dir',
  RUN_FFPROBE:             'run_ffprobe',

  // Highlight detection
  DETECT_HIGHLIGHTS:       'detect_highlights',
  DETECT_ZCR_BURSTS:       'detect_zcr_bursts',
  DETECT_SMART_SEGMENTS:   'detect_smart_segments',

  // Render / Transcode
  EXPORT_VIDEO:            'export_video',
  TRANSCODE_WITH_CROP:     'transcode_with_crop',
  AUTONOMOUS_RENDER:       'render_autonomous_cut',
  GENERATE_PREVIEW:        'generate_preview',
  CUT_VIDEO:               'cut_video',

  // Subtitle / Whisper ASR
  SUBTITLE_EXTRACT:        'subtitle_extract',
  SUBTITLE_BURN_IN:        'subtitle_burn_in',
  TRANSCRIBE_AUDIO:        'transcribe_audio',
  LIST_WHISPER_MODELS:     'list_whisper_models',
  CHECK_FASTER_WHISPER:    'check_faster_whisper',
  DOWNLOAD_WHISPER_MODEL:  'download_whisper_model',
  GET_WHISPER_LANGUAGES:   'get_whisper_supported_languages',

  // TTS
  SYNTHESIZE_SPEECH:       'synthesize_speech',
  LIST_TTS_BACKENDS:       'list_tts_backends',
  CHECK_TTS_AVAILABLE:     'check_tts_available',
  MIX_AUDIO:               'mix_audio',
  GET_AUDIO_DURATION:      'get_audio_duration',

  // AI Director
  RUN_AI_DIRECTOR_PLAN:   'run_ai_director_plan',

  // Translate
  TRANSLATE_TEXT:          'translate_text',

  // File operations
  FILE_READ:               'read_text_file',
  FILE_WRITE:              'write_text_file',
  FILE_DELETE:             'delete_file',
  FILE_EXISTS:             'file_exists',
  CLEAN_TEMP_FILE:         'clean_temp_file',
  OPEN_FILE:               'open_file',
  VOICE_DISCOVERY:         'voice_discovery',
  GET_FILE_SIZE:           'get_file_size',

  // Project
  PROJECT_LOAD:            'load_project_file',
  PROJECT_SAVE:            'save_project_file',
  PROJECT_DELETE:          'delete_project_file',
  PROJECT_LIST:            'list_project_files',
  LIST_APP_DATA_FILES:     'list_app_data_files',
  CHECK_APP_DATA_DIR:      'check_app_data_directory',

  // Window
  WINDOW_MINIMIZE:         'window_minimize',
  WINDOW_MAXIMIZE:         'window_maximize',
  WINDOW_CLOSE:            'window_close',

  // Export state
  CANCEL_EXPORT:           'cancel_export',

  // LLM / AI Script Generation
  GENERATE_NARRATION_SCRIPT:   'generate_narration_script',
  ANALYZE_VIDEO_FOR_NARRATION: 'analyze_video_for_narration',
  LIST_AVAILABLE_MODELS:       'list_available_models',
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

// Note: DEFAULT_TIMEOUT is reserved for future timeout configuration
// const DEFAULT_TIMEOUT = 60_000; // 60s — 视频处理可能较长

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
  const { retries = 0, signal } = options ?? {};

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    // 每次重试前检查 signal 状态
    if (signal?.aborted) {
      throw TauriBridgeError.fromInvoke(command, new Error('Request aborted'));
    }

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
  // ── FFmpeg / Video analysis ──────────────────────────────────────

  /** 检查 FFmpeg 是否可用 */
  async checkFFmpeg() {
    return invoke(TauriCommand.CHECK_FFMPEG, {}) as Promise<{
      installed: boolean;
      version?: string;
    }>;
  },

  /** 分析视频元数据（时长、分辨率、编码等） */
  async analyzeVideo(path: string) {
    return invoke(TauriCommand.ANALYZE_VIDEO, { path });
  },

  /** 运行 ffprobe 原始命令 */
  async runFfprobe(args: string[]) {
    return invoke(TauriCommand.RUN_FFPROBE, { args }) as Promise<string>;
  },

  // ── Highlight detection ──────────────────────────────────────────

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

  // ── Render / Transcode ──────────────────────────────────────────

  /** 比例裁切 + 编码导出（9:16 / 1:1 / 16:9） */
  async transcodeWithCrop(input: {
    inputPath: string;
    outputPath: string;
    aspect: '9:16' | '1:1' | '16:9';
    startTime?: number;
    endTime?: number;
    quality?: 'low' | 'medium' | 'high';
  }) {
    return invoke(TauriCommand.TRANSCODE_WITH_CROP, {
      input: {
        inputPath: input.inputPath,
        outputPath: input.outputPath,
        aspect: input.aspect,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        quality: input.quality ?? 'high',
      },
    }) as Promise<string>;
  },

  /** 全自动 AI 剪辑渲染 */
  async autonomousRender(input: Record<string, unknown>) {
    return invoke(TauriCommand.AUTONOMOUS_RENDER, { input }) as Promise<string>;
  },

  /** 生成预览片段 */
  async generatePreview(input: {
    inputPath: string;
    segment: { start: number; end: number };
  }) {
    return invoke(TauriCommand.GENERATE_PREVIEW, { input }) as Promise<string>;
  },

  /** 裁剪视频（多段合并） */
  async cutVideo(input: {
    inputPath: string;
    outputPath: string;
    segments: Array<{ start: number; end: number }>;
    useHwAccel?: boolean;
    onProgress?: (progress: unknown) => void;
  }) {
    return invoke(TauriCommand.CUT_VIDEO, {
      inputPath: input.inputPath,
      outputPath: input.outputPath,
      segments: input.segments,
      useHwAccel: input.useHwAccel ?? false,
    }) as Promise<string>;
  },

  // ── Subtitle / Whisper ASR ──────────────────────────────────────

  /** 提取字幕（SRT/VTT） */
  async extractSubtitle(videoPath: string, lang?: string) {
    return invoke(TauriCommand.SUBTITLE_EXTRACT, {
      video_path: videoPath,
      lang,
    });
  },

  /** 烧录字幕到视频 */
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

  /** Whisper 语音转字幕（Rust faster-whisper） */
  async transcribeAudio(
    audioPath: string,
    modelSize?: string,
    language?: string,
  ) {
    return invoke(TauriCommand.TRANSCRIBE_AUDIO, {
      audio_path: audioPath,
      model_size: modelSize,
      language,
    }) as Promise<{
      language: string;
      language_probability: number;
      duration_ms: number;
      segments: Array<{ start_ms: number; end_ms: number; text: string }>;
    }>;
  },

  /** 列出本地已下载的 Whisper 模型 */
  async listWhisperModels() {
    return invoke(TauriCommand.LIST_WHISPER_MODELS, {}) as Promise<
      Array<{ name: string; size: string; is_downloaded: boolean; path: string | null }>
    >;
  },

  /** 检查 faster-whisper 是否可用 */
  async checkFasterWhisper() {
    return invoke(TauriCommand.CHECK_FASTER_WHISPER, {}) as Promise<boolean>;
  },

  /** 下载指定大小的 Whisper 模型 */
  async downloadWhisperModel(modelSize: string) {
    return invoke(TauriCommand.DOWNLOAD_WHISPER_MODEL, {
      model_size: modelSize,
    }) as Promise<string>;
  },

  /** 获取 Whisper 支持的语言列表 */
  async getWhisperLanguages() {
    return invoke(TauriCommand.GET_WHISPER_LANGUAGES, {}) as Promise<
      Array<{ code: string; name: string }>
    >;
  },

  // ── TTS ─────────────────────────────────────────────────────────

  /** 语音合成 */
  async synthesizeSpeech(input: Record<string, unknown>) {
    return invoke(TauriCommand.SYNTHESIZE_SPEECH, { input }) as Promise<string>;
  },

  /** 列出可用的 TTS 后端 */
  async listTTSBackends() {
    return invoke(TauriCommand.LIST_TTS_BACKENDS, {}) as Promise<
      Array<{ id: string; name: string; voices: unknown[] }>
    >;
  },

  /** 检查 TTS 是否可用 */
  async checkTTSAvailable() {
    return invoke(TauriCommand.CHECK_TTS_AVAILABLE, {}) as Promise<boolean>;
  },

  async mixAudio(options: {
    videoPath: string;
    ttsAudioPath: string;
    outputPath: string;
    ttsVolume?: number;
    backgroundVolume?: number;
    offsetSeconds?: number;
  }): Promise<string> { return invoke(TauriCommand.MIX_AUDIO, options) as Promise<string>; },

  async getAudioDuration(audioPath: string): Promise<number> { return invoke(TauriCommand.GET_AUDIO_DURATION, { audioPath }) as Promise<number>; },

  // ── AI Director ────────────────────────────────────────────────

  /** AI 导演计划 */
  async runAIDirectorPlan(input: Record<string, unknown>) {
    return invoke(TauriCommand.RUN_AI_DIRECTOR_PLAN, { input });
  },

  // ── Translate ───────────────────────────────────────────────────

  /** 翻译文本 */
  async translateText(text: string, fromLang: string, toLang: string) {
    return invoke(TauriCommand.TRANSLATE_TEXT, {
      text,
      from_lang: fromLang,
      to_lang: toLang,
    }) as Promise<string>;
  },

  // ── File operations ─────────────────────────────────────────────

  /** 读取文本文件 */
  async readTextFile(path: string) {
    return invoke(TauriCommand.FILE_READ, { path }) as Promise<string>;
  },

  /** 写入文本文件 */
  async writeTextFile(path: string, content: string) {
    return invoke(TauriCommand.FILE_WRITE, { path, content }) as Promise<void>;
  },

  /** 删除文件 */
  async deleteFile(path: string) {
    return invoke(TauriCommand.FILE_DELETE, { path }) as Promise<void>;
  },

  /** 清理临时文件 */
  async cleanTempFile(path: string) {
    return invoke(TauriCommand.CLEAN_TEMP_FILE, { path }) as Promise<void>;
  },

  /** 用系统默认应用打开文件 */
  async openFile(path: string) {
    return invoke(TauriCommand.OPEN_FILE, { path }) as Promise<void>;
  },

  /** 获取文件大小（字节） */
  async getFileSize(path: string) {
    return invoke(TauriCommand.GET_FILE_SIZE, { path }) as Promise<number>;
  },

  /** 语音发现（枚举可用 TTS 引擎） */
  async voiceDiscovery() {
    return invoke(TauriCommand.VOICE_DISCOVERY, {});
  },

  // ── Project ─────────────────────────────────────────────────────

  /** 获取导出目录 */
  async getExportDir() {
    return invoke(TauriCommand.GET_EXPORT_DIR, {}) as Promise<string>;
  },

  /** 保存项目文件 */
  async saveProject(projectId: string, content: string) {
    return invoke(TauriCommand.PROJECT_SAVE, { projectId, content }) as Promise<void>;
  },

  /** 加载项目文件 */
  async loadProject(projectId: string) {
    return invoke(TauriCommand.PROJECT_LOAD, { projectId }) as Promise<string>;
  },

  /** 删除项目文件 */
  async deleteProject(projectId: string) {
    return invoke(TauriCommand.PROJECT_DELETE, { projectId }) as Promise<void>;
  },

  /** 列出所有项目 */
  async listProjects() {
    return invoke(TauriCommand.PROJECT_LIST, {}) as Promise<unknown[]>;
  },

  /** 列出应用数据目录中的文件 */
  async listAppDataFiles(directory: string) {
    return invoke(TauriCommand.LIST_APP_DATA_FILES, { directory }) as Promise<string[]>;
  },

  /** 检查应用数据目录是否存在 */
  async checkAppDataDir() {
    return invoke(TauriCommand.CHECK_APP_DATA_DIR, {}) as Promise<string>;
  },

  // ── Render / Transcode ─────────────────────────────────────────

  /** 通用视频导出（支持字幕烧录） */
  async exportVideo(input: {
    inputPath: string;
    outputPath: string;
    format?: string;
    resolution?: string;
    frameRate?: number;
    videoCodec?: string;
    audioCodec?: string;
    crf?: number;
    subtitleEnabled?: boolean;
    subtitlePath?: string;
    burnSubtitles?: boolean;
  }) {
    return invoke(
      TauriCommand.EXPORT_VIDEO,
      {
        inputPath: input.inputPath,
        outputPath: input.outputPath,
        format: input.format,
        resolution: input.resolution,
        frameRate: input.frameRate,
        videoCodec: input.videoCodec,
        audioCodec: input.audioCodec,
        crf: input.crf,
        subtitleEnabled: input.subtitleEnabled,
        subtitlePath: input.subtitlePath,
        burnSubtitles: input.burnSubtitles,
      }
    ) as Promise<{ outputPath: string; duration: number; fileSize: number }>;
  },

  // ── Export state ────────────────────────────────────────────────

  /** 取消正在进行的导出 */
  async cancelExport(exportId: string) {
    return invoke(TauriCommand.CANCEL_EXPORT, { exportId }) as Promise<void>;
  },

  // ── LLM / AI Script Generation ────────────────────────────────────

  /**
   * 生成解说脚本
   * @param input — 包含 model_id, api_key, video_path, analysis, options
   */
  async generateNarrationScript(input: {
    modelId: string;
    apiKey: string;
    videoPath: string;
    analysis: string;
    options?: {
      style?: string;
      tone?: string;
      language?: string;
      maxWords?: number;
    };
  }) {
    return invoke(TauriCommand.GENERATE_NARRATION_SCRIPT, { input }) as Promise<{
      script: string;
      segments: Array<{ start_ms: number; end_ms: number; text: string }>;
      model: string;
      tokens_used: number;
    }>;
  },

  /**
   * 分析视频内容为解说生成做准备
   * @param input — 包含 model_id, api_key, video_path, analysis_hints
   */
  async analyzeVideoForNarration(input: {
    modelId: string;
    apiKey: string;
    videoPath: string;
    analysisHints?: string[];
  }) {
    return invoke(TauriCommand.ANALYZE_VIDEO_FOR_NARRATION, { input }) as Promise<{
      summary: string;
      keyPoints: string[];
      suggestedTone: string;
      estimatedDurationSec: number;
      sceneDescriptions: Array<{ start_ms: number; end_ms: number; description: string }>;
    }>;
  },

  /** 列出当前 API Key 可用的模型 */
  async listAvailableModels(apiKeys: Record<string, string>) {
    return invoke(TauriCommand.LIST_AVAILABLE_MODELS, { apiKeys }) as Promise<
      Array<{ id: string; name: string; provider: string; isAvailable: boolean }>
    >;
  },
};

export default tauri;
