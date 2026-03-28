# 快速开始

> 本指南将帮助你在 5 分钟内上手 StoryForge

---

## 环境要求

| 依赖 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Node.js | ≥ 18 | ≥ 20 |
| pnpm | ≥ 8 | ≥ 9 |
| Rust | 可选 | 最新稳定版 |
| FFmpeg | 必须 | 最新稳定版 |

---

## 🚀 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/Agions/StoryForge.git
cd StoryForge
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置 API 密钥

在项目根目录创建 `.env` 文件：

```bash
cp .env.example .env
```

编辑 `.env`，填入你的 AI 模型密钥：

```env
VITE_OPENAI_API_KEY=sk-xxx
VITE_ANTHROPIC_API_KEY=xxx
VITE_GOOGLE_API_KEY=xxx
```

支持的模型及获取地址：

| 模型 | 获取地址 |
|------|---------|
| OpenAI GPT | https://platform.openai.com |
| Anthropic Claude | https://console.anthropic.com |
| Google Gemini | https://aistudio.google.com |
| DeepSeek | https://platform.deepseek.com |
| 通义千问 | https://dashscope.aliyuncs.com |
| 智谱 GLM | https://open.bigmodel.cn |
| Kimi | https://platform.moonshot.cn |

### 4. 启动开发服务器

```bash
# 前端开发模式
npm run dev

# 完整桌面应用（Tauri）
npm run tauri dev
```

访问 http://localhost:1420 或 Tauri 窗口查看应用。

---

## 📖 快速入门

### 步骤一：创建项目

1. 打开应用首页
2. 点击「新建项目」
3. 输入项目名称 → 点击创建

### 步骤二：上传视频

- **拖拽上传**：直接将视频文件拖入窗口
- **点击上传**：点击上传区域选择文件

| 支持格式 | MP4 / MOV / WebM / AVI / MKV |
|---------|------------------------------|
| 文件大小 | 单文件最大 2GB |
| 批量上传 | 最多 10 个文件同时上传 |

### 步骤三：选择剪辑模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| 🔥 **智能混剪** | AI 自动识别高光，一键生成精彩集锦 | 活动回顾、体育高光 |
| 🎭 **剧情分析** | AI 理解叙事结构，故事驱动的智能剪辑 | 纪录片、访谈、剧情内容 |
| 🎤 **AI 解说** | 自动生成解说词 + 配音合成 | 知识视频、产品介绍 |
| 📝 **第一人称视角** | 第三人称素材转化为个人叙事 | Vlog、旅拍 |
| 🔄 **视频重混** | 智能重组，保留叙事逻辑同时确保原创 | 二次创作 |

### 步骤四：预览并导出

1. 预览 AI 生成的剪辑结果
2. 微调片段顺序、转场、字幕
3. 选择输出格式和分辨率
4. 点击「导出」

---

## 🔧 平台特定配置

### Windows

确保已安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)，Tauri 构建需要。

### macOS

```bash
# 安装 Xcode Command Line Tools
xcode-select --install

# 安装 Homebrew 后
brew install ffmpeg
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install libgtk-3-dev libwebkit2gtk-4.0-dev ffmpeg
```

### FFmpeg 验证

```bash
ffmpeg -version
# 应显示 FFmpeg 版本信息
```

---

## ❓ 常见问题

**Q: npm run dev 报错 `Cannot find module`*\*\***

```bash
pnpm install
```

**Q: Tauri 构建失败**

```bash
rustup update
npm run tauri build
```

**Q: AI 功能无法使用**

检查 `.env` 中的 API 密钥是否正确，以及网络是否能访问对应 AI 服务商。

---

## 下一步

- 📖 [功能特性](./features.md) — 了解 StoryForge 所有能力
- 🔄 [工作流程](./workflow.md) — 了解创作全流程
- 🎭 [剧情分析模式](./guides/plot-analysis.md) — 新功能详解
