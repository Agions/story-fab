# 安装与环境

## 环境要求

- Node.js `>= 20`
- npm `>= 10`
- Rust（用于 Tauri 构建）
- macOS（构建 `.dmg` 时需要）

## 1. 安装依赖

```bash
npm install
```

## 2. 本地开发运行

```bash
npm run tauri dev
```

默认会启动前端开发服务并拉起桌面窗口。

## 3. 构建桌面包

```bash
npm run tauri build
```

如果你需要稳定产出 macOS DMG（自动兜底转换），使用：

```bash
npm run tauri:build:dmg
```

## 4. 常见目录

- 前端源码：`src/`
- Tauri 后端：`src-tauri/`
- 文档站点：`docs/`
- 打包产物：`src-tauri/target/release/bundle/`
