---
title: 快速开始
description: 5 分钟快速上手 CutDeck，从安装到第一个 AI 视频剪辑项目。
---

# 快速开始

本文档帮助你 **5 分钟内** 启动 CutDeck 项目并完成第一次 AI 视频剪辑。

---

## 前置条件

| 要求 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18.0.0 | 推荐 LTS 版本 |
| npm / pnpm | ≥ 9.0.0 | 随 Node.js 一起安装 |
| FFmpeg | 最新版 | 视频处理核心依赖 |
| Git | ≥ 2.30.0 | 用于版本控制 |

详见 [安装配置](./installation.md)。

---

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/Agions/CutDeck.git
cd CutDeck
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 AI API 密钥

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少配置一个 AI 提供商：

```bash
# 选择默认提供商（任选其一）
VITE_DEFAULT_PROVIDER=deepseek

# DeepSeek 配置（性价比最高）
VITE_DEEPSEEK_API_KEY=sk-xxxx

# OpenAI 配置
VITE_OPENAI_API_KEY=sk-xxxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# 通义千问配置
VITE_QIANWEN_API_KEY=xxxx
```

::: tip 推荐
初次使用推荐 **DeepSeek Chat**，性价比最高，效果出色。
:::

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 <http://localhost:1430>

::: warning 注意
首次启动时，依赖安装和构建可能需要 **3-5 分钟**，请耐心等待。
:::

---

## 创建第一个项目

### Step 1 — 导入素材

1. 点击主界面 **「新建项目」**
2. 选择 **「导入视频」**，支持以下格式：

| 格式 | 扩展名 |
|------|--------|
| MP4 | `.mp4` |
| QuickTime | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| WebM | `.webm` |

### Step 2 — AI 分析

1. 选择导入的视频素材
2. 点击 **「AI 分析」** 按钮
3. 等待 AI 完成分析（场景分割 / 高光检测 / 关键帧提取）

### Step 3 — AI 拆条（v1.7.0 新功能）

1. AI 分析完成后，点击 **「AI 拆条」** 进入拆条工作区
2. 选择 **目标平台**（抖音 / 小红书 / B站 / YouTube Shorts / TikTok）
3. 设置 **目标片段数量**（3 / 5 / 8 / 10 / 15 个）
4. 点击 **「开始 AI 拆条分析」**
5. 查看 6 维评分，勾选满意的片段
6. 点击 **「导出选中片段」** 选择格式（9:16 / 1:1 / 16:9）

### Step 4 — 手动剪辑（如需）

如需更精细的控制：

1. 在时间线上拖拽调整片段
2. 预览最终效果
3. 添加字幕（点击 **「字幕」** → **「Whisper ASR」**）

### Step 5 — 导出成片

1. 满意后点击 **「导出」**
2. 选择导出格式（MP4 H.264 / MP4 H.265）
3. 设置输出路径和画质
4. 点击 **「开始导出」**

---

## 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放 / 暂停 |
| `K` | 停止 |
| `J` | 后退 1 帧 |
| `L` | 前进 1 帧 |
| `I` | 设置入点 |
| `O` | 设置出点 |
| `Delete` | 删除选中片段 |
| `Cmd/Ctrl + Z` | 撤销 |
| `Cmd/Ctrl + E` | 导出 |

---

## 下一步

- [AI 智能拆条](./guide/clip-repurpose.md) — 完整拆条流程
- [字幕处理](./guide/subtitle.md) — Whisper ASR + 字幕样式
- [导出格式](./guide/export.md) — 平台优化预设
- [批量处理](./guide/batch-processing.md) — 多视频并行处理

---

## 遇到问题？

- 查看 [安装配置](./installation.md) 确认环境依赖
- 查看 [常见问题](./faq.md) 寻找解决方案
- 在 [GitHub Issues](https://github.com/Agions/CutDeck/issues) 提交问题
