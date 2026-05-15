/**
 * AI Prompt 构建纯函数
 *
 * v2 增强目标：镜头级精准度 + 结构化输出
 * - 不再依赖纯文本，使用 [START:0.0s/END:12.5s] 时间戳格式
 * - 每个 segment 对应真实镜头/场景，而非等时长猜测
 * - 输出 JSON 结构，parseScriptSegments 直接解析时间戳
 */

interface SceneContext {
  startTime: number;   // 秒 (float)
  endTime: number;     // 秒 (float)
  description?: string; // 场景描述（可选，来自 visionService）
  tags?: string[];     // 场景标签，如 "产品特写" "户外" "对话"
  emotion?: string;     // 情感倾向：positive/negative/neutral/tension/excitement
}

interface SubtitleSegment {
  start_ms: number;   // 毫秒 (来自 Whisper)
  end_ms: number;
  text: string;       // 已 normalize 过的原文
}

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
  // v2 新增：镜头级上下文
  scenes?: SceneContext[];       // 场景列表（来自 visionService）
  subtitles?: SubtitleSegment[]; // Whisper 字幕（精确时间戳）
}

const STYLE_MAP: Record<string, string> = {
  professional: '专业正式',
  casual: '轻松随意',
  humorous: '幽默风趣',
  emotional: '情感共鸣',
  technical: '技术讲解',
  promotional: '营销推广',
};

const TONE_MAP: Record<string, string> = {
  formal: '正式、严肃',
  casual: '轻松、自然、口语化',
  humor: '活泼、诙谐、爱开玩笑',
  emotional: '温暖、富有感染力',
};

const LENGTH_MAP: Record<string, { time: string; words: string; charLimit: number }> = {
  short:  { time: '1-3分钟',  words: '300-500字',  charLimit: 600  },
  medium: { time: '3-5分钟',  words: '500-800字',  charLimit: 1000 },
  long:   { time: '5-10分钟', words: '800-1500字', charLimit: 2000 },
};

const OPTIMIZATION_MAP: Record<string, string> = {
  shorten:     '缩短内容，保持核心信息',
  lengthen:   '扩展内容，增加细节描述',
  simplify:   '简化语言，让内容更通俗易懂',
  professional: '提升专业性，增加行业术语',
};

/** 口语化转换规则 — 减少 AI 生成"念稿感" */
const ORAL_FLUFF_RULES = `
口语化规则（严格遵守）：
- 删除"首先""其次""最后"等书面过渡词，改用"好，咱们""接下来""然后呢"
- 删除"值得注意的是""由此可见"等官腔句式
- 专业术语后加口语化解释，如"这个叫景深（就是背景模糊的效果）"
- 数字读出来：2023年 → 二三零三年 | 50% → 一半
- 英文首字母缩写在首次出现时读全称：AI（人工智能）

【禁词检测与替换 — 必须在输出前完成】
以下词语为机械腔/书面语，生成脚本后必须自动替换为口语化表达：

禁词列表：
首先、其次、最后、值得注意的是、实际上、顾名思义、顾而、由此可见、一言以蔽之、总的来说、综上所述、显而易见、毫无疑问、不言而喻

替换规则（示例）：
- "首先" → "先" 或 "开头"
- "其次" → "然后" 或 "接下来"
- "最后" → "最后呢" 或 "最后一步"
- "值得注意的是" → "重点来了" 或 "需要注意的是"
- "实际上" → "其实" 或 "说实话"
- "顾而言之" → "从名字就能看出来"
- "顾而" → "所以"
- "由此可见" → "这么一看"
- "一言以蔽之" → "简单来说"
- "总的来说" → "整体来看" 或 "综合来讲"
- "综上所述" → "总的来说"
- "显而易见" → "一眼就能看出来"
- "毫无疑问" → "说实话"
- "不言而喻" → "不用说大家都知道"

【强制要求】：生成完整脚本后，逐句扫描上述禁词，全部替换为口语化表达后再返回。
`;

export function buildSystemPrompt(): string {
  return `你是一个专业的视频内容创作助手，擅长生成自然、口语化、有感染力的视频解说脚本。

核心原则：
1. 口语优先：脚本是"说"的，不是"读"的。每句话在心里默念一遍，确保顺口。
2. 时间戳精准：每个镜头对应精确的文案，不跳脱、不留白。
3. 情绪锚点：配合画面情感调整语气——高潮处加大张力，低谷处放缓节奏。
4. 观众视角：想象你正在对朋友介绍这个内容，而不是对着镜头念稿。`;
}

export function buildScriptPrompt(params: ScriptPromptParams): string {
  const length = LENGTH_MAP[params.length] ?? LENGTH_MAP['medium'];
  const toneGuidance = TONE_MAP[params.tone] ?? TONE_MAP['casual'];

  // ── 镜头级上下文构建 ────────────────────────────────────────────────────────
  let sceneContextBlock = '';
  if (params.scenes && params.scenes.length > 0) {
    const sceneLines = params.scenes.map((s, i) => {
      const tagStr = s.tags?.length ? ` [标签: ${s.tags.join('/')}]` : '';
      const emoStr = s.emotion ? ` [情感: ${s.emotion}]` : '';
      const descStr = s.description ? ` "${s.description}"` : '';
      const startFmt = formatSec(s.startTime);
      const endFmt = formatSec(s.endTime);
      return `[镜头${i + 1}] ${startFmt} → ${endFmt}${tagStr}${emoStr}${descStr}`;
    });
    sceneContextBlock = `\n\n视频镜头序列（共${params.scenes.length}个镜头，按时间顺序）：\n${sceneLines.join('\n')}`;
  }

  // ── Whisper 字幕上下文构建 ─────────────────────────────────────────────────
  let subtitleContextBlock = '';
  if (params.subtitles && params.subtitles.length > 0) {
    const snippet = params.subtitles
      .slice(0, 20)
      .map((s) => `[${(s.start_ms / 1000).toFixed(1)}s] ${s.text}`)
      .join('\n');
    subtitleContextBlock = `\n\n视频语音字幕（已预处理，前20条）：\n${snippet}${params.subtitles.length > 20 ? `\n...（共${params.subtitles.length}条字幕）` : ''}`;
  }

  // ── 关键词语境增强 ────────────────────────────────────────────────────────
  const keywordBlock = params.keywords?.length
    ? `\n内容关键词（请在对应镜头处自然融入）：${params.keywords.join('、')}`
    : '';

  // ── 时长校准 ─────────────────────────────────────────────────────────────
  const durationHint = params.videoDuration
    ? `\n视频总时长：${Math.round(params.videoDuration / 60)}分${Math.round(params.videoDuration % 60)}秒`
    : '';

  return `请为以下视频生成专业解说脚本。

## 基本信息
主题：${params.topic}
目标风格：${STYLE_MAP[params.style] || params.style}
语气：${toneGuidance}
目标长度：${length.time}（约${length.words}）
目标受众：${params.audience}${durationHint}${keywordBlock}
${params.requirements ? `\n特殊要求：${params.requirements}` : ''}
${ORAL_FLUFF_RULES}${sceneContextBlock}${subtitleContextBlock}

## 输出格式要求（严格遵守）
请以 JSON 数组格式返回，每条记录对应一个镜头/段落：

[
  {
    "start": 0.0,      // 开始时间（秒，浮点数）
    "end": 12.5,       // 结束时间（秒，浮点数）
    "type": "narration",  // 类型：narration（旁白）| dialogue（对话）| intro（开场白）| outro（结束语）
    "content": "这里是口播文案，保持自然流畅，适合录音直接使用。"
  },
  ...
]

写作规范：
1. start/end 必须精确，尽量与镜头边界对齐${params.scenes ? '（参考上方镜头序列）' : ''}
2. content 每条不超过 ${length.charLimit} 字
3. 开头部（intro）放在最前，结尾部（outro）放在最后
4. 内容按时间顺序排列，不要有重叠
5. 对话类内容在 content 中用【对话】标签开头
6. 如果某个时间段无合适内容，用"（画面描述+简短旁白）"填充，不可留白
7. 语气标签开头：如 [轻松] [激动] [低沉] [幽默] — 帮助后续 TTS 调节语速
8. 禁止使用：括号内解释、书面过渡词（首先/其次/最后）、表情符号`;
}

/** 辅助：秒 → "M:SS" 格式 */
function formatSec(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1);
  return `${m}:${s.padStart(4, '0')}`;
}

export { formatSec };

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
