/**
 * 视觉识别服务门面
 * 统一导出所有视觉相关服务，保持向后兼容性
 *
 * 重构说明：
 * - 原 visionService.ts (662行) 拆分为 4 个独立服务
 * - 每个服务职责单一，便于测试和维护
 * - 本文件作为门面，保持原有 API 兼容
 */

import { tauri } from '@/core/tauri';
import { logger } from '@/shared/utils/logging';
import type {
  VideoInfo,
  Scene,
  VideoAnalysis,
  ObjectDetection,
  EmotionAnalysis,
} from '@/core/types';
import type { HighlightSegment, DetectOptions, HighlightReason } from '@/core/interfaces';

// 导入拆分后的服务
import { sceneDetectionService } from './sceneDetectionService';
import { objectDetectionService } from './objectDetectionService';
import { emotionAnalysisService } from './emotionAnalysisService';
import { analysisReportService } from './analysisReportService';

// 重新导出各服务
export { sceneDetectionService } from './sceneDetectionService';
export { objectDetectionService } from './objectDetectionService';
export { emotionAnalysisService } from './emotionAnalysisService';
export { analysisReportService } from './analysisReportService';

// ============================================
// 视频分析选项
// ============================================

export interface VideoAnalysisOptions {
  minSceneDuration?: number;
  threshold?: number;
  detectObjects?: boolean;
  detectEmotions?: boolean;
}

// ============================================
// 视觉识别服务门面
// ============================================

export class VisionService {
  /**
   * 视频分析入口
   * 整合场景检测、对象识别、情感分析
   *
   * 重构说明：将原 662 行单体服务拆分为 4 个独立服务
   * - sceneDetectionService: 场景分割和分类
   * - objectDetectionService: 物体检测
   * - emotionAnalysisService: 情感分析
   * - analysisReportService: 报告生成
   */
  async analyzeVideo(
    videoInfo: VideoInfo,
    options?: VideoAnalysisOptions
  ): Promise<{
    scenes: Scene[];
    objects: ObjectDetection[];
    emotions: EmotionAnalysis[];
  }> {
    return this.detectScenesAdvanced(videoInfo, options);
  }

  /**
   * 高级场景检测
   * 使用多维度分析提高准确性
   */
  async detectScenesAdvanced(
    videoInfo: VideoInfo,
    options: VideoAnalysisOptions = {}
  ): Promise<{
    scenes: Scene[];
    objects: ObjectDetection[];
    emotions: EmotionAnalysis[];
  }> {
    const {
      minSceneDuration = 3,
      detectObjects = true,
      detectEmotions = true,
    } = options;

    // 1. 基础场景分割
    const baseScenes = await sceneDetectionService.segmentScenes(videoInfo, minSceneDuration);

    // 2. 场景分类
    const classifiedScenes = await sceneDetectionService.classifyScenes(baseScenes, videoInfo);

    // 3. 物体检测 + 情感分析（并行，独立分析维度）
    const [objects, emotions] = await Promise.all([
      detectObjects
        ? objectDetectionService.detectObjectsInScenes(classifiedScenes, videoInfo)
        : ([] as ObjectDetection[]),
      detectEmotions
        ? emotionAnalysisService.analyzeEmotions(classifiedScenes)
        : ([] as EmotionAnalysis[]),
    ]);

    // 4. 场景优化
    const optimizedScenes = this.optimizeScenes(classifiedScenes, objects, emotions);

    return {
      scenes: optimizedScenes,
      objects,
      emotions,
    };
  }

  /**
   * 提取关键帧
   */
  async extractKeyframes(
    videoInfo: VideoInfo,
    options: { maxFrames?: number } = {}
  ): Promise<Array<{ id: string; timestamp: number; thumbnail: string; description: string }>> {
    const { maxFrames = 20 } = options;

    try {
      const { scenes } = await this.detectScenesAdvanced(videoInfo, {
        minSceneDuration: 1,
        threshold: 0.3,
        detectObjects: false,
        detectEmotions: false,
      });

      // 采样：均匀抽取 maxFrames 个场景的起始帧
      const step = Math.max(1, Math.ceil(scenes.length / maxFrames));
      const sampled = scenes.filter((_, i) => i % step === 0).slice(0, maxFrames);

      return sampled.map((scene, i) => ({
        id: scene.id || `kf_${i}`,
        timestamp: scene.startTime,
        thumbnail: scene.thumbnail || '',
        description: scene.description || '',
      }));
    } catch {
      // 检测失败时，按时间均匀采样
      const interval = Math.max(1, videoInfo.duration / maxFrames);
      return Array.from({ length: maxFrames }, (_, i) => ({
        id: `kf_${i}`,
        timestamp: i * interval,
        thumbnail: '',
        description: '',
      }));
    }
  }

  /**
   * 优化场景
   * 整合物体和情感数据
   */
  private optimizeScenes(
    scenes: Scene[],
    objects: ObjectDetection[],
    emotions: EmotionAnalysis[]
  ): Scene[] {
    // 预建查找表：sceneId → objects/emotions，避免 O(n²) 嵌套循环
    const objectMap = objectDetectionService.groupObjectsByScene(objects);
    const emotionMap = new Map(emotions.map((e) => [e.sceneId, e]));

    return scenes.map((scene) => {
      const sceneObjects = objectMap.get(scene.id) ?? [];
      const sceneEmotion = emotionMap.get(scene.id) ?? null;

      // 生成更准确的描述
      const description = analysisReportService.generateSceneDescription(
        scene,
        sceneObjects,
        sceneEmotion ?? undefined
      );

      return {
        ...scene,
        description,
        objectCount: sceneObjects.length,
        dominantEmotion: sceneEmotion?.dominant,
      };
    });
  }

  /**
   * 生成视频分析报告
   */
  async generateAnalysisReport(
    videoInfo: VideoInfo,
    scenes: Scene[],
    objects: ObjectDetection[],
    emotions: EmotionAnalysis[]
  ): Promise<VideoAnalysis> {
    return analysisReportService.generateReport(videoInfo, scenes, objects, emotions);
  }

  /**
   * Rust 高光检测 — 激活 highlight_detector.rs
   *
   * 使用 FFmpeg scdet 滤镜 + 音频短时能量分析，无需外部 AI 服务
   * 识别高光片段（音频能量峰值 + 场景切换）
   *
   * @deprecated 使用 @/core/interfaces DetectOptions 类型 + tauri.detectHighlights()
   */
  async detectHighlights(
    videoInfo: VideoInfo,
    options: Partial<DetectOptions> = {}
  ): Promise<HighlightSegment[]> {
    const videoPath = videoInfo.path;

    if (!videoPath) {
      logger.info('[VisionService] detectHighlights: videoInfo.path is empty');
      return [];
    }

    try {
      const rawSegments = await tauri.detectHighlights(videoPath, {
        threshold: options.threshold,
        minDurationMs: options.minDurationMs ?? options.minDurationMs,
        topN: options.topN,
        windowMs: options.windowMs,
      });

      return (
        rawSegments as Array<{
          start_ms: number;
          end_ms: number;
          score: number;
          reason: string;
          audio_score?: number;
          scene_score?: number;
          motion_score?: number;
        }>
      ).map((h) => ({
        startTime: h.start_ms / 1000,
        endTime: h.end_ms / 1000,
        score: h.score,
        reason: h.reason as HighlightReason,
        audioScore: h.audio_score,
        sceneScore: h.scene_score,
        motionScore: h.motion_score,
      }));
    } catch (error) {
      logger.info('[VisionService] detectHighlights failed:', error);
      return [];
    }
  }
}

// 导出单例
export const visionService = new VisionService();
export default visionService;
