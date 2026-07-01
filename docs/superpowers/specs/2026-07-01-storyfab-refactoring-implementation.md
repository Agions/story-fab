# 🚀 StoryFab 系统性重构完整实施计划

**基于**：深度架构分析 + 5-Agent 并行分析结果
**日期**：2026-07-01
**状态**：✅ 分析完成，准备执行
**预计总工期**：6 周（全职）

---

## 📋 目录

1. [执行摘要](#执行摘要)
2. [深度分析发现](#深度分析发现)
3. [重构优先级矩阵](#重构优先级矩阵)
4. [分阶段实施计划](#分阶段实施计划)
5. [代码示例与迁移指南](#代码示例与迁移指南)
6. [验证与测试策略](#验证与测试策略)
7. [监控与成功指标](#监控与成功指标)

---

## 执行摘要

### 项目健康评分

```
架构质量：    B+ (3.5/5.0)  ████████░░ 良好，但有明显改进空间
代码质量：    B  (3.0/5.0)  ███████░░░ 中等偏上，有技术债务
类型安全：    B- (2.8/5.0)  ██████░░░░ 中等，any 类型过多
性能优化：    C+ (2.5/5.0)  █████░░░░░ 有较大优化空间
测试覆盖：    D  (2.0/5.0)  ████░░░░░░ 偏低，约 10%
```

### 核心发现数字

| 指标 | 数量 | 状态 |
|------|------|------|
| **分析文件数** | 500+ | ✅ |
| **总代码行数** | 57,000 | - |
| **导入语句** | 1,286 | ✅ 无循环依赖 |
| **God Objects** | 3 | 🔴 需重构 |
| **Pipeline 重复实现** | 2 | 🔴 需统一 |
| **类型定义重复** | 82 个在 30+ 文件 | 🔴 需统一 |
| **any 类型使用** | ~1,200 | 🔴 需减少 |
| **死代码行数** | ~300 | 🟡 需清理 |
| **重复代码行数** | ~500 | 🟡 需合并 |
| **测试文件** | 35 | 🟡 覆盖率低 |
| **Tauri Commands** | 48 | 🟡 类型不严格 |

### Top 10 优先级任务

1. 🔴 **删除 `src/pipeline/engine.ts`** - 137 行死代码，2h
2. 🔴 **拆分 Commentary God Object** - 217 行 → 4 个服务，16h
3. 🔴 **删除向后兼容类型别名** - ~20 处，4h
4. 🟠 **统一 Pipeline 实现** - 180 行重复，24h
5. 🟠 **统一服务层继承 BaseService** - 7 个服务，12h
6. 🟠 **消除 Hooks 中的 UI 依赖** - 1 处严重违规，2h
7. 🟡 **重命名 aiClip/ → ai-clip/** - 统一命名，2h
8. 🟡 **为 Tauri invoke 添加泛型** - 48 个命令，24h
9. 🟡 **统一核心类型定义** - 82 个接口，16h
10. 🟢 **提取通用错误处理装饰器** - 15 处重复，8h

**总预计工作量**：~130 小时（约 3.25 周全职）

---

## 深度分析发现

### 🔴 关键架构问题

#### 1. God Object: `commentary/index.ts`

**问题**：217 行单一文件承担 8+ 职责

```typescript
// src/core/services/commentary/index.ts
// ❌ 当前：单一文件处理所有 commentary 相关功能
export async function createCommentarySession(...) { /* Session */ }
export async function getCommentaryStatus(...) { /* Status */ }
export async function startCommentaryAnalysis(...) { /* Analysis */ }
export async function generateCommentaryPlan(...) { /* Plan */ }
export async function approveCommentaryPlan(...) { /* Approval */ }
export async function reviseCommentaryPlan(...) { /* Revision */ }
export async function completeCommentaryRender(...) { /* Render */ }
export async function destroyCommentarySession(...) { /* Cleanup */ }
export async function generateCommentaryScript(...) { /* Script */ }
export async function synthesizeCommentaryAudio(...) { /* TTS */ }
export async function estimateTTSDuration(...) { /* Estimation */ }
export async function listCommentaryVoices(...) { /* Voice List */ }
export async function quickCommentary(...) { /* Factory */ }
```

**影响**：
- 被 12 个文件导入（最高耦合度）
- 任何修改影响 12 个模块
- 无法单独测试子功能

**✅ 重构方案**：

```typescript
// src/core/services/commentary/
├── index.ts                    // 统一导出
├── session.service.ts          // SessionService (create/destroy/status)
├── script.service.ts           // ScriptService (generate)
├── audio.service.ts            // AudioService (synthesize/estimate)
└── voice-catalog.service.ts    // VoiceCatalogService (list voices)

// src/core/services/commentary/index.ts
export * from './session.service';
export * from './script.service';
export * from './audio.service';
export * from './voice-catalog.service';

// ✅ 使用示例
import { createCommentarySession, getCommentaryStatus } from '@/core/services/commentary/session';
import { generateCommentaryScript } from '@/core/services/commentary/script';
```

**迁移步骤**：
1. 创建 4 个新服务文件
2. 移动对应函数
3. 更新导入（12 个文件）
4. 运行测试
5. 删除旧文件

---

#### 2. Pipeline 双重实现

**问题**：两个不兼容的 Pipeline 系统并存

| 维度 | 旧版 (engine.ts) | 新版 (step.ts) | 建议 |
|------|-----------------|----------------|------|
| **文件名** | `pipeline/engine.ts` | `core/pipeline/step.ts` | 删除旧版 |
| **行数** | 137 | 324 | - |
| **Step 接口** | `PipelineStep<TInput,TOutput>` | `Step<TInput,TOutput>` | 统一为新版 |
| **执行器** | `PipelineEngine` | `ChainPipeline` | 统一为 ChainPipeline |
| **使用范围** | 12 个文件 | 3 个文件 | 迁移旧版用户 |
| **复杂度** | 状态驱动 | 函数式组合 | 新版更灵活 |

**重复代码分析**：

| 功能 | 旧版 | 新版 | 重复行数 |
|------|------|------|---------|
| 步骤注册 | `registerStep()` | 构造函数参数 | 40 |
| 状态管理 | `PipelineState` | `PipelineResult` | 50 |
| 进度追踪 | `stepProgress` | `onProgress` 回调 | 30 |
| 错误处理 | try-catch | try-catch | 20 |
| **总计** | - | - | **~140** |

**✅ 迁移计划**：

```bash
# Phase 1: 迁移旧版用户（8 个文件）
src/pipeline/steps/ingest.ts       → 使用 ChainPipeline
src/pipeline/steps/analyze.ts      → 使用 ChainPipeline
src/pipeline/steps/script.ts       → 使用 ChainPipeline
src/pipeline/steps/voice.ts        → 使用 ChainPipeline
src/pipeline/steps/compose.ts      → 使用 ChainPipeline
src/pipeline/steps/export.ts       → 使用 ChainPipeline
src/pipeline/index.ts              → 更新导出

# Phase 2: 删除旧版
rm src/pipeline/engine.ts          # 137 行
rm src/pipeline/steps/             # 整个目录（已迁移）

# Phase 3: 统一 Commentary Pipeline
# 将 composite-pipeline.ts 改为使用 ChainPipeline
```

---

#### 3. Service Layer 不一致

**问题**：7 个服务中仅 2 个正确继承 `BaseService`

| 服务 | 行数 | 继承 BaseService | 问题 |
|------|------|-----------------|------|
| `ai-service.ts` | 372 | ✅ | 良好 |
| `subtitle-service.ts` | 120+ | ❌ | 应统一 |
| `video-effect-service.ts` | 100+ | ❌ | 应统一 |
| `voice-synthesis-service.ts` | 305 | ❌ | 应统一 |
| `export-service.ts` | 140 | ❌ | 应统一 |
| `vision/index.ts` | 200+ | ❌ | 应统一 |
| `ai-clip/analyzer.ts` | 150+ | ❌ | 应统一 |

**✅ 重构示例**：

```typescript
// ❌ 当前：独立的 SubtitleService
export class SubtitleService {
  async transcribeWithWhisper(...) { /* ... */ }
  async extractSubtitles(...) { /* ... */ }
}

// ✅ 重构后：继承 BaseService
import { BaseService, ServiceError } from '../providers/base-service';

export class SubtitleService extends BaseService {
  constructor() {
    super('SubtitleService', { timeout: 300_000, retries: 2 });
  }

  async transcribeWithWhisper(
    audioPath: string,
    modelSize: string = 'base',
    language: string = 'auto',
    onProgress?: (progress: WhisperProgress) => void
  ): Promise<SubtitleTrack> {
    return this.executeRequest(
      async () => {
        // ... 原有实现
      },
      'Whisper 转录',
      { loadingMessage: '正在转录音频...' }
    );
  }
}
```

**收益**：
- 统一错误处理
- 统一日志格式
- 统一重试机制
- 统一超时配置

---

#### 4. 类型系统碎片化

**问题**：82 个接口在 30+ 文件中定义，3 个核心类型重复定义

**重复类型详情**：

| 类型名 | 定义次数 | 位置 | 建议 |
|--------|---------|------|------|
| `ScriptSegment` | 3 | types/, core/services/ai/, core/types/ | 保留 src/types/ 版本 |
| `VideoInfo` | 4 | types/, core/video/, 2 个其他 | 保留 src/types/ 版本 |
| `Project` | 3 | types/, core/services/, store/ | 保留 src/types/ 版本 |

**✅ 统一策略**：

```
单一权威源：src/types/

Step 1: 确定每个类型的主定义
- ScriptSegment     → src/types/script.ts
- VideoInfo         → src/types/media.ts
- Project           → src/types/project.ts
- Script            → src/types/script.ts
- SubtitleTrack     → src/types/subtitle.ts
- VoiceTrackData    → src/types/voice.ts
... (共 ~40 个核心类型)

Step 2: 删除其他位置的重复定义
- src/core/types/script.ts  → 删除（已在 src/types/script.ts）
- src/core/types/analysis.ts → 删除（已在 src/types/analysis.ts）
- src/core/video/types.ts   → 删除（已在 src/types/media.ts）

Step 3: 删除向后兼容的类型别名
- export type Script = AIScriptDraft;
- export type ScriptSegment = CoreScriptSegment;
... (共 ~20 处)

Step 4: 更新所有导入
- 统一使用 @/types 导入
```

---

#### 5. UI 混入 Hooks（严重违反 Clean Architecture）

**问题**：[hooks/use-director-status.ts](hooks/use-director-status.ts:12) 导入 UI 组件

```typescript
// ❌ 当前：Hook 直接使用 UI
import { toast } from '@/components/ui/sonner';

export function useDirectorStatus(sessionId: string | null) {
  const { data, error } = useQuery(...);

  // Hook 内部触发 UI 效果！
  useEffect(() => {
    if (error) {
      toast.error('Failed to load status');  // ❌ 违反原则
    }
  }, [error]);

  return { data, error };
}

// ✅ 重构后：Hook 只负责状态
export function useDirectorStatus(sessionId: string | null) {
  const { data, error } = useQuery(...);
  return { data, error };  // ✅ 纯状态返回
}

// ✅ Component 负责 UI 效果
function DirectorPanel({ sessionId }: Props) {
  const { data, error } = useDirectorStatus(sessionId);

  useEffect(() => {
    if (error) {
      toast.error('Failed to load status');  // ✅ UI 逻辑在 Component
    }
  }, [error]);

  return /* ... */;
}
```

**影响**：
- Hook 无法在没有 UI 库的环境中测试
- 违反 Clean Architecture 的依赖规则
- Hook 复用性降低

---

### 🟡 性能问题

#### Bundle 体积优化机会

**当前估算**：~500KB (gzip)

**优化机会**：

| 优化项 | 影响 | 工作量 |
|--------|------|-------|
| **大导入拆分** | -30KB | 8h |
| **删除死代码** | -10KB | 4h |
| **Tree-shaking 改进** | -15KB | 12h |
| **代码分割** | -50KB (懒加载) | 16h |
| **总计** | **-105KB (-21%)** | **40h** |

**具体优化**：

```typescript
// ❌ 大导入
import { debounce, throttle, merge, cloneDeep } from 'lodash';  // +30KB

// ✅ 按需导入
import debounce from 'lodash/debounce';  // +2KB
import throttle from 'lodash/throttle';   // +2KB
```

#### React 渲染优化

**当前状态**：32/406 个组件使用优化 Hooks

**目标**：100+ 个组件

**高频重渲染组件（优先优化）**：

| 组件 | 问题 | 优化方案 |
|------|------|---------|
| `Timeline` | 大量 Clips 导致重渲染 | `React.memo` + `useMemo` |
| `ProjectList` | 列表更新频繁 | 虚拟化 + `React.memo` |
| `VideoPlayer` | 60fps 更新 | `useCallback` + `requestAnimationFrame` |
| `CommentaryPanel` | 状态复杂 | `useMemo` 派生状态 |

---

### 🟢 TypeScript 改进

#### any 类型分布

| 严重度 | 位置 | 数量 | 建议 |
|--------|------|------|------|
| 🔴 High | Tauri invoke | 48 | 添加泛型支持 |
| 🔴 High | 服务层 public API | ~200 | 使用具体类型 |
| 🟡 Medium | Hooks 返回值 | ~300 | 明确返回类型 |
| 🟡 Medium | 组件 Props | ~400 | 严格定义 |
| 🟢 Low | 内部实现 | ~250 | 可保留 any |

**P0 任务**：消除 Tauri invoke 的 `any`

```typescript
// ❌ 当前
const invoke = <T = any>(cmd: string, args?: any): Promise<T> => { ... }

// ✅ 重构后
type TauriCommandMap = {
  CHECK_FFMPEG: { input: void; output: boolean };
  ANALYZE_VIDEO: { input: VideoPath; output: VideoMetadata };
  SYNTHESIZE_SPEECH: { input: SynthesisInput; output: AudioPath };
  // ... 共 48 个命令
};

declare function invoke<C extends keyof TauriCommandMap>(
  command: C,
  args: TauriCommandMap[C]['input']
): Promise<TauriCommandMap[C]['output']>;

// ✅ 使用
const metadata = await invoke('ANALYZE_VIDEO', { path: '/tmp/video.mp4' });
// metadata 自动推断为 VideoMetadata 类型！
```

---

## 重构优先级矩阵

### 按影响/工作量排序

```
立即执行（本周）:
  ✅ 删除 src/pipeline/engine.ts            [2h]   [影响: 中] [风险: 低]
  ✅ 删除向后兼容类型别名                 [4h]   [影响: 低] [风险: 低]
  ✅ 重命名 aiClip/ → ai-clip/             [2h]   [影响: 低] [风险: 低]
  ✅ 消除 UI 依赖 in Hooks                 [2h]   [影响: 高] [风险: 低]

高优先级（2-3 周）:
  🔧 拆分 Commentary God Object           [16h]  [影响: 高] [风险: 中]
  🔧 统一 Pipeline 实现                   [24h]  [影响: 高] [风险: 中]
  🔧 统一服务层继承 BaseService           [12h]  [影响: 中] [风险: 中]
  🔧 统一类型定义系统                     [16h]  [影响: 高] [风险: 中]

中等优先级（4-6 周）:
  ⚡ Tauri invoke 泛型化                  [24h]  [影响: 高] [风险: 中]
  ⚡ Bundle 体积优化                     [40h]  [影响: 中] [风险: 低]
  ⚡ React 渲染优化                      [30h]  [影响: 中] [风险: 低]
  ⚡ Rust 后端优化                       [52h]  [影响: 中] [风险: 低]
```

---

## 分阶段实施计划

### Phase 1: 基础清理（第 1 周）

**目标**：快速清理，建立基线

**预计时间**：10 小时

#### 1.1 删除死代码（2h）

```bash
# 删除旧版 Pipeline
rm -rf src/pipeline/

# 删除向后兼容类型别名
# 文件：src/core/services/ai/script/script-generation-service.ts
sed -i '' '/export type Script = AIScriptDraft/d' ...
sed -i '' '/export type ScriptSegment = CoreScriptSegment/d' ...
# ... (共 20 处)
```

**验证**：
```bash
npm run type-check  # 确保无类型错误
npm run test        # 确保测试通过
```

#### 1.2 统一命名规范（2h）

```bash
# 重命名 aiClip/
mv src/core/services/aiClip src/core/services/ai-clip

# 更新所有导入（自动化）
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|@/core/services/aiClip|@/core/services/ai-clip|g'

# 统一其他命名
mv src/core/services/ai/script   src/core/services/ai/script-generation
mv src/core/services/ai/vision   src/core/services/ai/vision-analysis
```

**规范文档**：[命名规范](docs/dev/naming-conventions.md)

#### 1.3 消除 Hooks 中的 UI 依赖（2h）

**文件**：[hooks/use-director-status.ts](hooks/use-director-status.ts:12)

```diff
- import { toast } from '@/components/ui/sonner';
-
  export function useDirectorStatus(sessionId: string | null) {
    const { data, error } = useQuery(...);
+
+   // ❌ 删除 UI 调用
+   // if (error) toast.error('Failed');
+
+   return { data, error };
  }
```

**Consumer 更新**：
```typescript
// 在 Component 中添加 toast
function DirectorPanel({ sessionId }) {
  const { error } = useDirectorStatus(sessionId);

+ useEffect(() => {
+   if (error) toast.error('Failed to load status');
+ }, [error]);

  return /* ... */;
}
```

#### 1.4 统一服务层继承（4h）

```typescript
// 1. SubtitleService
// src/core/services/subtitle/subtitle-service.ts
+ import { BaseService, ServiceError } from '../providers/base-service';
-
- export class SubtitleService {
+ export class SubtitleService extends BaseService {
-   async transcribeWithWhisper(...) {
+   async transcribeWithWhisper(...) {
+     return this.executeRequest(
+       async () => { /* ... */ },
+       'Whisper 转录'
+     );
-     // ... 原有实现
-   }
+   }
  }

// 2. 重复上述过程用于：
// - VideoEffectService
// - VoiceSynthesisService
// - ExportService
// - VisionService
```

---

### Phase 2: 架构重构（第 2-3 周）

**目标**：消除 God Objects，统一 Pipeline

**预计时间**：40 小时

#### 2.1 拆分 Commentary Service（16h）

```typescript
// src/core/services/commentary/session.service.ts
export class CommentarySessionService {
  async createSession(id: string, style?: ScriptStylePreset): Promise<string> { ... }
  async getStatus(sessionId: string): Promise<DirectorStatusResponse> { ... }
  async destroySession(sessionId: string): Promise<void> { ... }
}

// src/core/services/commentary/script.service.ts
export class CommentaryScriptService {
  async generateScript(input: GenerateScriptInput): Promise<CommentaryScriptOutput> { ... }
}

// src/core/services/commentary/audio.service.ts
export class CommentaryAudioService {
  async synthesizeAudio(text: string, voice: string, ...): Promise<SynthesizeResult> { ... }
  async estimateTTSDuration(text: string, voice: string, ...): Promise<number> { ... }
}

// src/core/services/commentary/voice-catalog.service.ts
export class CommentaryVoiceCatalogService {
  async listVoices(style?: ScriptStylePreset): Promise<VoiceInfo[]> { ... }
}

// src/core/services/commentary/index.ts
export * from './session.service';
export * from './script.service';
export * from './audio.service';
export * from './voice-catalog.service';

// 移除便捷工厂函数 quickCommentary()，移到单独文件
```

#### 2.2 统一 Pipeline 实现（24h）

```typescript
// ❌ 删除：src/pipeline/engine.ts (137 行)

// ✅ 迁移所有旧版用户到 ChainPipeline
// 文件：src/pipeline/steps/ingest.ts
- import { PipelineStep, PipelineDataContext } from '../engine';
+ import { Step, PipelineContext } from '../../core/pipeline/step';

- export const ingestStep: PipelineStep<...> = {
+ export const ingestStep: Step<...> = {
    name: 'ingest',
-   async execute(input, _ctx: PipelineDataContext) {
+   async execute(input, _ctx: PipelineContext) {
      // ...
    }
  };

// ✅ 更新 src/pipeline/index.ts
- export { PipelineEngine, PipelineStep, ... } from './engine';
+ // 已迁移到 core/pipeline/step.ts
+ export { ChainPipeline, ConcurrentPipeline, Step, ... } from '../core/pipeline/step';
```

---

### Phase 3: 类型系统增强（第 4 周）

**目标**：统一类型，消除 any

**预计时间**：40 小时

#### 3.1 统一核心类型（16h）

```bash
# 1. 确立权威源
mv src/core/types/script.ts   src/types/script.backup.ts  # 备份
mv src/core/types/analysis.ts src/types/analysis.backup.ts # 备份

# 2. 合并到 src/types/
# 手动合并重复定义，确保无冲突

# 3. 删除重复定义
rm src/core/types/*.ts  # 删除已迁移的类型

# 4. 删除向后兼容别名
grep -r "export type.*=.*Draft\|export type.*=.*Segment" src/core/services/
# 删除所有导出别名
```

#### 3.2 Tauri invoke 泛型化（24h）

```typescript
// src/core/tauri/types.ts  (新建)
export interface TauriCommandDefinitions {
  CHECK_FFMPEG: { input: void; output: boolean };
  ANALYZE_VIDEO: { input: { path: string; duration: number }; output: VideoMetadata };
  SYNTHESIZE_SPEECH: { input: SynthesisInput; output: string };
  // ... 共 48 个命令
}

// src/core/tauri/invoke.ts
import type { TauriCommandDefinitions } from './types';

export function invoke<C extends keyof TauriCommandDefinitions>(
  command: C,
  args: TauriCommandDefinitions[C]['input']
): Promise<TauriCommandDefinitions[C]['output']> {
  return window.__TAURI__.core.invoke(command, args);
}

// ✅ 使用
const metadata = await invoke('ANALYZE_VIDEO', { path: videoPath });
// TypeScript 自动推断返回类型为 VideoMetadata
```

---

### Phase 4: 性能优化（第 5 周）

**目标**：Bundle 减少 20%，渲染性能提升 30%

**预计时间**：40 小时

#### 4.1 Bundle 优化（16h）

**检查清单**：
- [ ] 拆分大导入（lodash, date-fns）
- [ ] 按需导入 UI 组件
- [ ] 移除未使用的依赖
- [ ] 配置代码分割

```typescript
// vite.config.ts 优化
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // vendor 按功能拆分
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', 'lucide-react'],
          'vendor-tauri': ['@tauri-apps/api'],
        },
      },
    },
  },
});
```

#### 4.2 React 渲染优化（24h）

**优先优化组件**：

```typescript
// ✅ 使用 React.memo
export const TimelineClip = React.memo(({ clip, onSelect }: Props) => {
  // ...
}, (prev, next) => {
  return prev.clip.id === next.clip.id && prev.clip.selected === next.clip.selected;
});

// ✅ 使用 useMemo
const sortedClips = useMemo(() =>
  clips.sort((a, b) => a.startTime - b.startTime),
  [clips]
);

// ✅ 使用 useCallback
const handleClipSelect = useCallback((id: string) => {
  selectClip(id);
}, [selectClip]);
```

---

### Phase 5: Rust 后端优化（第 6 周）

**目标**：性能与可维护性

**预计时间**：40 小时

#### 5.1 异步边界（20h）

```rust
// ❌ 当前：可能在 Tokio 主线程阻塞
fn process_video_sync(path: &str) -> Result<Video> {
  // FFmpeg 同步调用
}

// ✅ 重构：使用 spawn_blocking
async fn process_video(path: &str) -> Result<Video> {
  tokio::task::spawn_blocking(move || {
    // FFmpeg 同步调用在独立线程
  }).await?
}
```

#### 5.2 统一错误处理（12h）

```rust
// src-tauri/src/error.rs
#[derive(Debug, thiserror::Error)]
pub enum StoryFabError {
  #[error("Video processing failed: {0}")]
  VideoProcessing(#[from] VideoError),

  #[error("FFmpeg not found")]
  FfmpegNotFound,

  #[error("Invalid path: {0}")]
  InvalidPath(String),
}

// 所有 Tauri commands 返回 Result<T, StoryFabError>
#[tauri::command]
async fn export_video(input: ExportInput) -> Result<ExportResult, StoryFabError> {
  // ...
}
```

#### 5.3 添加单元测试（8h）

```rust
// src-tauri/src/services/export.rs
#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_export_video_success() {
    let input = ExportInput { /* ... */ };
    let result = export_video(input).await;
    assert!(result.is_ok());
  }
}
```

---

## 代码示例与迁移指南

### 迁移示例 1：Pipeline 统一

**Before**（使用旧版 Pipeline）：
```typescript
// src/pipeline/steps/script.ts
import { PipelineStep, PipelineDataContext } from '../engine';

export const scriptStep: PipelineStep<AnalysisResult, Script> = {
  name: 'script',
  validate(input) { /* ... */ },
  async execute(analysis, ctx) { /* ... */ }
};
```

**After**（使用新版 Pipeline）：
```typescript
// src/core/pipeline/steps/script.ts
import { Step, PipelineContext } from '../step';

export const scriptStep: Step<AnalysisResult, Script> = {
  name: 'script',
  validate(input) { /* ... */ },
  async execute(analysis, ctx: PipelineContext) { /* ... */ }
};

// 使用
import { ChainPipeline } from '@/core/pipeline/step';
const pipeline = new ChainPipeline(ingestStep, analyzeStep, scriptStep, voiceStep);
const result = await pipeline.run(initialInput);
```

---

### 迁移示例 2：服务层统一

**Before**：
```typescript
// ❌ 独立的 SubtitleService
export class SubtitleService {
  async transcribe(audioPath: string) {
    try {
      return await this.doTranscribe(audioPath);
    } catch (error) {
      logger.error('Failed:', error);
      throw error;
    }
  }
}
```

**After**：
```typescript
// ✅ 继承 BaseService
export class SubtitleService extends BaseService {
  constructor() {
    super('SubtitleService', { timeout: 300_000, retries: 2 });
  }

  async transcribe(audioPath: string) {
    return this.executeRequest(
      async () => await this.doTranscribe(audioPath),
      '转录音频',
      { loadingMessage: '正在转录...' }
    );
  }

  // 提取私有方法
  private async doTranscribe(audioPath: string) {
    // ... 原有实现
  }
}
```

---

### 迁移示例 3：类型统一

**Before**：
```typescript
// ❌ 多处定义
// src/types/script.ts
export interface ScriptSegment { ... }

// src/core/types/script.ts
export interface ScriptSegment { ... }  // 重复！

// src/core/services/ai/script/script-generation-service.ts
export type ScriptSegment = CoreScriptSegment;  // 别名！
```

**After**：
```typescript
// ✅ 单一权威源
// src/types/script.ts
export interface ScriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  content: string;
  type: 'intro' | 'narration' | 'outro' | 'dialogue';
}

// 其他地方直接导入
import type { ScriptSegment } from '@/types';

// ❌ 删除所有重复定义
// ❌ 删除所有向后兼容别名
```

---

## 验证与测试策略

### 每阶段验证清单

#### Phase 1 验证

```bash
# 类型检查
npm run type-check

# 单元测试
npm run test

# E2E 测试（如果有）
npm run test:e2e

# Bundle 大小对比
npm run build
gzip -c dist/assets/*.js | wc -c
```

#### Phase 2 验证

```bash
# 架构验证
npx madge --circular src/  # 确保无循环依赖

# 依赖分析
npm run analyze

# 性能基准
npm run test:perf
```

#### Phase 3 验证

```bash
# 类型覆盖
npx type-coverage --strict

# 类型覆盖率应该 >= 95%
```

#### Phase 4 验证

```bash
# Lighthouse 性能评分
npm run lighthouse

# Bundle 分析
npm run build:analyze

# 目标：Lighthouse > 80
# 目标：Bundle < 400KB
```

---

## 监控与成功指标

### 量化指标

| 指标 | 当前 | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|------|------|---------|---------|---------|---------|---------|
| **代码行数** | 57,000 | 56,700 | 56,000 | 55,000 | 54,500 | 54,000 |
| **Bundle 体积** | 500KB | 490KB | 480KB | 450KB | **400KB** | 400KB |
| **TypeScript any** | 1,200 | 1,180 | 1,100 | 600 | 400 | **<300** |
| **God Objects** | 3 | 3 | 1 | 0 | 0 | 0 |
| **Pipeline 实现** | 2 | 1 | 1 | 1 | 1 | 1 |
| **循环依赖** | 0 | 0 | 0 | 0 | 0 | 0 |
| **测试覆盖** | 10% | 10% | 15% | 25% | 35% | **50%** |
| **React 优化使用** | 32 | 35 | 50 | 70 | 85 | **100+** |

### 质量门禁

每个 PR 必须满足：

- [ ] `npm run type-check` 通过
- [ ] `npm run lint` 无新增 error
- [ ] 单元测试覆盖率不下降
- [ ] Bundle 大小不增加
- [ ] 无新增循环依赖
- [ ] 代码审查通过

### CI/CD 增强

添加以下检查到 `.github/workflows/ci.yml`：

```yaml
- name: Check Circular Dependencies
  run: npx madge --circular src/

- name: Check Code Duplication
  run: npx jscpd src/

- name: Bundle Size Check
  run: npm run build:budget

- name: Type Coverage
  run: npx type-coverage --strict --minimum 95

- name: Performance Budget
  run: npm run lighthouse:ci -- --threshold=80
```

---

## 附录 A：工具与资源

### 开发工具

```bash
# 架构分析
npm install -D madge                  # 循环依赖检测
npm install -D jscpd                  # 代码重复检测

# Bundle 分析
npm install -D rollup-plugin-visualizer

# 类型检查增强
npm install -D type-coverage          # 类型覆盖率检查

# 性能分析
npm install -D @vitest/coverage-v8    # 测试覆盖率
npm install -D lighthouse-ci          # 性能评分
```

### 参考文档

- [TypeScript 最佳实践](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React 性能优化](https://react.dev/learn/render-and-commit)
- [SOLID 原则](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**文档版本**：v1.0
**最后更新**：2026-07-01
**负责人**：Claude（资深软件架构师）
**状态**：✅ 准备执行
