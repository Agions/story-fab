import { invoke, TauriCommand } from '../TauriBridge';

export const tts = {
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
};