import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import type {
  TauriCommandName,
  TauriCommandOutput,
} from './command-types';
import type {
  CommentaryPipelineInput,
  CommentaryPipelineOutput,
} from '@/types';

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

  TRANSCRIBE_AUDIO:        'transcribe_audio',

  SYNTHESIZE_SPEECH:       'synthesize_speech',
  LIST_TTS_BACKENDS:       'list_tts_backends',
  CHECK_TTS_AVAILABLE:     'check_tts_available',
  MIX_AUDIO:               'mix_audio',
  GET_AUDIO_DURATION:      'get_audio_duration',

  RUN_AI_DIRECTOR_PLAN:   'run_ai_director_plan',

  TRANSLATE_TEXT:          'translate_text',

  FILE_READ:               'read_text_file',
  FILE_DELETE:             'delete_file',
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

  CANCEL_EXPORT:           'cancel_export',

  GENERATE_NARRATION_SCRIPT:   'generate_narration_script',
  ANALYZE_VIDEO_FOR_NARRATION: 'analyze_video_for_narration',
  LIST_AVAILABLE_MODELS:       'list_available_models',

  // Commentary Director
  CREATE_DIRECTOR_SESSION:     'create_director_session',
  GET_DIRECTOR_STATUS:         'get_director_status',
  START_DIRECTOR_ANALYSIS:     'start_director_analysis',
  GENERATE_DIRECTOR_PLAN:      'generate_director_plan',
  APPROVE_DIRECTOR_PLAN:       'approve_director_plan',
  REVISE_DIRECTOR_PLAN:        'revise_director_plan',
  COMPLETE_DIRECTOR_RENDER:    'complete_director_render',
  DESTROY_DIRECTOR_SESSION:    'destroy_director_session',

  // Commentary Script Generator
  GENERATE_COMMENTARY_SCRIPT:  'generate_commentary_script',

  // Commentary Synthesizer
  SYNTHESIZE_COMMENTARY_AUDIO: 'synthesize_commentary_audio',
  ESTIMATE_TTS_DURATION:       'estimate_tts_duration',
  LIST_COMMENTARY_VOICES:      'list_commentary_voices',

  // Commentary Pipeline Orchestrator
  RUN_COMMENTARY_PIPELINE:     'run_commentary_pipeline',

  // Auto-save
  AUTO_SAVE_PROJECT:       'auto_save_project',
  CLEAR_AUTOSAVE:          'clear_autosave',
  LIST_RECOVERABLE_PROJECTS: 'list_recoverable_projects',
  RECOVER_AUTOSAVE:        'recover_autosave',
  PREVIEW_AUTOSAVE:        'preview_autosave',

  // Crash recovery
  LIST_CRASHES:            'list_crashes',
  READ_CRASH:              'read_crash',
  DELETE_CRASH:            'delete_crash',
  CLEAR_CRASHES:           'clear_crashes',
} as const;

// 命令名称类型（与 command-types.ts 中的 TauriCommandName 保持一致）
export type TauriCommand = TauriCommandName;

// ============================================================
// 错误类型 — 分类 kind 便于上层针对性处理
// ============================================================

/**
 * Tauri 调用错误分类：
 * - timeout:    命令执行超时（可重试）
 * - ipc-error:  Rust 端返回错误（部分可重试）
 * - deserialize: 响应数据反序列化失败（参数不匹配等，通常不可重试）
 * - aborted:    显式 AbortSignal 触发（按需重试）
 * - unknown:    其他未分类错误
 */
export type TauriErrorKind = 'timeout' | 'ipc-error' | 'deserialize' | 'aborted' | 'unknown';

export class TauriBridgeError extends Error {
  constructor(
    message: string,
    public readonly command: TauriCommand,
    public readonly kind: TauriErrorKind = 'unknown',
    public readonly cause?: unknown,
    public readonly retryable = false,
  ) {
    super(message);
    this.name = 'TauriBridgeError';
  }

  static fromInvoke(command: TauriCommand, error: unknown, kind?: TauriErrorKind): TauriBridgeError {
    if (error instanceof TauriBridgeError) return error;

    if (error instanceof Error) {
      const detectedKind = kind ?? detectKindFromError(error);
      const isRetryable = computeRetryable(detectedKind, error);
      return new TauriBridgeError(
        `Tauri invoke '${command}' failed: ${error.message}`,
        command,
        detectedKind,
        error,
        isRetryable,
      );
    }
    return new TauriBridgeError(
      `Tauri invoke '${command}' failed: ${String(error)}`,
      command,
      kind ?? 'unknown',
      error,
      false,
    );
  }
}

function detectKindFromError(error: Error): TauriErrorKind {
  const msg = error.message.toLowerCase();
  if (msg.includes('aborted') || msg.includes('abort')) return 'aborted';
  if (msg.includes('timeout') || msg.includes('timed out')) return 'timeout';
  if (
    msg.includes('deserialize') ||
    msg.includes('json') ||
    msg.includes('serde') ||
    msg.includes('invalid type')
  ) {
    return 'deserialize';
  }
  return 'ipc-error';
}

function computeRetryable(kind: TauriErrorKind, error: Error): boolean {
  if (kind === 'timeout' || kind === 'aborted') return true;
  if (kind === 'deserialize') return false;
  // ipc-error: 部分消息暗示可重试
  const msg = error.message.toLowerCase();
  return msg.includes('busy') || msg.includes('temporary') || msg.includes('try again');
}

// ============================================================
// Bridge 配置
// ============================================================

/** 默认单次调用超时 30 秒（适用于绝大多数 IPC；重型操作应在 options 显式覆盖） */
export const DEFAULT_TIMEOUT_MS = 30_000;

export interface BridgeOptions {
  retries?: number;
  signal?: AbortSignal;
  /** 单次调用超时（毫秒），默认 30000 */
  timeoutMs?: number;
}

// ============================================================
// Helpers
// ============================================================

function normalizeArgs(
  args: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (args && Object.keys(args).length > 0) return args;
  return {};
}

/**
 * 为 Promise 附加超时。超时后会 reject 一个 TauriBridgeError(kind='timeout')。
 * 原 Promise 继续运行（不取消），由 Rust 端或 GC 自然清理 — Tauri invoke 不支持中途取消。
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  command: TauriCommand,
): Promise<T> {
  if (ms <= 0) return promise;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(
        TauriBridgeError.fromInvoke(
          command as TauriCommand,
          new Error(`Tauri invoke '${command}' timed out after ${ms}ms`),
          'timeout',
        ),
      );
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

// ============================================================
// 核心调用函数
// ============================================================

/**
 * 类型安全的 Tauri invoke
 * 自动推断输入和输出类型
 *
 * @param command 命令名称
 * @param args 命令参数（建议使用命令特定的参数类型）
 * @param options 可选配置（retries / signal / timeoutMs）
 * @returns 命令执行结果
 */
export async function invoke<C extends TauriCommandName>(
  command: C,
  args: Record<string, unknown> = {},
  options?: BridgeOptions,
): Promise<TauriCommandOutput<C>> {
  const { retries = 0, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = options ?? {};
  return executeWithRetry(command, normalizeArgs(args), retries, signal, timeoutMs);
}

/**
 * 一键执行解说流水线（导演规划 + 脚本生成 + 配音合成）
 */
export async function runCommentaryPipeline(
  input: CommentaryPipelineInput,
): Promise<CommentaryPipelineOutput> {
  const payload: CommentaryPipelineInput = {
    ...input,
    autoApprove: true,
  };

  return invoke(TauriCommand.RUN_COMMENTARY_PIPELINE, payload as unknown as Record<string, unknown>) as Promise<CommentaryPipelineOutput>;
}

async function executeWithRetry<C extends TauriCommandName>(
  command: C,
  args: Record<string, unknown>,
  retries: number,
  signal: AbortSignal | undefined,
  timeoutMs: number,
): Promise<TauriCommandOutput<C>> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal && signal.aborted) {
      throw TauriBridgeError.fromInvoke(
        command as TauriCommand,
        new Error('Request aborted before attempt'),
        'aborted',
      );
    }

    try {
      return await withTimeout(
        tauriInvoke(command, args) as Promise<TauriCommandOutput<C>>,
        timeoutMs,
        command as TauriCommand,
      );
    } catch (error) {
      lastError = error;

      // 已分类的 timeout/aborted 不重试（重试会重新计时但可能立刻再次超时）
      if (error instanceof TauriBridgeError && (error.kind === 'timeout' || error.kind === 'aborted')) {
        throw error;
      }
      // deserialize 错误不重试（参数不匹配，重试无意义）
      if (error instanceof TauriBridgeError && error.kind === 'deserialize') {
        throw error;
      }

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 500));
      }
    }
  }

  throw TauriBridgeError.fromInvoke(command as TauriCommand, lastError);
}
