# 常见问题

## 一般问题

### 如何开始使用 StoryForge？

请参考[快速开始](./getting-started.md)指南，了解如何安装和启动项目。

### StoryForge 支持哪些视频格式？

StoryForge 支持 MP4、MOV、AVI、MKV 等常见视频格式。

### StoryForge 是免费的吗？

StoryForge 本身是开源免费的，但使用 AI 服务（如 OpenAI、Azure 等）可能需要付费。

## AI 相关问题

### 是否需要 AI API 密钥？

是的，需要配置 AI 模型服务才能使用 AI 分析和生成功能。请参考 [AI 模型配置](./ai-config.md) 指南。

### 如何获取 AI API 密钥？

你可以在以下平台申请 API 密钥：

- [OpenAI Platform](https://platform.openai.com/api-keys)
- [Azure Portal](https://portal.azure.com)
- [智谱 AI 开放平台](https://open.bigmodel.cn/)

### 支持哪些 AI 模型？

StoryForge 支持多种模型提供商：

- OpenAI GPT 系列
- Azure OpenAI
- 智谱 GLM 系列
- 百度文心一言
- 阿里通义千问

## 技术问题

### 启动开发服务器失败怎么办？

1. 确保 Node.js 版本 ≥ 18.0.0
2. 清除缓存：`npm cache clean --force`
3. 删除 node_modules 后重新安装：`rm -rf node_modules && npm install`

### 视频处理需要 GPU 吗？

基础功能不需要 GPU。GPU 主要用于加速 AI 模型推理，推荐用于生产环境。

### 如何报告问题或建议？

请在 [GitHub Issues](https://github.com/Agions/StoryForge/issues) 中提交，我们会尽快处理。
