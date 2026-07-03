---
title: 快速开始
description: 5分钟上手 StoryFab，从安装到导出第一个视频
---

# 快速开始

本指南将帮助您在 5 分钟内完成 StoryFab 的安装、配置并导出第一个视频。

## 📋 前置要求

在开始之前，请确保您的系统满足以下要求：

| 项目 | 最低要求 | 推荐配置 |
|------|----------|----------|
| **操作系统** | Windows 10 / macOS 11 / Ubuntu 20.04 | 最新稳定版 |
| **内存** | 8 GB | 16 GB 或更高 |
| **存储空间** | 2 GB 可用空间 | 5 GB SSD |
| **网络** | 首次启动需联网 | - |

> **注意**：StoryFab 会下载 FFmpeg 和 Whisper 模型文件（约 2-3 GB），请确保有足够的磁盘空间和网络带宽。

---

## 🚀 安装步骤

### 方式一：下载安装包（推荐）

1. 前往 [Releases](https://github.com/Agions/story-fab/releases) 页面
2. 根据您的系统选择对应安装包：
   - **Windows**：`StoryFab_*_x64-setup.exe`
   - **macOS (Apple Silicon)**：`StoryFab_*_aarch64.dmg`
   - **macOS (Intel)**：`StoryFab_*_x64.dmg`
   - **Linux**：`StoryFab_*_amd64.AppImage`
3. 下载并运行安装程序
4. 按照提示完成安装

### 方式二：从源码构建

适合开发者或需要自定义功能的用户：

```bash
# 1. 克隆仓库
git clone https://github.com/Agions/story-fab.git
cd story-fab

# 2. 安装依赖
npm install

# 3. 启动开发模式
npm run tauri -- dev
```

详细构建步骤请参考 [安装指南](installation.md)。

---

## ⚙️ 首次配置

### 1. 启动应用

首次启动时，StoryFab 会自动：

- ✅ 下载 FFmpeg 二进制文件
- ✅ 初始化 Whisper 引擎
- ✅ 创建本地配置目录

**请耐心等待几分钟**，进度条会显示当前下载状态。

### 2. 选择工作模式

启动完成后，您将看到模式选择界面：

- **剪辑模式** 🎬 - 适合快速剪辑、高光提取
- **解说模式** 🎭 - 适合长视频AI解说创作

👉 新手推荐从 **剪辑模式** 开始熟悉基础操作。

### 3. 导入第一个视频

1. 点击「导入视频」按钮
2. 选择您要处理的视频文件（支持 MP4、MKV、AVI、MOV 等格式）
3. 等待视频加载完成

### 4. 基础操作

#### 剪辑模式

```
导入视频 → AI高光检测 → 预览片段 → 选择比例 → 导出
```

1. **AI 高光检测**：点击「自动检测」按钮
2. **预览片段**：在时间线中查看识别结果
3. **微调剪辑**：拖拽调整片段起止点
4. **选择导出比例**：9:16 / 1:1 / 16:9 等
5. **导出**：点击「导出」生成最终视频

#### 解说模式

```
导入视频 → Director策划 → 生成脚本 → TTS配音 → 渲染导出
```

1. **启动 Director Agent**：点击「开始策划」
2. **多轮对话**：与 AI 讨论视频风格、节奏、语气
3. **生成解说词**：Agent 自动生成分段脚本
4. **选择配音**：试听并选择 TTS 音色
5. **渲染导出**：一键生成带字幕和解说的完整视频

---

## 🎯 推荐学习路径

### 新手入门（30 分钟）

1. ✅ [安装指南](installation.md) - 了解系统要求和安装步骤
2. ✅ [快速开始](quick-start.md) - 完成第一次导出
3. ✅ [剪辑模式](commentary-mode.md) - 掌握基础剪辑
4. ✅ [快捷键](keyboard-shortcuts.md) - 提升操作效率

### 进阶创作（1-2 小时）

5. 🎭 [解说模式深度指南](ai-analysis.md) - 掌握 Director Agent
6. 📝 [脚本生成](script-generation.md) - AI 文案创作技巧
7. 🎨 [导出配置](export.md) - 专业级导出设置
8. ⚙️ [高级配置](configuration.md) - LLM/TTS/Whisper 优化

---

## 💡 实用技巧

### 提升性能

- 🚀 **使用 SSD**：视频渲染速度提升 2-3 倍
- 🧠 **大内存**：16GB+ 内存支持并行渲染
- 🎮 **GPU 加速**：NVIDIA / AMD 显卡可启用硬件编码
- 💾 **缓存管理**：定期清理 `~/.config/story-fab/cache/` 释放空间

### 优化 AI 效果

- 📊 **Whisper 模型选择**：
  - `base` / `small`：快速预览（速度优先）
  - `medium` / `large-v2`：生产环境（精度优先）
- 🎯 **高光检测阈值**：根据视频类型调整灵敏度
- 🎭 **Director 对话深度**：提供更多上下文可获得更精准的脚本

### 常见问题

**Q: 首次启动下载太慢怎么办？**
A: 可以手动下载 FFmpeg 和 Whisper 模型，放置到本地配置目录。

**Q: 如何切换 LLM 提供商？**
A: 进入「设置 → AI 配置」选择对应提供商并填写 API Key。

**Q: 导出的视频没有声音？**
A: 检查 TTS 配置是否正确，或尝试重新生成配音轨道。

更多问题请查看 [FAQ](reference/faq.md)。

---

## 🆘 获取帮助

遇到问题？我们随时为您提供支持：

- 📖 **[完整文档](https://agions.github.io/story-fab/)** - 详细的功能说明
- 💬 **[GitHub Discussions](https://github.com/Agions/story-fab/discussions)** - 社区交流
- 🐛 **[Issue 反馈](https://github.com/Agions/story-fab/issues)** - Bug 报告
- 📧 **邮件支持**：agions@qq.com

---

## 🎉 恭喜！

您已完成快速开始教程！现在可以：

- 🎬 开始创作您的第一个 AI 解说视频
- 📖 深入阅读 [解说模式](commentary-mode.md) 掌握高级功能
- 🤝 加入我们的社区，分享您的作品

---

<div align="center">

**喜欢 StoryFab？给我们一个 ⭐ Star！**

[GitHub](https://github.com/Agions/story-fab) · [文档](https://agions.github.io/story-fab/)

</div>
