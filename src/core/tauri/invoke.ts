import { invoke as tauriInvoke } from '@tauri-apps/api/core';

// ============================================================
// 命令名称常量（与 Rust 端保持一致）
// ============================================================
export const TauriCommand = {
  CHECK_FFMPEG:             'check_ffmpeg',
  ANALYZE_VIDEO:            'analyze_video',
  GET_EXPORT_DIR:          'get_export_dir',
  RUN_FFPROBE:             'run_ffprobe',

  DETECT_HIGHLIGHTS:       'detect_highlights',
  DETECT_ZCR_BURSTS:       'detect_zcr_bursts',
  DETECT_SMART_SEGMENTS:   'detect_smart_segments',

  EXPORT_VIDEO:            'export_video',
  TRANSCODE_WITH_CROP:     'transcode_with_crop',
  AUTONOMOUS_RENDER:       'render_autonomous_cut',
  GENERATE_PREVIEW:        'generate_preview',
  CUT_VIDEO:               'cut_video',

  SUBTITLE_EXTRACT:        'subtitle_extract',
  SUBTITLE_BURN_IN:        'subtitle_burn_in',
  TRANSCRIBE_AUDIO:        'transcribe_audio',
  LIST_WHISPER_MODELS:     'list_whisper_models',
  CHECK_FASTER_WHISPER:    'check_faster_whisper',
  DOWNLOAD_WHISPER_MODEL:  'download_whisper_model',
  GET_WHISPER_LANGUAGES:   'get_whisper_supported_languages',

  SYNTHESIZE_SPEECH:       'synthesize_speech',
  LIST_TTS_BACKENDS:       'list_tts_backends',
  CHECK_TTS_AVAILABLE:     'check_tts_available',
  MIX_AUDIO:               'mix_audio',
  GET_AUDIO_DURATION:      'get_audio_duration',

  RUN_AI_DIRECTOR_PLAN:   'run_ai_director_plan',

  TRANSLATE_TEXT:          'translate_text',

  FILE_READ:               'read_text_file',
  FILE_WRITE:              'write_text_file',
  FILE_DELETE:             'delete_file',
  FILE_EXISTS:             'file_exists',
  CLEAN_TEMP_FILE:         'clean_temp_file',
  OPEN_FILE:               'open_file',
  VOICE_DISCOVERY:         'voice_discovery',
  GET_FILE_SIZE:           'get_file_size',

  PROJECT_LOAD:            'load_project_file',
  PROJECT_SAVE:            'save_project_file',
  PROJECT_DELETE:          'delete_project_file',
  PROJECT_LIST:            'list_project_files',
  LIST_APP_DATA_FILES:     'list_app_data_files',
  CHECK_APP_DATA_DIR:      'check_app_data_directory',

  WINDOW_MINIMIZE:         'window_minimize',
  WINDOW_MAXIMIZE:         'window_maximize',
  WINDOW_CLOSE:            'window_close',

  CANCEL_EXPORT:           'cancel_export',

  GENERATE_NARRATION_SCRIPT:   'generate_narration_script',
  ANALYZE_VIDEO_FOR_NARRATION: 'analyze_video_for_narration',
  LIST_AVAILABLE_MODELS:       'list_available_models',

  EXTRACT_KEY_FRAMES:    'extract_key_frames',
  GENERATE_THUMBNAIL:    'generate_thumbnail',
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
  retries?: number;
  signal?: AbortSignal;
}

// ============================================================
// 核心调用函数
// ============================================================

async function executeWithRetry<C extends string>(
  command: C,
  args: Record<string, unknown>,
  retries: number,
  signal: AbortSignal | undefined,
): Promise<unknown> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) {
      throw TauriBridgeError.fromInvoke(command as TauriCommand, new Error('Request aborted'));
    }

    try {
      return await tauriInvoke(command, args);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }
  }

  throw TauriBridgeError.fromInvoke(command as TauriCommand, lastError);
}

/** Raw invoke without TauriCommand restriction — for commentary/Rust-only commands */
export async function rawInvoke<C extends string>(
  command: C,
  args?: Record<string, unknown>,
): Promise<unknown> {
  return executeWithRetry(command, args ?? {}, 0, undefined);
}

export async function invoke<C extends TauriCommand>(
  command: C,
  args?: Record<string, unknown>,
  options?: BridgeOptions,
): Promise<unknown> {
  const { retries = 0, signal } = options ?? {};
  return executeWithRetry(command, args ?? {}, retries, signal);
}
