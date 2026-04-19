/**
 * AI Prompt 构建纯函数
 */

interface ScriptPromptParams {
  topic: string;
  style: string;
  tone: string;
  length: string;
  audience: string;
  language: string;
  keywords?: string[];
  requirements?: string;
  videoDuration?: number;
}

const STYLE_MAP: Record<string, string> = {
  professional: '专业正式',
  casual: '轻松随意',
  humorous: '幽默风趣',
  emotional: '情感共鸣',
  technical: '技术讲解',
  promotional: '营销推广',
};

const LENGTH_MAP: Record<string, { time: string; words: string }> = {
  short:  { time: '1-3分钟',  words: '300-500字'  },
  medium: { time: '3-5分钟',  words: '500-800字'  },
  long:   { time: '5-10分钟', words: '800-1500字' },
};

const OPTIMIZATION_MAP: Record<string, string> = {
  shorten:     '缩短内容，保持核心信息',
  lengthen:   '扩展内容，增加细节描述',
  simplify:   '简化语言，让内容更通俗易懂',
  professional: '提升专业性，增加行业术语',
};

const SYSTEM_PROMPT = '你是一个专业的视频内容创作助手，擅长生成高质量的解说脚本。';

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildScriptPrompt(params: ScriptPromptParams): string {
  const length = LENGTH_MAP[params.length] ?? LENGTH_MAP['medium'];
  return `请为以下主题生成一个视频解说脚本：

主题：${params.topic}
风格：${STYLE_MAP[params.style] || params.style}
语气：${params.tone}
长度：${length.time}（约${length.words}）
目标受众：${params.audience}
语言：中文
${params.keywords?.length ? `关键词：${params.keywords.join('、')}` : ''}
${params.requirements ? `特殊要求：${params.requirements}` : ''}
${params.videoDuration ? `视频时长：${Math.round(params.videoDuration / 60)}分钟` : ''}

请生成一个结构完整的脚本，包含：
1. 开场白（吸引观众注意）
2. 主体内容（分段阐述）
3. 结尾（总结和互动）

要求：
- 语言自然流畅，适合口语表达
- 段落清晰，便于分段录制
- 适当使用过渡语句
- 包含互动引导（提问、引导评论等）

请直接返回脚本内容，不需要额外的解释。`;
}

export function buildAnalysisPrompt(videoInfo: {
  duration: number;
  width: number;
  height: number;
  format: string;
}): string {
  return `请分析以下视频的基本信息：

时长：${Math.round(videoInfo.duration / 60)}分钟
分辨率：${videoInfo.width}x${videoInfo.height}
格式：${videoInfo.format}

请提供：
1. 视频内容摘要（100字以内）
2. 建议的脚本风格
3. 目标受众分析
4. 内容亮点建议

请直接返回分析结果。`;
}

export function buildOptimizationPrompt(script: string, optimization: string): string {
  return `请对以下脚本进行优化：

优化目标：${OPTIMIZATION_MAP[optimization] ?? optimization}

原脚本：
${script}

请直接返回优化后的脚本内容。`;
}

export function buildTranslationPrompt(script: string, targetLanguage: string): string {
  return `请将以下脚本翻译成${targetLanguage}，保持原有的语气和风格：

${script}

请直接返回翻译后的内容，不要添加解释。`;
}
