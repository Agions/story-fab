/**
 * CommentaryDirectorStep — director-agent
 *
 * 职责：制定镜头节奏策略，分配段落优先级
 * 输入：state (含 mode, analysis, segments)
 * 输出：state + directorPlan
 *
 * Step 1/5
 * 进度范围：[0.0, 0.15]
 */

import { createStep, reportProgress } from '../../Step';
import { logger } from '../../../../shared/utils/logging';
import {
  type CommentaryDirectorInput,
  type CommentaryDirectorOutput,
  derivePacing,
} from './types';
import type { Scene } from '@/core/types';

// ============================================================
// Step Metadata
// ============================================================

const STEP_META = {
  name: 'commentary-director',
  description: '制定镜头节奏策略，分配段落优先级 (director-agent)',
  estimatedDuration: 1,
};

// ============================================================
// 辅助: 生成 narrative arc
// ============================================================

const buildNarrativeArc = (
  mode: string,
  duration: number,
  sceneCount: number
): string => {
  const minutes = Math.round(duration / 60);
  const guidance: Record<string, string> = {
    'ai-commentary': `以专业解说员视角串联${minutes}分钟${sceneCount}个镜头的核心剧情，保持客观准确。`,
    'ai-first-person': `以第一人称"我"的角度，重述${minutes}分钟内的所见所感，营造沉浸感。`,
    'ai-mixclip': `用极快节奏串联${sceneCount}个高能片段，制造视觉冲击，每段≤4秒。`,
    'ai-repurposing': `提炼${minutes}分钟中的金句和高光，最大化情绪冲击。`,
  };
  return guidance[mode] ?? guidance['ai-commentary'];
};

/**
 * 计算 scene 优先级
 * 优先级 = scene.score * (0.6 + motionScore * 0.4)
 * 缺少 motionScore 时使用 score
 */
const computeScenePriorities = (scenes: Scene[]): Map<string, number> => {
  const map = new Map<string, number>();
  for (const scene of scenes) {
    const motionScore = (scene as Scene & { motionScore?: number }).motionScore ?? 0;
    const baseScore = scene.score ?? 0;
    const priority = baseScore * (0.6 + motionScore * 0.4);
    map.set(scene.id, Math.min(1, Math.max(0, priority)));
  }
  return map;
};

/**
 * Director 目标漂移阈值
 * - ai-commentary: 0.8s (高精度)
 * - ai-first-person: 1.0s
 * - ai-mixclip: 1.5s (允许更大漂移以保节奏)
 * - ai-repurposing: 1.0s
 */
const computeTargetDrift = (mode: string): number => {
  const map: Record<string, number> = {
    'ai-commentary': 0.8,
    'ai-first-person': 1.0,
    'ai-mixclip': 1.5,
    'ai-repurposing': 1.0,
  };
  return map[mode] ?? 1.0;
};

// ============================================================
// Step Implementation
// ============================================================

export const commentaryDirectorStep: import('../../Step').Step<
  CommentaryDirectorInput,
  CommentaryDirectorOutput
> = createStep(STEP_META, async (input, _ctx, options) => {
  const { state } = input;
  const { mode, analysis } = state;
  const scenes = (analysis.scenes ?? []) as Scene[];

  reportProgress(options?.onProgress, STEP_META.name, 0.2, 'director 正在分析模式...');

  const pacing = derivePacing(scenes, analysis.duration ?? 0);
  const scenePriorities = computeScenePriorities(scenes);

  reportProgress(options?.onProgress, STEP_META.name, 0.5, 'director 制定节奏策略...');

  const narrativeArc = buildNarrativeArc(mode, analysis.duration ?? 0, scenes.length);
  const targetDriftSeconds = computeTargetDrift(mode);

  reportProgress(options?.onProgress, STEP_META.name, 0.9, 'director 分配段落优先级...');

  const directorPlan = {
    mode,
    pacing,
    scenePriorities,
    scenePrioritiesList: Array.from(scenePriorities.entries()).map(([sceneId, priority]) => ({
      sceneId,
      priority,
    })),
    narrativeArc,
    targetDriftSeconds,
    createdAt: Date.now(),
  };

  logger.debug(`[${STEP_META.name}] director 完成`, {
    mode,
    pacing,
    sceneCount: scenes.length,
    targetDriftSeconds,
  });

  return {
    state: {
      ...state,
      directorPlan,
    },
  };
});

export default commentaryDirectorStep;
