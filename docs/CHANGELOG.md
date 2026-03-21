# 更新日志

> 所有项目变更将记录在此文件中

---

## [1.0.0-beta] - 2026-03-21

### 🔧 优化

#### 代码质量
- 类型统一：`VideoProject` 类型添加，原 `Project` 标记 `@deprecated`
- 组件拆分：`VideoProcessingController/modules/` 模块化
- 代码清理：TODO 注释增强描述信息

#### 重构
- **console.log → logger 重构**：33+ 文件统一使用 `@/utils/logger`
- **工具函数去重**：`helpers.ts` 重导出 `array.ts`，消除 `unique`/`groupBy`/`sortBy`/`shuffle` 重复实现
- **localStorage key 统一**：重命名 `'reelforge-store'` → `'clipflow-app-settings'`

#### 清理
- 移除未使用依赖：`styled-components` @types/styled-components
- 删除死代码：`src/features/` 目录 (-511 行)

### 🧪 测试
- 新增 `format.test.ts` (33 tests)
- 新增 `object.test.ts` (23 tests)
- 测试结果：101 passed

### ✅ 质量门禁
- TypeScript: 0 errors
- ESLint: 0 warnings
- Build: ~17s

---

## [1.0.0-beta] - 2026-03-03

### ✨ 新增

- 科技暗黑主题 UI 设计
- 霓虹发光效果
- 玻璃拟态组件
- 默认暗色模式
- 简化左侧导航栏（首页、项目管理、设置）
- API 密钥管理面板支持 Google (Gemini)
- 2026年3月最新 AI 模型列表

### 🔄 更新

- 设计系统配色方案
- 布局组件暗色样式
- 首页视觉效果
- 输入框改为白色背景

### 🤖 模型更新

| 厂商 | 新增/更新模型 |
|------|---------------|
| OpenAI | GPT-5.3 (最新) |
| Anthropic | Claude 4.6 Opus |
| Google | Gemini 3 Ultra |
| DeepSeek | DeepSeek R1 |
| 月之暗面 | Kimi k2.5 |
| 阿里云 | Qwen 3.5 |
| 智谱 | GLM-5 |

### 🗑️ 移除

- 百度 ERNIE 模型

---

## [1.x.x] - 早期版本

### 初始版本

- 基础项目结构
- React + TypeScript + Tauri 技术栈
- Ant Design UI 组件库
- Zustand 状态管理
- 基础 AI 功能集成

---

## 版本号规范

本项目遵循 [语义化版本控制](https://semver.org/lang/zh-CN/)：

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的新功能
- **PATCH**: 向后兼容的问题修复

---

## 发布周期

- 每月发布一次小版本
- 重要功能随时发布
- 重大版本每年发布

---

<p align="center">感谢您使用 ClipFlow！</p>
