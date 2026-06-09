/**
 * 情感分析服务
 * 职责：视频场景的情感分析和情绪识别
 */

import type { Scene, EmotionAnalysis } from '@/core/types';
import { EMOTION_DIMENSIONS } from '../types';

// ============================================
// 情感分析服务
// ============================================

export class EmotionAnalysisService {
  /**
   * 分析场景情感
   * @param scenes 场景列表
   * @returns 情感分析结果列表
   */
  async analyzeEmotions(scenes: Scene[]): Promise<EmotionAnalysis[]> {
    return scenes.map((scene) => {
      const baseEmotions = [...EMOTION_DIMENSIONS];

      // 基于场景类型调整情感
      this.adjustEmotionsBySceneType(baseEmotions, scene.type);

      // 归一化
      const normalized = this.normalizeEmotions(baseEmotions);

      // 找出主导情感
      const dominant = this.findDominantEmotion(normalized);

      return {
        id: `emotion_${scene.id}`,
        sceneId: scene.id,
        timestamp: scene.startTime,
        emotions: normalized,
        dominant: dominant.id,
        intensity: dominant.score,
      };
    });
  }

  /**
   * 根据场景类型调整情感分数
   */
  private adjustEmotionsBySceneType(
    emotions: Array<{ id: string; score: number }>,
    sceneType: string
  ): void {
    const emotionMap: Record<string, Record<string, number>> = {
      intro: { excited: 0.7, positive: 0.6 },
      emotion: { excited: 0.8, positive: 0.5 },
      default: { neutral: 0.6, calm: 0.5 },
    };

    const adjustments = emotionMap[sceneType] || emotionMap.default;

    for (const emotion of emotions) {
      if (adjustments[emotion.id] !== undefined) {
        emotion.score = adjustments[emotion.id];
      }
    }
  }

  /**
   * 归一化情感分数
   */
  private normalizeEmotions(
    emotions: Array<{ id: string; name: string; score: number }>
  ): Array<{ id: string; name: string; score: number }> {
    const total = emotions.reduce((sum, e) => sum + e.score, 0);
    return emotions.map((e) => ({
      ...e,
      score: total > 0 ? e.score / total : 0.2,
    }));
  }

  /**
   * 找出主导情感
   */
  private findDominantEmotion(
    emotions: Array<{ id: string; score: number }>
  ): { id: string; score: number } {
    return emotions.reduce((max, e) => (e.score > max.score ? e : max));
  }

  /**
   * 获取情感统计
   * @param emotions 情感分析结果
   * @returns 主导情感计数
   */
  getDominantEmotionStats(emotions: EmotionAnalysis[]): Record<string, number> {
    return emotions.reduce((countsByEmotion, emotion) => {
      const emotionKey = emotion.dominant ?? 'neutral';
      countsByEmotion[emotionKey] = (countsByEmotion[emotionKey] || 0) + 1;
      return countsByEmotion;
    }, {} as Record<string, number>);
  }
}

// 导出单例
export const emotionAnalysisService = new EmotionAnalysisService();
