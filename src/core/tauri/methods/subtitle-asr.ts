import { invoke, TauriCommand } from '../invoke';
import type { SubtitleTrack } from '@/types';

export const subtitleAsr = {
  /** 转录音频 */
  async transcribeAudio(options: { audioPath: string; modelSize?: string; language?: string }): Promise<SubtitleTrack> {
    return invoke(TauriCommand.TRANSCRIBE_AUDIO, options) as Promise<SubtitleTrack>;
  },

  /** 翻译文本 */
  async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    return invoke(TauriCommand.TRANSLATE_TEXT, { text, fromLang, toLang }) as Promise<string>;
  },
};
