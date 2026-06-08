---
title: 安装指南
---

# 安装指南

## 系统要求

- Node.js ≥ 18
- Rust ≥ 1.77
- FFmpeg
- pnpm（推荐）

## 桌面应用安装

前往 [Releases](https://github.com/Agions/story-fab/releases) 下载对应平台的安装包：

| 平台 | 安装包 |
| --- | --- |
| Windows | `StoryFab_*_x64-setup.exe` |
| macOS (Apple Silicon) | `StoryFab_*_aarch64.dmg` |
| macOS (Intel) | `StoryFab_*_x64.dmg` |
| Linux | `StoryFab_*_amd64.AppImage` 或 `.deb` |

首次启动会自动下载 FFmpeg 和 Whisper 二进制到本地配置目录。

## macOS 启动拦截

未签名应用会被 Gatekeeper 拦截。两种处理方式：

```bash
# 方式 1：解除隔离属性
sudo xattr -rd com.apple.quarantine "/Applications/StoryFab.app"

# 方式 2：右键 app → 打开 → 弹出对话框再点打开
```

## Linux AppImage

需要 `libfuse2`：

```bash
sudo apt install libfuse2
```

或改用 `.deb` 包（无需 FUSE）。

## 从源码构建

```bash
git clone https://github.com/Agions/story-fab.git
cd story-fab
pnpm install
pnpm tauri dev        # 开发模式
pnpm tauri build      # 生产构建
```

## 验证

启动后访问 http://localhost:1430，能看到主界面即表示安装成功。