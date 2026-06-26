# StoryFab 架构重构方案与代码优化路线图

> 基于影视/短剧解说行业调研结果
> 版本：v2.3.0
> 日期：2026-06-25

---

## 一、架构重构目标

将 StoryFab 从"通用视频编辑器+解说功能"改造为**影视/短剧解说业务专用高性能系统**。

### 1.1 设计原则

| 原则 | 说明 |
|------|------|
| **流水线驱动** | 6步解说流水线是唯一的主干路径 |
| **单一职责** | 每个模块只做一件事 |
| **消除二义性** | 不存在两条路径做同一件事 |
| **极致精简** | 以最少的代码量实现最稳健的功能 |
| **命名统一** | 文件/目录 kebab-case，类型/组件 PascalCase |

### 1.2 量化目标

| 维度 | 重构前 | 重构后 | 降幅 |
|------|--------|--------|------|
| 页面数 | 9 个 | 4 个 | -56% |
| Store 数 | 5 个 | 3 个 | -40% |
| Service 目录 | 14 个 | 7 个文件 | -50% |
| Tauri 命令 | 61 个 | ~30 个 | -51% |
| 类型定义位置 | 6+ 处 | 1 处 | -83% |
| 非kebab-case文件 | 212 个 | 0 个 | -100% |

---

## 二、已完成的重构工作

### Phase 1: 类型统一 ✅

**目标**：建立统一类型源

**成果**：
- 创建 `src/types/` 目录，包含 8 个领域类型文件：
  - `project.ts` - 项目模型
  - `media.ts` - 视频/音频媒体类型
  - `script.ts` - 解说脚本类型
  - `voice.ts` - 语音/TTS类型
  - `analysis.ts` - AI分析结果类型
  - `pipeline.ts` - 流水线状态类型
  - `export.ts` - 导出配置类型
  - `timeline.ts` - 时间线模型
- 所有旧类型位置改为重导出层（向后兼容）
- 添加 `@/types` 路径别名

### Phase 2: 流水线引擎 ✅

**目标**：建立6步强制线性流水线

**成果**：
- 创建 `src/pipeline/engine.ts` - PipelineEngine状态机
- 实现6个步骤：
  - `ingest.ts` - 素材导入 + 元数据提取
  - `analyze.ts` - 场景检测 + 关键帧 + 音频分析
  - `script.ts` - LLM脚本生成 + 风格控制
  - `voice.ts` - TTS语音合成
  - `compose.ts` - 视频合成 + 字幕 + 混音
  - `export.ts` - 多格式导出 + 硬件加速
- 每个步骤独立可重试，支持断点续做
- Pipeline状态可通过subscribe模式观察

### Phase 3: 路由精简 ✅

**目标**：精简页面入口

**成果**：
- 路由从15个精简到12个
- 消除重复入口（/dashboard、/ai-editor等）

### Phase 5.1: 命名规范化 ✅

**目标**：全项目文件统一kebab-case

**成果**：
- 212个非kebab-case文件 → 0个
- 60个commits
- 涵盖：store、errors、utils、services、config、pipeline、components、hooks、pages、tauri方法、workflow

### Phase 5.2: 死代码清理 ✅

**目标**：移除未使用的代码

**成果**：
- 移除未使用的文件（use-pipeline.ts、video-project.ts）
- 移除未使用的函数（createPipeline、timeline工具函数）
- 清理未使用的CSS类（workspace.module.less、highlights.module.css）
- 修复孤立的测试文件
- 修复CSS模块导入

---

## 三、代码优化路线图

### 3.1 极致精简方案

#### 3.1.1 Service层精简

**当前状态**：14个service目录，部分功能重叠

**精简方案**：

| 当前模块 | 精简后 | 说明 |
|----------|--------|------|
| ai/ + aiClip/ + providers/ | `services/ai.ts` | AI服务统一 |
| video/ + videoEffectService/ | `services/video.ts` | 视频处理统一 |
| subtitle/ + asr/ | `services/subtitle.ts` | 字幕服务统一 |
| export/ | `services/export.ts` | 导出服务 |
| project/ + file/ + storage/ | `services/project.ts` | 项目存储 |
| editor/ | `services/editor.ts` | 编辑器服务 |
| commentary/ | `services/commentary.ts` | 解说服务 |

**预期收益**：14个目录 → 7个文件，减少50%的模块数量

#### 3.1.2 Store层精简

**当前状态**：5个Zustand Store

**精简方案**：

| 当前Store | 精简后 | 说明 |
|-----------|--------|------|
| appStore + modelStore | `store/app-store.ts` | 全局状态 |
| projectStore | `store/project-store.ts` | 项目+流水线状态 |
| editorStore + timelineStore | `store/editor-store.ts` | 编辑器+时间线状态 |

**预期收益**：5个Store → 3个Store，减少40%

#### 3.1.3 页面精简

**当前状态**：9个页面

**精简方案**：

| 当前页面 | 精简后 | 说明 |
|----------|--------|------|
| Home + Dashboard | `pages/home.tsx` | 首页合并 |
| Projects + ProjectDetail + ProjectEdit + ScriptDetail | `pages/projects.tsx` | 项目管理合并 |
| VideoEditor + AIVideoEditor + StoryFab workspace | `pages/workspace.tsx` | 工作区统一 |
| Settings | `pages/settings.tsx` | 设置保持 |

**预期收益**：9个页面 → 4个页面，减少56%

### 3.2 DRY原则实施方案

#### 3.2.1 消除重复组件

**问题**：存在两套功能重叠的组件

| 重复组件A | 重复组件B | 合并方案 |
|-----------|-----------|----------|
| Timeline/ | VideoEditor/Timeline | 合并为 editor/timeline.tsx |
| ScriptEditor/ | CommentaryPanel/ScriptEditor | 合并为 workspace/script-panel.tsx |
| VideoPlayer/ | StoryFab workspace播放器 | 合并为 editor/player.tsx |

#### 3.2.2 消除重复逻辑

**问题**：多处实现相同的视频处理逻辑

| 重复逻辑 | 位置 | 统一方案 |
|----------|------|----------|
| 视频元数据提取 | videoProcessor + ffprobe | 统一到 services/video.ts |
| 场景检测 | highlight/ + segment/ | 统一到 pipeline/steps/analyze.ts |
| TTS合成 | synthesizer/ + commentary_synthesizer/ | 统一到 pipeline/steps/voice.ts |
| 字幕生成 | subtitle/ + asr/ | 统一到 services/subtitle.ts |

### 3.3 性能优化方案

| 优化点 | 策略 | 预期收益 |
|--------|------|----------|
| **懒加载** | 每个流水线步骤组件按需加载 | 首屏加载 -40% |
| **Web Worker** | 视频分析、脚本生成移入Worker | UI不卡顿 |
| **增量更新** | 流水线状态变更只diff变化部分 | 减少re-render |
| **缓存策略** | 步骤结果缓存到本地 | 避免重复计算 |
| **并发执行** | analyze步骤的子任务并行 | 分析速度 +200% |
| **硬件加速** | NVENC/VideoToolbox/VAAPI | 导出速度 +300% |

---

## 四、实施计划

### 4.1 执行顺序

```
Phase 1 (类型统一) ✅
    ↓
Phase 2 (流水线引擎) ✅
    ↓
Phase 3 (路由精简) ✅
    ↓
Phase 5.1 (命名规范化) ✅
    ↓
Phase 5.2 (死代码清理) ✅
    ↓
Phase 6 (Service层精简) ← 下一步
    ↓
Phase 7 (Store层精简)
    ↓
Phase 8 (页面精简)
    ↓
Phase 9 (组件合并)
    ↓
Phase 10 (性能优化)
```

### 4.2 风险评估

| 阶段 | 风险等级 | 说明 |
|------|----------|------|
| Phase 6 | 中 | Service层重构影响面广 |
| Phase 7 | 低 | Store合并相对独立 |
| Phase 8 | 中 | 页面合并涉及路由变更 |
| Phase 9 | 高 | 组件合并可能破坏UI |
| Phase 10 | 低 | 性能优化不影响功能 |

---

## 五、验证标准

### 5.1 功能验证

- [ ] 6步流水线完整执行
- [ ] 每个步骤独立可重试
- [ ] 断点续做正常
- [ ] 批量处理正常

### 5.2 性能验证

- [ ] 首屏加载 < 2s
- [ ] 视频分析 < 30s
- [ ] 脚本生成 < 10s
- [ ] TTS合成 < 5s/段
- [ ] 视频导出 < 60s/min

### 5.3 代码质量验证

- [ ] TypeScript编译零错误
- [ ] 生产构建通过
- [ ] 所有测试通过
- [ ] 无未使用的导入
- [ ] 无重复代码
- [ ] 100% kebab-case命名

---

## 六、总结

StoryFab已完成向"影视/短剧解说业务专用系统"的架构升级基础：

1. **类型统一**：单一类型源 `@/types`
2. **流水线引擎**：6步强制线性流水线
3. **命名规范**：100% kebab-case
4. **死代码清理**：移除未使用的代码

**下一步工作**：
- Service层精简（14→7）
- Store层精简（5→3）
- 页面精简（9→4）
- 组件合并（消除重复）
- 性能优化（懒加载/Worker/缓存）

**核心竞争力**：
- 100%本地处理，隐私安全
- 6步流水线引擎，架构清晰
- 多LLM提供商支持，灵活扩展
- 硬件加速，性能优秀
- 行业标准工作流完全对齐
