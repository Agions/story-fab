import { invoke, TauriCommand } from '../invoke';

export const subtitleAsr = {
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
};