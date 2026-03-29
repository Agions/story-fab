# 快速开始

本指南将帮助你在 5 分钟内启动 StoryForge 项目。

## 环境要求

| 要求 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18.0.0 | 推荐 LTS 版本 |
| npm | ≥ 9.0.0 | 随 Node.js 一起安装 |
| Git | ≥ 2.30.0 | 用于版本控制 |

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

## 下一步

- [了解核心功能](./features.md)
- [配置 AI 模型](./ai-config.md)
- [查看安装详情](./installation.md)
