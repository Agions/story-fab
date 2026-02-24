# ClipFlow 更新日志

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-02-19

### 重命名

- **ReelForge → ClipFlow**: 项目正式更名为 ClipFlow

### 新增功能

#### 9 步智能工作流
- 视频上传 → 分析 → 模板选择 → 脚本生成 → 去重优化 → 唯一性保障 → 脚本编辑 → 时间轴 → 导出
- 完整的端到端 AI 视频创作流程

#### AI 模型支持
- OpenAI (GPT-5)
- Anthropic (Claude Opus 4.6)
- Google (Gemini 3)
- 百度 (ERNIE 5.5)
- 阿里 (Qwen 3.5)
- 智谱 (GLM-5)
- 讯飞 (Spark X1)
- MiniMax (MiniMax-01)

#### 脚本模板
- 7 种脚本模板：专业、轻松、幽默、情感、技术、营销、叙事
- 6 种风格可选
- 可调节长度（短/中/长）

#### 原创性保障
- 内容指纹生成
- 语义去重检测
- 8 种去重变体：保守型、平衡型、激进型、创意型、学术型、口语型、诗意型、技术型
- 唯一性检测与自动重写

#### 成本追踪
- 实时 Token 用量统计
- API 调用成本计算
- 按模型/按日统计

### 重构

- 移除 CLI 功能
- 合并重复服务（clip-workflow.service.ts → aiClip.service.ts）
- 删除重复组件
- 新增 AI 剪辑布局（AILayout）

### 技术栈更新

- React 18
- TypeScript 5
- Vite 4
- Ant Design 5
- Zustand 4
- Tauri 2.0

---

## [1.0.0] - 2024-XX-XX

### 初始版本 (ReelForge)

- 视频上传与基本处理
- 基础脚本生成
- 简单的视频剪辑功能
- 字幕生成
- 语音合成

---

## 更新日志说明

### 版本号格式

`[主版本].[次版本].[补丁版本]`

- 主版本：重大架构变更
- 次版本：新功能
- 补丁版本：bug 修复

### 标签

- `新增` - 新功能
- `优化` - 改进现有功能
- `重构` - 代码重构
- `移除` - 移除的功能
- `修复` - bug 修复

---

## 迁移指南

### 从 1.x 迁移到 2.0

1. **API 变更**
   - 服务层 API 重新设计
   - 状态管理迁移到 Zustand

2. **功能变化**
   - 移除 CLI，请使用桌面端或 Web 端

3. **配置更新**
   - 更新模型配置格式
   - 重新配置 API 密钥
