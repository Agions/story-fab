/**
 * 步骤 4: 语音合成
 * Script → VoiceTrackData（TTS 合成）
 */

import type { PipelineStep, PipelineDataContext, VoiceTrackData } from '../engine';
import type { Script } from '@/types';
import { tts } from '@/core/tauri/methods/tts';

export interface VoiceStepConfig {
  voice?: string;
  speed?: number;
  pitch?: number;
}

export const createVoiceStep = (config: VoiceStepConfig): PipelineStep<Script, VoiceTrackData> => ({
  name: 'voice',

  validate(input) {
    if (!input?.segments?.length) {
      return { valid: false, reason: '脚本片段为空' };
    }
    return { valid: true };
  },

  async execute(script: Script, _ctx: PipelineDataContext): Promise<VoiceTrackData> {
    const {
      voice = 'zh-CN-XiaoxiaoNeural',
      speed = 1.0,
      pitch = 1.0,
    } = config;

    const segments: VoiceTrackData['segments'] = [];

    // 逐段合成语音
    for (const segment of script.segments) {
      const text = segment.content ?? segment.text ?? '';
      if (!text.trim()) continue;

      const audioPath = await synthesizeSegment(text, voice, speed, pitch);

      segments.push({
        text,
        startTime: segment.startTime,
        endTime: segment.endTime,
        audioPath,
      });
    }

    // 计算总时长
    const duration = segments.reduce((acc, seg) => {
      return Math.max(acc, seg.endTime);
    }, 0);

    return {
      audioPath: segments[0]?.audioPath ?? '',
      duration,
      segments,
    };
  },
});

// ─── 辅助函数 ───

async function synthesizeSegment(
  text: string,
  voice: string,
  speed: number,
  pitch: number,
): Promise<string> {
  try {
    const result = await tts.synthesizeSpeech({
      text,
      voice,
      rate: speed,
      pitch,
      format: 'mp3',
    });

    return (result as any)?.audioPath ?? '';
  } catch (err) {
    console.error('TTS synthesis failed:', err);
    return '';
  }
}
