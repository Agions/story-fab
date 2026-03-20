# ClipFlow

<p align="center">
  <img src="./public/logo.svg" alt="ClipFlow" width="128" />
</p>

<h3 align="center">AI 驱动的智能视频剪辑桌面应用</h3>

<p align="center">
  <a href="https://github.com/agions/clipflow/releases">
    <img src="https://img.shields.io/github/v/release/agions/clipflow?include_prereleases&label=latest" alt="Release" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/React-18+-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tauri-2.x-FFC107?logo=tauri" alt="Tauri" />
  <img src="https://img.shields.io/github/stars/agions/clipflow" alt="Stars" />
</p>

---

## ⭐ 为什么选择 ClipFlow？

| 特性 | 说明 |
|------|------|
| 🤖 **AI 智能剪辑** | 自动识别精彩片段，一键生成精彩集锦 |
| 📝 **智能字幕** | 语音转文字 + 多语言翻译 + 风格化字幕 |
| 🎵 **自动配乐** | 根据视频情绪智能匹配背景音乐 |
| 🔒 **本地运行** | 所有数据本地处理，保护隐私安全 |
| 💻 **桌面应用** | Tauri 构建，轻量流畅 |

---

## 🚀 快速开始

### 环境要求

- Node.js `>= 20`
- npm `>= 10`
- Rust（Tauri 打包需要）

### 安装

```bash
# 克隆项目
git clone https://github.com/agions/clipflow.git
cd clipflow

# 安装依赖
npm install

# 启动开发
npm run dev
```

### 构建

```bash
# 开发模式（前端）
npm run dev

# 生产构建
npm run build

# Tauri 桌面应用
npm run tauri dev      # 开发
npm run tauri build    # 打包
```

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 前端开发模式 |
| `npm run build` | 前端生产构建 |
| `npm run tauri dev` | Tauri 开发模式 |
| `npm run tauri build` | Tauri 打包 |
| `npm run type-check` | TypeScript 类型检查 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 运行测试 |
| `npm run test:coverage` | 测试覆盖率 |
| `npm run docs:dev` | 文档开发服务器 |

---

## 🎯 核心功能

### 1. AI 智能剪辑
- 场景切换检测
- 音频峰值识别（笑声、掌声）
- 运动强度分析
- 自动生成精彩集锦

### 2. 智能字幕
- 语音转字幕 (ASR)
- 多语言翻译
- 字幕风格化
- 导出 SRT/ASS/VTT

### 3. 自动配乐
- 情绪匹配音乐
- 本地音乐库
- 淡入淡出
- 音量调节

### 4. 多模型接入
- OpenAI
- Anthropic  
- Google AI
- 阿里通义
- 智谱 AI
- 支持自定义 API

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript 5 |
| UI 组件 | Ant Design 5 |
| 状态管理 | Zustand 5 |
| 桌面客户端 | Tauri 2.x (Rust) |
| 构建工具 | Vite 6 |
| AI 服务 | OpenAI + Claude API |

---

## 📂 项目结构

```
clipflow/
├── src/                        # 前端源码
│   ├── components/             # React 组件
│   │   ├── editor/            # 编辑器组件
│   │   │   └── Timeline/      # 时间轴组件（模块化）
│   │   ├── AIPanel/          # AI 功能面板
│   │   └── common/           # 通用组件
│   ├── core/                  # 核心逻辑
│   │   ├── services/          # 业务服务
│   │   │   ├── workflow/      # 工作流服务
│   │   │   │   └── steps/    # 工作流步骤
│   │   │   └── ai.service.ts # AI 服务
│   │   └── types/            # 类型定义（统一）
│   ├── pages/                 # 页面组件
│   ├── hooks/                 # 自定义 Hooks
│   ├── store/                # Zustand 状态管理
│   ├── styles/               # 全局样式
│   └── theme/                # 主题系统
├── src-tauri/                # Tauri/Rust 后端
├── docs/                      # 文档
├── scripts/                   # 构建脚本
└── tests/                     # 测试文件
```

---

## 🤝 贡献指南

欢迎贡献！请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

```bash
# 克隆项目
git clone https://github.com/agions/clipflow.git

# 创建分支
git checkout -b feature/your-feature

# 安装依赖
npm install

# 提交更改
git commit -m 'feat: 添加新功能'

# 推送
git push origin feature/your-feature
```

---

## 📖 文档

- [📚 在线文档](https://agions.github.io/clipflow/)
- [🔥 快速开始](docs/getting-started/quick-start.md)
- [⚙️ 模型配置](docs/guides/model-config.md)
- [💡 核心工作流](docs/guides/core-workflow.md)

---

## 📝 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新。

---

## 💬 交流社区

- [GitHub Issues](https://github.com/agions/clipflow/issues) - 报告 Bug
- [Discussions](https://github.com/agions/clipflow/discussions) - 功能讨论

---

## 📄 License

MIT License - 自由使用，商用欢迎！

---

<p align="center">
  <strong>如果这个项目对你有帮助，欢迎点个 ⭐ Star！</strong>
</p>
