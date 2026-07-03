# 贡献指南

感谢你对 StoryFab 的关注！我们欢迎所有形式的贡献。

## 📋 贡献流程

### 1. 准备工作

```bash
# Fork 本仓库
# 克隆你的 Fork
git clone https://github.com/YOUR_USERNAME/story-fab.git
cd story-fab

# 添加 upstream remote
git remote add upstream https://github.com/Agions/story-fab.git
```

### 2. 创建分支

```bash
# 从 main 拉取最新代码
git checkout main
git pull upstream main

# 创建特性分支
git checkout -b feature/AmazingFeature
# 或
git checkout -b fix/BugFix
```

**分支命名规范：**
- `feature/xxx` - 新功能
- `fix/xxx` - Bug 修复
- `docs/xxx` - 文档更新
- `refactor/xxx` - 代码重构
- `test/xxx` - 测试相关
- `chore/xxx` - 构建/工具链

### 3. 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

**代码规范：**
- 遵循 [Conventional Commits](https://www.conventional-commits.org/) 规范
- 确保 ESLint 和 TypeScript 检查通过
- 添加必要的测试用例
- 更新相关文档

### 4. 提交代码

```bash
# 提交更改
git commit -m 'feat: add amazing feature'

# 推送到你的 Fork
git push origin feature/AmazingFeature
```

**提交信息格式：**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 说明：**
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档更新
- `style` - 代码格式（不影响功能）
- `refactor` - 代码重构
- `perf` - 性能优化
- `test` - 测试相关
- `chore` - 构建/工具链

**示例：**
```
feat(audio): add volume normalization

- Implement audio volume normalization using FFmpeg
- Add configuration option in settings
- Update documentation

Closes #123
```

### 5. 开启 Pull Request

1. 在 GitHub 上开启 Pull Request
2. 填写 PR 模板，描述变更内容
3. 确保 CI 检查通过
4. 等待代码审查

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行特定测试文件
npm test -- path/to/test.ts
```

**测试要求：**
- 新功能必须添加测试用例
- Bug 修复应添加回归测试
- 测试覆盖率不低于 90%

## 📝 代码规范

### TypeScript

```typescript
// ✅ 好 - 使用接口定义类型
interface User {
  id: string
  name: string
}

// ❌ 差 - 使用 type 定义复杂对象
type User = {
  id: string
  name: string
}
```

### React

```typescript
// ✅ 好 - 使用函数组件 + Hooks
export function MyComponent({ name }: Props) {
  const [count, setCount] = useState(0)
  return <div>{name}</div>
}

// ❌ 差 - 使用类组件
class MyComponent extends React.Component {
  render() {
    return <div>{this.props.name}</div>
  }
}
```

### 命名规范

- **组件**：PascalCase（`VideoPlayer.tsx`）
- **Hook**：camelCase 以 `use` 开头（`useVideoPlayer.ts`）
- **函数**：camelCase（`handleClick`）
- **常量**：UPPER_SNAKE_CASE（`MAX_FILE_SIZE`）
- **类型/接口**：PascalCase（`VideoPlayerProps`）
- **文件**：kebab-case（`video-player.tsx`）

## 🔍 代码审查

所有 PR 需要至少 1 名核心维护者审查批准后才能合并。

**审查标准：**
- 代码逻辑正确性
- 性能影响
- 安全性
- 可维护性
- 测试覆盖
- 文档完整性

## 🐛 报告 Bug

请通过 [GitHub Issues](https://github.com/Agions/story-fab/issues) 报告 Bug。

**报告模板：**
```markdown
## Bug 描述
简要描述 Bug 的表现

## 复现步骤
1. 打开应用
2. 执行 XXX 操作
3. 观察到 XXX 错误

## 预期行为
描述期望的正确行为

## 实际行为
描述实际发生的错误

## 环境信息
- OS: [e.g. Windows 11, macOS 14, Ubuntu 22.04]
- 版本: [e.g. 2.2.0]
- 架构: [e.g. x64, ARM64]

## 附加信息
- 错误日志
- 截图
- 屏幕录制
```

## 💡 功能请求

欢迎通过 [GitHub Issues](https://github.com/Agions/story-fab/issues) 提出功能请求。

**请求模板：**
```markdown
## 功能描述
简要描述你想要的功能

## 使用场景
描述这个功能的使用场景

## 预期效果
描述功能实现后的效果

## 替代方案
描述是否有其他替代方案
```

## 📄 许可证

贡献即表示你同意你的代码将在 MIT 许可证下发布。

## 🙏 致谢

感谢所有贡献者的努力！<img src="https://contrib.rocks/image?repo=Agions/story-fab" />
