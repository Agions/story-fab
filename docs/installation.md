---
title: 安装配置
description: CutDeck 完整安装配置指南，涵盖环境搭建、依赖安装、故障排除。
---

# 安装配置

## 环境要求

| 要求 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18.0.0 | 推荐 LTS 版本 |
| npm / pnpm | ≥ 9.0.0 | 随 Node.js 一起安装 |
| Git | ≥ 2.30.0 | 用于版本控制 |
| **FFmpeg** | 最新版 | 视频处理核心依赖 |
| **Rust** | ≥ 1.70 | Tauri 桌面应用构建必需 |
| Tauri CLI | 2.x | 桌面应用构建（可选） |

::: tip 首次安装推荐顺序
FFmpeg → Node.js → Rust → 项目依赖
:::

---

## 安装步骤

### 1. 安装 FFmpeg

**macOS：**
```bash
brew install ffmpeg
```

**Ubuntu/Debian：**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows：**
下载 [FFmpeg Builds](https://www.gyan.dev/ffmpeg/builds/) 并配置环境变量。

验证安装：
```bash
ffmpeg -version
ffprobe -version
```

### 2. 安装 Node.js

推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理版本：

```bash
nvm install 18
nvm use 18
node -v  # 应显示 v18.x.x
```

### 3. 安装 Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustc --version  # 应显示 rustc 1.70+
```

::: warning 注意
Rust 用于 Tauri 桌面应用构建。如仅运行前端开发模式（`npm run dev`），Rust 不是必须的。
:::

### 4. 克隆项目

```bash
git clone https://github.com/Agions/CutDeck.git
cd CutDeck
```

### 5. 安装依赖

```bash
npm install
```

::: warning 注意
如果安装过程卡住，可以尝试：
- 使用淘宝镜像：`npm install --registry=https://registry.npmmirror.com`
- 清除缓存后重试：`npm cache clean --force`
:::

### 6. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的 AI API 密钥。详细配置请参考 [AI 模型配置](./ai-config.md)。

### 7. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 <http://localhost:1430>

---

## 构建生产版本

### 仅构建前端

```bash
npm run build
```

产物输出到 `dist/` 目录。

### 构建 Tauri 桌面应用

```bash
# 需要先安装 Tauri CLI
npm install -D @tauri-apps/cli@latest

# 构建桌面应用
npm run tauri build
```

构建产物输出到 `src-tauri/target/release/bundle/` 目录。

---

## 项目脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器（无需 Rust） |
| `npm run build` | 构建前端生产版本 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run preview` | 预览前端构建产物 |
| `npm run tauri dev` | 启动 Tauri 开发模式（需 Rust） |
| `npm run tauri build` | 构建 Tauri 桌面应用（需 Rust） |
| `npm run test` | 运行测试 |
| `npm run test:watch` | 监听模式运行测试 |

---

## 常见问题

### FFmpeg 未找到

**错误**：`FFmpeg not found` 或 `ffprobe not found`

**解决方案**：

1. 确认 FFmpeg 已安装并加入 PATH：
```bash
which ffmpeg   # macOS/Linux
where ffmpeg   # Windows
```

2. 手动指定路径（可选）：
```bash
# 在 .env 中添加
CUTDECK_FFMPEG_PATH=/usr/local/bin/ffmpeg
```

### Node.js 版本不兼容

**错误**：`Unsupported engine` 或类似警告

**解决方案**：
```bash
# 使用 nvm 安装正确版本
nvm install 18
nvm use 18
```

### npm install 失败

**解决方案**：

1. 清除 npm 缓存：
```bash
npm cache clean --force
```

2. 删除 node_modules 后重新安装：
```bash
rm -rf node_modules package-lock.json
npm install
```

3. 如果网络问题，配置国内镜像：
```bash
npm config set registry https://registry.npmmirror.com
```

### 端口被占用

**错误**：`Error: listen EADDRINUSE :::1430`

**解决方案**：

1. 查找占用端口的进程：
```bash
# macOS/Linux
lsof -i :1430

# Windows
netstat -ano | findstr :1430
```

2. 结束进程或修改端口：
```bash
# 修改 .env 文件添加
VITE_PORT=1431
```

### Tauri 构建失败

**检查项**：

1. 确保已安装 Rust：
```bash
rustc --version
cargo --version
```

2. 更新 Rust 到最新版本：
```bash
rustup update
```

3. 安装 Tauri CLI：
```bash
npm install -D @tauri-apps/cli@latest
```

4. 安装 Tauri 依赖：
```bash
cd src-tauri
cargo build
```

### AI 功能无法使用

1. 确认 `.env` 文件配置正确
2. 确认 API Key 有效且有余额
3. 确认网络可以访问 AI 服务商
4. 查看浏览器控制台错误信息

---

## 卸载

```bash
# 删除项目目录
rm -rf CutDeck

# 清除缓存（可选）
rm -rf ~/.cache/CutDeck
```

---

## 下一步

- [AI 模型配置](./ai-config.md) — 配置 AI 服务
- [快速开始](./getting-started.md) — 开始使用
- [常见问题](./faq.md) — 更多问题解答
