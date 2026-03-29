# 安装配置

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

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置你的 AI API 密钥。

### 4. 启动开发服务器

```bash
npm run dev
```

## 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

## 项目脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产版本 |
| `npm run lint` | 运行 ESLint 检查 |

## 常见问题

如果安装过程中遇到问题：

1. 确保 Node.js 版本符合要求
2. 清除 npm 缓存：`npm cache clean --force`
3. 删除 node_modules 后重新安装
4. 查看 [常见问题](./faq.md) 或提交 [Issue](https://github.com/Agions/StoryForge/issues)
