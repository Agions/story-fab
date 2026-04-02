---
title: AI 模型配置
description: StoryForge 支持的 AI 模型提供商配置详解，2026年3月最新模型推荐。
---

# AI 模型配置

StoryForge 支持多种 AI 模型服务提供商。所有模型均已更新至 **2026年3月最新版本**。

---

## 快速配置

在项目根目录创建 `.env` 文件：

```bash
# 选择默认提供商（任选其一）
VITE_DEFAULT_PROVIDER=deepseek

# DeepSeek 配置（性价比最高，推荐）
VITE_DEEPSEEK_API_KEY=sk-xxxx

# OpenAI 配置
VITE_OPENAI_API_KEY=sk-xxxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```

::: tip 推荐配置
初次使用推荐 **DeepSeek V3.2**，性价比最高，效果出色。
:::

---

## 支持的提供商

### OpenAI

使用 GPT-5.4 系列模型进行文本生成和分析。

```bash
VITE_DEFAULT_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-xxxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```

| 推荐模型 | 特点 |
|----------|------|
| `gpt-5.4` | 最强通用能力 |
| `gpt-4o` | 多模态，支持视觉 |

获取 API 密钥：[platform.openai.com](https://platform.openai.com/api-keys)

---

### Anthropic Claude

使用 Claude Sonnet 4.6 / Opus 4.6 模型。

```bash
VITE_ANTHROPIC_API_KEY=sk-ant-xxxx
```

| 推荐模型 | 特点 |
|----------|------|
| `claude-opus-4.6` | 最强能力，长上下文 |
| `claude-sonnet-4.6` | 性价比高 |

获取 API 密钥：[console.anthropic.com](https://console.anthropic.com/)

---

### Google Gemini

使用 Gemini 3.1 Pro 模型。

```bash
VITE_GOOGLE_API_KEY=xxxx
VITE_DEFAULT_PROVIDER=gemini
```

| 推荐模型 | 特点 |
|----------|------|
| `gemini-3.1-pro` | 1M 超长上下文，多模态 |

获取 API 密钥：[AI Studio](https://aistudio.google.com/app/apikey)

---

### DeepSeek

使用 DeepSeek V3.2 模型，性价比极高。

```bash
VITE_DEEPSEEK_API_KEY=sk-xxxx
VITE_DEFAULT_PROVIDER=deepseek
```

| 推荐模型 | 特点 |
|----------|------|
| `deepseek-v3.2` | 🏆 性价比最高 |

获取 API 密钥：[platform.deepseek.com](https://platform.deepseek.com/)

---

### 通义千问 (Qwen)

使用阿里 Qwen 2.5 Max 模型，中文优化出色。

```bash
VITE_QIANWEN_API_KEY=xxxx
VITE_DEFAULT_PROVIDER=qianwen
```

| 推荐模型 | 特点 |
|----------|------|
| `qwen2.5-max` | 中文优化，性价比高 |
| `qwen2.5-plus` | 日常任务首选 |

获取 API 密钥：[阿里云百炼](https://bailian.console.aliyun.com/)

---

### 智谱 AI (GLM)

使用智谱 GLM-5 系列模型。

```bash
VITE_ZHIPU_API_KEY=xxxx
VITE_DEFAULT_PROVIDER=zhipu
```

| 推荐模型 | 特点 |
|----------|------|
| `glm-5` | 中文优化 |

获取 API 密钥：[智谱 AI 开放平台](https://open.bigmodel.cn/)

---

### Moonshot Kimi

使用 Kimi K2.5 模型，超长上下文支持。

```bash
VITE_MOONSHOT_API_KEY=sk-xxxx
VITE_DEFAULT_PROVIDER=moonshot
```

| 推荐模型 | 特点 |
|----------|------|
| `kimi-k2.5` | 200K+ 超长上下文 |

获取 API 密钥：[Moonshot Console](https://platform.moonshot.cn/)

---

### 讯飞星火

使用讯飞星火 V3.5 模型。

```bash
VITE_SPARK_API_KEY=xxxx
VITE_DEFAULT_PROVIDER=spark
```

| 推荐模型 | 特点 |
|----------|------|
| `generalv3.5` | 中文语音优化 |

获取 API 密钥：[讯飞开放平台](https://xinghuo.xfyun.cn/)

---

## 配置方式

### 环境变量配置

在 `.env` 文件中配置：

```bash
# ===================
# AI 提供商选择
# ===================
VITE_DEFAULT_PROVIDER=deepseek

# ===================
# OpenAI
# ===================
VITE_OPENAI_API_KEY=sk-xxxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1

# ===================
# DeepSeek
# ===================
VITE_DEEPSEEK_API_KEY=sk-xxxx

# ===================
# 通义千问
# ===================
VITE_QIANWEN_API_KEY=xxxx

# ===================
# Anthropic Claude
# ===================
VITE_ANTHROPIC_API_KEY=sk-ant-xxxx
```

::: warning 注意
不同提供商的密钥不能混用，请确保 `VITE_DEFAULT_PROVIDER` 与你配置的提供商一致。
:::

---

## 模型推荐 (2026年3月)

| 场景 | 推荐模型 | 说明 |
|------|----------|------|
| 剧情分析 | GPT-5.4 / Claude Opus 4.6 | 强大的推理和分析能力 |
| 脚本生成 | GPT-5.4 / Qwen 2.5-Max | 高质量的文本生成 |
| 字幕翻译 | GPT-5.4 / DeepSeek V3.2 | 准确的翻译能力 |
| 语音合成 | Azure TTS / 阿里语音 | 自然的语音输出 |
| 多模态分析 | Gemini 3.1 Pro | 出色的视觉理解能力 |

---

## 模型对比 (2026年3月)

| 模型 | 上下文 | 优势 | 适合场景 |
|------|--------|------|----------|
| GPT-5.4 | 128K | 全能型，推理能力强 | 复杂分析、创意写作 |
| Claude Opus 4.6 | 200K | 超长上下文，安全性高 | 长文本分析、代码 |
| Claude Sonnet 4.6 | 200K | 性价比高 | 日常任务、翻译 |
| Gemini 3.1 Pro | 1M | 超长上下文，多模态 | 视频理解、超长文本 |
| Qwen 2.5-Max | 128K | 中文优化，性价比高 | 中文内容创作 |
| DeepSeek V3.2 | 128K | 开源友好，价格低 | 日常任务、翻译 |
| GLM-5 | 128K | 中文优化 | 中文内容创作 |
| Kimi K2.5 | 200K+ | 超长上下文 | 长文本分析 |

---

## API 代理配置

如果无法直接访问某些 AI 服务，可以配置代理：

```bash
# HTTP 代理
VITE_HTTP_PROXY=http://127.0.0.1:7890

# HTTPS 代理
VITE_HTTPS_PROXY=http://127.0.0.1:7890
```

---

## 成本优化建议

| 建议 | 说明 |
|------|------|
| 使用 DeepSeek | 性价比最高，效果不输 GPT-4 |
| 批量处理 | 合理安排任务，减少 API 调用 |
| 缓存分析结果 | 相同视频不要重复分析 |
| 选择合适的模型 | 简单任务用小模型，复杂任务用大模型 |

---

## 相关文档

- [快速开始](./getting-started.md) — 开始使用
- [常见问题](./faq.md) — AI 相关问题解答
