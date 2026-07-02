import { invoke, TauriCommand } from '../invoke';
import type { SubtitleTrack } from '@/types';

export const subtitleAsr = {
  /** 提取字幕 */
  async extractSubtitles(options: { videoPath: string; language?: string }): Promise<SubtitleTrack> {
    return invoke(TauriCommand.SUBTITLE_EXTRACT, options) as Promise<SubtitleTrack>;
  },

  /** 烧录字幕到视频 */
  async burnInSubtitles(options: { videoPath: string; subtitlePath: string; outputPath: string }): Promise<string> {
    const result = await invoke(TauriCommand.SUBTITLE_BURN_IN, options);
    return (result as { outputPath: string }).outputPath;
  },

  /** 转录音频 */
  async transcribeAudio(options: { audioPath: string; modelSize?: string; language?: string }): Promise<SubtitleTrack> {
    return invoke(TauriCommand.TRANSCRIBE_AUDIO, options) as Promise<SubtitleTrack>;
  },
};
