/**
 * CommentaryVisualStep — visual-analyst-agent
 *
 * 职责：解析场景语义与情绪峰值，提供可讲述画面锚点
 * 输入：state + directorPlan
 * 输出：state + visualAnalysis
 *
 * Step 2/5
 * 进度范围：[0.15, 0.40]
 */

import { createStep, reportProgress } from '../../Step';
import { logger } from '../../../../shared/utils/logging';
import { AppError } from '@/core/errors';
import {
  type CommentaryVisualInput,
  type CommentaryVisualOutput,
  type VisualAnalysisOutput,
} from './types';
import type { Scene, Emotion } from '@/core/types';

// ============================================================
// Step Metadata
// ============================================================

const STEP_META = {
  name: 'commentary-visual',
  description: '解析场景语义与情绪峰值 (visual-analyst-agent)',
  estimatedDuration: 2,
};

// ============================================================
// 辅助
// ============================================================

/**
 * 为每个 scene 补充 motionScore + dominantEmotion
 * 真实场景下，motionScore 由 Rust highlight_detector 提供
 * 这里降级为基于 scene.score + 位置估算
 */
const enhanceScenes = (
  scenes: Scene[],
  emotions: { timestamp: number; type: string; intensity: number }[]
): VisualAnalysisOutput['enhancedScenes'] => {
  const safeEmotions: { timestamp: number; type: string; intensity: number }[] = (
    emotions ?? []
  ) as { timestamp: number; type: string; intensity: number }[];
  return scenes.map((scene) => {
    // motionScore: 优先用 scene 已有，否则用 score
    const motionScore =
      (scene as Scene & { motionScore?: number }).motionScore ?? scene.score;

    // dominantEmotion: 找 scene 范围内最强情绪
    const sceneEmotions = safeEmotions.filter(
      (e) => e.timestamp >= scene.startTime && e.timestamp <= scene.endTime
    );
    const dominantEmotion =
      sceneEmotions.length > 0
        ? sceneEmotions.reduce((max, e) => (e.intensity > max.intensity ? e : max)).type
        : undefined;

    return {
      ...scene,
      motionScore,
      isKeyAnchor: motionScore > 0.7,
      dominantEmotion,
    };
  });
};

/**
 * 提取关键镜头锚点 (top N)
 * 优先级：isKeyAnchor 优先 > score 高
 */
const extractKeyAnchors = (
  enhancedScenes: VisualAnalysisOutput['enhancedScenes'],
  topN: number = 5
): VisualAnalysisOutput['keyAnchors'] => {
  return [...enhancedScenes]
    .filter((s) => s.isKeyAnchor)
    .sort((a, b) => b.motionScore - a.motionScore)
    .slice(0, topN)
    .map((scene) => ({
      sceneId: scene.id,
      startTime: scene.startTime,
      endTime: scene.endTime,
      reason: scene.motionScore > 0.8 ? 'motion' : 'emotion',
    }));
};

// ============================================================
// Step Implementation
// ============================================================

export const commentaryVisualStep: import('../../Step').Step<
  CommentaryVisualInput,
  CommentaryVisualOutput
> = createStep(STEP_META, async (input, _ctx, options) => {
  const { state } = input;
  const { analysis } = state;
  // 守卫：director 步骤未执行时拒绝运行
  if (!state.directorPlan) {
    throw new AppError('APP_PIPELINE_ORDER', '[commentary-visual] requires directorPlan from previous step', {
      userMessage: '解说流程顺序错误：缺少 director 计划',
    });
  }
  const scenes = (analysis.scenes ?? []) as Scene[];
  const emotions = (analysis.emotions ?? []) as Emotion[];

  reportProgress(options?.onProgress, STEP_META.name, 0.2, 'visual 正在解析场景...');

  const enhancedScenes = enhanceScenes(scenes, emotions);

  reportProgress(options?.onProgress, STEP_META.name, 0.6, 'visual 识别情绪峰值...');

  const keyAnchors = extractKeyAnchors(enhancedScenes, 5);

  const visualAnalysis: VisualAnalysisOutput = {
    enhancedScenes,
    keyAnchors,
  };

  reportProgress(options?.onProgress, STEP_META.name, 0.95, 'visual 锚点提取完成...');

  logger.debug(`[${STEP_META.name}] visual 完成`, {
    enhancedScenes: enhancedScenes.length,
    keyAnchors: keyAnchors.length,
  });

  return {
    state: {
      ...state,
      directorPlan: state.directorPlan!,
      visualAnalysis,
    },
  };
});

export default commentaryVisualStep;
