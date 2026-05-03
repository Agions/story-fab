/**
 * AI 服务 — 统一的 AI 模型调用入口
 *
 * 目录结构:
 *   providers/   — 各 AI Provider 适配器（OpenAI / Anthropic / Google / 阿里 / 智谱 / Moonshot / 百度）
 *   prompts.ts   — Prompt 构建纯函数
 *   ai.service.ts — 主服务（公开 API、请求路由、response 解析）
 */
import { BaseService, ServiceError } from '../providers/base.service';
import type { AIModel, AIModelSettings, ScriptData, ScriptSegment, VideoAnalysis, VideoInfo, Scene, Keyframe } from '@/core/types';
import { AI_MODELS, DEFAULT_MODEL_ID, MODEL_RECOMMENDATIONS } from '../../config/aiModels.config';
import { visionService } from './vision.service';

import {
  type AIResponse,
  type RequestConfig,
  isSupportedProvider,
  callOpenAI,
  callAnthropic,
  callGoogle,
  callAlibaba,
  callZhipu,
  callMoonshot,
  callBaidu,
  mockCall,
} from '@/core/services/providers';

import {
  buildSystemPrompt,
  buildScriptPrompt,
  buildAnalysisPrompt,
  buildOptimizationPrompt,
  buildTranslationPrompt,
} from '../providers/prompts';

// =========================================
// AIService
// =========================================
export class AIService extends BaseService {
  private abortControllers = new Map<string, AbortController>();

  constructor() {
    super('AIService', { timeout: 60_000, retries: 2 });
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  async generateText(
    model: AIModel,
    prompt: string,
    settings: AIModelSettings = { enabled: true, apiKey: '', temperature: 0.7, maxTokens: 1200 }
  ): Promise<string> {
    if (settings.temperature !== undefined && (settings.temperature < 0 || settings.temperature > 2)) {
      throw new ServiceError('temperature must be between 0 and 2', 'INVALID_PARAM');
    }
    if (settings.maxTokens !== undefined && settings.maxTokens <= 0) {
      throw new ServiceError('maxTokens must be a positive integer', 'INVALID_PARAM');
    }
    if (typeof prompt !== 'string' || !prompt.trim()) {
      throw new ServiceError('prompt must be a non-empty string', 'INVALID_PARAM');
    }
    const response = await this.callAPI(model, settings, prompt);
    return response.content;
  }

  async generateScript(
    model: AIModel,
    settings: AIModelSettings,
    params: {
      topic: string; style: string; tone: string; length: string;
      audience: string; language: string; keywords?: string[];
      requirements?: string; videoDuration?: number;
    }
  ): Promise<ScriptData> {
    return this.executeRequest(
      async () => {
        const prompt = buildScriptPrompt(params);
        const response = await this.callAPI(model, settings, prompt);
        return {
          id: `script_${Date.now()}`,
          title: params.topic,
          content: response.content,
          segments: parseScriptSegments(response.content),
          metadata: {
            style: params.style,
            tone: params.tone,
            length: params.length as 'short' | 'medium' | 'long',
            targetAudience: params.audience,
            language: params.language,
            wordCount: response.content.length,
            estimatedDuration: estimateDuration(response.content.length),
            generatedBy: model.id,
            generatedAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      },
      '生成脚本',
      { loadingMessage: '正在生成脚本...' }
    );
  }

  async analyzeVideo(
    model: AIModel,
    settings: AIModelSettings,
    videoInfo: { duration: number; width: number; height: number; format: string; id?: string; path?: string }
  ): Promise<Partial<VideoAnalysis>> {
    return this.executeRequest(
      async () => {
        const prompt = buildAnalysisPrompt(videoInfo);
        const response = await this.callAPI(model, settings, prompt);

        const [scenesResult, keyframesResult] = await Promise.allSettled([
          visionService.detectScenesAdvanced(videoInfo as VideoInfo, { minSceneDuration: 3, threshold: 0.3 }),
          visionService.extractKeyframes(videoInfo as VideoInfo, { maxFrames: 20 }),
        ]);

        const scenes: Scene[] = scenesResult.status === 'fulfilled' && scenesResult.value.scenes
          ? scenesResult.value.scenes.map((s) => ({
              id: s.id || crypto.randomUUID(),
              startTime: s.startTime,
              endTime: s.endTime,
              thumbnail: s.thumbnail || '',
              description: s.description || '',
              tags: s.tags || [],
              type: (s as unknown as Record<string, unknown>).type as Scene['type'] || 'narrative',
              score: (s as unknown as Record<string, unknown>).score as number || 0.8,
            }))
          : [];

        const keyframes: Keyframe[] = keyframesResult.status === 'fulfilled'
          ? keyframesResult.value.map((k, idx) => ({
              id: k.id || `kf_${idx}`,
              timestamp: k.timestamp || 0,
              thumbnail: k.thumbnail || '',
              description: k.description || '',
            }))
          : [];

        return { summary: response.content, scenes, keyframes, createdAt: new Date().toISOString() };
      },
      '分析视频',
      { loadingMessage: '正在分析视频...' }
    );
  }

  async optimizeScript(
    model: AIModel,
    settings: AIModelSettings,
    script: string,
    optimization: 'shorten' | 'lengthen' | 'simplify' | 'professional'
  ): Promise<string> {
    return this.executeRequest(
      async () => {
        const prompt = buildOptimizationPrompt(script, optimization);
        const response = await this.callAPI(model, settings, prompt);
        return response.content;
      },
      '优化脚本',
      { loadingMessage: '正在优化脚本...' }
    );
  }

  async translateScript(
    model: AIModel,
    settings: AIModelSettings,
    script: string,
    targetLanguage: string
  ): Promise<string> {
    return this.executeRequest(
      async () => {
        const prompt = buildTranslationPrompt(script, targetLanguage);
        const response = await this.callAPI(model, settings, prompt);
        return response.content;
      },
      '翻译脚本',
      { loadingMessage: '正在翻译脚本...' }
    );
  }

  // ─── Model queries ─────────────────────────────────────────────────────────

  getRecommendedModels(task: keyof typeof MODEL_RECOMMENDATIONS) {
    const modelIds = MODEL_RECOMMENDATIONS[task] ?? [DEFAULT_MODEL_ID];
    return AI_MODELS.filter((m) => modelIds.includes(m.id));
  }

  getModelInfo(modelId: string) {
    return AI_MODELS.find((m) => m.id === modelId) ?? null;
  }

  getAllModels() {
    return Object.values(AI_MODELS);
  }

  getDomesticModels() {
    return Object.values(AI_MODELS).filter((m) =>
      m.provider != null && (['alibaba', 'moonshot', 'zhipu', 'deepseek', 'iflytek'] as string[]).includes(m.provider)
    );
  }

  // ─── Request routing ────────────────────────────────────────────────────────

  private async callAPI(model: AIModel, settings: AIModelSettings, prompt: string): Promise<AIResponse> {
    if (!isSupportedProvider(model.provider)) {
      throw new ServiceError(`不支持的提供商: ${model.provider}`, 'UNSUPPORTED_PROVIDER');
    }

    const apiKey = settings.apiKey;
    if (!apiKey) {
      throw new ServiceError('缺少 API Key', 'MISSING_API_KEY');
    }

    const config: RequestConfig = {
      model: settings.model || model.id,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user',   content: prompt },
      ],
      temperature: settings.temperature ?? 0.7,
      max_tokens:  settings.maxTokens ?? 2000,
    };

    switch (model.provider) {
      case 'openai':    return this.retryRequest(() => callOpenAI(apiKey, config));
      case 'anthropic': return this.retryRequest(() => callAnthropic(apiKey, config));
      case 'google':    return this.retryRequest(() => callGoogle(apiKey, config));
      case 'alibaba':   return this.retryRequest(() => callAlibaba(apiKey, config));
      case 'zhipu':     return this.retryRequest(() => callZhipu(apiKey, config));
      case 'moonshot':  return this.retryRequest(() => callMoonshot(apiKey, config));
      // azure / local / custom — fall through to mock
      default:           return this.retryRequest(() => mockCall(config));
    }
  }

  // ─── Utilities ─────────────────────────────────────────────────────────────

  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseScriptSegments(content: string): ScriptSegment[] {
  const paragraphs = content.split('\n\n').filter((p) => p.trim());
  return paragraphs.map((p, index) => ({
    id: `seg_${index + 1}`,
    startTime: index * 30,
    endTime: (index + 1) * 30,
    content: p.trim(),
    type: index === 0 || index === paragraphs.length - 1 ? 'narration' : 'dialogue',
  }));
}

function estimateDuration(wordCount: number): number {
  return Math.ceil(wordCount / 150); // ~150 words/min
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const aiService = new AIService();
export default aiService;

export type { AIResponse, RequestConfig } from '@/core/services/providers';
