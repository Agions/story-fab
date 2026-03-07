# ClipFlow 多子Agent协同整改计划（2026-03）

## 目标
- 在不破坏现有可运行状态下，分轨道并行修复代码质量问题。
- 每个轨道独立可验收，统一通过 `type-check`、`lint:legacy`、`build:ci`。

## Agent 轨道

### Agent A1 - 页面结构与路由规范（已完成）
- 结果：路由页统一为 `pages/<Route>/index.tsx + index.module.less`
- 结果：`App.tsx` 路由懒加载统一到目录入口
- 结果：已移除冲突入口 `Editor.tsx`、`VideoEditor.tsx`

### Agent A2 - 类型安全治理（进行中）
- 范围优先级：
1. `src/core/services/**`
2. `src/core/hooks/**`
3. `src/pages/**`
- 本批目标：
1. 清理关键流程中的 `any`（workflow / editor / ai clip）
2. 为公共 DTO 建立精确类型
3. 禁止新增 `any`
- 验收：`npm run type-check --silent` 必须通过

### Agent A3 - 日志与错误处理治理
- 将 `console.log/warn/error` 统一替换为 `src/utils/logger.ts`
- 区分开发/生产日志级别
- 关键失败路径统一 error code 与用户提示文案

### Agent A4 - AI 模型配置一致性治理
- 设置页模型下拉严格来源于 API Key 已配置 provider
- 统一模型源：`src/core/config/models.config.ts`
- 清除历史旧模型与重复枚举

### Agent A5 - UI 与流程一致性治理
- 设置页、编辑页、工作流页统一信息架构
- 消除重复按钮与不一致状态文案
- 增加关键交互空态与错误态

## 执行节奏
- 第 1 批：A2 + A3
- 第 2 批：A4 + A5
- 每批结束都执行：
  - `npm run type-check --silent`
  - `npm run lint:legacy`
  - `npm run build:ci`
