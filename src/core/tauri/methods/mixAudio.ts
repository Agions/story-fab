import { invoke, TauriCommand } from '../TauriBridge';

export const mixAudio = {
  /** 混音 TTS 配音与原视频音轨 */
  async mix(options: {
    videoPath: string;
    ttsAudioPath: string;
    outputPath: string;
    ttsVolume?: number;
    backgroundVolume?: number;
    offsetSeconds?: number;
  }): Promise<string> {
    return invoke(TauriCommand.MIX_AUDIO, {
      videoPath: options.videoPath,
      ttsAudioPath: options.ttsAudioPath,
      outputPath: options.outputPath,
      ttsVolume: options.ttsVolume ?? 1.0,
      backgroundVolume: options.backgroundVolume ?? 0.3,
      offsetSeconds: options.offsetSeconds ?? 0,
    }) as Promise<string>;
  },

  /** 获取音频时长 */
  async getDuration(audioPath: string): Promise<number> {
    return invoke(TauriCommand.GET_AUDIO_DURATION, { audioPath }) as Promise<number>;
  },
};