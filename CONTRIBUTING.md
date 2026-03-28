# StoryForge 贡献指南

感谢您对 StoryForge 的关注！本指南将帮助您开始贡献。

---

## 如何贡献

### 报告 Bug

1. 在 [GitHub Issues](https://github.com/agions/storyforge/issues) 创建新 Issue
2. 使用 Bug 报告模板
3. 提供以下信息:
   - 清晰的标题和描述
   - 复现步骤
   - 预期 vs 实际行为
   - 环境信息 (OS, Node 版本等)
   - 截图或日志

### 提出功能建议

1. 在 [GitHub Discussions](https://github.com/agions/storyforge/discussions) 讨论
2. 描述您的用例
3. 解释为什么这会对项目有益
4. 提供参考实现或链接

### 提交代码

#### 开发流程

```bash
# 1. Fork 仓库
# 点击 GitHub 页面右上角 Fork 按钮

# 2. 克隆您 Fork 的仓库
git clone https://github.com/YOUR_USERNAME/storyforge.git
cd storyforge

# 3. 创建功能分支
git checkout -b feature/your-feature-name
# 或修复分支
git checkout -b fix/issue-number

# 4. 安装依赖
npm install

# 5. 进行开发
npm run dev

# 6. 运行测试
npm run test

# 7. 运行 lint
npm run lint

# 8. 提交更改
git add .
git commit -m 'feat: Add your feature description'
# 遵循 conventional commits 格式

# 9. 推送到您的 Fork
git push origin feature/your-feature-name

# 10. 创建 Pull Request
```

#### Commit 消息格式

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型 (type)**:

| Type | Description |
|------|-------------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式 (不影响功能) |
| `refactor` | 重构 (非新功能非修复) |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `build` | 构建相关 |
| `ci` | CI/CD 相关 |
| `chore` | 其他 |

**示例**:

```
feat(plotAnalysis): Add narrative structure detection

Add PlotAnalysisService for understanding video story structure.
- Scene boundary detection
- Emotion tracking
- Plot point identification

Closes #123
```

---

## 代码规范

### TypeScript

- 启用 strict 模式
- 避免使用 `any`
- 优先使用 `interface`
- 导出清晰类型

```typescript
// ✅ Good
export interface VideoSegment {
  id: string;
  startTime: number;
  endTime: number;
}

// ❌ Avoid
export interface VideoSegment {
  id: any;
  startTime: any;
  endTime: any;
}
```

### React 组件

- 使用函数组件
- 使用 Hooks
- 组件文件 `.tsx`
- 样式文件 `.module.less`

```typescript
// ✅ Good
export const VideoUploader: React.FC<VideoUploaderProps> = ({ onUpload }) => {
  const [loading, setLoading] = useState(false);
  return <div>...</div>;
};

// ❌ Avoid
class VideoUploader extends Component<VideoUploaderProps> {
  render() { return <div>...</div>; }
}
```

### 命名规范

| 类别 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `VideoPlayer` |
| Hooks | camelCase + use 前缀 | `useVideoPlayer` |
| 常量 | SCREAMING_SNAKE | `MAX_DURATION` |
| 类型/接口 | PascalCase | `VideoMetadata` |
| 文件 | kebab-case | `video-player.tsx` |

---

## 测试要求

- 新功能必须包含测试
- Bug 修复必须包含回归测试
- 测试覆盖率应保持或提高

```bash
# 运行测试
npm run test

# 生成覆盖率
npm run test:coverage
```

---

## Pull Request 流程

1. **创建 PR** — 填写 PR 模板
2. **CI 检查** — 必须通过所有检查
3. **代码审查** — 至少 1 人审查
4. **合并** — 审查通过后合并

### PR 模板

```markdown
## 描述
[简要描述更改内容]

## 类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 重构

## 截图/截图
[如果涉及 UI 更改]

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 测试已添加/更新
- [ ] 文档已更新 (如需要)
- [ ] CI 检查通过
```

---

## 分支管理

```
main          # 稳定版本，只读
develop       # 开发分支
feature/*     # 功能分支
fix/*         # 修复分支
docs/*        # 文档分支
```

### 分支命名

```
feature/plot-analysis      # 新功能
fix/video-upload-bug      # Bug 修复
docs/readme-update         # 文档
refactor/ai-service        # 重构
```

---

## 社区准则

- 尊重所有参与者
- 使用友好和包容的语言
- 建设性反馈
- 专注于项目目标

---

## 许可证

通过贡献，您同意您的代码将根据 MIT 许可证发布。

---

## 联系我们

- **GitHub Issues**: [报告问题](https://github.com/agions/storyforge/issues)
- **Discussions**: [功能讨论](https://github.com/agions/storyforge/discussions)
- **邮箱**: agions@qq.com

---

*感谢您的贡献！*
