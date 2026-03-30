---
title: 安装配置
description: StoryForge 完整安装配置指南，涵盖环境搭建、依赖安装、故障排除。
---

# 安装配置

## 环境要求

| 要求 | 版本 | 说明 |
|------|------|------|
| Node.js | ≥ 18.0.0 | 推荐 LTS 版本 |
| npm | ≥ 9.0.0 | 随 Node.js 一起安装 |
| Git | ≥ 2.30.0 | 用于版本控制 |
| Tauri CLI | 2.x | 可选，用于桌面应用构建 |

::: tip 推荐
推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理 Node.js 版本，避免版本冲突。
:::

---

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

::: warning 注意
如果安装过程卡住，可以尝试：
- 使用淘宝镜像：`npm install --registry=https://registry.npmmirror.com`
- 清除缓存后重试：`npm cache clean --force`
:::

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的 AI API 密钥。详细配置请参考 [AI 模型配置](./ai-config.md)。

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 <http://localhost:1430>

---

## 构建生产版本

```bash
# 构建桌面应用
npm run tauri build

# 仅构建前端
npm run build
```

构建产物将输出到 `dist/` 目录。

---

## 项目脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本（前端） |
| `npm run tauri dev` | 启动 Tauri 开发模式 |
| `npm run tauri build` | 构建 Tauri 桌面应用 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run preview` | 预览构建产物 |

---

## 常见问题

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
npm install
```

### 端口被占用

**错误**：`Error: listen EADDRINUSE :::1430`

**解决方案**：

1. 查找占用端口的进程：
```bash
# Windows
netstat -ano | findstr :1430

# macOS/Linux
lsof -i :1430
```

2. 结束进程或修改端口：
```bash
# 修改 .env 文件添加
VITE_PORT=1431
```

### 依赖安装慢

**解决方案**：

1. 使用国内镜像：
```bash
npm config set registry https://registry.npmmirror.com
```

2. 或使用 npn：
```bash
npm install -g pnpm
pnpm install
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

### AI 功能无法使用

1. 确认 `.env` 文件配置正确
2. 确认 API Key 有效且有余额
3. 确认网络可以访问 AI 服务商
4. 查看浏览器控制台错误信息

---

## 卸载

```bash
# 删除项目目录
rm -rf StoryForge

# 清除缓存（可选）
rm -rf ~/.cache/StoryForge
```

---

## 下一步

- [AI 模型配置](./ai-config.md) — 配置 AI 服务
- [快速开始](./getting-started.md) — 开始使用
- [常见问题](./faq.md) — 更多问题解答
