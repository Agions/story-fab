# Director Agent Design
# AI 导演 Agent 设计

> Commentary Mode 的核心编排引擎 — 管理从视频分析到成片输出的全流程状态机

---

## 1. 概述

### 1.1 什么是 Director Agent？

Director Agent 是 Commentary Mode 的"大脑"——一个状态机，它协调所有子模块（SmartSegmenter、LLM、ScriptGenerator、CommentarySynth、RenderEngine）的工作，并在关键节点允许用户介入。

### 1.2 与传统状态机的区别

| 传统状态机 | Director Agent |
|-----------|----------------|
| 被动响应事件 | 主动规划下一步 |
| 无用户介入点 | 多轮用户交互 |
| 失败即终止 | 失败降级继续 |
| 单线程执行 | 支持并行 + 异步 |

### 1.3 核心职责

1. **编排**：协调各模块的执行顺序和依赖
2. **决策**：决定使用哪些 segment、如何分配解说结构
3. **适应**：根据用户反馈调整计划
4. **容错**：处理各模块的错误和降级

---

## 2. 状态机设计

### 2.1 状态定义

```typescript
enum DirectorPhase {
  // 初始状态
  idle = 'idle',

  // 分析阶段
  analyzing = 'analyzing',        // 分析视频，提取语义
  analyzing_semantic = 'analyzing_semantic',  // LLM 语义分段

  // 规划阶段
  planning = 'planning',          // 生成解说计划
  planning_refining = 'planning_refining',  // 优化计划细节

  // 用户交互阶段
  reviewing = 'reviewing',        // 用户审核解说计划
  awaiting_feedback = 'awaiting_feedback',  // 等待用户反馈

  // 修改阶段
  revising = 'revising',          // 根据反馈修改计划
  regenerating_script = 'regenerating_script',  // 重新生成解说词

  // 执行阶段
  executing = 'executing',        // 执行渲染
  synthesizing = 'synthesizing',   // TTS 配音合成
  rendering = 'rendering',        // 视频渲染

  // 结束状态
  completed = 'completed',        // 成功完成
  error = 'error',               // 不可恢复的错误
  cancelled = 'cancelled',        // 用户取消
}
```

### 2.2 状态流转图

```
                    ┌─────────────────────────────────────────┐
                    │                   idle                    │
                    │        用户发起解说任务                   │
                    └───────────────────┬─────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │              analyzing                    │
                    │       SmartSegmenter 粗分                 │
                    └───────────────────┬─────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │          analyzing_semantic              │
                    │       LLM 语义标注（并行）                │
                    └───────────────────┬─────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │               planning                   │
                    │       生成 CommentaryPlan                │
                    └───────────────────┬─────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │             reviewing                    │
                    │       用户审核解说计划                   │
                    └──────────┬──────────────────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
    ┌──────────────────┐        ┌──────────────────────────┐
    │    revising      │        │       executing          │
    │  用户要求修改      │        │   用户确认，执行           │
    └────────┬─────────┘        └────────────┬─────────────┘
             │                                  │
             ▼                                  ▼
    ┌──────────────────┐           ┌──────────────────────┐
    │regenerating_script│           │    synthesizing      │
    │  重新生成         │           │   TTS 配音合成        │
    └────────┬─────────┘           └────────────┬───────────┘
             │                                  │
             └──────────────► planning ◄────────┘

                       （小修改回 planning，大修改重新分析）
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │              rendering                   │
                    │       视频渲染 + 混音 + 字幕              │
                    └───────────────────┬─────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │             completed                    │
                    └─────────────────────────────────────────┘

        如果中途出错：
                    ┌─────────────────────────────────────────┐
                    │               error                       │
                    └─────────────────────────────────────────┘
```

### 2.3 状态转换规则

```typescript
interface TransitionRule {
  from: DirectorPhase;
  event: string;           // 触发事件
  condition?: () => boolean;  // 条件判断
  action?: () => Promise<void>;  // 执行动作
  to: DirectorPhase;
}

const transitionRules: TransitionRule[] = [
  // idle → analyzing
  {
    from: 'idle',
    event: 'START',
    to: 'analyzing',
  },

  // analyzing → analyzing_semantic
  {
    from: 'analyzing',
    event: 'ANALYSIS_COMPLETE',
    to: 'analyzing_semantic',
  },

  // analyzing_semantic → planning
  {
    from: 'analyzing_semantic',
    event: 'SEMANTIC_COMPLETE',
    to: 'planning',
  },

  // planning → reviewing
  {
    from: 'planning',
    event: 'PLAN_COMPLETE',
    to: 'reviewing',
  },

  // reviewing → executing（用户确认）
  {
    from: 'reviewing',
    event: 'USER_CONFIRM',
    to: 'executing',
  },

  // reviewing → revising（用户要求修改）
  {
    from: 'reviewing',
    event: 'USER_REQUEST_CHANGE',
    condition: (ctx) => ctx.changeScope === 'small',
    to: 'revising',
  },

  // reviewing → analyzing（用户要求重新分析）
  {
    from: 'reviewing',
    event: 'USER_REQUEST_CHANGE',
    condition: (ctx) => ctx.changeScope === 'large',
    to: 'analyzing',
  },

  // revising → planning
  {
    from: 'revising',
    event: 'REVISION_COMPLETE',
    to: 'planning',
  },

  // executing → synthesizing
  {
    from: 'executing',
    event: 'SCRIPT_READY',
    to: 'synthesizing',
  },

  // synthesizing → rendering
  {
    from: 'synthesizing',
    event: 'SYNTH_COMPLETE',
    to: 'rendering',
  },

  // rendering → completed
  {
    from: 'rendering',
    event: 'RENDER_COMPLETE',
    to: 'completed',
  },

  // 任何状态 → error
  {
    from: '*',
    event: 'UNRECOVERABLE_ERROR',
    to: 'error',
  },

  // 任何状态 → cancelled
  {
    from: '*',
    event: 'USER_CANCEL',
    to: 'cancelled',
  },
];
```

---

## 3. DirectorContext（上下文）

### 3.1 完整上下文结构

```typescript
interface DirectorContext {
  // 项目信息
  project_id: string;
  video_path: string;
  video_metadata: VideoMetadata;

  // 分析结果
  raw_segments: VideoSegment[];       // SmartSegmenter 输出
  semantic_segments: SemanticSegment[]; // LLM 语义标注

  // 解说计划
  plan: CommentaryPlan | null;
  plan_version: number;                // 计划版本（每次修改+1）

  // 合成结果
  commentary_track: CommentaryTrack | null;
  render_output: string | null;        // 最终输出路径

  // 状态机状态
  phase: DirectorPhase;
  progress: number;                    // 0-100
  current_step: string;                // 当前步骤描述
  estimated_remaining_ms: number;      // 预计剩余时间

  // 用户交互
  user_feedback: UserFeedback | null;
  pending_user_action: boolean;

  // 错误处理
  errors: ProcessingError[];
  warnings: ProcessingWarning[];

  // 配置
  config: CommentarProjectConfig;
}

interface VideoMetadata {
  duration_ms: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  file_size: number;
}

interface UserFeedback {
  type: 'approve' | 'request_change' | 'cancel';
  change_scope?: 'small' | 'large';  // 小改/大改
  change_details?: string;          // 具体修改要求
  preferred_style?: CommentaryStyle; // 偏好的解说风格
  preferred_tone?: string;          // 偏好的语气
}

interface ProcessingError {
  phase: DirectorPhase;
  code: string;
  message: string;
  recoverable: boolean;
  retry_count: number;
}

interface ProcessingWarning {
  phase: DirectorPhase;
  code: string;
  message: string;
}
```

### 3.2 上下文持久化

```typescript
// 保存到项目文件
interface ProjectFile {
  // ... 现有字段 ...

  // Director 状态
  director: {
    phase: DirectorPhase;
    context_snapshot: DirectorContext;
    plan_history: CommentaryPlan[];  // 历史版本（用于回滚）
  };
}
```

---

## 4. 各阶段实现

### 4.1 analyzing（分析阶段）

```typescript
async function handleAnalyzing(ctx: DirectorContext): Promise<void> {
  ctx.phase = 'analyzing';
  ctx.current_step = '正在分析视频...';
  ctx.progress = 5;

  try {
    // 调用 Rust SmartSegmenter
    const segments = await Tauri.invoke<VideoSegment[]>('detect_smart_segments', {
      videoPath: ctx.video_path,
      options: {
        min_duration_ms: 1000,
        max_duration_ms: 30000,
        scene_threshold: 0.3,
        silence_threshold_db: -40,
        detect_dialogue: true,
        detect_transitions: true,
      },
    });

    ctx.raw_segments = segments;
    ctx.progress = 30;
    ctx.current_step = '分析完成，准备语义分段...';

    // 自动进入下一阶段
    transitionTo(ctx, 'analyzing_semantic');
  } catch (error) {
    ctx.errors.push({
      phase: 'analyzing',
      code: 'SEGMENTATION_FAILED',
      message: `视频分析失败: ${error}`,
      recoverable: false,
      retry_count: 0,
    });
    transitionTo(ctx, 'error');
  }
}
```

### 4.2 analyzing_semantic（语义分段阶段）

```typescript
async function handleAnalyzingSemantic(ctx: DirectorContext): Promise<void> {
  ctx.phase = 'analyzing_semantic';
  ctx.current_step = '正在进行语义分析...';
  ctx.progress = 35;

  try {
    // 并行调用 LLM 语义分析（每 4 个 segment 一批）
    const semanticSegments = await semanticSegmentWithLLM(
      ctx.raw_segments,
      ctx.config.api_provider,
      (batchIdx, total) => {
        ctx.progress = 35 + (batchIdx / total) * 20;
        ctx.current_step = `语义分析中... (${batchIdx}/${total})`;
      }
    );

    ctx.semantic_segments = semanticSegments;
    ctx.progress = 55;
    ctx.current_step = '语义分析完成，正在生成计划...';

    transitionTo(ctx, 'planning');
  } catch (error) {
    // 降级：用规则填充语义（不用 LLM）
    ctx.warnings.push({
      phase: 'analyzing_semantic',
      code: 'LLM_FAILED_FALLBACK',
      message: '语义分析降级为规则模式',
    });

    ctx.semantic_segments = ctx.raw_segments.map(s => ({
      ...s,
      plot_summary: '（AI 分析不可用）',
      characters: [],
      emotional_tone: 'unknown',
      commentary_tone: 'normal',
      highlight_potential: 0.5,
    }));

    transitionTo(ctx, 'planning');
  }
}
```

### 4.3 planning（规划阶段）

```typescript
async function handlePlanning(ctx: DirectorContext): Promise<void> {
  ctx.phase = 'planning';
  ctx.current_step = '正在生成解说计划...';
  ctx.progress = 60;

  try {
    // 使用 ScriptGenerator 生成解说词
    const plan = await generateCommentaryPlan(
      ctx.semantic_segments,
      ctx.config
    );

    ctx.plan = plan;
    ctx.plan_version = 1;
    ctx.progress = 80;
    ctx.current_step = '解说计划生成完成，等待审核...';

    transitionTo(ctx, 'reviewing');
  } catch (error) {
    ctx.errors.push({
      phase: 'planning',
      code: 'PLANNING_FAILED',
      message: `计划生成失败: ${error}`,
      recoverable: true,
      retry_count: 0,
    });

    // 降级：使用默认计划
    ctx.plan = createDefaultPlan(ctx.raw_segments);
    transitionTo(ctx, 'reviewing');
  }
}
```

### 4.4 reviewing（审核阶段）

```typescript
async function handleReviewing(ctx: DirectorContext): Promise<void> {
  ctx.phase = 'reviewing';
  ctx.current_step = '请审核解说计划';
  ctx.progress = 80;
  ctx.pending_user_action = true;

  // 等待用户反馈（异步）
  // UI 层监听 ctx.pending_user_action，展示审核 UI
}
```

### 4.5 executing（执行阶段）

```typescript
async function handleExecuting(ctx: DirectorContext): Promise<void> {
  ctx.phase = 'executing';
  ctx.current_step = '正在合成配音...';
  ctx.progress = 85;

  try {
    // 调用 CommentarySynth
    const track = await synthesizeCommentary(
      ctx.plan,
      getTTSService()
    );

    ctx.commentary_track = track;
    ctx.current_step = '正在渲染视频...';
    ctx.progress = 90;

    // 触发下一阶段
    transitionTo(ctx, 'synthesizing');
  } catch (error) {
    ctx.errors.push({
      phase: 'executing',
      code: 'SYNTHESIS_FAILED',
      message: `配音合成失败: ${error}`,
      recoverable: true,
      retry_count: 0,
    });

    // 降级：跳过配音
    ctx.warnings.push({
      phase: 'executing',
      code: 'SYNTHESIS_SKIPPED',
      message: '配音合成失败，将生成无配音版本',
    });

    transitionTo(ctx, 'rendering');
  }
}
```

### 4.6 rendering（渲染阶段）

```typescript
async function handleRendering(ctx: DirectorContext): Promise<void> {
  ctx.phase = 'rendering';
  ctx.current_step = '正在渲染视频...';
  ctx.progress = 95;

  try {
    // 调用 Rust autonomous_cut（扩展支持 commentary）
    const outputPath = await Tauri.invoke<string>('render_with_commentary', {
      input: {
        input_path: ctx.video_path,
        segments: ctx.plan.video_segments,
        output_path: ctx.config.output_dir,
        aspect_ratio: ctx.config.aspect_ratio,
      },
      commentary_track: ctx.commentary_track,
      mix_config: {
        narration_volume: 1.0,
        original_volume: 0.25,
        bgm_volume: 0.0,
      },
      burnin_subtitles: true,
    });

    ctx.render_output = outputPath;
    ctx.progress = 100;
    ctx.current_step = '渲染完成！';

    transitionTo(ctx, 'completed');
  } catch (error) {
    ctx.errors.push({
      phase: 'rendering',
      code: 'RENDER_FAILED',
      message: `渲染失败: ${error}`,
      recoverable: false,
      retry_count: 0,
    });

    transitionTo(ctx, 'error');
  }
}
```

---

## 5. 用户介入机制

### 5.1 介入点

| 阶段 | 可介入点 | 可修改内容 |
|------|---------|-----------|
| reviewing | 计划审核 | 风格/语气/片段选择/解说词 |
| executing | 执行中 | 可取消重新来 |
| rendering | 渲染中 | 可调整输出参数 |

### 5.2 修改范围判断

```typescript
type ChangeScope = 'small' | 'large';

function determineChangeScope(feedback: UserFeedback): ChangeScope {
  const changeDetails = feedback.change_details?.toLowerCase() || '';

  // 小改：只影响当前 act 或单段解说词
  const smallChangeKeywords = [
    '语气', '风格', '这段', '这个', '改一下',
    '语气不对', '太快了', '太慢', '重点突出',
  ];

  // 大改：影响整体结构或多个 acts
  const largeChangeKeywords = [
    '重新', '结构', '整体', '换一种', '完全重写',
    '换一个风格', '换个思路', '不行', '不对',
  ];

  if (largeChangeKeywords.some(k => changeDetails.includes(k))) {
    return 'large';
  }

  if (smallChangeKeywords.some(k => changeDetails.includes(k))) {
    return 'small';
  }

  // 默认小改
  return 'small';
}
```

### 5.3 修改后的重规划

```typescript
async function handleRevising(ctx: DirectorContext): Promise<void> {
  ctx.phase = 'revising';
  const feedback = ctx.user_feedback!;
  const scope = determineChangeScope(feedback);

  ctx.current_step = '正在根据您的反馈修改计划...';
  ctx.progress = 70;

  try {
    if (scope === 'small') {
      // 小改：只修改相关部分
      const updatedActs = await reviseActs(
        ctx.plan.acts,
        feedback.change_details,
        ctx.config
      );
      ctx.plan.acts = updatedActs;

      // 重新生成受影响 act 的解说词
      const regeneratedActs = await regenerateScripts(
        ctx.plan.acts,
        ctx.config.api_provider
      );
      ctx.plan.acts = regeneratedActs;

    } else {
      // 大改：重新分析 + 重新规划
      transitionTo(ctx, 'analyzing');
      return;
    }

    ctx.plan_version += 1;
    ctx.user_feedback = null;

    transitionTo(ctx, 'planning');
  } catch (error) {
    ctx.errors.push({
      phase: 'revising',
      code: 'REVISION_FAILED',
      message: `修改失败: ${error}`,
      recoverable: true,
      retry_count: 0,
    });

    transitionTo(ctx, 'planning');
  }
}
```

---

## 6. 错误处理与恢复

### 6.1 错误分类

```typescript
enum ErrorSeverity {
  recoverable = 'recoverable',      // 可恢复（重试/降级）
  fatal = 'fatal',                  // 不可恢复（需用户介入）
  warning = 'warning',              // 警告（不影响流程）
}

interface ErrorHandlingStrategy {
  [errorCode: string]: {
    severity: ErrorSeverity;
    retryable: boolean;
    maxRetries: number;
    fallback?: () => any;          // 降级处理函数
    userMessage: string;
  };
}
```

### 6.2 错误处理策略表

```typescript
const errorHandlingStrategies: ErrorHandlingStrategy = {
  SEGMENTATION_FAILED: {
    severity: 'fatal',
    retryable: false,
    maxRetries: 0,
    userMessage: '视频分析失败，可能是视频文件损坏或格式不支持',
  },

  LLM_FAILED_FALLBACK: {
    severity: 'warning',
    retryable: false,
    maxRetries: 0,
    fallback: () => useRuleBasedSegmentation(),
    userMessage: '语义分析降级为规则模式（部分 AI 功能不可用）',
  },

  LLM_RATE_LIMIT: {
    severity: 'recoverable',
    retryable: true,
    maxRetries: 3,
    fallback: () => cacheLLMResult(),
    userMessage: 'AI 服务限流中，将自动重试...',
  },

  TTS_FAILED: {
    severity: 'recoverable',
    retryable: true,
    maxRetries: 2,
    fallback: () => skipAudio(),
    userMessage: '配音合成失败，将生成无配音版本',
  },

  RENDER_FAILED: {
    severity: 'fatal',
    retryable: true,
    maxRetries: 2,
    fallback: () => useSimpleRender(),
    userMessage: '渲染失败，请尝试降低输出质量',
  },

  FILE_NOT_FOUND: {
    severity: 'fatal',
    retryable: false,
    maxRetries: 0,
    userMessage: '视频文件不存在或路径错误',
  },
};
```

### 6.3 全局错误处理

```typescript
async function transitionTo(ctx: DirectorContext, newPhase: DirectorPhase): Promise<void> {
  try {
    // 执行退出动作
    await onExitPhase(ctx.phase, ctx);

    // 更新状态
    ctx.phase = newPhase;

    // 执行进入动作
    await onEnterPhase(newPhase, ctx);

  } catch (error) {
    ctx.errors.push({
      phase: ctx.phase,
      code: 'TRANSITION_ERROR',
      message: `状态转换失败: ${error}`,
      recoverable: false,
      retry_count: 0,
    });

    ctx.phase = 'error';
  }
}

async function onEnterPhase(phase: DirectorPhase, ctx: DirectorContext): Promise<void> {
  switch (phase) {
    case 'analyzing':
      await handleAnalyzing(ctx);
      break;
    case 'analyzing_semantic':
      await handleAnalyzingSemantic(ctx);
      break;
    case 'planning':
      await handlePlanning(ctx);
      break;
    case 'reviewing':
      await handleReviewing(ctx);
      break;
    case 'revising':
      await handleRevising(ctx);
      break;
    case 'executing':
      await handleExecuting(ctx);
      break;
    case 'synthesizing':
      await handleSynthesizing(ctx);
      break;
    case 'rendering':
      await handleRendering(ctx);
      break;
    case 'completed':
      await handleCompleted(ctx);
      break;
    case 'error':
      await handleError(ctx);
      break;
  }
}
```

---

## 7. 性能优化

### 7.1 并行处理

```typescript
// 语义分段并行（最多 4 并发）
async function semanticSegmentWithLLM(
  segments: VideoSegment[],
  apiProvider: AIProviderService,
  onProgress: (current: number, total: number) => void
): Promise<SemanticSegment[]> {
  const BATCH_SIZE = 4;
  const results: SemanticSegment[] = [];
  const total = Math.ceil(segments.length / BATCH_SIZE);

  for (let i = 0; i < segments.length; i += BATCH_SIZE) {
    const batch = segments.slice(i, i + BATCH_SIZE);

    const batchResults = await Promise.all(
      batch.map(seg => semanticSegmentOne(seg, apiProvider))
    );

    results.push(...batchResults);
    onProgress(Math.min(i + BATCH_SIZE, segments.length), segments.length);
  }

  return results;
}
```

### 7.2 缓存策略

```typescript
// Plan 缓存
const planCache = new Map<string, CommentaryPlan>();

function getCachedPlan(videoHash: string, config: CommentarProjectConfig): CommentaryPlan | null {
  const key = `${videoHash}_${config.style.id}`;
  return planCache.get(key) || null;
}

function cachePlan(videoHash: string, config: CommentarProjectConfig, plan: CommentaryPlan): void {
  const key = `${videoHash}_${config.style.id}`;
  planCache.set(key, plan);
}
```

---

## 8. API 设计

### 8.1 Director Agent 服务接口

```typescript
// src/core/services/commentary/DirectorAgent.ts

class DirectorAgent {
  private context: DirectorContext;

  // 启动解说流程
  async start(projectId: string, config: CommentarProjectConfig): Promise<void>;

  // 获取当前状态
  getPhase(): DirectorPhase;
  getProgress(): number;
  getPlan(): CommentaryPlan | null;
  getErrors(): ProcessingError[];

  // 用户操作
  async approvePlan(): Promise<void>;       // 确认计划
  async requestChange(feedback: UserFeedback): Promise<void>;  // 请求修改
  async cancel(): Promise<void>;            // 取消任务

  // 事件监听
  onPhaseChange(callback: (phase: DirectorPhase) => void): void;
  onProgressUpdate(callback: (progress: number, step: string) => void): void;
  onError(callback: (error: ProcessingError) => void): void;
}
```

### 8.2 状态订阅

```typescript
// 前端订阅 Director 状态
const directorAgent = new DirectorAgent();

directorAgent.onPhaseChange((phase) => {
  console.log('Phase changed:', phase);
  updateUI(phase);
});

directorAgent.onProgressUpdate((progress, step) => {
  progressBar.value = progress;
  stepLabel.text = step;
});

directorAgent.onError((error) => {
  if (error.severity === 'fatal') {
    showErrorDialog(error.userMessage);
  } else {
    showWarning(error.userMessage);
  }
});
```

---

## 9. 与其他模块的协作

### 9.1 依赖关系

```
DirectorAgent
  ├──► SmartSegmenter（Rust）  — 分析视频
  ├──► LLM（API）             — 语义分段 + 解说词生成
  ├──► ScriptGenerator（TS）   — 解说词生成
  ├──► CommentarySynth（TS）   — TTS 配音
  └──► autonomous_cut（Rust）  — 渲染
```

### 9.2 数据流

```
SmartSegmenter → raw_segments → DirectorAgent
                                      │
                                      ▼
                              LLM Semantic Seg
                                      │
                                      ▼
                              CommentaryPlan
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ScriptGenerator     CommentarySynth    autonomous_cut
                    │                 │                 │
                    ▼                 ▼                 │
              script text        audio track          │
                                                    ▼
                                              final output
```

---

## 10. 未来扩展

### 10.1 多语言支持

扩展 DirectorAgent 支持多语言解说：
- 增加 `target_language` 配置
- LLM 调用时指定语言
- TTS 使用对应语言的 voice

### 10.2 多角色解说

未来支持多个解说角色（不同音色）：
- 增加 `narrator_roles` 配置
- 不同 act 使用不同 narrator
- 配音合成时多轨混合

### 10.3 实时预览

增加流式渲染预览：
- 用户边修改边看效果
- 低码率实时预览
- 确认后再生成高质量版本