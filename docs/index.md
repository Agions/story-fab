---
layout: home
title: StoryForge
titleTemplate: false
---

<div class="vp-doc home">

# StoryForge

**AI 驱动的专业智能视频剪辑工具**

</div>

<div class="features-grid">

<div class="feature-card">
<span class="icon">🎬</span>
<span class="title">剧情分析</span>
<span class="desc">AI 深度理解叙事结构，识别高光时刻</span>
</div>

<div class="feature-card">
<span class="icon">✂️</span>
<span class="title">智能剪辑</span>
<span class="desc">一键生成专业级剪辑方案</span>
</div>

<div class="feature-card">
<span class="icon">🎙️</span>
<span class="title">AI 配音</span>
<span class="desc">多音色配音，支持中文、英文及方言</span>
</div>

<div class="feature-card">
<span class="icon">🎵</span>
<span class="title">智能混剪</span>
<span class="desc">自动节奏卡点，多素材智能拼接</span>
</div>

<div class="feature-card">
<span class="icon">📝</span>
<span class="title">字幕生成</span>
<span class="desc">ASR 自动字幕 + OCR 识别</span>
</div>

<div class="feature-card">
<span class="icon">🎨</span>
<span class="title">自动包装</span>
<span class="desc">智能字幕样式、封面设计、片头片尾</span>
</div>

</div>

---

<div class="stats-row">

![Stars](https://img.shields.io/github/stars/Agions/StoryForge?style=for-the-badge&logo=github&color=10B981)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=opensource&color=10B981)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react&color=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript&color=3178C6)
![Tauri](https://img.shields.io/badge/Tauri-2.x-black?style=for-the-badge&logo=tauri&color=FFC131)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&color=646CFF)

**React + TypeScript + Tauri · 桌面应用**

</div>

---

## 🚀 开始使用

### 安装 StoryForge

::: tip 📦 克隆项目
从 GitHub 克隆最新代码：
```bash
git clone https://github.com/Agions/StoryForge.git
cd StoryForge
```
:::

::: tip 📥 安装依赖
运行 `npm install` 安装项目依赖
:::

::: tip 🤖 配置 AI
复制 `.env.example` 为 `.env`，配置至少一个 AI API Key（推荐 DeepSeek）
:::

::: tip 🚀 启动项目
运行 `npm run dev`，访问 http://localhost:1430
:::

---

## 💡 支持的 AI 模型

| 提供商 | 代表模型 | 特点 |
|--------|----------|------|
| OpenAI | GPT-5.4 | 最强通用能力 |
| Claude | Sonnet 4.6 | 超长上下文、安全性强 |
| Gemini | 3.1 Pro | 1M 超长上下文 |
| DeepSeek | V3.2 | 🏆 性价比最高 |
| 通义千问 | Qwen 2.5-Max | 中文优化 |
| Kimi | K2.5 | 超长上下文 |
| 智谱 GLM | GLM-5 | 中文优化 |

> 💡 **只需配置一个 API Key 即可使用全部 AI 功能。**

---

## 📋 更新日志

### v1.1.0 (2026-03-29)

- ✨ 完成设计系统升级，全新 UI
- ✨ 新增专业文档站点
- 🎨 优化 AI 服务集成
- 🔧 完善组件库

### v1.0.0 (2026-03-22)

- ✨ 初始版本发布
- ✨ 基础 AI 视频分析功能
- ✨ 智能剪辑工作流
- ✨ 多格式导出支持

---

## 🤝 参与贡献

StoryForge 是开源项目，欢迎所有形式的贡献：

| 贡献方式 | 说明 |
|----------|------|
| 🐛 报告 Bug | [GitHub Issues](https://github.com/Agions/StoryForge/issues) |
| 📝 完善文档 | 直接提交 PR |
| 💡 功能建议 | [GitHub Discussions](https://github.com/Agions/StoryForge/discussions) |
| 🔧 提交代码 | 提交 Pull Request |

---

<style>
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 2.5rem 0;
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 16px;
  padding: 1.5rem 1rem;
  text-align: center;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.feature-card:hover {
  border-color: var(--sf-green);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.15);
}

.feature-card .icon {
  font-size: 2rem;
  line-height: 1;
}

.feature-card .title {
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--vp-c-text-1);
  margin: 0;
}

.feature-card .desc {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin: 0;
  line-height: 1.4;
}

.stats-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin: 1.5rem 0;
  justify-content: center;
}

.stats-row img {
  height: 28px;
}

.VPHero .name {
  font-size: 3.5rem;
}

@media (max-width: 640px) {
  .VPHero .name {
    font-size: 2.5rem;
  }
}

.home {
  text-align: center;
}

.home h1 {
  display: none;
}

.vp-doc.home {
  background: none !important;
}
</style>
