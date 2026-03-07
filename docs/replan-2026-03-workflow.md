# ClipFlow 2026-03 重规划（多 Agent）

更新时间：2026-03-06

## 1. 目标

- 产品定位：不是传统剪辑软件，而是 AI 自主剪辑软件（精品项目路线）。
- 模型层：只保留官方文档可核验的模型 ID，避免虚构版本号。
- 业务层：明确三条核心产品线。
- 工程层：按模块拆分，便于多人并行开发和维护。

## 2. 三条核心流程

### AI 解说（精准对齐）

1. 上传素材
2. 场景分析（镜头切分 + 语义标签）
3. 脚本生成（逐镜头）
4. 对齐校验（解说段落 vs 镜头时长）
5. 自动添加原画轨（可关闭）
6. 预览与导出

验收指标：
- 口播与镜头时间漂移 P95 <= 0.8s
- 解说段落覆盖率 >= 98%

### AI 混剪（自动旁白）

1. 多素材上传
2. 选段打分（情绪、运动、信息密度）
3. 自动成片（镜头排序 + 转场）
4. 自动旁白补全（空白段优先）
5. 自动添加原画轨（可关闭）
6. 人工微调与导出

验收指标：
- 空白时段（无解说）占比 <= 5%
- 关键镜头保留率 >= 90%

### AI 第一人称视角解说

1. 上传素材
2. 叙事意图识别（“我”的行动线）
3. 第一人称脚本生成
4. 口吻一致性校验
5. 自动添加原画轨（可关闭）
6. 预览与导出

验收指标：
- 第一人称句式占比 >= 95%
- 语气一致性评分 >= 4/5

## 3. 模块化目录建议

```text
src/core/
  config/
    models.config.ts
  workflow/
    featureBlueprint.ts
  services/
    scene-commentary-alignment.service.ts
    ai-director.service.ts
    commentary-mix.service.ts
src-tauri/src/
  lib.rs  # run_ai_director_plan / render_autonomous_cut(多片段拼接+转场+字幕+原画轨) / 本地文件命令
```

## 4. 多 Agent 分工建议

- Agent A（Model Ops）：维护模型与 API 兼容性、下线预警。
- Agent B（Vision）：镜头切分、标签、节奏评分。
- Agent C（Narration）：脚本生成、旁白补全、第一人称改写。
- Agent D（Sync QA）：解说-画面对齐评分与回归测试。
- Agent E（UI/UX）：工作流交互、状态可视化、编辑器体验。

## 5. 实施顺序

1. 统一模型清单与推荐策略。
2. 上线三模式入口和动态步骤条。
3. 接入对齐服务，输出 drift/confidence 指标。
4. 落地自动原画轨策略与遮挡评分（导出前 QA）。

## 6. 当前工程体检（2026-03-06）

- `type-check`：已通过（0 错误）。
- `build`：已通过，但存在大包告警。
  - `antd-vendor`: 1,100 KB（gzip 342 KB）。
- `lint`：已拆分为双轨并通过。
  - `lint` / `lint:core`：核心模块门禁（通过）。
  - `lint:legacy`：存量模块巡检（通过，临时关闭 `ban-ts-comment`）。
- 当前 `@ts-nocheck` 文件数：0（本轮完成收尾，新增完成 `editor/Timeline` 清理）。

## 7. 下一阶段优化清单（按优先级）

### P0（本周）

1. 模型统一收口（已完成）
   - 设置页、模型选择器、AI 助手、脚本生成功能全部改为核心模型源。
2. 三大核心流程对齐
   - `AI 解说`、`AI 混剪`、`AI 第一人称` 共用同一镜头分析结果和时间轴对齐服务。
3. 对齐质量门禁
   - 导出前强制执行 `scene-commentary-alignment`，低分段落自动重写。

### P1（两周）

1. 去 `@ts-nocheck` 专项
   - 目标：75 -> 30。
   - 先处理核心链路：`workflow`、`editor`、`services`。
2. Lint 分层
   - `lint:core`（强门禁）和 `lint:legacy`（渐进治理）拆分执行，保证新代码质量。
3. 打包拆分
   - 基于页面域进一步拆 `antd-vendor`，将编辑器专用依赖延后加载。

### P2（一个月）

1. 自动评测体系
   - 解说-画面对齐、混剪节奏评分、第一人称一致性做离线回归。
2. 多 Agent 执行编排
   - Director / Vision / Narration / QA 四代理串并联，支持失败重试和降级。
3. 可观测性
   - 每次生成记录模型、耗时、漂移、重试次数，支持回放分析。

## 9. 当前收尾状态（2026-03-06）

- TypeScript 存量清理完成：`src` 内 `@ts-nocheck = 0`。
- 构建与质量门禁稳定：
  - `type-check` / `lint` / `lint:legacy` / `build` 全通过。
- 性能债已显著缓解：
  - 当前无 `>500KB` chunk 告警，需持续防止回弹。

## 10. 下一步执行建议（可直接实施）

1. 路由级组件懒加载已完成，下一步建议做“页面内重组件懒加载”
   - 目标：把 `AIVideoEditor` 内高开销模块（二级面板、时间轴、预览）改为按标签懒加载。
2. 拆分 AntD 使用面
   - 目标：减少首屏路径对 `antd` 重组件（Table/Tabs/Form）的同步依赖。
3. 持续执行性能预算门禁
   - 目标：在 CI 固化 `build:ci`，防止包体积回弹。

## 8. 交付标准（精品项目）

- 画面-解说漂移：P95 <= 0.8s。
- 混剪空白段占比：<= 5%。
- 第一人称句式占比：>= 95%。
- 核心流程成功率：>= 98%（含自动重试后）。
- 导出可用率：>= 99%。

## 11. 工程推进快照（2026-03-06 追加）

- 预算门禁已接入：
  - `package.json` 新增 `build:budget`、`build:ci`。
  - `scripts/check-bundle-budget.mjs` 作为构建后预算检查脚本（默认阈值 `MAX_CHUNK_KB=600`、`MAX_CHUNK_GZIP_KB=90`）。
- 根壳性能优化已落地：
  - `AppProvider` 与 `Layout` 改为 `React.lazy` 懒加载。
  - `ErrorBoundary` 去除 `antd` 依赖，避免错误兜底路径把重量 UI 库打进首包。
  - `AppProvider` locale 导入统一为 `antd/locale/zh_CN` 与 `antd/locale/en_US`。
  - `ClipFlowProvider` 从全局入口下沉到 `AIVideoEditor` 页面内注入，主路由与 AI 工作流状态解耦。
- 依赖引用与页面拆分优化：
  - 业务代码中 `@/core/services` 桶引用已改为直连具体 service 文件，减少无关模块联动打包。
  - `ProjectDetail` 的 `VideoAnalyzer / SubtitleExtractor / ScriptEditor / VideoProcessingController / VideoInfo` 已改为按步骤懒加载。
  - `Projects` 列表视图已拆分为独立懒加载模块（`ProjectsListView`），并在“列表视图”按钮 hover 时预加载。
  - `ScriptDetail` 已改为编辑器懒加载并在页面数据就绪后预热加载。
  - `ScriptEditor.tsx` 已统一为薄封装重导出，收口到模块化 `ScriptEditor/index` 实现，避免同名文件/目录解析歧义。
  - `ProjectsListView` 与 `ScriptEditor/SegmentTable` 已由 `Table` 改为 `List` 渲染，显著降低表格子系统打包负担。
- 最新构建体积（`npm run build:ci`）：
  - 最大 JS chunk：`index-cAd-IhBQ.js` `245.38 KB`（gzip `79.38 KB`）。
  - `Table` chunk 已不在预算 Top8（当前可达路径已基本移除重表格依赖）。
  - `react-vendor-CUJEmqHC.js`：`161.19 KB`（gzip `52.63 KB`）。
- 质量门禁状态：
  - `type-check` 通过。
  - `lint:legacy` 通过。
  - `build` 通过。
  - `build:budget` 通过。

## 12. 工程推进快照（2026-03-06 再追加）

- `framer-motion` 依赖已从前端路径完全剔除：
  - 新增兼容层 `src/components/common/motion-shim.tsx`，以零动画实现承接 `motion.div` / `AnimatePresence` 接口，保证 UI 行为稳定并移除动画库打包体积。
  - `AIModelSelector`、`ModelSelector`、`ScriptGenerator`、`ScriptGeneratorV2`、`SubtitleExtractor`、`VideoUploader`、`pages/Editor` 均已切换到本地 shim。
  - `vite.config.ts` 中 `motion-vendor` 分包规则已移除；`optimization.config.ts` vendor 列表已去除 `framer-motion`。
  - `package.json` 已卸载 `framer-motion`。
- 最新验证结果（同轮）:
  - `npm run type-check --silent` 通过。
  - `npm run lint:legacy` 通过。
  - `npm run build:ci` 通过。
- 最新预算基线（`build:budget`）:
  - 最大 chunk 仍为 `index-cAd-IhBQ.js`：`245.38 KB`（gzip `79.38 KB`）。
  - `react-vendor`：`161.19 KB`（gzip `52.63 KB`）。
  - `motion-vendor` 已消失（无 `framer-motion` 残留 chunk）。
- 路由一致性修复：
  - 新增规范脚本路由：`/project/:projectId/script/:scriptId`。
  - 移除无效入口 `/script/new`。
  - `ProjectDetail` 参数读取统一为 `projectId`，与路由保持一致。
  - `ScriptDetail` 兼容旧链接（仅 `scriptId`）并自动从 store 反查所属项目。
- 模型统一收口（2026-03-06）：
  - 代码内 OpenAI 主模型标识由 `gpt-5.2` 统一升级为 `gpt-5.3-codex`。
  - `DEFAULT_MODEL_ID`、模型推荐、优化策略、成本映射、类型别名已同步一致。
  - 设置页默认模型下拉不再出现旧值 `gpt-5.2`。
- 路由常量统一（2026-03-06）：
  - `src/core/constants/index.ts` 与 `src/shared/constants/index.ts` 的 `PROJECT_DETAIL/PROJECT_EDIT` 已从旧式 `/projects/:id` 统一为 `/project/:projectId` 与 `/project/edit/:projectId`。
  - 模型版本常量 `MODEL_VERSION` 同步更新为 `2026-03-06`，与本轮模型收口变更日期一致。
- 导出前对齐门禁（2026-03-06）：
  - 已在 `workflowService.stepExport` 增加强制门禁：
    - 阈值：`minConfidence = 0.8`、`maxDriftSeconds = 0.8`。
    - 自动修复：对低分段落自动将字幕片段与脚本片段时间对齐到对应视频片段窗口。
    - 修复后复检：若仍不达标则阻断导出并返回明确错误。
  - 门禁结果写入 `WorkflowData.alignmentGateReport`（before/after、自动修复段数、是否通过）。
  - 导出 UI 已透传具体失败原因，不再只显示通用“导出失败”。
- 门禁可视化（2026-03-06）：
  - `Workflow ExportStep` 已展示对齐门禁报告：阈值、修复前/后平均置信度、最大漂移、低置信/高漂移段落计数、自动修复段数、是否通过。
  - 导出阶段现在支持“可见化验收”，便于在导出前确认解说与画面匹配质量。
- 门禁细粒度可视化（2026-03-06 继续）：
  - `alignmentGateReport` 新增失败段落明细：`failedSegmentsBefore/failedSegmentsAfter`（segmentId、drift、confidence）。
  - 导出页新增失败段落列表与“前往时间轴修正”按钮，可直接跳回 `timeline-edit` 步骤进行处理。
- 导出门禁 -> 时间轴定位闭环（2026-03-06 继续）：
  - 导出页失败段落列表支持“定位到时间轴”。
  - 点击后自动跳转 `timeline-edit` 并定位到对应字幕段落时间窗口。
  - 时间轴页增加定位提示，可关闭后继续手动微调。
