# 贡献指南

感谢你对 ClipFlow 的兴趣！欢迎贡献代码。

## 🤝 如何贡献

### 1. Fork 项目

点击页面右上角的 Fork 按钮。

### 2. 克隆项目

```bash
git clone https://github.com/YOUR_USERNAME/clipflow.git
cd clipflow
```

### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/bug-description
```

### 4. 开发环境

```bash
# 安装依赖
npm install

# 启动开发
npm run tauri dev
```

### 5. 提交代码

```bash
# 提交更改
git add .
git commit -m 'feat: 添加新功能'

# 推送分支
git push origin feature/your-feature-name
```

### 6. 发起 PR

在 GitHub 上发起 Pull Request。

---

## 📋 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

| 类型 | 说明 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | Bug 修复 |
| `docs:` | 文档更新 |
| `style:` | 代码格式 |
| `refactor:` | 代码重构 |
| `perf:` | 性能优化 |
| `test:` | 测试相关 |
| `chore:` | 构建/工具 |

**示例：**
```bash
git commit -m 'feat: 添加自动配乐功能'
git commit -m 'fix: 修复字幕导出bug'
git commit -m 'docs: 更新README'
```

---

## 🐛 报告 Bug

1. 搜索是否已有相同问题
2. 使用 Issue 模板创建新 Issue
3. 包含复现步骤和环境信息

---

## 💡 提出新功能

1. 搜索是否已有相同建议
2. 使用 Feature Request 模板
3. 详细描述功能需求和使用场景

---

## 📝 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 组件添加无障碍支持 (aria-label)
- 使用 Zustand 管理状态

---

## 🔧 开发规范

### 目录结构

```
src/
├── components/     # UI 组件
├── core/          # 核心服务
│   └── services/  # AI 服务、工作流
├── pages/         # 页面组件
├── hooks/        # 自定义 Hooks
└── utils/        # 工具函数
```

### 命名规范

- 组件：`PascalCase` (如 `VideoPlayer.tsx`)
- 工具函数：`camelCase` (如 `formatTime.ts`)
- 常量：`UPPER_SNAKE_CASE`

---

## 📄 许可证

贡献即表示同意 MIT 许可证。

---

## ❓ 问题？

- 欢迎在 [Discussions](https://github.com/agions/clipflow/discussions) 提问
- 提交 Issue 前先搜索

感谢你的贡献！ 🎉
