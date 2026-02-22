/**
 * 智能模型选择 Hook
 * 根据任务类型和预算自动选择最优模型
 */

import { useState, useCallback, useMemo } from 'react';
import { costService } from '@/core/services/cost.service';
import { OPTIMIZATION_CONFIG } from '@/core/config/optimization.config';
import { aiService } from '@/core/services/ai.service';

// 任务类型
export type TaskType = 'simple' | 'standard' | 'complex' | 'creative';

// 预算约束
export type BudgetLevel = 'low' | 'medium' | 'high';

// 生成选项
export interface SmartGenerateOptions {
  taskType?: TaskType;
  budgetLevel?: BudgetLevel;
  enableCache?: boolean;
  maxRetries?: number;
  timeout?: number;
}

// 生成结果
export interface SmartGenerateResult {
  content: string;
  model: string;
  provider: string;
  cost: number;
  duration: number;
  cached: boolean;
}

// 使用统计
export interface UsageStats {
  totalCalls: number;
  totalCost: number;
  avgCost: number;
  cacheHitRate: number;
  modelDistribution: Record<string, number>;
}

// 缓存
const responseCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时

export function useSmartModel() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SmartGenerateResult | null>(null);

  // 生成缓存键
  const generateCacheKey = useCallback((prompt: string, taskType: TaskType): string => {
    return `${taskType}_${prompt.slice(0, 100)}`;
  }, []);

  // 检查缓存
  const checkCache = useCallback((key: string): string | null => {
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.content;
    }
    return null;
  }, []);

  // 设置缓存
  const setCache = useCallback((key: string, content: string): void => {
    responseCache.set(key, { content, timestamp: Date.now() });

    // 清理过期缓存
    if (responseCache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of responseCache.entries()) {
        if (now - v.timestamp > CACHE_TTL) {
          responseCache.delete(k);
        }
      }
    }
  }, []);

  // 智能生成
  const generate = useCallback(async (
    prompt: string,
    options: SmartGenerateOptions = {}
  ): Promise<SmartGenerateResult> => {
    const {
      taskType = 'standard',
      budgetLevel = 'medium',
      enableCache = true,
      maxRetries = 3,
      timeout = 30000
    } = options;

    setIsGenerating(true);
    setError(null);

    const startTime = performance.now();

    try {
      // 检查缓存
      const cacheKey = generateCacheKey(prompt, taskType);
      if (enableCache) {
        const cached = checkCache(cacheKey);
        if (cached) {
          const duration = performance.now() - startTime;
          const result: SmartGenerateResult = {
            content: cached,
            model: 'cache',
            provider: 'cache',
            cost: 0,
            duration,
            cached: true
          };
          setLastResult(result);
          setIsGenerating(false);
          return result;
        }
      }

      // 获取模型建议
      const suggestion = costService.getModelSuggestion(taskType, budgetLevel);
      const { model, provider } = suggestion;

      // 调用 AI 服务
      let lastError: Error | null = null;
      let result: string | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          result = await aiService.generate(prompt, {
            model,
            provider,
            signal: controller.signal
          });

          clearTimeout(timeoutId);
          break;
        } catch (err) {
          lastError = err as Error;
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }

      if (!result) {
        throw lastError || new Error('生成失败');
      }

      // 估算成本
      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil(result.length / 4);
      const costRecord = costService.recordLLMCost(
        provider,
        model,
        inputTokens,
        outputTokens,
        { taskType, budgetLevel }
      );

      // 缓存结果
      if (enableCache) {
        setCache(cacheKey, result);
      }

      const duration = performance.now() - startTime;
      const generateResult: SmartGenerateResult = {
        content: result,
        model,
        provider,
        cost: costRecord.cost,
        duration,
        cached: false
      };

      setLastResult(generateResult);
      return generateResult;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [checkCache, setCache, generateCacheKey]);

  // 批量生成
  const generateBatch = useCallback(async (
    prompts: string[],
    options: SmartGenerateOptions = {}
  ): Promise<SmartGenerateResult[]> => {
    const results: SmartGenerateResult[] = [];

    // 使用并发控制
    const concurrency = OPTIMIZATION_CONFIG.performance.concurrency.maxRequests;
    const chunks = [];

    for (let i = 0; i < prompts.length; i += concurrency) {
      chunks.push(prompts.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(prompt => generate(prompt, options))
      );
      results.push(...chunkResults);
    }

    return results;
  }, [generate]);

  // 获取使用统计
  const getStats = useCallback((): UsageStats => {
    const costStats = costService.getStats();

    const totalCalls = Object.values(costStats.byModel).reduce((sum, cost) => {
      // 估算调用次数（假设平均每次 $0.001）
      return sum + Math.round(cost / 0.001);
    }, 0);

    const cacheHits = Array.from(responseCache.values()).filter(
      item => Date.now() - item.timestamp < CACHE_TTL
    ).length;
    const totalCacheRequests = totalCalls + cacheHits;
    const cacheHitRate = totalCacheRequests > 0 ? cacheHits / totalCacheRequests : 0;

    return {
      totalCalls,
      totalCost: costStats.total,
      avgCost: totalCalls > 0 ? costStats.total / totalCalls : 0,
      cacheHitRate,
      modelDistribution: costStats.byModel
    };
  }, []);

  // 获取优化建议
  const getSuggestions = useCallback((): string[] => {
    return costService.getOptimizationSuggestions();
  }, []);

  // 清空缓存
  const clearCache = useCallback((): void => {
    responseCache.clear();
  }, []);

  // 导出报告
  const exportReport = useCallback((): string => {
    return costService.exportReport();
  }, []);

  // 计算属性
  const stats = useMemo(() => getStats(), [lastResult]);
  const suggestions = useMemo(() => getSuggestions(), [lastResult]);

  return {
    // 状态
    isGenerating,
    error,
    lastResult,

    // 操作
    generate,
    generateBatch,
    clearCache,
    exportReport,

    // 统计
    stats,
    suggestions,

    // 成本服务
    costService
  };
}

export default useSmartModel;
