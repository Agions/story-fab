/**
 * 画面质量评估服务
 * 评估视频画面质量，用于叠加层优化
 */

import { logger } from '@/utils/logger';

export interface Quality评估结果 {
  score: number;
  brightness: number;
  contrast: number;
  sharpness: number;
  noiseLevel: number;
}

export interface Quality评估输入 {
  frameData?: ImageData | null;
  brightnessThreshold?: number;
  contrastThreshold?: number;
}

class OverlayQualityService {
  /**
   * 评估画面质量
   * @param input 评估输入
   * @returns 质量评估结果
   */
  evaluate(input: Quality评估输入): number {
    const { frameData, brightnessThreshold = 0.3, contrastThreshold = 0.2 } = input;

    // 如果没有帧数据，返回默认质量分数
    if (!frameData) {
      logger.info('[OverlayQualityService] 无帧数据，返回默认质量分数');
      return 0.7;
    }

    try {
      // 简化实现：基于亮度和对比度计算质量分数
      const { data, width, height } = frameData;
      const pixelCount = width * height;

      let totalBrightness = 0;
      let maxBrightness = 0;
      let minBrightness = 255;

      // 计算亮度和对比度
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // 计算亮度 (使用标准 luminance 公式)
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
        
        if (brightness > maxBrightness) maxBrightness = brightness;
        if (brightness < minBrightness) minBrightness = brightness;
      }

      const avgBrightness = totalBrightness / pixelCount;
      const contrast = (maxBrightness - minBrightness) / 255;

      // 计算质量分数 (0-1)
      let qualityScore = 0.5;

      // 亮度评分：最佳范围 100-200
      if (avgBrightness >= 100 && avgBrightness <= 200) {
        qualityScore += 0.25;
      } else {
        qualityScore += 0.25 * Math.exp(-Math.pow((avgBrightness - 150) / 80, 2));
      }

      // 对比度评分
      if (contrast >= contrastThreshold) {
        qualityScore += 0.25 * Math.min(contrast / 0.5, 1);
      }

      logger.info('[OverlayQualityService] 质量评估完成:', {
        avgBrightness: Math.round(avgBrightness),
        contrast: contrast.toFixed(3),
        qualityScore: qualityScore.toFixed(3),
      });

      return Math.max(0, Math.min(1, qualityScore));

    } catch (error) {
      logger.error('[OverlayQualityService] 评估失败:', error);
      return 0.7; // 默认质量分数
    }
  }

  /**
   * 检查是否需要叠加层
   * @param qualityScore 当前质量分数
   * @param threshold 阈值
   */
  needsOverlay(qualityScore: number, threshold: number = 0.5): boolean {
    return qualityScore < threshold;
  }

  /**
   * 获取推荐叠加模式
   * @param qualityScore 当前质量分数
   */
  getRecommendedMode(qualityScore: number): 'pip' | 'full' {
    if (qualityScore >= 0.8) {
      return 'full'; // 高质量，使用全屏叠加
    } else if (qualityScore >= 0.5) {
      return 'pip'; // 中等质量，使用画中画
    } else {
      return 'pip'; // 低质量，使用画中画
    }
  }
}

// 导出单例
export const overlayQualityService = new OverlayQualityService();
