---
title: 贡献指南
description: 如何参与 CutDeck 的开发、报告问题和完善文档。
---

# 贡献指南

感谢你愿意为 CutDeck 贡献力量！无论是报告 Bug、提交代码还是完善文档，每一份贡献都让这个项目变得更好。 🎉

---

## 贡献方式

| 方式 | 说明 | 入口 |
|------|------|------|
| 🐛 报告 Bug | 帮助我们发现和修复问题 | [GitHub Issues](https://github.com/Agions/CutDeck/issues/new?template=bug_report.md) |
| 💡 功能建议 | 提出新功能想法 | [Feature Request](https://github.com/Agions/CutDeck/issues/new?template=feature_request.md) |
| 📝 完善文档 | 修正错别字、补充说明、翻译 | 直接提交 PR |
| 🔧 提交代码 | Bug 修复、新功能实现 | 提交 Pull Request |
| ⭐ 推广项目 | 分享给更多人 | Star、Fork、在社交媒体介绍 |

---

## 开发环境搭建

### 前置条件

| 依赖 | 版本要求 | 安装方式 |
|------|----------|----------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| npm | 9+ | 随 Node.js 一起安装 |
| Git | 2.30+ | [git-scm.com](https://git-scm.com/) |
| Rust | 1.70+ | [rustup.rs](https://rustup.rs/) |

### 快速搭建

```bash
# 1. Fork 项目到你的 GitHub 账户
# 访问 https://github.com/Agions/CutDeck 点击 Fork

# 2. 克隆你的 Fork
git clone https://github.com/YOUR_USERNAME/CutDeck.git
cd CutDeck

# 3. 安装依赖
npm install

# 4. 复制环境配置
cp .env.example .env
# 编辑 .env，填入测试用 API Key

# 5. 启动开发服务器
npm run dev

# 6. 运行测试
npm test

# 7. 代码检查
npm run lint
```

---

## 代码提交流程

### 分支命名规范

| 类型 | 分支名示例 | 说明 |
|------|-----------|------|
| 功能开发 | `feature/ai-clip-improvements` | 新功能 |
| Bug 修复 | `fix/subtitle-sync-fix` | Bug 修复 |
| 文档更新 | `docs/update-installation-guide` | 文档改进 |
| 重构 | `refactor/ai-provider-abstract` | 代码重构 |

### 提交流程

```bash
# 1. 从 main 创建功能分支
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# 2. 进行开发（遵循代码规范）
# ... 修改代码 ...

# 3. 提交代码
git add .
git commit -m "feat: add batch processing queue management"
git commit -m "fix: resolve audio sync delay issue"
git commit -m "docs: expand troubleshooting section"

# 4. 推送分支到你的 Fork
git push origin feature/your-feature-name

# 5. 在 GitHub 上创建 Pull Request
```

---

## Pull Request 检查清单

提交 PR 前请确认：

- [ ] 代码通过了测试
- [ ] 代码通过了 ESLint 检查
- [ ] 新功能已添加对应测试
- [ ] 文档已同步更新
- [ ] PR 描述清晰说明了改动的目的和影响范围
- [ ] 分支是从最新的 `main` 创建的

---

## 项目规范

### 技术栈约定

```
React 18 + TypeScript + Vite 6 + Tauri 2.x + Ant Design 5
```

### 组件开发规范

```typescript
// 组件命名：PascalCase
// 文件命名：PascalCase.tsx
// Hooks 命名：camelCase，use 前缀

// 示例
// components/AIClipPanel/index.tsx
// hooks/useAI.ts

// Props 接口命名：ComponentNameProps
interface AIClipPanelProps {
  videoId: string
  onClipGenerated?: (clips: Clip[]) => void
}
```

### CSS 规范

- 优先使用 CSS Modules
- 避免使用 !important
- 使用 CSS 变量管理主题色

---

## 优先贡献方向

| 方向 | 优先级 | 说明 |
|------|--------|------|
| 🪟 **Windows 平台测试** | ⭐⭐⭐ | 确保跨平台兼容性 |
| 🌐 **多语言文档** | ⭐⭐⭐ | 英文文档完善 |
| 🤖 **新 AI 模型接入** | ⭐⭐ | 接入更多 AI 模型 |
| 🎨 **UI/UX 改进** | ⭐⭐ | 界面体验优化 |
| ⚡ **性能优化** | ⭐⭐ | 大文件处理速度优化 |
| 🧪 **测试覆盖** | ⭐ | 增加自动化测试 |

---

## 行为准则

作为 CutDeck 的贡献者，请遵守以下原则：

- **尊重** — 尊重所有参与者的观点和背景
- **包容** — 欢迎各种经验水平的贡献者
- **专业** — 保持建设性的技术讨论
- **透明** — 公开讨论决策过程

---

## 交流渠道

| 渠道 | 用途 |
|------|------|
| [GitHub Issues](https://github.com/Agions/CutDeck/issues) | Bug 报告、功能请求 |
| [GitHub Issues](https://github.com/Agions/CutDeck/issues) | Bug 报告、功能请求 |

---

## 致谢

感谢每一位贡献者！你们的名字将在项目主页和 CHANGELOG 中展示。 ❤️

如果你有任何问题，欢迎在 GitHub Discussions 中提问。
