# CutDeck 开发者指南

> 本文档面向希望参与 CutDeck 开发的工程师。涵盖代码规范、Git 工作流、测试策略和发布流程。

---

## 1. 开发环境搭建

### 1.1 基础依赖

```bash
# Node.js 18+
node --version  # >= 18.0.0

# Rust 1.75+（Tauri 后端）
rustc --version  # >= 1.75.0
cargo --version

# FFmpeg（系统级）
ffmpeg -version  # 视频编解码
ffprobe -version # 视频元数据
```

### 1.2 启动开发服务器

```bash
git clone https://github.com/Agions/CutDeck.git
cd CutDeck
npm install

# 同时启动前端 + Tauri 开发模式
npm run tauri dev
```

前端热重载在 `http://localhost:1430`，Tauri 窗口自动打开。

### 1.3 环境变量

在 `src/` 目录或项目根目录创建 `.env` 文件：

```bash
# .env — 开发环境（可选，Defaults 在代码中已设置）

# AI API Keys（也通过 Settings UI 配置）
VITE_OPENAI_API_KEY=
VITE_ANTHROPIC_API_KEY=
VITE_DEEPSEEK_API_KEY=

# API 配置
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=30000

# 视频处理
VITE_MAX_VIDEO_SIZE=500
VITE_CACHE_ENABLED=true
VITE_ENABLE_HW_ACCEL=true
```

---

## 2. 代码规范

### 2.1 TypeScript

| 规则 | 说明 |
|------|------|
| `strict: true` | 所有 `tsconfig.json` 启用严格模式 |
| `noUncheckedIndexedAccess` | 数组访问必须做边界检查 |
| `exactOptionalPropertyTypes` | 可选属性必须显式标注 |
| 禁止 `any` | 无类型断言用 `unknown` + 类型守卫 |
| 禁止 `@ts-ignore` | 用 `@ts-expect-error` 并附说明 |

**命名规范**：

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `VideoProcessingController.tsx` |
| Hooks | camelCase + `use` 前缀 | `useProject.ts` |
| 工具函数 | camelCase | `formatDuration.ts` |
| 类型/接口 | PascalCase | `VideoMetadata`, `PipelineContext` |
| 常量 | SCREAMING_SNAKE_CASE | `MAX_CONCURRENT_TASKS` |
| 文件名 | kebab-case 或 PascalCase | `clip-operations.ts`, `VideoEditor.tsx` |

### 2.2 Rust

| 规则 | 说明 |
|------|------|
| `cargo fmt` | 代码格式（`rustfmt.toml` 配置） |
| `cargo clippy` | Lint 检查 |
| edition 2021 | Rust edition |
| 禁止 `unwrap()` 在生产代码 | 用 `?` 操作符或 `expect()` 并注释原因 |

### 2.3 CSS / Tailwind

| 规则 | 说明 |
|------|------|
| OKLCH 色彩空间 | `globals.css` 中使用 `oklch()` 函数定义颜色 |
| 基础网格 4px | 所有间距为 4px 的倍数 |
| `cubic-bezier(0.16, 1, 0.3, 1)` | 微交互缓动曲线，最大 200ms |
| `prefers-reduced-motion` | 所有动画必须尊重此媒体查询 |

---

## 3. Git 工作流

### 3.1 分支策略

```
main (protected)
  └── feature/*    — 新功能开发
  └── refactor/*   — 重构（不影响功能）
  └── fix/*        — Bug 修复
  └── docs/*       — 文档更新
  └── chore/*      — 杂项（依赖升级、CI 配置等）
```

### 3.2 提交规范

每次 `git commit` 后**等待手动 push** 再继续下一个 commit（按用户偏好）。

**Commit Message 格式**：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 前缀**：

| Type | 含义 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(ai-clip): add emotion peak detection` |
| `fix` | Bug 修复 | `fix(render): bind format_time results to avoid temporary value lifetime` |
| `refactor` | 重构（代码优化） | `refactor(workflow): consolidate types into single workflow.ts` |
| `docs` | 文档更新 | `docs: add ARCHITECTURE.md and DEVELOPER_GUIDE.md` |
| `chore` | 杂项 | `chore: update dependencies to latest versions` |
| `test` | 测试 | `test: add unit tests for highlight detector` |
| `perf` | 性能优化 | `perf(video): optimize FFmpeg subprocess calls` |

**Scope**：affected module（`workflow`, `ai`, `render`, `timeline`, 等）

**Examples**：

```bash
# Good commit messages
git commit -m "refactor(workflow): consolidate types/constants/initialState into single workflow.ts, eliminate circular imports"
git commit -m "fix(rust): bind format_time results to avoid temporary value lifetime issues"
git commit -m "docs: add ARCHITECTURE.md with full system overview"
git commit -m "chore: add Cargo.lock to .gitignore"

# Bad commit messages
git commit -m "update code"        # 缺少 type 和 scope
git commit -m "fix bug"           # 缺少 scope
git commit -m "WIP"               # 模糊不清
```

### 3.3 Pull Request 流程

1. Fork 仓库，创建 `feature/*` 分支
2. 开发完成后，PR 描述必须包含：
   - 改动内容
   - 测试验证
   - 截图（如涉及 UI）
3. CI 必须通过（`cargo check` / `tsc --noEmit`）
4. 至少 1 名维护者 review 后合并

---

## 4. 测试策略

### 4.1 前端测试（Vitest）

```bash
# 运行所有测试
npm test

# 监听模式（开发时）
npm test -- --watch

# 特定文件
npm test -- src/core/services/export/export-progress.test.ts

# 覆盖率报告
npm test -- --coverage
```

| 测试类型 | 工具 | 位置 |
|----------|------|------|
| 单元测试 | Vitest | `*.test.ts` / `*.test.tsx` 同目录 |
| 组件测试 | Vitest + @testing-library/react | 同上 |
| 集成测试 | Vitest | `src/test/` 目录 |

**跳过 PySide6 相关测试**（在 `vitest.config.ts` 中配置）：

```typescript
// vitest.config.ts — PySide6 依赖文件无法在 headless CI 中运行
test: {
  exclude: [
    ...defaultExclude,
    '**/test_project_manager.py',      // PySide6
    '**/test_application.py',
    '**/test_ui_components.py',
    '**/test_page_loader.py',
    '**/test_project_settings_manager.py',
    '**/test_project_version_manager.py',
    '**/test_icon_manager.py',
    '**/test_project_template_manager.py',
  ]
}
```

### 4.2 Rust 测试

```bash
# 运行 Rust 测试
cd src-tauri
cargo test

# 带日志输出
cargo test -- --nocapture

# 仅运行特定测试
cargo test highlight_detector
```

### 4.3 CI 质量门

| Check | Command | 失败原因 |
|-------|---------|----------|
| TypeScript | `npx tsc --noEmit` | 类型错误 |
| ESLint | `npm run lint` | 风格违规 |
| Vitest | `npm test` | 测试用例失败 |
| Rust | `cargo check` | 编译错误（注意 Rust 版本） |

---

## 5. 关键开发工作流

### 5.1 新增 AI Provider

1. 在 `src/core/services/providers/` 创建 `newprovider.ts`
2. 实现 `BaseService` 接口
3. 在 `src/core/config/aiModels.config.ts` 添加模型配置
4. 在 `providers/index.ts` 导出
5. 在 `src/core/services/providers/prompts.ts` 添加提示词模板

### 5.2 新增 Pipeline Step

```typescript
// src/core/pipeline/steps/MyStep.ts
import type { Step } from '../Step';
import type { PipelineContext } from '../clip-pipeline/types';

export class MyStep implements Step {
  name = 'MyStep';

  async execute(ctx: PipelineContext) {
    // 业务逻辑
    return { ok: true };
  }

  async rollback?(ctx: PipelineContext) {
    // 回滚逻辑（可选）
  }
}
```

### 5.3 新增 Tauri 命令

```rust
// src-tauri/src/commands/my_command.rs
use tauri::command;

#[command]
pub async fn my_command(arg: String) -> Result<String, String> {
    // 业务逻辑
    Ok(format!("result: {}", arg))
}

// src-tauri/src/commands/mod.rs
pub mod my_command;
pub use my_command::*;

// src-tauri/src/lib.rs
mod commands;
// 在 register_commands() 中:
app.handle().plugin(
    CommandPlugin::new().command(my_command::my_command)
);
```

### 5.4 添加新的 UI 组件

使用 shadcn/ui CLI 添加组件：

```bash
npx shadcn@latest add button
# 自动生成：
#   src/components/ui/button.tsx
#   src/components/ui/button.css (如果有)
```

自定义样式放在 `globals.css` 中（通过 CSS 变量），不使用内联 `<style>`。

---

## 6. 性能优化指南

| 场景 | 优化手段 |
|------|----------|
| Timeline 100+ clips 卡顿 | 使用 `react-virtual` 虚拟化列表 |
| 批量 AI 请求 | `src/core/services/providers/base.service.ts` 的 5 并发限制池 |
| FFmpeg subprocess 泄漏 | 通过 `SecureExecutor` 统一管理生命周期 |
| 大文件视频处理 | Rust 流式处理 + 无全量内存加载 |
| 热重载慢 | 检查 `vite.config.ts` 的 `optimizeDeps.exclude` 配置 |

---

## 7. 调试技巧

### 7.1 前端调试

```typescript
// 添加断点日志
import { logger } from '@/shared/utils/logging';
logger.debug('video segments:', segments);
```

### 7.2 Rust 调试

```bash
# 启用 debug 日志
RUST_LOG=debug cargo run

# Attach debugger (VS Code)
# .vscode/launch.json 配置 rust-analyzer
```

### 7.3 Tauri IPC 调试

```typescript
// src/services/tauri.ts 中拦截所有 invoke 调用
const originalInvoke = window.__TAURI__.core.invoke;
window.__TAURI__.core.invoke = async (...args) => {
  console.log('[TAURI INVOKE]', ...args);
  return originalInvoke(...args);
};
```

---

## 8. 发布流程

### 8.1 版本规范

遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)：

```
major.minor.patch
 2  . 0  . 0
```

| 部分 | 变化 | 示例 |
|------|------|------|
| `patch` | Bug 修复，向后兼容 | `2.0.0` → `2.0.1` |
| `minor` | 新功能，向后兼容 | `2.0.0` → `2.1.0` |
| `major` | 破坏性变更 | `2.0.0` → `3.0.0` |

### 8.2 发布步骤

1. 更新 `CHANGELOG.md`（将 `[Unreleased]` 改为 `[vX.Y.Z] (YYYY-MM-DD)`）
2. 更新 `package.json` 的 `version` 字段
3. 提交：`git commit -m "chore: bump version to vX.Y.Z"`
4. 打 tag：`git tag -a vX.Y.Z -m "Release vX.Y.Z" && git push origin vX.Y.Z`
5. GitHub Actions 自动触发构建并发布到 Releases

### 8.3 CHANGELOG 编写规范

每个版本包含：

```markdown
## [vX.Y.Z] (YYYY-MM-DD)

### Features      # 新功能
### Bug Fixes     # Bug 修复
### Performance   # 性能改进
### Refactor      # 代码重构
### Docs          # 文档更新
### Chore         # 杂项（依赖升级等）
```

---

## 9. 目录约定

| 目录 | 说明 |
|------|------|
| `src/pages/` | 路由页面组件 |
| `src/components/` | 可复用 UI 组件 |
| `src/components/ui/` | shadcn/ui 基础组件 |
| `src/core/services/` | 业务逻辑（按域拆分） |
| `src/store/` | Zustand 全局状态 |
| `src/hooks/` | 可复用 React Hooks |
| `src/shared/` | 跨模块共享（utils · constants · types） |
| `src/styles/` | 全局样式 |
| `src-tauri/src/` | Rust 后端代码 |

---

## 10. 快速参考

```bash
# 启动开发
npm run tauri dev

# 类型检查
npx tsc --noEmit

# Lint
npm run lint

# 测试
npm test

# 构建桌面应用
npm run tauri build

# Rust 检查
cd src-tauri && cargo check
```
