# StoryForge

<div align="center">

<p align="center">
  <img src="./docs/public/logo.svg" alt="StoryForge" width="128" />
</p>

<h3 align="center">AI-Powered Professional Video Editing Tool</h3>
<h4 align="center">AI 驱动的专业智能视频剪辑工具</h4>

<p align="center">
  <a href="https://github.com/Agions/StoryForge/releases">
    <img src="https://img.shields.io/github/v/release/Agions/StoryForge?include_prereleases&label=latest" alt="Release" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tauri-2.x-FFC107?logo=tauri" alt="Tauri" />
  <img src="https://img.shields.io/github/stars/Agions/StoryForge" alt="Stars" />
</p>

</div>

---

## 🎯 一句话介绍

> **StoryForge** 是一款**AI 驱动的专业智能视频剪辑工具**，支持剧情分析、智能剪辑、多素材混剪、字幕生成等全链路 AI 剪辑能力，让专业视频制作变得简单。

## ✨ 核心功能

| 功能 | 说明 |
|------|------|
| 🎬 **剧情分析** | AI 分析视频叙事结构、情感曲线 |
| ✂️ **智能剪辑** | 一键生成专业级剪辑方案 |
| 🎙️ **AI 配音** | 多音色 AI 配音，支持中文、英文及多种方言 |
| 🎵 **智能混剪** | 自动识别节奏卡点，多素材智能拼接 |
| 📝 **字幕生成** | ASR 自动字幕提取和 OCR 字幕识别 |
| 🎨 **自动包装** | 智能字幕样式、封面设计、片头片尾生成 |

## 🚀 快速开始

### 环境要求

| 要求 | 版本 |
|------|------|
| Node.js | ≥ 18.0.0 |
| npm | ≥ 9.0.0 |

### 安装

```bash
# 克隆项目
git clone https://github.com/Agions/StoryForge.git
cd StoryForge

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开浏览器访问 <http://localhost:1430>

### 构建

```bash
# 生产环境构建
npm run build
```

## 🤖 AI 模型支持 (2026年3月最新)

| 提供商 | 推荐模型 | 场景 |
|--------|----------|------|
| OpenAI | GPT-5.4 | 剧情分析、脚本生成 |
| Anthropic | Claude Sonnet 4.6 | 长文本分析、代码 |
| Google | Gemini 3.1 Pro | 多模态理解 |
| DeepSeek | V3.2 | 翻译、日常任务 |
| 阿里云 | Qwen 2.5-Max | 中文内容创作 |
| 智谱 | GLM-5 | 中文内容创作 |
| Kimi | K2.5 | 长文本分析 |

详细配置请参考 [AI 模型配置](docs/ai-config.md)。

## 📂 项目结构

```
StoryForge/
├── src/
│   ├── components/       # React 组件
│   │   ├── AIPanel/      # AI 功能面板
│   │   ├── editor/       # 视频编辑器
│   │   └── Home/         # 首页
│   ├── core/             # 核心服务
│   │   ├── services/     # AI 服务、视频处理
│   │   ├── store/        # 状态管理
│   │   └── types/        # 类型定义
│   ├── pages/             # 页面
│   ├── hooks/             # 自定义 Hooks
│   └── utils/             # 工具函数
├── src-tauri/             # Tauri 原生应用
├── docs/                  # 项目文档
└── public/                # 静态资源
```

## 📖 文档

| 文档 | 说明 |
|------|------|
| [快速开始](docs/getting-started.md) | 5 分钟上手 |
| [功能介绍](docs/features.md) | 全部功能详解 |
| [AI 模型配置](docs/ai-config.md) | AI 服务配置 |
| [安装配置](docs/installation.md) | 详细安装指南 |
| [常见问题](docs/faq.md) | FAQ 故障排查 |

完整文档：https://agions.github.io/StoryForge

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| UI 框架 | React 18 + TypeScript |
| 状态管理 | Zustand |
| 视频处理 | FFmpeg + WebCodecs |
| AI 接入 | OpenAI SDK + 多厂商 API |
| 构建工具 | Vite + Tauri |
| 样式 | CSS Modules + Ant Design |

## 🐛 反馈问题

如发现问题或建议，请提交 [GitHub Issues](https://github.com/Agions/StoryForge/issues)。

## 📄 许可证

[MIT License](LICENSE) · Copyright © 2025-2026 [Agions](https://github.com/Agions)

---

<div align="center">

⭐ 如果这个项目对您有帮助，请给一个 Star

</div>
