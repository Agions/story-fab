---
layout: home
title: StoryForge
---

<div class="sf-home">

<!-- Hero -->
<div class="sf-hero">
  <div class="sf-hero-glow"></div>
  <div class="sf-hero-logo">
    <img src="/logo.svg" alt="StoryForge" width="140" height="140" />
  </div>
  <h1 class="sf-hero-title">
    <span class="sf-hero-name">StoryForge</span>
    <span class="sf-hero-sub">AI-Powered Professional Video Editing</span>
  </h1>
  <p class="sf-hero-desc">
    AI 驱动的专业智能视频剪辑工具 — 剧情分析 · 智能剪辑 · 字幕生成 · 自动化包装
  </p>
  <div class="sf-hero-actions">
    <a href="/guide/quick-start" class="sf-btn sf-btn-brand">🚀 快速开始</a>
    <a href="/features" class="sf-btn sf-btn-outline">📖 功能介绍</a>
  </div>
</div>

<!-- Features Grid -->
<div class="sf-section">
  <h2 class="sf-section-title">✨ 核心功能</h2>
  <div class="sf-features-grid">

    <div class="sf-feature-card">
      <span class="sf-feature-icon">🎬</span>
      <h3 class="sf-feature-title">剧情分析</h3>
      <p class="sf-feature-desc">AI 深度理解叙事结构，识别高光时刻与情感曲线</p>
    </div>

    <div class="sf-feature-card">
      <span class="sf-feature-icon">✂️</span>
      <h3 class="sf-feature-title">智能剪辑</h3>
      <p class="sf-feature-desc">一键生成专业级剪辑方案，支持自动 / 半自动双模式</p>
    </div>

    <div class="sf-feature-card">
      <span class="sf-feature-icon">🎙️</span>
      <h3 class="sf-feature-title">AI 配音</h3>
      <p class="sf-feature-desc">多音色配音，语速 / 音调 / 情感均可调节</p>
    </div>

    <div class="sf-feature-card">
      <span class="sf-feature-icon">🎵</span>
      <h3 class="sf-feature-title">智能混剪</h3>
      <p class="sf-feature-desc">自动识别节奏卡点，多素材智能拼接</p>
    </div>

    <div class="sf-feature-card">
      <span class="sf-feature-icon">📝</span>
      <h3 class="sf-feature-title">字幕生成</h3>
      <p class="sf-feature-desc">ASR 语音转字幕 + OCR 画面文字识别，多样式可选</p>
    </div>

    <div class="sf-feature-card">
      <span class="sf-feature-icon">🎨</span>
      <h3 class="sf-feature-title">自动包装</h3>
      <p class="sf-feature-desc">智能字幕样式、封面设计、片头片尾生成</p>
    </div>

  </div>
</div>

<!-- Tech Badges -->
<div class="sf-badges-row">
  <img src="https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tauri-2.x-FFC131?style=for-the-badge&logo=tauri&logoColor=black" alt="Tauri" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/github/stars/Agions/StoryForge?style=for-the-badge&logo=github&color=f59e0b" alt="Stars" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge&logo=opensourceinitiative" alt="License" />
</div>

<!-- Quick Start -->
<div class="sf-section">
  <h2 class="sf-section-title">🚀 快速开始</h2>

  <div class="sf-steps">

    <div class="sf-step">
      <div class="sf-step-num">1</div>
      <div class="sf-step-body"><h3>克隆项目</h3><pre><code>git clone https://github.com/Agions/StoryForge.git &amp;&amp; cd StoryForge &amp;&amp; npm install</code></pre></div>
    </div>

    <div class="sf-step">
      <div class="sf-step-num">2</div>
      <div class="sf-step-body"><h3>配置 AI</h3><pre><code>cp .env.example .env &amp;&amp; # 编辑 .env 填入 API Key（推荐 DeepSeek）</code></pre></div>
    </div>

    <div class="sf-step">
      <div class="sf-step-num">3</div>
      <div class="sf-step-body"><h3>启动项目</h3><pre><code>npm run dev &amp;&amp; # 访问 http://localhost:1430</code></pre></div>
    </div>

  </div>
</div>

<!-- AI Models -->
<div class="sf-section">
  <h2 class="sf-section-title">🤖 支持的 AI 模型</h2>
  <div class="sf-table-wrap">
    <table>
      <thead>
        <tr>
          <th>提供商</th>
          <th>推荐模型</th>
          <th>场景</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>OpenAI</td><td>GPT-5.4</td><td>剧情分析、脚本生成</td></tr>
        <tr><td>Anthropic</td><td>Claude Sonnet 4.6</td><td>长文本分析、内容理解</td></tr>
        <tr><td>Google</td><td>Gemini 3.1 Pro</td><td>多模态理解</td></tr>
        <tr><td>DeepSeek</td><td>V3.2</td><td>性价比最高</td></tr>
        <tr><td>阿里云</td><td>Qwen 2.5-Max</td><td>中文内容创作</td></tr>
        <tr><td>智谱</td><td>GLM-5</td><td>中文内容创作</td></tr>
        <tr><td>Kimi</td><td>K2.5</td><td>长文本分析</td></tr>
      </tbody>
    </table>
    <p class="sf-table-note">只需配置一个 API Key 即可使用全部 AI 功能。</p>
  </div>
</div>

<!-- Changelog -->
<div class="sf-section">
  <h2 class="sf-section-title">📋 更新日志</h2>
  <div class="sf-changelog">

    <div class="sf-changelog-entry">
      <h3>v1.1.1 <span class="sf-date">2026-04-03</span></h3>
      <ul>
        <li>品牌视觉全新升级 — Cinematic Dark × Warm Amber</li>
        <li>新增专业文档站点</li>
      </ul>
    </div>

    <div class="sf-changelog-entry">
      <h3>v1.1.0 <span class="sf-date">2026-03-29</span></h3>
      <ul>
        <li>完成设计系统升级，全新 UI</li>
        <li>新增专业文档站点</li>
        <li>优化 AI 服务集成</li>
        <li>完善组件库</li>
      </ul>
    </div>

    <div class="sf-changelog-entry">
      <h3>v1.0.0 <span class="sf-date">2026-03-22</span></h3>
      <ul>
        <li>初始版本发布</li>
        <li>基础 AI 视频分析功能</li>
        <li>智能剪辑工作流</li>
        <li>多格式导出支持</li>
      </ul>
    </div>

  </div>
</div>

<!-- Contributing -->
<div class="sf-section">
  <h2 class="sf-section-title">🤝 参与贡献</h2>
  <div class="sf-contrib-grid">
    <div class="sf-contrib-card">
      <span class="sf-contrib-icon">🐛</span>
      <h3>报告 Bug</h3>
      <p>在 GitHub Issues 提交问题</p>
      <a href="https://github.com/Agions/StoryForge/issues" class="sf-btn sf-btn-outline sf-btn-sm">提交 Issue</a>
    </div>
    <div class="sf-contrib-card">
      <span class="sf-contrib-icon">📝</span>
      <h3>完善文档</h3>
      <p>直接提交 PR 完善文档</p>
      <a href="https://github.com/Agions/StoryForge/edit/main/docs" class="sf-btn sf-btn-outline sf-btn-sm">编辑文档</a>
    </div>
    <div class="sf-contrib-card">
      <span class="sf-contrib-icon">💡</span>
      <h3>功能建议</h3>
      <p>欢迎提出功能建议和讨论</p>
      <a href="https://github.com/Agions/StoryForge/discussions" class="sf-btn sf-btn-outline sf-btn-sm">讨论区</a>
    </div>
    <div class="sf-contrib-card">
      <span class="sf-contrib-icon">🔧</span>
      <h3>提交代码</h3>
      <p>提交 Pull Request 贡献代码</p>
      <a href="https://github.com/Agions/StoryForge/pulls" class="sf-btn sf-btn-outline sf-btn-sm">提交 PR</a>
    </div>
  </div>
</div>

</div>
