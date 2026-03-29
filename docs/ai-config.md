# AI 模型配置

StoryForge 支持多种 AI 模型服务提供商。

## 支持的提供商

### OpenAI

使用 OpenAI GPT 系列模型进行文本生成和分析。

```bash
VITE_DEFAULT_PROVIDER=openai
VITE_OPENAI_API_KEY=sk-xxxx
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```

获取 API 密钥：[platform.openai.com](https://platform.openai.com/api-keys)

### Azure OpenAI

使用 Azure 托管的 OpenAI 模型。

```bash
VITE_AZURE_API_KEY=xxxx
VITE_AZURE_ENDPOINT=https://xxxx.openai.azure.com
VITE_AZURE_DEPLOYMENT=gpt-35-turbo
```

获取 API 密钥：[Azure Portal](https://portal.azure.com)

### 智谱 AI

使用智谱 GLM 系列模型。

```bash
VITE_ZHIPU_API_KEY=xxxx
```

获取 API 密钥：[智谱 AI 开放平台](https://open.bigmodel.cn/)

## 配置方式

在项目根目录创建 `.env` 文件：

```bash
VITE_DEFAULT_PROVIDER=openai
VITE_OPENAI_API_KEY=your-api-key
```

::: tip 提示
不同提供商的密钥不能混用，请确保 `VITE_DEFAULT_PROVIDER` 与你配置的提供商一致。
:::

## 模型推荐

| 场景 | 推荐模型 |
|------|----------|
| 剧情分析 | GPT-4o / Claude-3.5 |
| 脚本生成 | GPT-4o / GLM-4 |
| 字幕翻译 | GPT-4o / 百度翻译 |
| 语音合成 | Azure TTS / 阿里语音 |
