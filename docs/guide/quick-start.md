---
title: 快速开始
description: 5 分钟快速上手 StoryForge，从安装到第一个 AI 视频剪辑项目。
---

# 快速开始

本文档帮助你 **5 分钟内** 启动 StoryForge 项目并完成第一次 AI 视频剪辑。

---

## 前置条件

| 要求 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18.0.0 | 推荐 LTS 版本 |
| npm | ≥ 9.0.0 | 随 Node.js 一起安装 |
| Git | ≥ 2.30.0 | 用于版本控制 |

---

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/Agions/StoryForge.git
cd StoryForge
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
初次使用推荐 **DeepSeek V3.2**，性价比最高，效果出色。
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
3. 选择分析模式：
   - **剧情分析** — 理解叙事结构，识别高光时刻
   - **内容摘要** — 提取关键信息，生成文案
   - **情感分析** — 识别情感曲线，标记情绪高点

### Step 3 — 生成剪辑

1. AI 分析完成后，点击 **「智能剪辑」**
2. 选择剪辑策略：
   - **自动剪辑** — AI 全自动生成剪辑方案
   - **半自动剪辑** — AI 提供建议，你来决策
3. 调整剪辑参数（节奏、时长、转场）
4. 点击 **「预览」** 查看结果

### Step 4 — 导出成片

1. 满意后点击 **「导出」**
2. 选择导出格式（见 [导出格式指南](./export.md)）
3. 设置输出路径和画质
4. 点击 **「开始导出」**

---

## 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 新建项目 |
| `Ctrl + O` | 打开素材 |
| `Ctrl + S` | 保存项目 |
| `Ctrl + Z` | 撤销 |
| `Ctrl + Shift + Z` | 重做 |
| `Space` | 播放/暂停 |
| `Delete` | 删除选中 |

---

## 下一步

- [批量处理](./batch-processing.md) — 同时处理多个视频
- [短视频创作](./short-video.md) — 从零开始创作短视频
- [字幕处理](./subtitle.md) — 精细化字幕编辑
- [导出格式](./export.md) — 选择最适合的导出格式

---

## 遇到问题？

- 查看 [常见问题](../faq.md) 寻找解决方案
- 在 [GitHub Issues](https://github.com/Agions/StoryForge/issues) 提交问题
