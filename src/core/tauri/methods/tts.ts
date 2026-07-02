import { invoke, TauriCommand } from '../invoke';

export const tts = {
  /** 语音合成，返回生成的音频路径 */
  async synthesizeSpeech(input: { text: string; voice: string; speed?: number; format?: string; backend?: string }): Promise<string> {
    const { audioPath } = await invoke(TauriCommand.SYNTHESIZE_SPEECH, input);
    return audioPath;
  },

  /** 列出可用的 TTS 后端 */
  async listTTSBackends() {
    return invoke(TauriCommand.LIST_TTS_BACKENDS, undefined);
  },

  /** 检查 TTS 是否可用 */
  async checkTTSAvailable(): Promise<boolean> {
    return invoke(TauriCommand.CHECK_TTS_AVAILABLE, undefined);
  },
};
