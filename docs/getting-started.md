---
title: 快速开始
description: StoryForge 快速入门指南，从安装到创建第一个 AI 视频剪辑项目。
---

# 快速开始

本文档帮助你在 **5 分钟内** 启动 StoryForge 项目并完成第一次 AI 视频剪辑。

---

## 环境要求

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

### 3. 配置环境变量

复制环境变量模板并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的 AI API 密钥。详细配置请参考 [AI 模型配置](./ai-config.md)。

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 <http://localhost:1430>

::: tip 提示
首次启动可能需要几分钟时间来安装依赖和构建项目。
:::

---

## 创建第一个项目

### Step 1 — 导入素材

点击 **「新建项目」** → **「导入视频」**，支持 MP4、MOV、AVI、MKV 等常见格式。

### Step 2 — AI 分析

选择导入的视频，点击 **「AI 分析」**，StoryForge 会自动识别高光时刻与叙事结构。

### Step 3 — 生成剪辑

点击 **「智能剪辑」**，AI 一键生成专业级剪辑方案，支持自动和半自动两种模式。

### Step 4 — 导出成片

点击 **「导出」**，选择导出格式（MP4 / 剪映草稿 / PR 项目），设置输出路径，开始导出。

---

## 常用快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 新建项目 |
| `Ctrl + O` | 打开素材 |
| `Ctrl + S` | 保存项目 |
| `Ctrl + Z` | 撤销 |
| `Space` | 播放/暂停 |
| `Delete` | 删除选中 |

---

## 下一步

- [了解核心功能](./features.md) — 详细功能介绍
- [配置 AI 模型](./ai-config.md) — 配置你的 AI 服务
- [快速入门指南](./guide/quick-start.md) — 更详细的 5 分钟上手教程
- [批量处理](./guide/batch-processing.md) — 同时处理多个视频
