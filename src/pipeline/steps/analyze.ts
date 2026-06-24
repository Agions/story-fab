/**
 * 步骤 2: 智能分析
 * VideoInfo → AnalysisResult（场景检测 + 关键帧提取 + 音频分析）
 */

import type { PipelineStep, PipelineDataContext } from '../engine';
import type { VideoInfo, AnalysisResult, Scene, Keyframe } from '@/types';
import { videoProcessor } from '@/core/video';
import { invoke, TauriCommand } from '@/core/tauri';

export const analyzeStep: PipelineStep<VideoInfo, AnalysisResult> = {
  name: 'analyze',

  validate(input) {
    if (!input?.path) {
      return { valid: false, reason: '视频信息不完整' };
    }
    return { valid: true };
  },

  async execute(videoInfo: VideoInfo, _ctx: PipelineDataContext): Promise<AnalysisResult> {
    // 并行执行场景检测、关键帧提取、音频分析
    const [scenes, keyframes, audioPeaks] = await Promise.all([
      detectScenes(videoInfo.path),
      videoProcessor.extractKeyFrames(videoInfo.path, { maxFrames: 20 }),
      detectAudioPeaks(videoInfo.path),
    ]);

    // 转换关键帧格式
    const formattedKeyframes: Keyframe[] = keyframes.map(kf => ({
      id: kf.id,
      timestamp: kf.timestamp,
      imageUrl: kf.path,
      description: kf.description,
    }));

    // 构建分析结果
    const result: AnalysisResult = {
      scenes,
      keyframes: formattedKeyframes,
      objects: [], // 对象检测可后续添加
      emotions: audioPeaks.map(peak => ({
        timestamp: peak.timestamp,
        emotion: peak.type,
        intensity: peak.score,
      })),
      stats: {
        totalDuration: videoInfo.duration,
        sceneCount: scenes.length,
        keyframeCount: formattedKeyframes.length,
        objectCount: 0,
      },
    };

    return result;
  },
};

// ─── 辅助函数 ───

async function detectScenes(videoPath: string): Promise<Scene[]> {
  try {
    const result = await invoke(TauriCommand.DETECT_HIGHLIGHTS, {
      videoPath,
      threshold: 0.3,
      minDurationMs: 1000,
    });

    if (Array.isArray(result)) {
      return result.map((h: any, i: number) => ({
        id: `scene_${i}`,
        startTime: h.startMs / 1000,
        endTime: h.endMs / 1000,
        type: 'action' as const,
        score: h.score,
        description: h.reason,
      }));
    }

    return [];
  } catch {
    return [];
  }
}

async function detectAudioPeaks(videoPath: string): Promise<Array<{ timestamp: number; score: number; type: string }>> {
  try {
    const result = await invoke(TauriCommand.DETECT_HIGHLIGHTS, {
      videoPath,
      threshold: 0.5,
      minDurationMs: 500,
    });

    if (Array.isArray(result)) {
      return result.map((h: any) => ({
        timestamp: h.startMs / 1000,
        score: h.audioScore ?? h.score,
        type: 'speech',
      }));
    }

    return [];
  } catch {
    return [];
  }
}
