/**
 * 步骤 3: 脚本创作
 * AnalysisResult → Script（LLM 生成解说词）
 */

import type { PipelineStep, PipelineDataContext } from '../engine';
import type { AnalysisResult, Script, ScriptSegment, ScriptStylePreset } from '@/types';
import type { ModelProvider } from '@/types/analysis';
import type { ScriptGenerationSettings } from '@/core/services/ai/script/prompt-builder';
import { generateScriptWithModel } from '@/core/services/ai/script-service';
import { resolveLegacyModel } from '@/core/services/ai/ai-model-adapter';

export interface ScriptStepConfig {
  style?: ScriptStylePreset;
  provider?: ModelProvider;
  apiKey?: string;
}

export const createScriptStep = (config: ScriptStepConfig): PipelineStep<AnalysisResult, Script> => ({
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

    // 调用 LLM 生成脚本
    const model = resolveLegacyModel(provider);
    // NOTE: AnalysisResult.emotions 字段是 EmotionAnalysis (emotion/confidence/intensity),
    //       但 generateScriptWithModel 期望 AnalysisEmotion (type/intensity)。
    //       字段名不同 (emotion→type, confidence→丢弃) 属于 pre-existing type
    //       drift, 跟 lint 修复 scope 正交 — 用 cast 标记此处需要后续适配。
    const analysisInput = {
      keyMoments: analysis.scenes?.map(s => ({
        timestamp: s.startTime,
        description: s.description ?? s.type,
        importance: s.score,
      })),
      emotions: analysis.emotions?.map(e => ({
        timestamp: e.timestamp,
        type: e.emotion ?? 'neutral',
        intensity: e.intensity ?? 0.5,
      })),
      summary: `共 ${analysis.stats?.sceneCount ?? 0} 个场景`,
    };
    const settings: Pick<ScriptGenerationSettings, 'style'> = {
      style: style as ScriptGenerationSettings['style'],
    };
    const scriptText = await generateScriptWithModel(model, apiKey!, analysisInput, settings);

    // 解析脚本为片段
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
