/**
 * 视频分析报告生成服务
 * 职责：整合场景、物体、情感数据生成分析报告
 */

import type {
  VideoInfo,
  Scene,
  ObjectDetection,
  EmotionAnalysis,
  VideoAnalysis,
} from '@/core/types';
import { formatDurationChinese } from '../../../../shared/utils/formatting';

// ============================================
// 报告生成服务
// ============================================

export class AnalysisReportService {
  /**
   * 生成视频分析报告
   * @param videoInfo 视频信息
   * @param scenes 场景列表
   * @param objects 物体检测结果
   * @param emotions 情感分析结果
   * @returns 完整的视频分析报告
   */
  async generateReport(
    videoInfo: VideoInfo,
    scenes: Scene[],
    objects: ObjectDetection[],
    emotions: EmotionAnalysis[]
  ): Promise<VideoAnalysis> {
    // 统计信息
    const sceneTypes = this.countSceneTypes(scenes);
    const objectCategories = this.countObjectCategories(objects);
    const dominantEmotions = this.countDominantEmotions(emotions);

    // 生成摘要
    const summary = this.generateSummary(videoInfo, sceneTypes, objectCategories, dominantEmotions);

    return {
      id: `analysis_${Date.now()}`,
      videoId: videoInfo.id,
      scenes,
      keyframes: scenes.map((s) => ({
        id: `kf_${s.id}`,
        timestamp: s.startTime,
        thumbnail: s.thumbnail,
        description: s.description,
      })),
      objects,
      emotions: emotions?.map((e) => e.dominant || e.emotion || 'neutral') || [],
      summary,
      stats: {
        sceneCount: scenes.length,
        objectCount: objects.length,
        avgSceneDuration: videoInfo.duration / scenes.length,
        sceneTypes,
        objectCategories,
        dominantEmotions,
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 统计场景类型
   */
  private countSceneTypes(scenes: Scene[]): Record<string, number> {
    return scenes.reduce((countsByType, scene) => {
      countsByType[scene.type || 'unknown'] = (countsByType[scene.type || 'unknown'] || 0) + 1;
      return countsByType;
    }, {} as Record<string, number>);
  }

  /**
   * 统计物体类别
   */
  private countObjectCategories(objects: ObjectDetection[]): Record<string, number> {
    return objects.reduce((countsByCategory, obj) => {
      const key = Array.isArray(obj.category) ? obj.category[0] : obj.category;
      countsByCategory[key || 'unknown'] = (countsByCategory[key || 'unknown'] || 0) + 1;
      return countsByCategory;
    }, {} as Record<string, number>);
  }

  /**
   * 统计主导情感
   */
  private countDominantEmotions(emotions: EmotionAnalysis[]): Record<string, number> {
    return emotions.reduce((countsByEmotion, emotion) => {
      const emotionKey = emotion.dominant ?? 'neutral';
      countsByEmotion[emotionKey] = (countsByEmotion[emotionKey] || 0) + 1;
      return countsByEmotion;
    }, {} as Record<string, number>);
  }

  /**
   * 生成文本摘要
   */
  private generateSummary(
    videoInfo: VideoInfo,
    sceneTypes: Record<string, number>,
    objectCategories: Record<string, number>,
    dominantEmotions: Record<string, number>
  ): string {
    const parts: string[] = [];

    parts.push(`视频时长 ${this.formatDuration(videoInfo.duration)}，`);
    parts.push(`分辨率 ${videoInfo.width}x${videoInfo.height}，`);
    parts.push(`包含 ${Object.keys(sceneTypes).length} 种场景类型，`);

    // 主要场景类型
    const mainScenes = Object.entries(sceneTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    if (mainScenes.length > 0) {
      parts.push(`以${mainScenes.map(([type]) => type).join('、')}为主，`);
    }

    // 物体统计
    if (Object.keys(objectCategories).length > 0) {
      parts.push(`检测到 ${Object.keys(objectCategories).length} 类物体，`);
    }

    // 情感基调
    const mainEmotion = Object.entries(dominantEmotions).sort((a, b) => b[1] - a[1])[0];
    if (mainEmotion) {
      parts.push(`整体氛围${mainEmotion[0]}。`);
    }

    return parts.join('');
  }

  /**
   * 格式化时长
   */
  private formatDuration(seconds: number): string {
    return formatDurationChinese(seconds);
  }

  /**
   * 生成场景描述
   */
  generateSceneDescription(
    scene: Scene,
    objects: ObjectDetection[],
    emotion?: EmotionAnalysis
  ): string {
    const parts: string[] = [];

    // 场景类型
    const typeNames: Record<string, string> = {
      intro: '开场',
      product: '产品展示',
      demo: '操作演示',
      interview: '人物访谈',
      landscape: '风景展示',
      action: '动作场景',
      emotion: '情感表达',
      text: '文字信息',
      outro: '结尾总结',
    };

    parts.push(typeNames[scene.type || ''] || '场景');

    // 物体信息
    if (objects.length > 0) {
      const categories = [...new Set(objects.map((o) => o.category))];
      parts.push(`包含${categories.join('、')}`);
    }

    // 情感信息
    if (emotion) {
      const emotionNames: Record<string, string> = {
        positive: '积极',
        negative: '消极',
        neutral: '中性',
        excited: '兴奋',
        calm: '平静',
      };
      const emotionKey = emotion.dominant ?? 'neutral';
      parts.push(`氛围${emotionNames[emotionKey] || emotionKey}`);
    }

    return parts.join('，');
  }
}

// 导出单例
export const analysisReportService = new AnalysisReportService();
