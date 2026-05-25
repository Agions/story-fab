# Script Generation Design
# LLM 解说词生成原理

> Commentary Mode 的文案创作核心 — 基于多阶段 prompt 工程和质量控制

---

## 1. 概述

### 1.1 什么是 Script Generation？

Script Generation 是将视频的语义内容（SemanticSegment）转化为吸引人的解说词的过程。它不仅仅是"描述画面"，而是需要：
- 理解剧情走向和人物关系
- 用符合目标平台（抖音/B站）的语言风格写作
- 控制节奏（快慢适中、重点突出）
- 制造悬念/情感共鸣

### 1.2 与传统文案生成的差异

| 维度 | 传统文案 | Commentary Script |
|------|---------|-------------------|
| 输入 | 主题/关键词 | 视频语义（剧情+人物+情绪） |
| 约束 | 字数限制 | 时间轴约束（必须适配视频片段时长） |
| 风格 | 通用 | 平台定制（抖音梗/B站风） |
| 输出 | 纯文本 | 结构化 JSON（文本+时间+重音） |

---

## 2. 生成流程

### 2.1 整体 Pipeline

```
SemanticSegment
     │
     ▼
┌─────────────────┐
│ Context Builder │  构建 prompt 上下文
└────────┬────────┘
         ▼
┌─────────────────┐
│  Prompt Engine  │  选择/组合 prompt 模板
└────────┬────────┘
         ▼
┌─────────────────┐
│   LLM Call      │  调用 AI（DeepSeek V4-Pro 推荐）
└────────┬────────┘
         ▼
┌─────────────────┐
│ Output Parser   │  解析 JSON + 验证
└────────┬────────┘
         ▼
┌─────────────────┐
│ Quality Check   │  时长/质量验证
└────────┬────────┘
         ▼
   CommentaryScript
```

### 2.2 各阶段详解

#### Stage 1: Context Builder（上下文构建）

```typescript
interface SegmentContext {
  // 视频信息
  video: {
    title: string;
    duration_ms: number;
    genre: string;          // "短剧" | "电影" | "综艺" | "纪录片"
  };

  // 片段信息
  segment: {
    index: number;
    start_ms: number;
    end_ms: number;
    duration_ms: number;
    plot_summary: string;
    characters: string[];
    emotional_tone: string;
    highlight_potential: number;
  };

  // 叙事上下文
  narrative: {
    previous_script: string | null;  // 前一段解说词（用于连贯性）
    characters_so_far: string[];    // 到现在为止出现过的角色
    story_arc: string;                // 整体故事主线
  };

  // 输出约束
  constraints: {
    target_duration_ms: number;       // 目标朗读时长
    min_duration_ms: number;          // 最少时长
    max_duration_ms: number;          // 最大时长
    style: CommentaryStyle;
  };
}

function buildContext(
  segment: SemanticSegment,
  narrative: NarrativeContext,
  config: CommentarProjectConfig
): SegmentContext {
  return {
    video: {
      title: config.title,
      duration_ms: config.duration_ms,
      genre: detectGenre(segment),
    },
    segment: {
      index: segment.index,
      start_ms: segment.start_ms,
      end_ms: segment.end_ms,
      duration_ms: segment.end_ms - segment.start_ms,
      plot_summary: segment.plot_summary,
      characters: segment.characters,
      emotional_tone: segment.emotional_tone,
      highlight_potential: segment.highlight_potential,
    },
    narrative: {
      previous_script: narrative.previousScript,
      characters_so_far: narrative.charactersSoFar,
      story_arc: narrative.storyArc,
    },
    constraints: {
      target_duration_ms: estimateTargetDuration(segment),
      min_duration_ms: Math.max(3000, segment.duration_ms * 0.3),
      max_duration_ms: Math.min(segment.duration_ms * 1.5, 60000),
      style: config.commentary_style,
    },
  };
}
```

#### Stage 2: Prompt Engine（Prompt 工程）

```typescript
// Prompt 模板库
const PROMPT_TEMPLATES = {
  // 开场模板
  intro: `
你是一位抖音影视解说博主，擅长用极具吸引力的话语开场。

## 视频信息
标题：{title}
类型：{genre}

## 开场要求
- 前3秒必须抓眼球（制造悬念/震惊/好奇）
- 不要废话，直接进入主题
- 可以使用"没想到..."、"当...的时候..."、"原来..."等句式
- 字数：{target_chars} 字左右

## 风格
{style_description}

## 输出格式（JSON）
{{
  "script": "解说词正文（不要加引号）",
  "opening_hook": "抓眼球的前3秒内容",
  "target_chars": {target_chars}
}}
`,

  // 主体段落模板
  act: `
你是一位抖音影视解说博主，擅长讲述引人入胜的故事。

## 视频片段信息
- 时间：{start_time} - {end_time}
- 时长：{segment_duration} 秒
- 剧情：{plot_summary}
- 出现角色：{characters}
- 情绪基调：{emotional_tone}

## 前一段解说（用于连贯）
{previous_script}

## 已出场角色（避免重复介绍）
{characters_so_far}

## 本段要求
- 节奏：{pacing}
- 语气：{tone}
- 重点：{emphasis}
- 时长：约 {target_duration} 秒

## 风格
{style_description}

## 输出格式（JSON）
{{
  "script": "解说词正文...",
  "reading_time_ms": {reading_time_ms},
  "emphasis_positions": [数字数组，表示重音位置的字符偏移],
  "keywords_to_highlight": ["关键词1", "关键词2"]
}}
`,

  // 结尾模板
  outro: `
你是一位抖音影视解说博主，擅长在结尾制造悬念和引导互动。

## 视频信息
标题：{title}

## 故事主线
{story_arc}

## 结尾要求
- 总结本集核心看点
- 留下悬念（"下集会..."、"没想到的是..."）
- 引导互动（"评论区告诉我..."、"你们觉得..."）
- 字数：{target_chars} 字左右

## 风格
{style_description}

## 输出格式（JSON）
{{
  "script": "解说词正文...",
  "call_to_action": "结尾引导语",
  "cliffhanger": "悬念设置"
}}
`,

  // 通用模板
  generic: `
你是一位专业的影视解说员。

## 片段信息
- 时间：{start_time} - {end_time}
- 时长：{segment_duration} 秒
- 剧情：{plot_summary}
- 角色：{characters}
- 情绪：{emotional_tone}

## 约束
- 目标时长：约 {target_duration} 秒
- 风格：{style_description}

## 输出格式（JSON）
{{
  "script": "解说词正文...",
  "reading_time_ms": 估算朗读时长（毫秒）,
  "emphasis_positions": [重音位置],
  "keywords_to_highlight": [重点词]
}}
`,
};

function buildPrompt(
  context: SegmentContext,
  templateType: 'intro' | 'act' | 'outro' | 'generic'
): string {
  const template = PROMPT_TEMPLATES[templateType];

  return template
    .replace('{title}', context.video.title)
    .replace('{genre}', context.video.genre)
    .replace('{start_time}', msToTime(context.segment.start_ms))
    .replace('{end_time}', msToTime(context.segment.end_ms))
    .replace('{segment_duration}', String(Math.round(context.segment.duration_ms / 1000)))
    .replace('{plot_summary}', context.segment.plot_summary)
    .replace('{characters}', context.segment.characters.join('、') || '未知角色')
    .replace('{emotional_tone}', context.segment.emotional_tone)
    .replace('{previous_script}', context.narrative.previous_script || '（无前文）')
    .replace('{characters_so_far}', context.narrative.characters_so_far.join('、') || '无')
    .replace('{story_arc}', context.narrative.story_arc || '待补充')
    .replace('{pacing}', context.constraints.style.default_pacing)
    .replace('{tone}', context.constraints.style.default_tone)
    .replace('{emphasis}', context.constraints.style.emphasis || '突出关键信息')
    .replace('{target_chars}', String(Math.round(context.constraints.target_duration_ms / 50)))
    .replace('{target_duration}', String(Math.round(context.constraints.target_duration_ms / 1000)))
    .replace('{style_description}', buildStyleDescription(context.constraints.style))
    .replace('{reading_time_ms}', String(estimateReadingTime(context)));
}

function buildStyleDescription(style: CommentaryStyle): string {
  return `
风格类型：${style.name}
语气：${style.default_tone}
语速：${style.default_pacing}
特点：${style.description || '无特殊要求'}
`.trim();
}
```

#### Stage 3: LLM Call（AI 调用）

```typescript
interface LLMCallOptions {
  model: string;
  temperature: number;
  max_tokens: number;
  retry: number;
}

const DEFAULT_LLM_OPTIONS: LLMCallOptions = {
  model: 'deepseek-v4-pro',      // 性价比最高
  temperature: 0.7,              // 适度创意
  max_tokens: 2000,             // 单段解说词不会太长
  retry: 3,                      // 失败重试3次
};

async function callLLM(
  prompt: string,
  options: Partial<LLMCallOptions> = {}
): Promise<string> {
  const opts = { ...DEFAULT_LLM_OPTIONS, ...options };

  for (let attempt = 0; attempt < opts.retry; attempt++) {
    try {
      const response = await apiProvider.chat({
        model: opts.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: opts.temperature,
        max_tokens: opts.max_tokens,
      });

      return response.content;
    } catch (error) {
      if (isRateLimitError(error)) {
        // 指数退避
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }

      if (attempt === opts.retry - 1) {
        throw new ScriptGenerationError(`LLM 调用失败: ${error}`);
      }
    }
  }

  throw new ScriptGenerationError('LLM 调用超过最大重试次数');
}
```

#### Stage 4: Output Parser（输出解析）

```typescript
interface ParsedScript {
  script: string;
  reading_time_ms: number;
  emphasis_positions: number[];
  keywords_to_highlight: string[];
}

function parseScriptOutput(
  rawOutput: string,
  context: SegmentContext
): ParsedScript {
  // 1. 提取 JSON
  const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new ParseError('无法解析 LLM 输出为 JSON');
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new ParseError(`JSON 解析失败: ${jsonMatch[0].substring(0, 100)}`);
  }

  // 2. 验证必需字段
  if (!parsed.script || typeof parsed.script !== 'string') {
    throw new ParseError('缺少 script 字段');
  }

  // 3. 计算朗读时长（如果 LLM 没返回）
  const readingTimeMs = parsed.reading_time_ms
    || estimateReadingTimeFromText(parsed.script);

  // 4. 返回标准化结果
  return {
    script: parsed.script.trim(),
    reading_time_ms: readingTimeMs,
    emphasis_positions: Array.isArray(parsed.emphasis_positions)
      ? parsed.emphasis_positions
      : [],
    keywords_to_highlight: Array.isArray(parsed.keywords_to_highlight)
      ? parsed.keywords_to_highlight
      : [],
  };
}

function estimateReadingTimeFromText(script: string): number {
  // 中文字符约 3.5 字/秒
  const charCount = script.length;
  return Math.round((charCount / 3.5) * 1000);
}
```

#### Stage 5: Quality Check（质量检查）

```typescript
interface QualityResult {
  passed: boolean;
  issues: QualityIssue[];
  adjusted_script?: string;
  adjusted_duration_ms?: number;
}

interface QualityIssue {
  type: 'too_short' | 'too_long' | 'repetitive' | 'off_topic';
  severity: 'error' | 'warning';
  message: string;
  fix_suggestion?: string;
}

function checkQuality(
  script: ParsedScript,
  context: SegmentContext
): QualityResult {
  const issues: QualityIssue[] = [];

  // 1. 时长检查
  const durationDiff = script.reading_time_ms - context.constraints.target_duration_ms;
  const durationRatio = Math.abs(durationDiff) / context.constraints.target_duration_ms;

  if (durationRatio > 0.3) {
    if (script.reading_time_ms < context.constraints.min_duration_ms) {
      issues.push({
        type: 'too_short',
        severity: 'error',
        message: `解说时长 ${script.reading_time_ms}ms 低于最低要求 ${context.constraints.min_duration_ms}ms`,
        fix_suggestion: '请补充更多内容或调整语速',
      });
    } else if (script.reading_time_ms > context.constraints.max_duration_ms) {
      issues.push({
        type: 'too_long',
        severity: 'error',
        message: `解说时长 ${script.reading_time_ms}ms 超过最高限制 ${context.constraints.max_duration_ms}ms`,
        fix_suggestion: '请精简内容或放慢语速',
      });
    }
  } else if (durationRatio > 0.15) {
    issues.push({
      type: durationDiff > 0 ? 'too_long' : 'too_short',
      severity: 'warning',
      message: `解说时长偏差 ${Math.round(durationRatio * 100)}%，建议调整`,
    });
  }

  // 2. 重复检查
  const repetitivePatterns = detectRepetitivePatterns(script.script);
  if (repetitivePatterns.length > 0) {
    issues.push({
      type: 'repetitive',
      severity: 'warning',
      message: `检测到重复句式: ${repetitivePatterns.join(', ')}`,
      fix_suggestion: '请换一种表达方式',
    });
  }

  // 3. 主题相关性检查
  const relevanceScore = calculateRelevance(script.script, context.segment.plot_summary);
  if (relevanceScore < 0.5) {
    issues.push({
      type: 'off_topic',
      severity: 'warning',
      message: '解说词可能偏离原视频内容',
    });
  }

  return {
    passed: !issues.some(i => i.severity === 'error'),
    issues,
  };
}
```

---

## 3. 全局连贯性保证

### 3.1 上下文传递

```typescript
interface NarrativeContext {
  previousScript: string | null;
  charactersSoFar: string[];
  storyArc: string;
  sceneCount: number;
}

async function generateScriptsWithCoherence(
  segments: SemanticSegment[],
  config: CommentarProjectConfig,
  apiProvider: AIProviderService
): Promise<CommentaryScript[]> {
  const scripts: CommentaryScript[] = [];
  let narrativeContext: NarrativeContext = {
    previousScript: null,
    charactersSoFar: [],
    storyArc: buildStoryArc(segments),
    sceneCount: 0,
  };

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isIntro = i === 0;
    const isOutro = i === segments.length - 1;
    const templateType = isIntro ? 'intro' : (isOutro ? 'outro' : 'act');

    // 构建当前片段上下文
    const context = buildContext(seg, narrativeContext, config);

    // 生成 prompt
    const prompt = buildPrompt(context, templateType);

    // 调用 LLM
    const rawOutput = await callLLM(prompt);
    const parsed = parseScriptOutput(rawOutput, context);

    // 质量检查
    const quality = checkQuality(parsed, context);
    if (!quality.passed) {
      // 尝试自动修复
      const fixed = await autoFixScript(parsed, context, quality.issues);
      scripts.push(fixed);
    } else {
      scripts.push(parsed);
    }

    // 更新 narrative context
    narrativeContext = {
      previousScript: scripts[i].script,
      charactersSoFar: union(
        narrativeContext.charactersSoFar,
        seg.characters
      ),
      storyArc: narrativeContext.storyArc,
      sceneCount: i + 1,
    };
  }

  return scripts;
}
```

### 3.2 角色跟踪

```typescript
function trackCharacters(
  segments: SemanticSegment[],
  scripts: CommentaryScript[]
): CharacterTrack[] {
  const characterMap = new Map<string, CharacterTrack>();

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const script = scripts[i];

    for (const char of seg.characters) {
      if (!characterMap.has(char)) {
        characterMap.set(char, {
          name: char,
          first_appearance: i,
          appearances: [],
        });
      }

      characterMap.get(char)!.appearances.push({
        segment_index: i,
        script_excerpt: extractCharacterMention(script.script, char),
      });
    }
  }

  return Array.from(characterMap.values());
}

function buildStoryArc(segments: SemanticSegment[]): string {
  // 从 segments 提取故事主线
  const summaries = segments.map(s => s.plot_summary);
  return summaries.join(' → ');
}
```

---

## 4. CommentaryStyle（风格定义）

### 4.1 内置风格

```typescript
const COMMENTARY_STYLES: Record<string, CommentaryStyle> = {
  // 幽默风格（抖音常见）
  humorous: {
    id: 'humorous',
    name: '幽默版',
    default_tone: '幽默诙谐',
    default_pacing: 'fast',
    description: '用搞笑的语言解说，适合喜剧/搞笑视频，添加网络梗和流行语',
    opening_patterns: [
      '没想到吧...',
      '当你以为...的时候...',
      '这操作，就离谱！',
      '笑死，原来...',
    ],
    emphasis_keywords: ['绝', '服了', '离谱', '搞笑'],
  },

  // 接地气风格
  colloquial: {
    id: 'colloquial',
    name: '接地气版',
    default_tone: '口语化',
    default_pacing: 'normal',
    description: '用最日常的话解说，像和朋友聊天一样，适合情感/生活类视频',
    opening_patterns: [
      '说起来...',
      '你们有没有遇到过...',
      '这个事吧...',
    ],
    emphasis_keywords: ['真的', '其实', '就是'],
  },

  // 震惊风格
  shocking: {
    id: 'shocking',
    name: '震惊版',
    default_tone: '震惊夸张',
    default_pacing: 'fast',
    description: '用震惊的语气解说，制造悬念，适合悬疑/复仇类短剧',
    opening_patterns: [
      '天哪！没想到...',
      '震惊！原来...',
      '恐怖！这个女人...',
      '不敢相信自己的眼睛...',
    ],
    emphasis_keywords: ['震惊', '没想到', '恐怖', '惊人'],
  },

  // 感动风格
  emotional: {
    id: 'emotional',
    name: '感动版',
    default_tone: '温情',
    default_pacing: 'slow',
    description: '用温暖感人的语言解说，适合爱情/亲情类视频',
    opening_patterns: [
      '这段，让我红了眼眶...',
      '原来，这就是爱情...',
      '最让人心疼的是...',
    ],
    emphasis_keywords: ['心疼', '感动', '流泪', '温暖'],
  },

  // 专业解说风格
  professional: {
    id: 'professional',
    name: '专业版',
    default_tone: '客观中立',
    default_pacing: 'normal',
    description: '冷静客观地解说，适合纪录片/科教类视频',
    opening_patterns: [
      '接下来...',
      '这一幕...',
      '值得注意的是...',
    ],
    emphasis_keywords: ['关键', '重要', '注意'],
  },
};

interface CommentaryStyle {
  id: string;
  name: string;
  default_tone: string;
  default_pacing: 'fast' | 'normal' | 'slow';
  description?: string;
  opening_patterns?: string[];
  emphasis_keywords?: string[];
}
```

### 4.2 自定义风格

```typescript
interface CustomStyle extends CommentaryStyle {
  user_defined: true;
  prompt_template?: string;      // 自定义 prompt 模板
  example_scripts?: string[];    // 示例解说词
}

// 用户可以在 UI 中创建自定义风格
interface StyleEditor {
  name: string;
  tone: string;
  pacing: 'fast' | 'normal' | 'slow';
  opening_pattern: string;      // 自定义开场句式
  keywords: string[];          // 自定义强调词
  example: string;             // 示例文本
}
```

---

## 5. 批量生成与优化

### 5.1 批量生成

```typescript
async function generateAllScripts(
  segments: SemanticSegment[],
  config: CommentarProjectConfig,
  apiProvider: AIProviderService,
  onProgress: (current: number, total: number) => void
): Promise<CommentaryScript[]> {
  const results: CommentaryScript[] = [];
  const total = segments.length;

  for (let i = 0; i < total; i++) {
    onProgress(i, total);

    try {
      const script = await generateSingleScript(
        segments[i],
        results.slice(0, i),  // 前面的 scripts 用于连贯性
        config,
        apiProvider
      );
      results.push(script);
    } catch (error) {
      // 单段失败不影响整体，使用降级
      results.push(createFallbackScript(segments[i]));
    }
  }

  onProgress(total, total);
  return results;
}
```

### 5.2 并行批量（提速 4-8 倍）

```typescript
async function generateScriptsParallel(
  segments: SemanticSegment[],
  config: CommentarProjectConfig,
  apiProvider: AIProviderService,
  maxConcurrency: number = 4
): Promise<CommentaryScript[]> {
  const results: (CommentaryScript | null)[] = new Array(segments.length).fill(null);
  let currentIndex = 0;

  const workers = Array.from({ length: maxConcurrency }, async () => {
    while (currentIndex < segments.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await generateSingleScript(
          segments[idx],
          results.slice(0, idx).filter(Boolean) as CommentaryScript[],
          config,
          apiProvider
        );
      } catch {
        results[idx] = null;
      }
    }
  });

  await Promise.all(workers);

  // 填充失败的部分
  return results.map((r, i) => r || createFallbackScript(segments[i]));
}
```

### 5.3 降级策略

```typescript
function createFallbackScript(segment: SemanticSegment): CommentaryScript {
  // 使用规则生成降级解说词
  return {
    script: `[解说不可用] ${segment.plot_summary}`,
    reading_time_ms: Math.min(segment.duration_ms, 30000),
    emphasis_positions: [],
    keywords_to_highlight: [],
  };
}
```

---

## 6. 输出与集成

### 6.1 输出格式

```typescript
interface CommentaryScript {
  segment_index: number;
  start_ms: number;
  end_ms: number;

  // 内容
  script: string;
  tone: string;
  pacing: 'fast' | 'normal' | 'slow';

  // 时间轴
  reading_time_ms: number;
  emphasis_positions: number[];

  // 元数据
  keywords_to_highlight: string[];
  characters_mentioned: string[];

  // 质量
  quality_score: number;          // 0.0-1.0
  generation_method: 'llm' | 'fallback' | 'manual';
}

interface CommentaryScriptCollection {
  project_id: string;
  style: CommentaryStyle;
  scripts: CommentaryScript[];
  total_duration_ms: number;
  characters: CharacterTrack[];
  metadata: {
    generated_at: string;
    model: string;
    total_tokens: number;
  };
}
```

### 6.2 与其他模块集成

```typescript
// 输出给 DirectorAgent
function exportToDirector(scripts: CommentaryScript[]): DirectorPlan {
  return {
    scripts,
    total_reading_time_ms: scripts.reduce((sum, s) => sum + s.reading_time_ms, 0),
    characters: extractCharacters(scripts),
  };
}

// 输出给 CommentarySynth
function exportToSynth(scripts: CommentaryScript[]): SynthInput[] {
  return scripts.map(s => ({
    text: s.script,
    duration_ms: s.reading_time_ms,
    emphasis_positions: s.emphasis_positions,
    tone: s.tone,
    pacing: s.pacing,
  }));
}
```

---

## 7. 性能与成本优化

### 7.1 Token 消耗估算

| 场景 | Token 消耗 | 成本（DeepSeek V4-Pro） |
|------|-----------|----------------------|
| 单段解说（~200字） | ~800 input + ~400 output | ~0.002 元 |
| 10分钟视频（~30段） | ~24000 input + ~12000 output | ~0.06 元 |
| 1小时视频（~100段） | ~80000 input + ~40000 output | ~0.20 元 |

### 7.2 缓存策略

```typescript
// 基于文本 hash 的缓存
const scriptCache = new Map<string, CommentaryScript>();

function getCachedScript(textHash: string): CommentaryScript | null {
  return scriptCache.get(textHash) || null;
}

function cacheScript(textHash: string, script: CommentaryScript): void {
  scriptCache.set(textHash, script);

  // LRU 淘汰（最多 1000 条）
  if (scriptCache.size > 1000) {
    const firstKey = scriptCache.keys().next().value;
    scriptCache.delete(firstKey);
  }
}
```

### 7.3 模型选择建议

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| 日常批量化生产 | DeepSeek V4-Flash | 速度快，成本低 |
| 高质量创作 | DeepSeek V4-Pro | 推理能力强 |
| 复杂剧情理解 | GPT-5.5 | 多模态理解最强 |
| 中文长文本 | Qwen3.6-Max | 中文创作最佳 |