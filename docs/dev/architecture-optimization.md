---
title: 架构优化方案 v2.0 → v2.1
description: v2.0 现状的 5 个痛点 + 最小入侵改进路径
---

# 架构优化方案 v2.0 → v2.1

原则：不重写，向后兼容 + 可灰度回滚。

## 现状速览

| 维度 | 数量 |
| --- | --- |
| 前端 TS/TSX 源文件 | 439 |
| Rust 源文件 | 95 |
| Pages | 9 |
| Zustand store | 5 |
| services 子模块 | 14 |
| `#[tauri::command]` 数 | 61 |
| Rust 集成测试文件 | 3（resilience / crash_recovery / audio_mix） |

## 5 个核心痛点

### 痛点 1：双服务层职责模糊

`src/services/` 与 `src/core/services/` 边界不清，新人不知道代码该放哪。

### 痛点 2：状态层依赖反噬

view 通过 hook 调 store，再调 service，再调 backend——单向依赖偶尔被反向绕过。

### 痛点 3：注释流类型

解说模式有大量 JSON 字符串在层间传输，编译时无类型保障。

### 痛点 4：测试集中在 service 层

hook、view 层无测试覆盖，组合层出问题难以定位。

### 痛点 5：ADR 文档缺失

新成员上手需要口头交接，缺乏书面决策记录。

## ADR 决策

### ADR-101：双服务层职责划分

- `src/core/services/`：**业务逻辑**，纯 TS，无 IPC，可独立测试
- `src/services/`：**shim 层**，封装 `invoke` 调用，无业务逻辑

### ADR-102：状态层依赖图

```
view → hook → store → service → backend
```

任何反向引用视为架构违规。

### ADR-103：解说模式 Pipeline

5 步流水线累积式 state chain，类型安全 + 单元测试覆盖。

## 执行清单

- [x] ADR-101 落地：`src/services/README.md` 明确说明双层职责
- [x] ADR-102 落地：`src/store/README.md` 说明边界
- [x] ADR-103 落地：`src/core/pipeline/steps/commentary/` 实现 5 步（CommentaryDirectorStep / CommentaryVisualStep / CommentaryNarrationStep / CommentaryTimingStep / CommentaryOverlayStep）+ CompositeCommentaryPipeline 编排 + commentary.test.ts 覆盖
- [x] CI 校验：增加 `verify:store-boundaries` 检查
- [x] 测试覆盖：hook 层增加最小测试
- [x] 18 个组件迁移到 useReducer 状态机（PR #28-#47），141 个 useState 消除
- [x] 19 个 reducer 单元测试覆盖（PR #23d370b - #cb62e54），+469 tests

## v3.0 路线图

- 服务层重构：`core/services` 进一步拆分为 feature 模块
- 状态层：考虑迁移到 Redux Toolkit Query（仅在复杂度提升时）
- 类型系统：核心数据流引入 Zod schema，运行时校验