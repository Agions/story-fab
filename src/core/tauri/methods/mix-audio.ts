import { invoke, TauriCommand } from '../invoke';

export const mixAudio = {
  /** 混合 TTS 解说与视频原声，返回输出路径 */
  async mixAudio(options: {
    videoPath: string;
    ttsAudioPath: string;
    outputPath: string;
    ttsVolume?: number;
    backgroundVolume?: number;
    offsetSeconds?: number;
  }): Promise<string> {
    return invoke(TauriCommand.MIX_AUDIO, options);
  },

  /** 获取音频时长 */
  async getAudioDuration(audioPath: string): Promise<number> {
    return invoke(TauriCommand.GET_AUDIO_DURATION, { audioPath });
  },
};

