# O2 — Pipeline Orchestration 增量 PRD

> **范围**：StoryFab 桌面应用（Tauri 2.x 后端 + React/Vite 前端）  
> **性质**：增量 PRD，仅新增后端编排命令，不删除任何现有命令  
> **约束**：前端↔后端命令契约视为只读（新增 additive-only）

---

## 1. Product Goal

当前 AI 影视解说流程在前端由 3~6 个独立命令串行编排完成（Director 会话管理 + 脚本生成 + 音频合成），存在调用分散、错误恢复困难、进度难以统一的问题。O2 的目标是在后端新增一个**单一的流水线命令** `run_commentary_pipeline`，将 "AI Director → Commentary Script → Synthesize" 三段核心逻辑收拢到后端状态机内执行，从而：
1. 减少前端命令编排复杂度，降低前端状态机维护成本；
2. 统一进度与错误处理，使前端只需监听单一事件流即可驱动 UI；
3. 为后续扩展（如并行合成、断点续传）提供后端单一入口，避免前端重复改造。

---

## 2. User Stories

| 优先级 | User Story |
|---|---|
| **P0** | As a **backend**, I want to execute the full AI Director → Commentary Script → Synthesize pipeline as a **single command** so that the frontend no longer needs to orchestrate multiple calls. |
| **P0** | As a **frontend developer**, I want to migrate to the single pipeline command **without breaking** existing flows, so that I can adopt it incrementally. |
| **P1** | As a **frontend developer**, I want to **opt into** the new pipeline command and receive unified progress events so that I can replace the current polling + multi-command error handling. |
| **P2** | As a **product owner**, I want the three individual commands (`run_ai_director_plan`, `generate_commentary_script`, `synthesize_commentary_audio`) to be **deprecated** in a future major version so that the API surface stays clean. |

---

## 3. Scope & Boundaries

### In Scope
- 新增后端命令 `run_commentary_pipeline`（模块路径待定，见 Open Questions），内部串联：
  1. Director 阶段：分析视频 → 生成 Plan → 确认 Plan（复用现有 `commentary::director` 状态机或直接调用其逻辑）；
  2. Script 阶段：调用 `generate_commentary_script` 生成解说词；
  3. Synthesize 阶段：批量调用 `synthesize_commentary_audio` 为每个解说段落合成音频。
- 通过 Tauri Events（`app.emit`）向前端推送**统一进度事件**。
- 前端新增可选的 `invoke('run_commentary_pipeline', ...)` 调用路径。

### Out of Scope（本次 PRD）
- **不删除**现有三个命令（`run_ai_director_plan`、`generate_commentary_script`、`synthesize_commentary_audio`）。它们继续保留以维持向后兼容。
- **不改动**三个命令的内部行为/输出。当它们被单独调用时，必须与当前行为一致。
- 不改动 `commentary::director` 状态机的对外命令签名（`create_director_session` 等 8 个命令保持不变）。
- 不改变前端现有的 commentator 面板 UI 交互逻辑（本次仅替换底层调用路径）。

---

## 4. Frontend Impact Assessment

### 4.1 代码审计结果（真实调用方）

| 命令 | 前端调用文件 | 调用位置 | 说明 |
|---|---|---|---|
| `run_ai_director_plan` | **无** | — | 在 `src-tauri/src/lib.rs` 注册，TS 类型定义存在，但**全仓 grep 未发现任何前端调用方**。该命令当前为纯计算函数（输入 segments/scenes → 输出 pacingFactor/beatCount），不参与前端实际编排。 |
| `generate_commentary_script` | `src/core/services/commentary/script-service.ts` | L66, L76 (`quickCommentary`) | 批量生成脚本 + 批量合成音频的便捷入口。 |
| `generate_commentary_script` | `src/hooks/use-commentary-script.ts` | L114, L161 (`generate` / `multiGenerate`) | 单风格 / 多风格脚本生成。 |
| `generate_commentary_script` | `src/components/commentary-panel/commentary-panel.tsx` | L137, L143 (`handleGenerateScript` / `handleMultiStyleGenerate`) | 主面板"生成脚本"按钮。 |
| `synthesize_commentary_audio` | `src/core/services/commentary/script-service.ts` | L76 (`quickCommentary`) | 批量合成音频。 |
| `synthesize_commentary_audio` | `src/hooks/use-commentary-voice.ts` | L74 (`previewVoice`) | 音色预览合成。 |

### 4.2 当前错误处理与进度追踪模式

- **调用方式**：所有命令通过 `src/core/tauri/invoke.ts` 的 `invoke()` 泛型函数发起，内部带指数退避重试（默认 0 次）。
- **错误处理**：`TauriBridgeError` 包装，区分 retryable（timeout/busy/temporary）与不可重试错误；前端使用 `toast.error` 展示。
- **进度追踪**：
  - Director 状态通过轮询 `get_director_status` 获取（`useDirectorStatus` hook 内部定时刷新）。
  - Script 生成与 Audio 合成为**单次阻塞调用**，无中间进度事件（LLM 与 TTS 均为黑盒直到返回）。
  - 前端 pipeline steps（`src/core/pipeline/steps/commentary/*`）使用 `onProgress(stage, pct, message)` 回调追踪内部逻辑，但这属于前端纯逻辑步骤，不涉及后端事件。

### 4.3 单命令对前端状态机/事件处理的影响

若前端切到 `run_commentary_pipeline`：
- **正面**：无需再分别管理 Director 会话生命周期、Script 生成 loading、Audio 合成 loading；只需一个 `isPipelineRunning` 状态。
- **负面**：当前 `commentary-panel` 的 Plan 确认弹窗（`planConfirmOpen`）逻辑需要调整——后端流水线将自动执行到完成，前端不再有"生成 Plan → 用户确认 → 开始渲染"的分阶段交互。P1 需提供"自动确认"或"人工确认"参数。
- **事件模型变化**：从多命令 + 轮询 → 单命令 + Tauri Events 推送。前端需新增 `listen('pipeline-progress', ...)` 与 `listen('pipeline-complete', ...)`。

### 4.4 需改动的前端文件清单

| 文件 | 改动类型 | 说明 |
|---|---|---|
| `src/core/tauri/command-types.ts` | 新增类型 | 添加 `run_commentary_pipeline` 的 input/output 定义 |
| `src/core/tauri/invoke.ts` | 新增常量 | 添加 `RUN_COMMENTARY_PIPELINE` |
| `src/core/tauri/methods/commentary.ts` | 新增方法 | 添加 `runPipeline(input)` |
| `src/core/tauri/index.ts` | 新增导出 | 暴露 `runPipeline` |
| `src/core/services/commentary/session-service.ts` | 新增服务 | 添加 `runCommentaryPipeline()` 高层封装 |
| `src/hooks/use-commentary-script.ts` | 可选改造 | `generate` / `multiGenerate` 内部可切换走 pipeline |
| `src/hooks/use-commentary-voice.ts` | 可选改造 | `previewVoice` 保持原样（预览不走 pipeline） |
| `src/components/commentary-panel/commentary-panel.tsx` | 可选改造 | 新增"一键生成解说+配音"按钮；Plan 确认逻辑改为可选 |
| `src/core/services/commentary/script-service.ts` | 可选改造 | `quickCommentary` 可改为调用 pipeline（P1/P2） |

---

## 5. API Contract（Proposed）

### 5.1 新命令签名

**Rust 端**（示意签名，非实现）：

```rust
#[tauri::command]
pub async fn run_commentary_pipeline(
    input: CommentaryPipelineInput,
) -> Result<CommentaryPipelineOutput, String> {
    // 内部串联：
    // 1. create_director_session / start_director_analysis / generate_director_plan / approve_director_plan
    // 2. generate_commentary_script
    // 3. synthesize_commentary_audio (逐段批量合成)
    // 通过 app.emit("pipeline-progress", ...) 推送进度
}
```

**Input（最小可行）**：

```typescript
interface CommentaryPipelineInput {
  sessionId: string;            // Director 会话 ID
  videoPath: string;            // 视频路径（用于 director analysis）
  subtitles: string;            // 字幕文本
  style?: ScriptStylePreset;    // 解说风格，默认 conversational
  targetDurationSecs?: number;  // 目标时长
  apiKey: string;               // LLM API Key
  provider?: string;            // LLM provider，默认 openai
  model?: string;               // LLM model
  baseUrl?: string;             // LLM base URL
  voice?: string;               // TTS 音色，默认根据 style 推导
  speed?: number;               // TTS 语速，默认 1.0
  autoApprove?: boolean;        // P1: 是否自动确认 Plan（跳过人工确认）
}
```

**Output（聚合三类结果）**：

```typescript
interface CommentaryPipelineOutput {
  // Director Plan 结果
  directorPlan: {
    id: string;
    angle: string;
    targetDurationSecs: number;
    recommendedVoice: string;
    confidence: number;
    keyPoints: string[];
  };
  // Script 结果
  script: {
    fullScript: string;
    segments: Array<{
      startTime: number;
      endTime: number;
      text: string;
      emotion?: string;
    }>;
    estimatedDurationSecs: number;
    modelUsed: string;
    provider: string;
  };
  // Audio 结果（与 segments 一一对应）
  audioSegments: Array<{
    text: string;
    audioPath: string;
    durationSecs: number;
  }>;
  // 汇总
  totalAudioDurationSecs: number;
}
```

### 5.2 事件契约

| 事件名 | Payload | 触发时机 |
|---|---|---|
| `pipeline-progress` | `{ stage: 'director' \| 'script' \| 'synthesize', progress: number (0-1), message?: string }` | 每个子阶段开始/完成时 |
| `pipeline-complete` | `CommentaryPipelineOutput` | 全流程成功结束 |
| `pipeline-error` | `{ stage: string, error: string }` | 任一子阶段失败 |

### 5.3 与现有三命令的映射关系

| Pipeline 阶段 | 内部复用命令 | 参数流转 |
|---|---|---|
| Director | `create_director_session` → `start_director_analysis` → `generate_director_plan` → `approve_director_plan` | `sessionId` / `videoPath` / `subtitles` / `style` / `targetDurationSecs` 直接透传；`apiKey` 不参与 Director 阶段。 |
| Script | `generate_commentary_script` | `subtitles` + `style` + `targetDurationSecs` + `apiKey` + `provider` + `model` + `baseUrl` 透传；若 Director 阶段产出了 `summary` / `highlights`，作为 `summary` / `highlights` 字段传入。 |
| Synthesize | `synthesize_commentary_audio`（逐段循环） | 对 `script.segments` 逐条调用，`voice` 取 Director Plan 的 `recommendedVoice` 或用户指定；`speed` 透传。 |

### 5.4 向后兼容策略

- 现有三个命令（以及 Director 状态机的 8 个命令）**继续保留**，`generate_handler!` 继续注册。
- 新命令 `run_commentary_pipeline` 为**纯增量**，前端可通过 feature flag / 配置项决定走新路径还是旧路径。
- 旧路径在下一个 major version 前保持绿标，不标记 deprecated（避免 IDE 噪音），仅在文档中标注"建议迁移至 `run_commentary_pipeline`"。

---

## 6. Risks & Mitigations

| 风险 | 等级 | 缓解措施 |
|---|---|---|
| **契约风险**：新命令改变了前端调用模式，可能引入隐蔽 bug | Medium | Additive-only：旧命令 100% 保留；新命令通过 opt-in 启用，双轨并行验证 1 个 sprint。 |
| **状态 divergence**：Pipeline 内串联的命令产出与前端分别调用不一致 | High | 每个子阶段**严格复用现有命令函数**（不要复制逻辑）；输出字段做 `assert_eq!` 或快照对比测试（pipeline 输出 vs 分步调用输出）。 |
| **前端迁移风险**：commentary-panel 的 Plan 确认弹窗交互与自动 pipeline 冲突 | Medium | P0 阶段 pipeline 仍返回 `directorPlan`，前端保持现有"确认"交互；P1 再提供 `autoApprove` 参数跳过确认。 |
| **批量 TTS 耗时**：逐段 `synthesize_commentary_audio` 循环可能阻塞异步运行时 | Low-Medium | 使用 `tokio::spawn` + 限流（复用 `ResourceLimiter`）控制并发；单步失败时记录错误段落并继续（可配置 strict/lenient 模式）。 |
| **进度事件丢失**：Tauri Events 在极端负载下可能丢包 | Low | 前端以最终 `pipeline-complete` 输出为准，progress 事件仅做展示；最终结果校验通过 `commentary_pipeline_output` 完整性。 |

---

## 7. Open Questions

1. **模块归属**：`run_commentary_pipeline` 应放在 `commands::commentary::pipeline` 还是 `commands::ai::pipeline`？  
   - 倾向 `commands::commentary::pipeline`，因为该命令核心是串联 Commentary 子系统（Script + Synthesize），Director 状态机也已在 `commentary::director` 下。

2. **状态机复用 vs 包装**：Pipeline 是**直接复用** `commentary::director::commands` 的 8 个状态机命令，还是**在 pipeline 内部重新实现**一套轻量状态机？  
   - 倾向直接复用 8 个命令函数，保持单一事实来源（SSOT），避免 `build_plan` 等逻辑双份维护。

3. **进度事件粒度**：是统一为**单一事件流**（`pipeline-progress` + `stage` 字段），还是保留**各子步骤原有事件**（如 `director-progress`、`script-progress`、`synthesize-progress`）？  
   - 倾向统一事件流 + 一个 `stage` 字段，降低前端 `listen` 注册数量；若子步骤需要更细粒度，可在 `message` 中携带 JSON 字符串。

4. **错误恢复语义**：当 Pipeline 中途失败（如 Script 生成失败），Director 会话状态应回滚到 `Ready` 还是保持 `Rendering`？  
   - 建议 Pipeline 内部 catch 失败后，调用 `revise_director_plan` 或直接状态回滚，确保前端再次查询 `get_director_status` 时不会卡在 `Rendering`。

---

## Appendix：Backend 现状速查

### 现有命令图（与本 PRD 相关部分）

| 模块 | 命令 | 前端调用情况 |
|---|---|---|
| `commands::ai` | `run_ai_director_plan` | **无前端调用** |
| `commands::commentary::director` | `create/get/start/generate/approve/revise/complete/destroy_director_session` (8 个) | 前端通过 `useCommentarySession` + `commentary-panel` 调用 |
| `commands::commentary::script_generator` | `generate_commentary_script` | 前端通过 `useCommentaryScript` + `commentary-panel` 调用 |
| `commands::commentary::synthesizer` | `synthesize_commentary_audio` | 前端通过 `useCommentaryVoice` + `script-service.ts` 调用 |

### 前端核心文件定位

- **Tauri 桥接层**：`src/core/tauri/{invoke.ts, command-types.ts, methods/commentary.ts, index.ts}`
- **Service 层**：`src/core/services/commentary/{session-service.ts, script-service.ts, audio-service.ts, index.ts}`
- **Hook 层**：`src/hooks/use-commentary-session.ts`, `use-commentary-script.ts`, `use-commentary-voice.ts`
- **UI 层**：`src/components/commentary-panel/commentary-panel.tsx`
