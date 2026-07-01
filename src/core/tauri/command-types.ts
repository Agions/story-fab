/**
 * Tauri Commands Type Definitions
 *
 * 为所有 48 个 Tauri 命令提供类型安全的输入/输出定义
 * Phase 3 Task 1: Tauri invoke 泛型化
 *
 * 注意：字段名使用 camelCase 以匹配 TypeScript 代码约定
 * Tauri 会自动在 TS 和 Rust 之间转换命名
 */

import type { VideoInfo } from '@/types';
import type { SubtitleTrack } from '@/types';
import type { DirectorPlan } from '@/types';
import type { CommentaryScriptOutput } from '@/types';

// ============================================================
// 辅助类型：将命令字符串值映射到对应的输入/输出类型
// ============================================================

type CommandNameToDefs = {
  check_ffmpg: { input: void; output: boolean };
  analyze_video: { input: { path: string; duration?: number }; output: VideoInfo };
  get_export_dir: { input: void; output: string };
  run_ffprobe: { input: { path: string }; output: Record<string, unknown> };

  detect_highlights: { input: { videoPath: string; threshold?: number; minDurationMs?: number }; output: Array<{ startMs: number; endMs: number; score: number; reason: string }> };
  detect_zcr_bursts: { input: { videoPath: string }; output: Array<{ timestamp: number; intensity: number }> };
  detect_smart_segments: { input: { videoPath: string }; output: Array<{ startMs: number; endMs: number; type: string }> };

  export_video: { input: { inputPath: string; outputPath: string; format: string; resolution?: string; frameRate?: number; videoCodec?: string; audioCodec?: string; crf?: number; subtitleEnabled?: boolean; subtitlePath?: string; burnSubtitles?: boolean }; output: { outputPath: string; duration: number; fileSize: number } };
  transcode_with_crop: { input: { inputPath: string; outputPath: string; crop?: { x: number; y: number; width: number; height: number } }; output: { outputPath: string } };
  render_autonomous_cut: { input: { videoPath: string; segments: Array<{ start: number; end: number }>; outputPath: string }; output: { outputPath: string; duration: number } };
  generate_preview: { input: { videoPath: string; startTime: number; duration: number }; output: { previewPath: string } };
  cut_video: { input: { inputPath: string; outputPath: string; startTime: number; endTime: number }; output: { outputPath: string } };

  subtitle_extract: { input: { videoPath: string; language?: string }; output: SubtitleTrack };
  subtitle_burn_in: { input: { videoPath: string; subtitlePath: string; outputPath: string }; output: { outputPath: string } };
  transcribe_audio: { input: { audioPath: string; modelSize?: string; language?: string }; output: SubtitleTrack };
  list_whisper_models: { input: void; output: string[] };
  check_faster_whisper: { input: void; output: boolean };
  download_whisper_model: { input: { modelSize: string }; output: { success: boolean; path?: string } };
  get_whisper_supported_languages: { input: void; output: string[] };

  synthesize_speech: { input: { text: string; voice: string; speed?: number; format?: string; backend?: string }; output: string };
  list_tts_backends: { input: void; output: Array<{ id: string; name: string; voices: number }> };
  check_tts_available: { input: void; output: boolean };
  mix_audio: { input: { videoPath: string; audioPath: string; outputPath: string; replace?: boolean }; output: { outputPath: string } };
  get_audio_duration: { input: { audioPath: string }; output: number };

  run_ai_director_plan: { input: { sessionId: string; plan: DirectorPlan }; output: { success: boolean } };

  translate_text: { input: { text: string; fromLang: string; toLang: string }; output: string };

  read_text_file: { input: { path: string }; output: string };
  write_text_file: { input: { path: string; content: string }; output: void };
  delete_file: { input: { path: string }; output: boolean };
  file_exists: { input: { path: string }; output: boolean };
  clean_temp_file: { input: { path: string }; output: void };
  open_file: { input: { path: string }; output: void };
  voice_discovery: { input: void; output: string[] };
  get_file_size: { input: { path: string }; output: number };

  load_project_file: { input: { path: string }; output: unknown };
  save_project_file: { input: { path: string; data: unknown }; output: boolean };
  delete_project_file: { input: { path: string }; output: boolean };
  list_project_files: { input: { dirPath?: string }; output: string[] };
  list_app_data_files: { input: void; output: string[] };
  check_app_data_directory: { input: void; output: boolean };

  window_minimize: { input: void; output: void };
  window_maximize: { input: void; output: void };
  window_close: { input: void; output: void };

  cancel_export: { input: { exportId: string }; output: void };

  generate_narration_script: { input: { subtitles: string; style?: string; apiKey: string; provider?: string }; output: CommentaryScriptOutput };
  analyze_video_for_narration: { input: { videoPath: string; duration?: number }; output: { summary: string; highlights: string[] } };
  list_available_models: { input: void; output: Array<{ id: string; name: string; provider: string }> };

  extract_key_frames: { input: { videoPath: string; maxFrames?: number }; output: Array<{ path: string; timestamp: number; description: string }> };
  generate_thumbnail: { input: { videoPath: string; timestamp: number; outputPath: string }; output: { path: string } };
}

// 提取所有命令名称的联合类型
export type TauriCommandName = keyof CommandNameToDefs;

// 提取每个命令的输入类型（如果 void 则为 undefined）
export type TauriCommandInput<C extends TauriCommandName> = CommandNameToDefs[C]['input'] extends void ? undefined : CommandNameToDefs[C]['input'];

// 提取每个命令的输出类型
export type TauriCommandOutput<C extends TauriCommandName> = CommandNameToDefs[C]['output'];
