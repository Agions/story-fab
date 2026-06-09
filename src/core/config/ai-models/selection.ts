/**
 * AI 模型选择启发式算法
 *
 * 【优化思路】从 aiModels.config.ts 提取选择逻辑为独立模块，
 * 包含内容预估、最优模型选择、推荐列表生成等纯函数。
 *
 * 启发式规则：
 * 1. 短内容 + 快速任务 → 高性价比模型（gpt-4o-mini / qwen3.6-flash）
 * 2. 长内容 → 大 contextWindow 模型（gemini-2.5-pro / kimi-k2.6）
 * 3. 高复杂度 → 高智能模型（claude-opus-4.7 / gpt-5.5）
 * 4. 超长内容 → 启用 trim 策略，选择支持超长上下文的模型
 */

import type { AIModel } from '@/core/types';
import { AI_MODELS, getModelById } from './catalog';

// =============================================================================
// 类型定义
// =============================================================================

/** 内容特征 */
export interface ContentProfile {
  /** 预估 token 数量 */
  estimatedTokens: number;
  /** 是否为多模态内容（包含图像/视频） */
  isMultimodal: boolean;
  /** 语言复杂度：simple=日常对话，normal=普通文章，complex=技术/专业 */
  complexity: 'simple' | 'normal' | 'complex';
}

/** 任务类型 */
export type TaskType = 'script' | 'analysis' | 'code' | 'fast' | 'video';

export interface ModelSelectionHint {
  modelId: string;
  reason: string;
  needsTrim: boolean;
  trimRatio: number; // 0-1，建议裁剪比例
  score: number; // 0-100，适配度
}

// =============================================================================
// 核心算法
// =============================================================================

/** 任务 → 推荐模型列表（已按优先级排序） */
const TASK_MODEL_IDS: Record<TaskType, string[]> = {
  script:    ['gpt-5.5', 'claude-opus-4.7', 'qwen3.6-plus', 'kimi-k2.6', 'gpt-4o'],
  analysis:  ['gpt-5.5', 'gemini-2.5-pro', 'claude-opus-4.7', 'qwen3.6-max-preview', 'gpt-4o'],
  code:      ['o3', 'claude-sonnet-4.6', 'deepseek-v4-pro', 'deepseek-v4-flash'],
  fast:      ['qwen3.6-flash', 'gpt-5.4-mini', 'glm-5-turbo', 'deepseek-v4-flash'],
  video:     ['gpt-5.5', 'gemini-2.5-pro', 'kimi-k2.6', 'gpt-4o'],
};

/** 不支持多模态的模型 ID（用于过滤） */
const MULTIMODAL_EXCLUDES = ['o3', 'o3-mini', 'deepseek-v4-flash', 'deepseek-v4-pro'];

/** 安全系数：预估 token 可能不准确时的 buffer */
const SAFETY_BUFFER = 1.2;

/** 任务类型中文标签 */
const TASK_LABELS: Record<TaskType, string> = {
  script: '脚本生成', analysis: '视频分析', code: '代码任务', fast: '快速响应', video: '视频理解',
};

/**
 * 预估内容所需 token
 * 中文约 1.5 tokens/字，英文约 1.3 tokens/词
 */
export function estimateContentTokens(text: string, isEnglish: boolean = false): number {
  if (isEnglish) {
    const words = text.trim().split(/\s+/).length;
    return Math.round(words * 1.3);
  }
  return Math.round(text.length * 1.5);
}

/**
 * 生成选择原因描述
 */
function buildSelectionReason(
  model: AIModel,
  effectiveTokens: number,
  maxTokens: number,
  taskType: TaskType,
  complexity: ContentProfile['complexity'],
): string {
  const tokenLimitK = ((model.tokenLimit ?? 0) / 1000).toFixed(0);
  const effectiveK = (effectiveTokens / 1000).toFixed(0);

  if (effectiveTokens > maxTokens) {
    return `⚠️ 内容 ${effectiveK}K > 模型上限 ${tokenLimitK}K，将自动 trim`;
  }

  const complexityStr = complexity === 'complex' ? '复杂' : complexity === 'simple' ? '简单' : '';
  return `${TASK_LABELS[taskType]}${complexityStr} → ${model.name}（${tokenLimitK}K 上限，剩余 ${Math.round((1 - effectiveTokens / maxTokens) * 100)}%）`;
}

/**
 * 为单个候选模型计算适配分数
 */
function scoreCandidate(
  model: AIModel,
  effectiveTokens: number,
  complexity: ContentProfile['complexity'],
  estimatedTokens: number,
): { score: number; needsTrim: boolean; trimRatio: number } {
  const tokenLimit = model.tokenLimit ?? model.contextWindow ?? 0;
  const maxTokens = model.maxTokens ?? tokenLimit;

  if (maxTokens === 0) return { score: 0, needsTrim: false, trimRatio: 0 };

  let score = 50;
  let needsTrim = false;
  let trimRatio = 0;

  if (effectiveTokens > maxTokens) {
    needsTrim = true;
    trimRatio = Math.min(1, maxTokens / effectiveTokens);
    score = Math.max(0, 100 - (1 - trimRatio) * 80);
  } else {
    const headroom = (maxTokens - effectiveTokens) / maxTokens;
    score = 60 + Math.min(40, headroom * 50);
  }

  // 高复杂度任务倾向于更智能的模型
  if (complexity === 'complex' && model.isPro) {
    score = Math.min(100, score + 15);
  }

  // 超长内容优先选择大 contextWindow 模型
  if (estimatedTokens > 100000 && tokenLimit >= 1000000) {
    score = Math.min(100, score + 20);
  }

  return { score: Math.round(score), needsTrim, trimRatio };
}

/**
 * 获取带安全系数的有效 token 数
 */
function withSafetyBuffer(tokens: number): number {
  return tokens * SAFETY_BUFFER;
}

/**
 * 过滤多模态不兼容的候选模型
 */
function filterMultimodalCandidates(candidateIds: string[], isMultimodal: boolean): string[] {
  return isMultimodal
    ? candidateIds.filter(id => !MULTIMODAL_EXCLUDES.includes(id))
    : candidateIds;
}

/**
 * 根据内容特征 + 任务类型，选择最佳模型
 */
export function selectOptimalModel(
  taskType: TaskType,
  profile: ContentProfile,
): ModelSelectionHint {
  const { estimatedTokens, isMultimodal, complexity } = profile;
  const effectiveTokens = withSafetyBuffer(estimatedTokens);

  const candidateIds = TASK_MODEL_IDS[taskType] || TASK_MODEL_IDS.script;
  const candidates = filterMultimodalCandidates(candidateIds, isMultimodal);

  let bestHint: ModelSelectionHint | null = null;

  for (const modelId of candidates) {
    const model = getModelById(modelId);
    if (!model) continue;

    const { score, needsTrim, trimRatio } = scoreCandidate(model, effectiveTokens, complexity, estimatedTokens);
    if (score === 0) continue;

    if (!bestHint || score > bestHint.score) {
      const tokenLimit = model.tokenLimit ?? model.contextWindow ?? 0;
      const maxTokens = model.maxTokens ?? tokenLimit;
      bestHint = {
        modelId,
        reason: buildSelectionReason(model, effectiveTokens, maxTokens, taskType, complexity),
        needsTrim,
        trimRatio,
        score,
      };
    }
  }

  // Fallback：选择最大上下文模型
  if (!bestHint) {
    const fallback = AI_MODELS
      .filter(m => (m.tokenLimit ?? 0) > 0)
      .sort((a, b) => (b.tokenLimit ?? 0) - (a.tokenLimit ?? 0))[0];
    if (fallback) {
      bestHint = {
        modelId: fallback.id,
        reason: `Fallback：选择最大上下文模型 ${fallback.name}（${(fallback.tokenLimit ?? 0) / 1000}K）`,
        needsTrim: true,
        trimRatio: Math.max(0, 1 - estimatedTokens / (fallback.tokenLimit ?? 1)),
        score: 20,
      };
    }
  }

  return bestHint ?? { modelId: 'gpt-4o', reason: '默认选择', needsTrim: false, trimRatio: 0, score: 50 };
}

/**
 * 批量推荐多个模型（用于展示推荐列表）
 */
export function recommendModelsForTask(
  taskType: TaskType,
  profile: ContentProfile,
  limit: number = 5,
): ModelSelectionHint[] {
  const { estimatedTokens, isMultimodal } = profile;

  const extendedTaskModelIds: Record<TaskType, string[]> = {
    script:    ['gpt-5.5', 'claude-opus-4.7', 'qwen3.6-plus', 'kimi-k2.6', 'gpt-4o', 'gemini-2.5-pro'],
    analysis:  ['gpt-5.5', 'gemini-2.5-pro', 'claude-opus-4.7', 'qwen3.6-max-preview', 'gpt-4o'],
    code:      ['o3', 'claude-sonnet-4.6', 'deepseek-v4-pro', 'deepseek-v4-flash', 'gpt-5.4'],
    fast:      ['qwen3.6-flash', 'gpt-5.4-mini', 'glm-5-turbo', 'deepseek-v4-flash'],
    video:     ['gpt-5.5', 'gemini-2.5-pro', 'kimi-k2.6', 'gpt-4o'],
  };

  const candidateIds = filterMultimodalCandidates(
    extendedTaskModelIds[taskType] || extendedTaskModelIds.script,
    isMultimodal,
  );

  const effectiveTokens = withSafetyBuffer(estimatedTokens);

  const hints: ModelSelectionHint[] = [];

  for (const modelId of candidateIds) {
    const model = getModelById(modelId);
    if (!model) continue;

    const tokenLimit = model.tokenLimit ?? model.contextWindow ?? 0;
    const maxTokens = model.maxTokens ?? tokenLimit;
    if (maxTokens === 0) continue;

    const needsTrim = effectiveTokens > maxTokens;
    const trimRatio = needsTrim ? Math.min(1, maxTokens / effectiveTokens) : 0;

    let score = 60;
    if (needsTrim) {
      score = Math.max(0, 100 - (1 - trimRatio) * 80);
    } else {
      const headroom = (maxTokens - effectiveTokens) / maxTokens;
      score = 60 + Math.min(40, headroom * 50);
    }

    hints.push({
      modelId,
      reason: buildSelectionReason(model, estimatedTokens * SAFETY_BUFFER, maxTokens, taskType, profile.complexity),
      needsTrim,
      trimRatio,
      score: Math.round(score),
    });
  }

  return hints.sort((a, b) => b.score - a.score).slice(0, limit);
}
