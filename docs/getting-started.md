# 快速开始

> 本指南将帮助您快速上手 ClipFlow AI 视频创作平台

## 环境要求

| 要求    | 最低版本          |
| ------- | ----------------- |
| Node.js | >= 18.0.0         |
| npm     | >= 9.0.0          |
| Rust    | 最新稳定版 (可选) |

## 安装步骤

### 1. 克隆项目

```bash
git clone https://github.com/agions/clipflow.git
cd ClipFlow
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:1420 启动

### 4. 构建桌面应用 (可选)

```bash
npm run tauri build
```

## 配置 API 密钥

首次使用前，需要配置 AI 模型 API 密钥：

### 配置步骤

1. 打开应用，点击左侧导航 **设置**
2. 在 **API 密钥管理** 中选择要配置的模型
3. 输入对应的 API 密钥
4. 点击 **验证** 确认密钥有效

### 支持的模型

| 模型      | 获取地址                                                 |
| --------- | -------------------------------------------------------- |
| OpenAI    | [platform.openai.com](https://platform.openai.com)       |
| Anthropic | [anthropic.com](https://www.anthropic.com)               |
| Google    | [aistudio.google.com](https://aistudio.google.com)       |
| DeepSeek  | [platform.deepseek.com](https://platform.deepseek.com)   |
| 阿里云    | [dashscope.aliyuncs.com](https://dashscope.aliyuncs.com) |
| 智谱      | [open.bigmodel.cn](https://open.bigmodel.cn)             |
| 月之暗面  | [platform.moonshot.cn](https://platform.moonshot.cn)     |

## 创建第一个项目

```
1. 点击首页【创建新项目】→ 2. 上传视频素材 → 3. 选择 AI 功能
→ 4. 等待 AI 处理 → 5. 预览并导出视频
```

### 详细步骤

1. **创建项目** - 点击首页「创建新项目」按钮
2. **上传素材** - 拖拽或点击上传视频文件
3. **选择功能** - 选择 AI 剪辑/解说/混剪
4. **AI 处理** - 等待 AI 完成分析或生成
5. **预览导出** - 预览效果并导出最终视频

## 平台特定问题

### Windows

> 如果遇到构建问题，确保已安装 Visual Studio Build Tools

### macOS

```bash
# 安装 Xcode Command Line Tools
xcode-select --install
```

### Linux

```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev
```

## 下一步

- 📖 查看 [功能特性](features.md) 了解更多功能
- 🔄 查看 [工作流程](workflow.md) 了解创作流程
- ❓ 查看 [常见问题](faq.md) 解决疑问
