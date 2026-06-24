/**
 * 步骤 5: 视频合成
 * { Script, VoiceTrackData, VideoInfo } → ComposedVideoData
 */

import type { PipelineStep, PipelineDataContext, ComposedVideoData, VoiceTrackData } from '../engine';
import type { Script, VideoInfo } from '@/types';
import { invoke, TauriCommand } from '@/core/tauri';

export interface ComposeInput {
  script: Script;
  voiceTrack: VoiceTrackData;
  videoMeta: VideoInfo;
}

export interface ComposeStepConfig {
  burnSubtitles?: boolean;
  mixAudio?: boolean;
}

export const createComposeStep = (config: ComposeStepConfig = {}): PipelineStep<ComposeInput, ComposedVideoData> => ({
  name: 'compose',

  validate(input) {
    if (!input?.script?.segments?.length) {
      return { valid: false, reason: '脚本为空' };
    }
    if (!input?.videoMeta?.path) {
      return { valid: false, reason: '视频路径为空' };
    }
    return { valid: true };
  },

  async execute(input: ComposeInput, ctx: PipelineDataContext): Promise<ComposedVideoData> {
    const { script, voiceTrack, videoMeta } = input;
    const { burnSubtitles = true, mixAudio = true } = config;

    // 1. 生成字幕文件（如果需要）
    let subtitlePath: string | undefined;
    if (burnSubtitles) {
      subtitlePath = await generateSubtitles(script, ctx.projectId);
    }

    // 2. 混合音频（如果需要）
    let outputPath = videoMeta.path;
    if (mixAudio && voiceTrack.audioPath) {
      outputPath = await mixAudioTrack(videoMeta.path, voiceTrack.audioPath, ctx.projectId);
    }

    // 3. 烧录字幕（如果需要）
    if (burnSubtitles && subtitlePath) {
      outputPath = await burnSubtitle(outputPath, subtitlePath, ctx.projectId);
    }

    return {
      videoPath: outputPath,
      duration: videoMeta.duration,
      hasSubtitles: burnSubtitles,
      hasVoiceover: mixAudio,
    };
  },
});

// ─── 辅助函数 ───

async function generateSubtitles(script: Script, projectId: string): Promise<string> {
  // 生成 SRT 格式字幕
  const srtContent = script.segments
    .map((seg, index) => {
      const startTime = formatSrtTime(seg.startTime);
      const endTime = formatSrtTime(seg.endTime);
      const text = seg.content ?? seg.text ?? '';
      return `${index + 1}\n${startTime} --> ${endTime}\n${text}\n`;
    })
    .join('\n');

  // 保存字幕文件
  const subtitlePath = `/tmp/storyfab_${projectId}_subtitles.srt`;
  await invoke(TauriCommand.FILE_WRITE, { path: subtitlePath, content: srtContent });

  return subtitlePath;
}

async function mixAudioTrack(videoPath: string, audioPath: string, projectId: string): Promise<string> {
  const outputPath = `/tmp/storyfab_${projectId}_mixed.mp4`;

  try {
    await invoke(TauriCommand.MIX_AUDIO, {
      videoPath,
      audioPath,
      outputPath,
      replace: false, // 混合而非替换
    });
    return outputPath;
  } catch {
    return videoPath;
  }
}

async function burnSubtitle(videoPath: string, subtitlePath: string, projectId: string): Promise<string> {
  const outputPath = `/tmp/storyfab_${projectId}_subtitled.mp4`;

  try {
    await invoke(TauriCommand.SUBTITLE_BURN_IN, {
      videoPath,
      subtitlePath,
      outputPath,
    });
    return outputPath;
  } catch {
    return videoPath;
  }
}

function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
}

function pad(num: number, length: number = 2): string {
  return num.toString().padStart(length, '0');
}
