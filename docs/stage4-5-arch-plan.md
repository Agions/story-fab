# StoryFab 重构 — Stage 4 & Stage 5 架构计划

> 作者：高见远 (Gao)，Software Architect
> 范围：Rust 后端（`src-tauri/src/`，94 个 `.rs` 文件，不含 `target/`）
> 性质：纯分析与计划交付物（ANALYSIS + PLAN）。本文件为唯一新增文件，不修改任何源码。
> 硬约束（来自 lead）：Rust 标识符与目录名保持 `snake_case`（不改名）；`lib.rs` 的 `generate_handler!` 命令契约视为固定；所有改动须可经 `cargo check` / `cargo test` 验证。

---

## Stage 4 — Rust 文档 + 本地清理（不重命名）

### Feasibility（可行性）

- **编译链路已验证可用**：`cargo check` 在本环境通过（约 4.2s，仅 1 个 warning：`binary/hw_accel.rs:122` 不可达语句）。`cargo test` 可行（已有 `utils/mod.rs` 测试模块、`binary/mod.rs` 测试模块、`auto_save/tests.rs`）。
- **关键事实 — lib crate 不报 dead_code**：本项目是 `crate-type = ["staticlib","cdylib","rlib"]` 的库。`pub` 项（无论是否被真正调用）因属于 crate 公共 API，**不会**触发 `dead_code` 警告。因此 "genuinely dead pub code" 必须靠人工追踪调用方（grep）确认，而非依赖编译告警。已用 `cargo check` 排除私有项的死代码（结果为 0 个私有死代码告警）。
- **命令契约固定**：`src-tauri/src/lib.rs:73-147` 的 `generate_handler!` 是所有前端↔后端调用的契约。任何命令名/签名的改动都会破坏 `src/core/tauri/` 的前端调用，故本阶段不动命令。

### 命令图（Command Graph）— 从 lib.rs 展开

`main.rs` → `story_fab_lib::run()` (`lib.rs:45`) → `tauri::generate_handler![...]` 注册 **57 个命令**：

| 来源模块 | 命令（部分列举） | 数量 |
|---|---|---|
| `commands::ai` | `run_ai_director_plan`, `detect_highlights`, `detect_zcr_bursts`, `detect_smart_segments`, `synthesize_speech`, `check_tts_available`, `list_tts_backends`, `translate_text`, `get_export_dir` | 9 |
| `commands::project` | `check_app_data_directory`, `save_project_file`, `load_project_file`, `delete_project_file`, `list_project_files`, `list_app_data_files`, `delete_file`, `read_text_file`, `get_file_size` | 9 |
| `commands::render` | `render_autonomous_cut`, `transcode_with_crop`, `generate_preview`, `export_video` | 4 |
| `commands::export_state` | `cancel_export` | 1 |
| `commands::file_ops` | `clean_temp_file`, `open_file`, `voice_discovery` | 3 |
| `video::*` | `cut_video`, `mix_audio`, `get_audio_duration` | 3 |
| `commands::ffprobe` | `check_ffmpeg`, `analyze_video`, `run_ffprobe` | 3 |
| `subtitle::transcribe` | `transcribe_audio` | 1 |
| `commands::auto_save` | `auto_save_project`, `clear_autosave`, `list_recoverable_projects`, `recover_autosave`, `preview_autosave` | 5 |
| `commands::llm` | `generate_narration_script`, `analyze_video_for_narration`, `list_available_models` | 3 |
| `commentary::director::commands` | `create_director_session`, `get_director_status`, `start_director_analysis`, `generate_director_plan`, `approve_director_plan`, `revise_director_plan`, `complete_director_render`, `destroy_director_session` | 8 |
| `commentary::script_generator` | `generate_commentary_script` | 1 |
| `commentary::synthesizer::commands` | `synthesize_commentary_audio`, `estimate_tts_duration`, `list_commentary_voices` | 3 |
| `commands::crash_recovery` | `list_crashes`, `read_crash`, `delete_crash`, `clear_crashes` | 4 |

**模块图（lib.rs:7-15 的 `pub mod`）**：
- `binary` → `resolver.rs`, `hw_accel.rs`（被 video / render / highlight / segment / subtitle / ai / commentary 广泛调用）
- `commands` → `ai`, `auto_save`, `commentary`, `crash_recovery`, `export_state`, `ffprobe`, `file_ops`, `llm`, `project`, `render`
- `video` → `metadata`, `keyframes`, `thumbnail`（私有）；`processor`, `ffmpeg_cmd`, `mix_audio`, `audio_duration`（公共）
- `types` → `types.rs`
- `utils` → `audio`, `concat`, `process`（私有）；`resilience`（公共）
- `subtitle` → `types`, `whisper`, `transcribe`
- `highlight` → `types`, `audio_analysis`, `scene_detect`, `energy`, `zcr`（私有）；`combiner`（公共）
- `segment` → `types`, `energy`, `scene`, `segmenter`（私有）；`classifier`（公共）
- `llm` → `constants`, `helpers`, `parsing`, `providers`, `types`

**孤儿模块排查结论**：所有 9 个 `lib.rs` 模块均被命令图或彼此引用，**未发现孤儿模块**。`highlight`/`segment` 经 `commands/ai/detection.rs:5-6,29,75`（`HighlightDetector` / `get_highlights` / `SmartSegmenter`）接入命令图，确认存活。真正的 "死代码" 是若干个**未被任何调用方触及的 `pub` 项**（因是 `pub`，编译不报）。

### Doc Gaps（文档缺口）

**A. 模块级 `//!` 缺失（具体位置）**
| 文件 | 行 | 现状 | 建议 |
|---|---|---|---|
| `src-tauri/src/commands/mod.rs` | 1 | 首行即 `pub mod ai;`，无 `//!` | 补模块说明（罗列 10 个子命令模块职责） |
| `src-tauri/src/video/mod.rs` | 1 | 用 `//` 普通注释而非 `//!` | 改为 `//!`，说明 processor/ffmpeg_cmd/mix_audio/audio_duration 职责 |
| `src-tauri/src/highlight/mod.rs` | 1 | 用 `//` 普通注释而非 `//!` | 改为 `//!` |
| `src-tauri/src/types.rs` | 1 | 首行 `use serde::...` + 普通 `//` 分隔注释，无 `//!` | 补 `//!` 说明本文件为跨命令共享的 DTO 契约类型 |

**B. 公共项 `///` 缺失（代表样例，工程师按此标准补齐）**
- `src-tauri/src/video/processor.rs`：全部 `VideoProcessor` 公共方法均无 `///`（`new` L16、`check_installed` L23、`get_metadata` L30、`extract_keyframes` L34、`cut_video_segment` L38、`concat_segments` L76、`generate_thumbnail` L107）。
- `src-tauri/src/utils/audio.rs`：`pcm_samples_from_wav` (L6) 无 `///`（仅测试内部有一行 `//`）。
- `src-tauri/src/binary/hw_accel.rs`：`HwAccel` 枚举 (L7) 与 `impl` 方法 (`h264_encoder` L43 / `hevc_encoder` L53 / `hwaccel_input_args` L67 等) 无 `///`。
- `src-tauri/src/subtitle/types.rs`：`WhisperWord`(L7) / `SubtitleSegment`(L16) / `SubtitleResult`(L27) / `TranscribeProgress`(L45) 等公共结构体无 `///`（仅带 derive）。
- `src-tauri/src/segment/classifier.rs`：`SegmentClassifier` 的 `classify_segment`(L8) / `derive_suggested_speed`(L39) / `is_scene_at`(L72) 无 `///`。

> 标准：每个 `pub fn` / `pub struct` / `pub enum` 至少一句 `///`；每个 `mod.rs` 顶部 `//!` 一句话说明职责 + 子模块清单。

### Safe Cleanup（安全清理 — 死代码，附证明）

> 规则：仅移除命令图不可达、且无任何调用方的 `pub` 项。每项均给出 file:line、证明、风险、验证。

| file:line | what（死代码） | 证明（为何确定死） | 风险 | verification |
|---|---|---|---|---|
| `src-tauri/src/video/processor.rs:111-127` | `VideoProcessor::detect_hw_accel(&self) -> Option<String>` 方法 | 全仓 grep `detect_hw_accel(` 仅命中 `binary/hw_accel.rs:90`（真实现）+ 本方法定义；**无任何调用方**。`VideoProcessor` 本身存活（被 `video/ffmpeg_cmd.rs:86` 使用），仅此方法是冗余的（与 `binary::hw_accel()` 的 `OnceLock` 单例重复）。 | LOW | `cargo check`（移除后编译通过即可） |
| `src-tauri/src/subtitle/types.rs:36-41` | `pub struct WhisperModelInfo` | grep `WhisperModelInfo` 仅命中 `types.rs:36`（定义）+ `subtitle/mod.rs:8`（re-export），**无任何构造/读取**。`lib.rs:99-103` 注释明确 model 管理助手是 Python 片段、非 Tauri 命令。 | LOW | `cargo check` |
| `src-tauri/src/subtitle/types.rs:52-59` | `pub const WHISPER_LANGS` | grep `WHISPER_LANGS` 仅命中定义 (`types.rs:52`) + re-export (`subtitle/mod.rs:8`)，**无任何读取方**，无命令返回它。 | LOW | `cargo check` |
| `src-tauri/src/binary/hw_accel.rs:122` | 不可达语句 `log::info!("[StoryFab] No GPU detected — using CPU encoding")` | `cargo check` 已报 `warning: unreachable statement` at `hw_accel.rs:122`（前一行 `return HwAccel::VideoToolbox;` 已返回）。 | LOW | `cargo check`（warning 消失） |
| `src-tauri/src/Cargo.toml:33` | 未使用依赖 `anyhow = "1"` | 全仓 grep `anyhow` 仅在 `Cargo.toml:33` 与 `Cargo.lock`（reqwest 等传递依赖）出现；**源码中无任何 `anyhow::` / `use anyhow`**。`thiserror` 已用于 `ResourceError`，`anyhow` 完全多余。 | LOW | 删除该行 → `cargo check` + `cargo build`（传递依赖仍在 lock 中，构建不受影响） |

**明确排除（不要动）**：
- `src-tauri/src/types.rs:11` `#[allow(dead_code)]` 的 `DirectorSceneInput.r#type` —— 前端可能传入，属**故意保留**，不要清理。
- `VideoProcessor` 结构体整体 —— 存活（被 `cut_video` 命令使用），**只删其 `detect_hw_accel` 方法**。
- 任何以 kebab-case 重命名文件/目录 —— **禁止**（违反 `snake_case` 硬约束，`mod foo-bar;` 不编译）。

---

## Stage 5 — 架构升级（性能 / 可扩展性 优先）

> 映射：A2=缓存，A3=异步/并发，O1=模块边界/去重，O2=流水线编排，O3=错误处理统一性。
> 排序原则：挑 2–4 个**高价值 + 低风险**；明确标注过高风险/超范围项。

### A2 — 缓存（性能）★ 推荐

- **Improves**：性能。当前 `probe_metadata` / `ffprobe` 每次命令都重新 spawn 进程。同一文件在 `analyze_video` + `generate_preview` + `render_autonomous_cut` + `detect_*` 流程中被反复探测，造成重复 ffprobe 开销。
- **Design**：在 `video/` 新增 `video/metadata_cache.rs`（或并入 `video/mod.rs`），用 `OnceLock<Mutex<HashMap<PathBuf, (SystemTime, serde_json::Value)>>>` 做基于 `(路径, mtime)` 的缓存。提供 `probe_metadata_cached(path, ffprobe_path) -> Result<Value,String>`，将原 `probe_metadata` 调用点（`video/processor.rs:31`、`commands/ffprobe.rs`、`commands/render/*` 的 ffprobe 调用）改为走缓存版本。mtime 变化即失效。不新增外部依赖（`std::sync::Mutex` + `std::time::SystemTime` 即可）。
- **Risk**：LOW–MED。需保证 `Sync`（用 `Mutex` 而非 `RefCell`）；仅进程内有效，不做跨进程缓存。
- **Verification**：`cargo check`；加一个单测验证同一路径二次调用命中缓存（mtime 不变时返回相同 `Value`）；前端 vitest 不受影响（契约不变）。
- **Touches contract?**：**NO**。

### O3 — 错误处理统一性 ★ 推荐

- **Improves**：可维护性 / 清晰度。现状：命令几乎全返回 `Result<T, String>`；`ResourceError`（`thiserror`）只在 `ResourceLimiter` 用；`anyhow` 声明却未用 —— 三套错误处理基调不一致。
- **Design（保守版，不改契约）**：
  1. 新增 `utils/error.rs`，提供 `pub fn err(msg: impl Into<String>) -> String` 与常用构造器，统一中文字符串错误格式。
  2. 内部可引入 `pub type AppResult<T> = Result<T, String>` 提升可读性（**不改命令返回签名**）。
  3. 顺带移除未用依赖 `anyhow`（见 Stage 4 清理表）。
  4. **禁止**本阶段把 `-> Result<T, String>` 换成自定义 `thiserror` 枚举返回命令 —— 那会改变 `InvokeError` 的序列化形态，触碰契约。
- **Risk**：LOW。纯内部重构，命令行为不变。
- **Verification**：`cargo check` + `cargo test`（现有 auto_save / utils / binary 测试仍绿）；前端 vitest 不受影响。
- **Touches contract?**：**NO**。

### O1 — 模块边界 / 去重 LLM Provider ★ 推荐

- **Improves**：清晰度 / 可维护性，降低双实现行为漂移风险。当前存在**两套并行** LLM Provider：
  - `crate::llm::providers/{openai.rs, deepseek_qwen.rs, gemini.rs, anthropic.rs, router.rs}`，对外 `call_openai_compatible` / `call_gemini` / `call_anthropic` + 调度器 `call_llm_provider`。
  - `commands/commentary/script_generator/{openai_call.rs, gemini_call.rs, anthropic_call.rs, providers.rs}`，**重复实现** `call_openai_compatible` / `call_gemini` / `call_anthropic` + 另一调度器 `call_llm`（见 `providers.rs:13`）。
  - 此外 `llm/types.rs` 与 `commands/commentary/script_generator/types.rs` 各定义了一份 `ScriptStyle` / `ScriptSegment`（字段可能已分化）。
- **Design**：
  1. 让 `commands/commentary/script_generator` **复用** `crate::llm::providers::{call_openai_compatible, call_gemini, call_anthropic}`（及其 router）。
  2. 删除 `openai_call.rs` / `gemini_call.rs` / `anthropic_call.rs` 三份重复实现，与 `providers.rs` 中重复的 `call_llm` 调度器；`providers.rs` 改为 `pub use crate::llm::providers::{...}`。
  3. （较低优先级、较高风险）评估是否统一 `ScriptStyle`/`ScriptSegment` 类型 —— 若两处字段已分化则保留各自类型，仅去重 provider。
- **Risk**：MED。两实现可能在 timeout / `base_url` 处理上已悄悄分化；先做 diff 比对再删除，保留 commentary 特有参数。
- **Verification**：`cargo check`；`cargo test`（commentary 若有单测）；前端 commentary 解说流程 vitest 回归。
- **Touches contract?**：**NO**（仅改内部 provider 调用路径，命令名/签名不变）。

### A3 — 异步 / 并发（可选，低优先级）

- **Improves**：性能。`ResourceLimiter` 信号量已对 `transcode` / `autonomous_cut` 限流（`transcode.rs:27,101`、`autonomous_cut/mod.rs:39`）；`cut_segments_parallel` 已并行切段；`spawn_blocking` 已用于 `transcribe` / `detection` / `transcode` —— 并发基础已具备。
- **Design**：剩余可优化点 —— `commands/ai/detection.rs` 的 `detect_highlights` / `detect_smart_segments` 中，energy / zcr 分析与 scene 检测相互独立，可用 `tokio::join!` 或并行 `spawn_blocking` 并发执行后聚合。
- **Risk**：MED。需重构分析流程并保序/聚合正确。
- **Verification**：`cargo check`；用样本视频做集成验证（输出与现有一致）。
- **Touches contract?**：**NO**。

### O2 — 流水线编排（多步 AI Director → Commentary → Synthesize）

- **Improves**：清晰度 / 可扩展性。当前编排在前端：`run_ai_director_plan`(ai) → `generate_commentary_script`(commentary) → `synthesize_commentary_audio`(commentary)；`commentary::director` 已有状态机（`states.rs` / `state_ops.rs`）。
- **Design**：**本阶段不推荐**。后端编排器会合并这些命令 → 改变命令数量/语义 → **触碰契约**、且把编排逻辑从前端迁至 Rust，改动面大。
- **Risk**：HIGH。
- **Touches contract?**：**YES**。
- → 见 "Out of scope"。

---

## Out of scope / too risky（超范围 / 过高风险）

- **O2 后端流水线编排器**：HIGH 风险，改变命令契约（前端驱动 → 后端驱动），本阶段不做。
- **全量 async 重写**（用流式/异步媒体库替换阻塞式 FFmpeg）：HIGH 风险、改动面巨大，不做。
- **把命令返回类型从 `Result<T, String>` 换成自定义 `thiserror` 枚举**：MED–HIGH，会改变 `InvokeError` 序列化形态（契约），仅在后续单独评估。
- **任何 Rust 文件/目录 kebab-case 重命名**：**禁止**（违反 `snake_case` 硬约束，`mod foo-bar;` 不编译）。
- **移除 `VideoProcessor` 整体 / 改动命令签名 / 改动 `generate_handler!`**：禁止（破坏前端契约）。

---

## Recommended execution order（推荐执行顺序）

1. **T01 — Stage 4 安全清理（低风险快赢）**：删除 `VideoProcessor::detect_hw_accel` (`processor.rs:111-127`)、`WhisperModelInfo` (`types.rs:36-41`)、`WHISPER_LANGS` (`types.rs:52-59`)；修 `hw_accel.rs:122` 不可达日志；移除 `anyhow` 依赖 (`Cargo.toml:33`)。全部 `cargo check` 验证。
2. **T02 — Stage 4 文档缺口**：补 `//!`（commands/mod.rs、video/mod.rs、highlight/mod.rs、types.rs）；按标准补公共项 `///`（processor / audio / hw_accel / subtitle::types / segment::classifier）。
3. **T03 — Stage 5 A2 元数据缓存**（性价比最高、LOW–MED）：实现 `probe_metadata_cached`，路由 ffprobe/metadata 调用方。无契约变更。
4. **T04 — Stage 5 O3 错误处理标准化**（LOW）：新增 `utils/error.rs`，统一 `Result<T,String>` 错误构造；`anyhow` 已随 T01 移除。
5. **T05 — Stage 5 O1 去重 LLM Provider**（MED）：先 diff 两套 provider 差异，再删除 `script_generator/{openai_call,gemini_call,anthropic_call}.rs` 与重复 `call_llm` 调度器，改为复用 `crate::llm::providers`。
6. **(可选) Stage 5 A3 检测并行化**（MED，最低优先级）：`detection.rs` 中 energy/zcr 与 scene 并发执行。

> 执行建议：T01→T02 可并行（互不影响）；T03 先于 T05（缓存是更稳的 perf 赢）；T05 需在 diff 确认无行为分歧后再删代码；每步均以 `cargo check` 为门禁，T01/T03/T05 加 `cargo test` 回归。
