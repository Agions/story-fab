# 更新日志

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-03-28

### 🎭 新功能

#### 剧情分析模式 (Plot Analysis Mode) ✨NEW

**核心功能**:

- **剧情图谱 (Plot Timeline)**: 自动分析视频中的剧情结构，生成可视化的故事节点图谱
- **节点类型识别**: 
  - 背景铺垫 (Setup)
  - 上升情节 (Rising Action)
  - 高潮 (Climax)
  - 情感转折 (Emotional Beat)
  - 对话场景 (Dialogue)
  - 动作场景 (Action)
- **情感分析**: 识别视频中的情绪变化轨迹
- **多版本输出**:
  - 📼 剧情完整版 (Full Narrative)
  - ✂️ 精华版 (Highlights Reel)  
  - ⚡ 高能混剪版 (Intense Mix)

**技术实现**:

- 视频帧采样 + 场景检测
- 音频转文字 (ASR) + 对话分析
- 情绪识别 (兴奋/平静/紧张等)
- LLM 剧情理解 (时间戳 + 文字描述 → 剧情结构分析)
- 多模态融合剪辑决策

**新增模块**:

- `src/core/services/plotAnalysis.service.ts` - 剧情分析服务

#### 项目重命名

- **旧名称**: StoryForge (126+ 同名项目，侵权风险)
- **新名称**: StoryForge
- 体现"AI视频创作 + 故事叙事"的核心价值

### 📚 文档更新

- **README.md**: 全新专业化设计
  - Hero section + 技术栈徽章
  - 功能概览表格
  - 快速开始指南
  - 架构模块图
- **ARCHITECTURE.md**: 扩展架构文档
  - 新增剧情分析服务架构
  - 插件系统设计
  - 扩展点说明
- **DEVELOPER.md**: 新增开发者指南
  - 环境搭建
  - 调试技巧
  - 添加新功能指南
- **CONTRIBUTING.md**: 扩展贡献指南
  - Commit 格式规范
  - PR 流程
  - 分支管理

### 🏗️ 架构升级

- 领域模型清晰化
- Service 层模块化
- 准备 Plugin 系统支持不同 AI 模型

---

## [1.0.0-beta] - 2026-03-10

### 🚀 新功能

- **AI 智能剪辑**
  - 场景切换检测
  - 音频峰值识别 (笑声、掌声)
  - 运动强度分析
  - 自动生成精彩集锦

- **智能字幕**
  - 语音转字幕 (ASR)
  - 多语言翻译
  - 字幕风格化
  - 导出 SRT/ASS/VTT

- **自动配乐**
  - 情绪匹配音乐
  - 本地音乐库
  - 淡入淡出
  - 用户上传

- **多模型接入**
  - OpenAI API
  - Anthropic Claude
  - 本地模型支持
  - 自定义 API

### ⚡ 性能优化

- UI 无障碍优化 (aria-labels, keyboard navigation)
- 组件懒加载
- 图片懒加载

### 🔧 改进

- README 完善
- 统一日志系统
- 主题系统优化

### 📦 依赖更新

- React 18
- Tauri 2.x
- Ant Design 5
- TypeScript 5

---

## [0.9.0-alpha] - 2026-01

### 🚀 新功能 (初版)

- 项目管理系统
- 视频上传与管理
- 基础剪辑功能
- AI 解说生成
- AI 混剪
- POV 叙事

---

## 迁移指南

### 从 1.0.x 升级到 1.1.0

1. 更新依赖：`npm install`
2. 拉取最新代码：`git pull origin main`
3. 如使用旧剪辑模式，参考新的剧情分析模式

### 从 0.9.x 升级到 1.0

1. 更新依赖：`npm install`
2. 重新构建：`npm run tauri build`

---

## 旧版本

- 查看 [GitHub Releases](https://github.com/agions/storyforge/releases)
