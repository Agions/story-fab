# 贡献指南

感谢你愿意为 CutDeck 贡献代码！本文档帮助你快速上手开发环境，并详细说明项目的代码规范、提交约定和 PR 流程。

## 目录

- [开发环境搭建](#开发环境搭建)
  - [前置依赖](#前置依赖)
  - [快速开始](#快速开始)
  - [Tauri 桌面端开发](#tauri-桌面端开发)
  - [常见问题](#常见问题)
- [代码规范](#代码规范)
  - [TypeScript](#typescript)
  - [React 组件](#react-组件)
  - [样式规范](#样式规范)
  - [ESLint 与 Prettier](#eslint-与-prettier)
- [Git 提交规范](#git-提交规范)
  - [格式](#格式)
  - [类型说明](#类型说明)
  - [示例](#示例)
- [分支管理](#分支管理)
- [Pull Request 流程](#pull-request-流程)
  - [流程步骤](#流程步骤)
  - [PR 标题规范](#pr-标题规范)
  - [PR 描述模板](#pr-描述模板)
- [测试指南](#测试指南)
  - [运行测试](#运行测试)
  - [编写测试](#编写测试)
  - [测试覆盖率](#测试覆盖率)
- [文档贡献](#文档贡献)
- [许可](#许可)

---

## 开发环境搭建

### 前置依赖

| 依赖 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | ≥ 18 | 推荐使用 LTS 版本 |
| Rust | ≥ 1.70 | 仅 Tauri 桌面端开发需要 |
| pnpm | ≥ 8 | 推荐最新稳定版 |
| Git | 最新 | 用于版本控制 |

> **Windows 用户**：推荐使用 [Windows Subsystem for Linux (WSL2)](https://docs.microsoft.com/en-us/windows/wsl/) 或 [Git Bash](https://gitforwindows.org/)  
> **macOS 用户**：推荐使用 [Homebrew](https://brew.sh/) 安装依赖

### 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/Agion/CutDeck.git
cd CutDeck

# 2. 安装依赖
pnpm install

# 3. 启动文档开发服务器（前端主要开发入口）
pnpm docs:dev

# 4. 启动应用开发服务器（完整应用）
pnpm app:dev

# 5. 运行类型检查
pnpm type-check

# 6. 运行测试
pnpm test
```

### Tauri 桌面端开发

CutDeck 使用 [Tauri](https://tauri.app/) 构建跨平台桌面应用。如需开发或调试桌面端功能：

```bash
# 安装 Rust 工具链（仅首次）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 启动 Tauri 开发模式
pnpm tauri dev

# 构建生产版本
pnpm tauri build
```

> 注意：`pnpm tauri dev` 会同时启动前端开发服务器和 Tauri 桌面窗口。

### 可用脚本命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动 Vite 开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm build:prod` | 生产环境构建 |
| `pnpm build:ci` | CI 环境构建（含体积检查） |
| `pnpm preview` | 预览生产构建 |
| `pnpm type-check` | 运行 TypeScript 类型检查 |
| `pnpm lint` | 运行 ESLint 检查 |
| `pnpm lint:fix` | 自动修复 ESLint 问题 |
| `pnpm format` | Prettier 格式化代码 |
| `pnpm format:check` | 检查代码格式 |
| `pnpm test` | 运行 Vitest 测试 |
| `pnpm test:run` | 单次运行测试（无监听） |
| `pnpm test:coverage` | 生成测试覆盖率报告 |
| `pnpm test:ui` | 打开 Vitest UI 界面 |
| `pnpm test:ci` | CI 环境测试（含覆盖率） |
| `pnpm docs:dev` | VitePress 文档开发 |
| `pnpm docs:build` | 构建 VitePress 文档 |
| `pnpm docs:preview` | 预览文档构建 |

### 常见问题

**Q: `pnpm install` 失败**
```bash
# 清除缓存后重试
pnpm store prune
rm -rf node_modules
pnpm install
```

**Q: TypeScript 类型错误**
```bash
# 确保安装所有依赖
pnpm install
pnpm type-check
```

**Q: Rust 编译错误**
```bash
# 更新 Rust 工具链
rustup update
# 清理并重试
cd src-tauri && cargo clean
```

---

## 代码规范

### TypeScript

- **严格模式**：项目启用 TypeScript 严格模式，所有代码必须包含完整的类型定义
- **避免 `any`**：尽量避免使用 `any` 类型，优先使用 `unknown` 或具体类型
- **接口优于类型别名**（用于描述对象结构时）
- **使用 `type` 用于联合类型、交叉类型和工具类型**

```typescript
// ✅ 好的例子
interface User {
  id: string;
  name: string;
  email: string;
}

type Status = 'pending' | 'active' | 'inactive';
type UserOrGuest = User | Guest;

// ❌ 避免
const handleData = (data: any) => { ... }
```

### React 组件

- **函数组件**：仅使用函数组件，不使用类组件
- **Hooks 规范**：
  - 遵循 [Hook Rules](https://react.dev/reference/rules/rules-of-hooks)
  - 自定义 Hook 以 `use` 开头
  - 相关逻辑抽离到自定义 Hook
- **Props 类型**：使用接口定义 Props 类型，命名格式 `{ComponentName}Props`
- **文件结构**：
  ```
  ComponentName/
    index.ts           # 导出
    ComponentName.tsx  # 主组件
    ComponentName.module.less  # 样式（可选）
  ```

```typescript
// ✅ 好的例子
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
}) => {
  return (
    <button className={cn(`btn-${variant}`, `btn-${size}`)} onClick={onClick}>
      {children}
    </button>
  );
};
```

### 样式规范

- **Tailwind CSS**：优先使用 Tailwind CSS 工具类
- **LESS**：复杂样式或复用场景使用 LESS
- **CSS 变量**：使用 CSS 变量定义主题色和设计 token
- **class-variance-authority**：组件变体使用 CVA 管理
- **clsx + tailwind-merge**：使用 `cn()` 工具类合并

```typescript
import { cva } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva('inline-flex items-center justify-center', {
  variants: {
    variant: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-12 px-6 text-lg',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});
```

### ESLint 与 Prettier

项目使用 ESLint + Prettier 保证代码风格统一。

**提交流前检查**：

```bash
# 格式化代码
pnpm format

# 检查格式
pnpm format:check

# Lint 检查
pnpm lint

# 自动修复 Lint 问题
pnpm lint:fix

# 类型检查
pnpm type-check
```

**IDE 集成**（推荐）：

```json
// .vscode/settings.json (项目已包含)
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Git 提交规范

项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型说明

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构（不是新功能或修复） |
| `perf` | 性能优化 |
| `test` | 添加或修改测试 |
| `build` | 构建系统或依赖变更 |
| `ci` | CI 配置变更 |
| `chore` | 其他杂项（不涉及源码或文档） |

`scope` 表示影响的模块，可选，常见值：

- `core` - 核心功能
- `ui` - 界面组件
- `workflow` - 工作流
- `ai` - AI 相关功能
- `export` - 导出功能
- `docs` - 文档
- `deps` - 依赖更新

### 示例

```
feat(ai): add Whisper subtitle generation support

- integrate local Whisper model for subtitle extraction
- add progress indicator during transcription
- support multiple subtitle formats (SRT, VTT)

Closes #123
```

```
fix(export): correct aspect ratio calculation for 9:16 format

The aspect ratio was being calculated incorrectly, causing
exported videos to appear stretched on mobile devices.

Fixes #456
```

```
chore(deps): upgrade Ant Design to v5.29.3

Minor version upgrade to include latest bug fixes.
```

---

## 分支管理

| 分支 | 用途 | 保护 |
|------|------|------|
| `main` | 稳定发布版本 | ✅ 受保护，需 PR 合并 |
| `develop` | 开发主分支 | ✅ 受保护，需 PR 合并 |
| `feat/*` | 新功能开发 | 可自由提交 |
| `fix/*` | Bug 修复 | 可自由提交 |
| `refactor/*` | 代码重构 | 可自由提交 |
| `hotfix/*` | 紧急热修复 | 可自由提交 |

**命名规范**：

```bash
# 功能分支
git checkout -b feat/awesome-new-feature

# 修复分支
git checkout -b fix/video-playback-issue

# 重构分支
git checkout -b refactor/export-module
```

---

## Pull Request 流程

### 流程步骤

1. **创建分支**：从 `develop` 分支创建你的功能分支
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature-name
   ```

2. **开发**：编写代码，遵循项目的代码规范

3. **提交**：使用 Conventional Commits 格式提交
   ```bash
   git add .
   git commit -m "feat(core): add new feature"
   ```

4. **推送**：将分支推送到远程仓库
   ```bash
   git push -u origin feat/your-feature-name
   ```

5. **创建 PR**：在 GitHub 上创建 Pull Request

6. **等待 Review**：至少 1 人 approve 后才能合并

7. **合并**：由 Maintainers 合并到 `develop` 分支

### PR 标题规范

使用与提交信息相同的格式：

```
feat(ui): add dark mode toggle
fix(core): resolve memory leak in video player
docs: update API documentation
```

### PR 描述模板

项目仓库包含 PR 模板，基本结构如下：

```markdown
## 描述
<!-- 简要描述这个 PR 的改动 -->

## 改动类型
- [ ] 新功能 (feat)
- [ ] Bug 修复 (fix)
- [ ] 重构 (refactor)
- [ ] 文档更新 (docs)
- [ ] 测试 (test)
- [ ] 其他

## 关联 Issue
<!-- 使用 Closes #issue_number 关联 -->

## 测试说明
<!-- 描述如何测试这些改动 -->

## Checklist
- [ ] 代码遵循项目规范
- [ ] 已添加测试（如适用）
- [ ] 测试通过
- [ ] 文档已更新（如适用）
```

---

## 测试指南

### 运行测试

```bash
# 开发模式（文件变更自动重测）
pnpm test

# 单次运行
pnpm test:run

# 生成覆盖率报告
pnpm test:coverage

# Vitest UI 界面
pnpm test:ui

# CI 模式
pnpm test:ci
```

### 编写测试

项目使用 [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)。

**测试文件命名**：

```
// 组件测试
ComponentName.test.tsx

// 服务测试
serviceName.test.ts

// 工具函数测试
utils.test.ts

// 配置文件测试
config.test.ts
```

**示例**：

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
    
    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
  });
});
```

**测试配置**：

- 配置文件：`vitest.config.ts`
- 测试环境：`jsdom`
- 路径别名：`@/*` 指向 `src/*`

### 测试覆盖率

项目使用 `@vitest/coverage-v8` 生成覆盖率报告。

```bash
# 生成覆盖率报告
pnpm test:coverage

# 查看报告（HTML 格式在 coverage/ 目录）
```

---

## 文档贡献

- 文档位于 `docs/` 目录，使用 [VitePress](https://vitepress.dev/)
- API 文档在 `docs/api.md`
- 变更日志在 `docs/changelog.md`
- 新功能请同步更新文档

```bash
# 本地预览文档
pnpm docs:preview
```

---

## 许可

所有贡献必须遵循 MIT 许可证。提交 PR 即表示你同意你的代码遵循此许可证。
