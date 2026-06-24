/**
 * 提示词构建器
 * 职责：根据分析结果和设置生成 AI 提示词
 *
 * 重构说明：
 * - 从原 scriptService.ts (548行) 中提取提示词构建逻辑
 * - 职责单一，便于维护和测试
 */

import { STYLE_GUIDANCE_MAP, TONE_GUIDANCE_MAP } from './aiModelConfigs';

// ============================================
// 类型定义
// ============================================

interface AnalysisMoment {
  timestamp: number;
  description: string;
  importance: number;
}

interface AnalysisEmotion {
  timestamp: number;
  type: string;
  intensity: number;
}

export interface AnalysisInput {
  keyMoments?: AnalysisMoment[];
  emotions?: string[] | AnalysisEmotion[];
  summary?: string;
  title?: string;
  duration?: number;
}

export interface ScriptGenerationSettings {
  style?: 'informative' | 'entertaining' | 'dramatic' | 'casual';
  tone?: 'neutral' | 'enthusiastic' | 'serious' | 'humorous' | 'inspirational';
  targetLength?: number;
  instruction?: string;
}

// ============================================
// 提示词构建
// ============================================

/**
 * 构建脚本生成提示词
 * @param analysis 视频分析数据
 * @param options 生成设置
 * @returns 完整的提示词
 */
export function buildScriptPrompt(analysis: AnalysisInput, options?: ScriptGenerationSettings): string {
  const { keyMoments = [], emotions = [], summary, title, duration } = analysis;

  // 格式化关键时刻
  const keyMomentsText = keyMoments
    .map(
      (m) =>
        `时间点: ${Math.floor(m.timestamp / 60)}分${m.timestamp % 60}秒, 描述: ${m.description}, 重要性: ${m.importance}/10`
    )
    .join('\n');

  // 格式化情感标记
  const emotionsText = emotions
    .map((e) => {
      if (typeof e === 'string') return e;
      return `时间点: ${Math.floor(e.timestamp / 60)}分${e.timestamp % 60}秒, 情感: ${e.type}, 强度: ${e.intensity}`;
    })
    .join('\n');

  // 获取风格和语气指导
  const styleGuidance = getStyleGuidance(options?.style);
  const toneGuidance = getToneGuidance(options?.tone);

  return `请根据以下视频分析信息，为我创建一个视频解说脚本。

${title ? `视频标题: ${title}\n` : ''}${duration ? `时长: ${duration}秒\n` : ''}
视频摘要:
${summary || '无'}

关键时刻:
${keyMomentsText || '无'}

情感标记:
${emotionsText || '无'}

要求:
1. ${styleGuidance}
2. ${toneGuidance}
3. 每个段落应包含时间戳，格式为 [分:秒]
4. 脚本应当分段呈现，每段对应视频中的一个场景或主题
5. 脚本总长度应当适合视频时长，保持流畅自然
6. 请确保脚本语言生动，能够吸引观众注意力
7. 【重要】避免AI机械口吻：用自然的断句和语序，不使用"首先...其次...最后"这种僵硬结构
8. 【重要】使用自然过渡词：如"说到这里"、"接下来"、"值得注意的是"等，不用"第一点"、"第二点"
9. 【重要】口语化表达：用短句和感叹增加活力，但保持逻辑连贯
10. 【重要】前后呼应：每个段落结束时可用简短句子为下一段做铺垫

请直接返回分段的脚本内容，不要包含其他解释。每个段落前使用时间戳标记，例如 [00:10]。
`;
}

/**
 * 获取风格指导
 */
function getStyleGuidance(style?: string): string {
  if (style && Object.prototype.hasOwnProperty.call(STYLE_GUIDANCE_MAP, style)) {
    return STYLE_GUIDANCE_MAP[style as keyof typeof STYLE_GUIDANCE_MAP];
  }
  return '请生成一个专业、信息丰富的解说脚本';
}

/**
 * 获取语气指导
 */
function getToneGuidance(tone?: string): string {
  if (tone && Object.prototype.hasOwnProperty.call(TONE_GUIDANCE_MAP, tone)) {
    return TONE_GUIDANCE_MAP[tone as keyof typeof TONE_GUIDANCE_MAP];
  }
  return '使用中立、专业的语气';
}
