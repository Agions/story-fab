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
      // v2 新增
      scenes?: Array<{ startTime: number; endTime: number; description?: string; tags?: string[]; emotion?: string }>;
      subtitles?: Array<{ start_ms: number; end_ms: number; text: string }>;
    }
  ): Promise<ScriptData> {
    return this.executeRequest(
      async () => {
        const prompt = buildScriptPrompt(params);
        const response = await this.callAPI(model, settings, prompt);
        const segments = parseScriptSegments(response.content);

        return {
          id: `script_${Date.now()}`,
          title: params.topic,
          content: response.content,
          segments,
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
          ? keyframesResult.value.map((k, index) => ({
              id: k.id || `kf_${index}`,
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

// ─── Script segment parsing ────────────────────────────────────────────────────

/** Try parse AI JSON output → timestamped segments; fallback to paragraph parsing */
function parseScriptSegments(content: string): ScriptSegment[] {
  // Strategy 1: parse JSON (v2 structured output from AI)
  const segments = tryParseJsonSegments(content);
  if (segments.length > 0) return segments;

  // Strategy 2: parse timestamped lines like [0:00] or [00:00:00]
  const timestamped = tryParseTimestampedLines(content);
  if (timestamped.length > 0) return timestamped;

  // Strategy 3: fallback — equal-duration paragraph split (v1 behavior)
  const paragraphs = content.split(/\n{2,}/).filter((p) => p.trim());
  return paragraphs.map((p, index) => ({
    id: `seg_${index + 1}`,
    startTime: index * 30,
    endTime: (index + 1) * 30,
    content: p.trim(),
    type: index === 0 ? 'intro' : index === paragraphs.length - 1 ? 'outro' : 'narration',
  }));
}

interface JsonSegment {
  start: number;
  end: number;
  type?: string;
  content: string;
}

function tryParseJsonSegments(content: string): ScriptSegment[] {
  try {
    // Extract JSON block from AI response (might be wrapped in ```json ... ```)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ?? content.match(/(\[[\s\S]*\])/);
    const jsonStr = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : content;
    const trimmed = jsonStr.trim();
    if (!trimmed.startsWith('[')) return [];

    const parsed: JsonSegment[] = JSON.parse(trimmed);
    if (!Array.isArray(parsed) || parsed.length === 0) return [];

    return parsed.map((item, index) => ({
      id: `seg_${index + 1}`,
      startTime: typeof item.start === 'number' ? item.start : index * 30,
      endTime: typeof item.end === 'number' ? item.end : (index + 1) * 30,
      content: typeof item.content === 'string' ? item.content.trim() : String(item.content ?? '').trim(),
      type: mapSegmentType(item.type),
    }));
  } catch {
    return [];
  }
}

/** Parse lines like "[0:00] 开场白" or "[00:00:00] content" */
function tryParseTimestampedLines(content: string): ScriptSegment[] {
  // Match [M:SS], [M:SS.s], [HH:MM:SS], [HH:MM:SS.s] patterns
  const timeTagRegex = /\[(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?\]/g;
  const lines = content.split('\n').filter((l) => l.trim());
  const segments: ScriptSegment[] = [];

  for (const line of lines) {
    const matches = Array.from(line.matchAll(timeTagRegex));
    if (matches.length === 0) continue;

    const firstMatch = matches[0];
    const startSec = parseTimeTag(firstMatch);
    const text = line.replace(timeTagRegex, '').trim();
    if (!text) continue;

    // Estimate end from next line's start or assume 30s
    segments.push({
      id: `seg_${segments.length + 1}`,
      startTime: startSec,
      endTime: startSec + 30,
      content: text,
      type: 'narration',
    });
  }

  // Fill in endTime from next segment's startTime
  for (let i = 0; i < segments.length - 1; i++) {
    segments[i].endTime = segments[i + 1].startTime;
  }

  return segments;
}

function parseTimeTag(match: RegExpMatchArray): number {
  const parts = match.slice(1).filter(Boolean).map(Number);
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    // M:SS.s or M:SS
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function mapSegmentType(t?: string): ScriptSegment['type'] {
  if (!t) return 'narration';
  const lower = t.toLowerCase();
  if (['intro', 'opening', '开场'].some((k) => lower.includes(k))) return 'intro';
  if (['outro', 'ending', '结尾'].some((k) => lower.includes(k))) return 'outro';
  if (['dialogue', 'dialog', '对话'].some((k) => lower.includes(k))) return 'dialogue';
  return 'narration';
}

function estimateDuration(wordCount: number): number {
  return Math.ceil(wordCount / 150); // ~150 words/min
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export const aiService = new AIService();
export default aiService;

export type { AIResponse, RequestConfig } from '@/core/services/providers';
