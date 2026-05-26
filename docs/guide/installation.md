---
title: 安装指南
---

# 安装指南

## 系统要求

- **Node.js** 18+
- **Rust** 1.75+
- **FFmpeg**

## Windows

- 从 [GitHub Releases](https://github.com/Agions/story-fab/releases) 下载预构建安装包（`.exe`）
- 或通过 npm 构建：

```bash
npm install
npm run tauri build
```

## macOS

- 从 [GitHub Releases](https://github.com/Agions/story-fab/releases) 下载 `.dmg` 文件
- 如果提示被拦截：右键→打开，或运行以下命令解除隔离：

```bash
sudo xattr -rd com.apple.quarantine "/Applications/StoryFab.app"
```

## Linux

- 从 [GitHub Releases](https://github.com/Agions/story-fab/releases) 下载 `.deb` 或 `.AppImage`

## 从源码构建

```bash
npm install
npm run tauri build
```

## 验证安装

运行 `npm run dev`，如果能成功启动开发服务器，说明安装完成。