/**
 * 步骤 3: 脚本创作
 * AnalysisResult → Script（LLM 生成解说词）
 */

import type { PipelineStep, PipelineDataContext } from '../engine';
import type { AnalysisResult, Script, ScriptSegment, ScriptStylePreset } from '@/types';
import type { ModelProvider } from '@/types';
import {
  generateScriptWithModel,
  type AnalysisInput,
  type ScriptGenerationSettings,
} from '@/core/services/ai/script-service';
import { resolveLegacyModel } from '@/core/services/ai/ai-model-adapter';

export interface ScriptStepConfig {
  style?: ScriptStylePreset;
  provider?: string;
  apiKey?: string;
}

export const createScriptStep = (
  config: ScriptStepConfig
): PipelineStep<AnalysisResult, Script> => ({
  name: 'script',

  validate(input) {
    if (!input?.scenes?.length) {
      return { valid: false, reason: '分析结果为空，无法生成脚本' };
    }
    if (!config.apiKey) {
      return { valid: false, reason: '未配置 AI API Key' };
    }
    return { valid: true };
  },

  async execute(analysis: AnalysisResult, ctx: PipelineDataContext): Promise<Script> {
    const { style = 'informative', apiKey, provider = 'openai' } = config;

    const model = resolveLegacyModel(provider as ModelProvider);
    // Map EmotionAnalysis[] → AnalysisEmotion[] (drop confidence, rename emotion→type)
    // AnalysisInput.emotions only accepts string[] | { type, intensity }[]
    const analysisInput: AnalysisInput = {
      keyMoments: analysis.scenes?.map(s => ({
        timestamp: s.startTime,
        description: s.description ?? s.type,
        importance: s.score,
      })),
      emotions: analysis.emotions?.map(e => ({
        timestamp: e.timestamp,
        type: e.emotion ?? e.dominant ?? 'neutral',
        intensity: e.intensity ?? e.confidence ?? 0,
      })),
      summary: `共 ${analysis.stats?.sceneCount ?? 0} 个场景`,
    };
    const scriptText = await generateScriptWithModel(model, apiKey!, analysisInput, {
      style: style as ScriptGenerationSettings['style'],
    });

    const segments = parseScriptSegments(scriptText, analysis);

    return {
      id: `script_${ctx.projectId}`,
      segments,
      totalDuration: analysis.stats?.totalDuration,
      language: 'zh-CN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
});

// ─── 辅助函数 ───

function parseScriptSegments(scriptText: string, analysis: AnalysisResult): ScriptSegment[] {
  // 简单的段落分割逻辑
  const paragraphs = scriptText.split('\n\n').filter(p => p.trim());
  const totalDuration = analysis.stats?.totalDuration ?? 0;
  const segmentDuration = totalDuration / Math.max(paragraphs.length, 1);

  return paragraphs.map((text, index) => ({
    id: `seg_${index}`,
    startTime: index * segmentDuration,
    endTime: (index + 1) * segmentDuration,
    content: text.trim(),
    text: text.trim(),
    type: 'narration' as const,
  }));
}
