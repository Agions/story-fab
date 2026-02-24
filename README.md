```
  ____ _ _       _____ _
 / ___| (_)_ __ |  ___| | _____      __
| |   | | | '_ \| |_  | |/ _ \ \ /\ / /
| |___| | | |_) |  _| | | (_) \ V  V /
 \____|_|_| .__/|_|   |_|\___/ \_/\_/
           |_|
```

<p align="center">
  <strong>ClipFlow — AI 驱动的专业视频内容创作平台</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-2.0.0-blue.svg" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Tauri-2.0-ffc131?logo=tauri" alt="Tauri" />
</p>

---

## 简介

ClipFlow 是一款面向影视创作者和内容创作者的专业 AI 视频内容创作平台，提供智能脚本生成、视频分析、自动混剪和原创性保障。

> 📝 **更名历史**：ReelForge → **ClipFlow** (2026-02-19)

### 三大核心功能

- 🎬 **AI 视频解说** - 对视频内容进行专业解说，适合教程、评测
- 👤 **AI 第一人称解说** - 以第一人称视角讲述，像主播一样与观众互动
- ✂️ **AI 混剪** - 自动识别精彩片段，生成节奏感强的混剪视频（自动添加旁白）

### 完整工作流程

```
创建项目 → 上传视频 → AI分析 → 生成文案 → 视频合成 → 导出
   ↓          ↓          ↓        ↓          ↓        ↓
 project    video    analysis  script   synthesis   export
           (时长)    (场景)    (内容)   (音画同步)  (文件)
                     +字幕    +配音      +特效
                     (OCR)    (TTS)                
                     (ASR)              
```

### 功能特点

- **多比例支持** — 9:16 (抖音/快手)、16:9 (西瓜)、1:1 (小红书)、4:3
- **智能视频分析** — OCR文字识别、语音字幕、场景检测
- **AI 配音合成** — 文字转语音，多种音色选择
- **音画同步** — 自动对齐配音与视频
- **进度实时显示** — 每步处理都有明确进度
- **结果预览** — 生成前可预览效果

---

## 快速开始

```bash
# 克隆项目
git clone https://github.com/Agions/clip-flow.git
cd clip-flow

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

---

## 技术栈

- **前端框架**：React 18 + TypeScript 5
- **UI 组件库**：Ant Design 5
- **状态管理**：Zustand
- **路由**：React Router 6
- **桌面应用**：Tauri 2.0
- **构建工具**：Vite 4

---

## 项目结构

```
clip-flow/
├── src/
│   ├── components/     # UI 组件
│   ├── core/          # 核心服务
│   │   ├── services/  # 业务服务
│   │   ├── hooks/     # 自定义 Hooks
│   │   ├── store/     # 状态管理
│   │   └── types/     # 类型定义
│   ├── pages/         # 页面组件
│   ├── layouts/       # 布局组件
│   ├── styles/        # 全局样式
│   └── utils/         # 工具函数
├── docs/              # 项目文档
└── src-tauri/         # Tauri 后端
```

---

## 许可证

MIT License - 查看 [LICENSE](./LICENSE) 文件了解详情
