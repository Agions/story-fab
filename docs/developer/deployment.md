---
title: '部署指南'
description: 'StoryFab 应用构建和部署完整指南'
---

# 部署指南

本文档提供 StoryFab 应用的构建、打包和部署完整指南。

## 📋 目录

- [环境准备](#环境准备)
- [构建应用](#构建应用)
- [发布流程](#发布流程)
- [CI/CD](#cicd)
- [故障排查](#故障排查)

---

## 🛠️ 环境准备

### 必需依赖

```bash
# Node.js >= 18
node --version  # 应显示 v18.x 或更高

# npm >= 9 或 pnpm >= 8
npm --version

# Rust >= 1.77
rustc --version

# FFmpeg
ffmpeg -version
```

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/Agions/story-fab.git
cd story-fab

# 安装 Node 依赖
npm install

# 安装 Rust 依赖（如果需要）
# Rust 依赖在 tauri 构建时自动安装
```

---

## 🏗️ 构建应用

### 开发构建

```bash
# 启动前端开发服务器
npm run dev

# 在另一个终端启动 Tauri 应用
npm run tauri -- dev
```

### 生产构建

#### 前端构建

```bash
# 生产构建
npm run build

# 构建产物输出到 dist/ 目录
# - index.html
# - assets/ (JS, CSS, 字体等)
```

#### Tauri 应用构建

```bash
# 构建当前平台的应用
npm run tauri -- build

# 构建产物输出到 src-tauri/target/release/bundle/
```

### 多平台构建

```bash
# Windows (x64)
npm run tauri -- build -- --target x86_64-pc-windows-msvc

# macOS (Apple Silicon)
npm run tauri -- build -- --target aarch64-apple-darwin

# macOS (Intel)
npm run tauri -- build -- --target x86_64-apple-darwin

# Linux (x64)
npm run tauri -- build -- --target x86_64-unknown-linux-gnu
```

### 构建配置

#### Vite 配置

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 第三方库分包
          if (id.includes('node_modules')) {
            // ...
          }
        }
      }
    }
  }
})
```

#### Tauri 配置

```json
// src-tauri/tauri.conf.json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:1430",
    "distDir": "../dist"
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "dmg", "appimage"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

---

## 📦 发布流程

### 1. 版本管理

```bash
# 更新版本号
npm version patch  # 2.2.0 -> 2.2.1
npm version minor  # 2.2.0 -> 2.3.0
npm version major  # 2.2.0 -> 3.0.0
```

### 2. 生成 Changelog

```bash
# 使用 conventional-changelog
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

### 3. 创建 Git 标签

```bash
# 打标签
git tag v2.2.0
git push origin v2.2.0
```

### 4. 创建 GitHub Release

```bash
# 使用 GitHub CLI
gh release create v2.2.0 \
  --title "v2.2.0 - Director Agent 多轮对话优化" \
  --notes-file /tmp/release-notes.md \
  --latest
```

### 5. 上传构建产物

```bash
# 构建产物自动上传到 GitHub Release
# 或手动上传
gh release upload v2.2.0 \
  src-tauri/target/release/bundle/msi/*.msi \
  src-tauri/target/release/bundle/dmg/*.dmg \
  src-tauri/target/release/bundle/appimage/*.AppImage
```

---

## 🚀 CI/CD

### GitHub Actions 工作流

项目使用 GitHub Actions 进行自动化构建和发布：

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - uses: actions/setup-rust@v1
        with:
          rust-version: '1.77'

      - run: npm install
      - run: npm run tauri -- build

      - uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.os }}
          path: src-tauri/target/release/bundle/**
```

### 自动化流程

```
代码提交 → PR → CI 测试 → 合并 → 自动构建 → GitHub Release → 用户下载
```

---

## 🔧 故障排查

### 常见问题

#### 1. 构建失败：Rust 编译错误

```bash
# 清理 Rust 缓存
cd src-tauri
cargo clean
cd ..

# 重新构建
npm run tauri -- build
```

#### 2. 构建失败：依赖问题

```bash
# 清理 node_modules
rm -rf node_modules package-lock.json
npm install
```

#### 3. 构建产物过大

```bash
# 检查产物大小
du -sh dist/

# 优化建议：
# 1. 启用 treeshake
# 2. 压缩图片资源
# 3. 移除未使用的代码
```

#### 4. Tauri 应用闪退

```bash
# 查看日志
npm run tauri -- dev

# 或查看系统日志
# Windows: Event Viewer
# macOS: Console.app
# Linux: journalctl
```

---

## 📊 性能优化

### 前端优化

```bash
# 分析打包产物
npm run build -- --analyze

# 优化建议：
# 1. 代码分割
# 2. 懒加载
# 3. 图片压缩
# 4. 字体子集化
```

### Rust 优化

```toml
# src-tauri/Cargo.toml
[profile.release]
opt-level = "z"  # 优化大小
lto = true       # 链接时优化
codegen-units = 1
panic = "abort"
strip = true
```

---

## 🔐 代码签名

### macOS

```bash
# 设置签名证书
export APPLE_CERTIFICATE="base64-encoded-certificate"
export APPLE_CERTIFICATE_PASSWORD="certificate-password"

# 签名
npm run tauri -- build -- --target aarch64-apple-darwin
```

### Windows

```bash
# 设置签名证书
export WINDOWS_CERTIFICATE="base64-encoded-certificate"
export WINDOWS_CERTIFICATE_PASSWORD="certificate-password"

# 签名
npm run tauri -- build -- --target x86_64-pc-windows-msvc
```

---

## 📚 相关资源

- [Tauri 构建指南](https://tauri.app/v2/guides/build/)
- [Vite 构建优化](https://vitejs.dev/guide/build.html)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
