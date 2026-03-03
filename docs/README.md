# ClipFlow

> AI 驱动的专业视频内容创作平台

<p align="center">
  <img src="/logo.svg" alt="ClipFlow" width="100" />
</p>

<p align="center">
  <a href="https://github.com/agions/clipflow">
    <img src="https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react" alt="React" />
  </a>
  <a href="https://github.com/agions/clipflow">
    <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript" alt="TypeScript" />
  </a>
  <a href="https://github.com/agions/clipflow">
    <img src="https://img.shields.io/badge/Tauri-2.x-FFC107?style=flat-square&logo=tauri" alt="Tauri" />
  </a>
  <a href="https://github.com/agions/clipflow">
    <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  </a>
</p>

---

## 简介

ClipFlow 是一款面向影视创作者和内容创作者的专业 AI 视频内容创作平台。通过深度整合前沿大语言模型，ClipFlow 为用户提供 **智能脚本生成**、**视频分析** 和 **智能混剪** 等核心功能，大幅提升视频创作效率。

## 核心特性

| 功能           | 描述                                                    |
| -------------- | ------------------------------------------------------- |
| 🎬 AI 智能剪辑 | 自动识别精彩片段，智能生成剪辑方案                      |
| 🎙️ 智能解说    | 支持 AI 自动生成专业解说文案                            |
| 🎵 AI 混剪     | 多素材智能合成，自动匹配节奏                            |
| 🔍 视频分析    | 深度分析视频内容，提取关键信息                          |
| 🌐 多模型支持  | 集成 GPT、Claude、Gemini、DeepSeek、Kimi 等顶级 AI 模型 |

## 技术栈

```
┌─────────────────────────────────────────────────────────────┐
│                      前端技术栈                              │
├─────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript  │  Ant Design 5.x  │  Zustand   │
│  LESS + CSS Modules     │  Framer Motion   │   Vite     │
├─────────────────────────────────────────────────────────────┤
│                      桌面应用                               │
├─────────────────────────────────────────────────────────────┤
│                          Tauri 2.x                          │
└─────────────────────────────────────────────────────────────┘
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发

```bash
npm run dev
```

### 构建桌面应用

```bash
npm run tauri build
```

## 支持的 AI 模型

| 厂商          | 模型            | 适用场景     |
| ------------- | --------------- | ------------ |
| **OpenAI**    | GPT-5.3         | 综合文本生成 |
| **Anthropic** | Claude 4.6 Opus | 长文本分析   |
| **Google**    | Gemini 3 Ultra  | 多模态理解   |
| **DeepSeek**  | DeepSeek R1     | 推理任务     |
| **阿里云**    | Qwen 3.5        | 中文内容     |
| **智谱**      | GLM-5           | 多任务处理   |
| **月之暗面**  | Kimi k2.5       | 长文本处理   |

## 科技暗黑主题

ClipFlow 采用精心设计的科技暗黑风格：

- 🌑 **深邃黑背景** - #0a0a0f 主色调
- ✨ **霓虹发光** - 紫色/青色/粉色光效
- 💎 **玻璃拟态** - 现代半透明组件
- 🎬 **流畅动画** - 丝滑过渡效果

## 项目结构

```
src/
├── components/     # React 组件
├── pages/         # 页面组件
├── services/      # 业务服务
├── store/         # Zustand 状态
├── context/       # React Context
├── hooks/         # 自定义 Hooks
├── utils/         # 工具函数
├── styles/        # 全局样式
└── types/        # TypeScript 类型
```

## 相关文档

- [快速开始](getting-started) - 环境配置和安装
- [功能特性](features) - 详细功能介绍
- [工作流程](workflow) - AI 创作流程
- [常见问题](faq) - FAQ 解答
- [更新日志](CHANGELOG) - 版本更新记录

## 许可证

MIT License - 自由使用和修改

---

<p align="center">Made with ❤️ by Agions/p>
