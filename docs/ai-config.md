---
title: AI 模型配置
description: StoryForge 支持的 AI 模型提供商配置详解。
---

# AI 模型配置

StoryForge 支持多种 AI 模型服务提供商，可根据场景灵活选择。

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
初次使用推荐 **DeepSeek V3**，性价比最高，效果出色。
:::

---

## 支持的提供商

### OpenAI

使用 GPT 系列模型进行文本生成和分析。

```bash
VITE_DEFAULT_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-xxxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```

| 推荐模型 | 特点 |
|----------|------|
| `gpt-4o` | 全能型，多模态，支持视觉 |
| `gpt-4o-mini` | 轻量快速，性价比高 |
| `o3` | 推理能力突出 |

获取 API 密钥：[platform.openai.com](https://platform.openai.com/api-keys)

---

### Anthropic Claude

```bash
VITE_ANTHROPIC_API_KEY=sk-ant-xxxx
```

| 推荐模型 | 特点 |
|----------|------|
| `claude-3-5-sonnet` | 性价比高，日常首选 |
| `claude-3-opus` | 最强能力，长上下文 |

获取 API 密钥：[console.anthropic.com](https://console.anthropic.com/)

---

### Google Gemini

```bash
VITE_GOOGLE_API_KEY=xxxx
VITE_DEFAULT_PROVIDER=gemini
```

| 推荐模型 | 特点 |
|----------|------|
| `gemini-2.0-flash` | 最新高速，多模态 |
| `gemini-1.5-pro` | 长上下文，支持 1M token |

获取 API 密钥：[AI Studio](https://aistudio.google.com/app/apikey)

---

### DeepSeek

性价比极高的国产模型。

```bash
VITE_DEEPSEEK_API_KEY=sk-xxxx
VITE_DEFAULT_PROVIDER=deepseek
```

| 推荐模型 | 特点 |
|----------|------|
| `deepseek-v3` | 🏆 性价比最高 |
| `deepseek-r1` | 推理能力突出 |

获取 API 密钥：[platform.deepseek.com](https://platform.deepseek.com/)

---

### 通义千问 (Qwen)

阿里中文优化模型。

```bash
VITE_QIANWEN_API_KEY=xxxx
VITE_DEFAULT_PROVIDER=qianwen
```

| 推荐模型 | 特点 |
|----------|------|
| `qwen-max` | 最强中文能力 |
| `qwen-plus` | 日常任务首选 |

获取 API 密钥：[阿里云百炼](https://bailian.console.aliyun.com/)

---

### 智谱 AI (GLM)

```bash
VITE_ZHIPU_API_KEY=xxxx
VITE_DEFAULT_PROVIDER=zhipu
```

| 推荐模型 | 特点 |
|----------|------|
| `glm-4` | 中文优化 |
| `glm-4v` | 多模态视觉支持 |

获取 API 密钥：[智谱 AI 开放平台](https://open.bigmodel.cn/)

---

### Moonshot Kimi

超长上下文支持。

```bash
VITE_MOONSHOT_API_KEY=sk-xxxx
VITE_DEFAULT_PROVIDER=moonshot
```

| 推荐模型 | 特点 |
|----------|------|
| `moonshot-v1` | 128K 上下文 |

获取 API 密钥：[Moonshot Console](https://platform.moonshot.cn/)

---

### 讯飞星火

中文语音场景优化。

```bash
VITE_SPARK_API_KEY=xxxx
VITE_DEFAULT_PROVIDER=spark
```

| 推荐模型 | 特点 |
|----------|------|
| `generalv3.5` | 中文语音优化 |

获取 API 密钥：[讯飞开放平台](https://xinghuo.xfyun.cn/)

---

## 环境变量配置

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

## 场景模型推荐

| 场景 | 推荐模型 | 说明 |
|------|----------|------|
| 剧情分析 | GPT-4o / Claude 3.5 Sonnet | 强大的推理和分析能力 |
| 脚本生成 | GPT-4o / Qwen-Max | 高质量文本生成 |
| 字幕翻译 | DeepSeek-V3 / GPT-4o | 准确翻译 |
| 多模态分析 | Gemini 2.0 Flash | 出色的视觉理解能力 |
| 长文本理解 | Claude 3.5 Sonnet / Kimi moonshot-v1 | 超长上下文 |

---

## 模型对比

| 模型 | 上下文 | 优势 | 适合场景 |
|------|--------|------|----------|
| GPT-4o | 128K | 全能型，多模态 | 复杂分析、创意写作 |
| Claude 3.5 Sonnet | 200K | 性价比高，安全性高 | 日常任务、翻译 |
| Gemini 2.0 Flash | 1M | 高速，多模态 | 视频理解、超长文本 |
| DeepSeek-V3 | 128K | 开源友好，价格低 | 日常任务、翻译 |
| Qwen-Max | 128K | 中文优化 | 中文内容创作 |
| GLM-4 | 128K | 中文优化 | 中文内容创作 |
| moonshot-v1 | 128K | 超长上下文 | 长文本分析 |

---

## API 代理配置

如果无法直接访问某些 AI 服务，可以配置代理：

```bash
VITE_HTTP_PROXY=http://127.0.0.1:7890
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
