# StoryForge 开发者指南

## 环境搭建

### 系统要求

- **Node.js**: ≥ 18
- **npm**: ≥ 9
- **Rust**: 最新稳定版 (用于 Tauri 开发)
- **FFmpeg**: 必须安装并添加到 PATH

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/agions/storyforge.git
cd storyforge

# 2. 安装 Node 依赖
npm install

# 3. 安装 Rust (如果需要)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 4. 验证 FFmpeg
ffmpeg -version
```

### 开发环境启动

```bash
# 前端开发模式 (React + Vite)
npm run dev

# Tauri 开发模式 (完整桌面应用)
npm run tauri dev

# 运行测试
npm run test

# 类型检查
npm run type-check
```

---

## 项目结构

```
src/
├── components/       # React 组件
│   ├── AIPanel/     # AI 功能面板
│   │   ├── AIEditorContext.tsx   # AI 编辑器上下文
│   │   ├── ClipFlow/             # 剪辑模式组件
│   │   └── ...
│   ├── editor/      # 时间线/轨道编辑器
│   └── common/      # 通用组件
├── core/
│   ├── services/    # 业务服务
│   │   ├── ai.service.ts
│   │   ├── plotAnalysis.service.ts   # ✨ 新增
│   │   ├── aiClip.service.ts
│   │   └── ...
│   └── types/       # TypeScript 类型
├── pages/           # 页面
├── hooks/           # 自定义 Hooks
├── store/           # Zustand stores
└── utils/           # 工具函数
```

---

## 调试技巧

### 前端调试

```bash
# 开启详细日志
DEBUG=storyforge:* npm run dev

# React DevTools
# 安装浏览器扩展: React Developer Tools

# Zustand DevTools  
# 状态管理调试 (浏览器扩展)
```

### Tauri 调试

```bash
# 查看 Rust 日志
tail -f ~/.cache/tauri/logs/*/logs/*.log

# 重启 Tauri
npm run tauri dev -- --force
```

### AI 服务调试

在 `.env` 中配置:

```bash
# 启用调试日志
VITE_DEBUG_AI=true

# AI 服务日志
AI_DEBUG_LOG=true
```

---

## 添加新功能

### 1. 添加新的 AI 模型

编辑 `src/core/services/ai.service.ts`:

```typescript
// 1. 添加模型类型
export type LegacyAIModelType = 
  | 'openai' 
  | 'anthropic'
  | // ... existing
  | 'yourmodel';  // 新增

// 2. 添加模型配置
const MODEL_CONFIGS: Record<LegacyAIModelType, ModelConfig> = {
  // ... existing
  yourmodel: {
    url: 'https://api.yourmodel.com/v1/chat',
    model: 'yourmodel-latest',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    transformRequest: (prompt) => ({
      model: 'yourmodel-latest',
      messages: [{ role: 'user', content: prompt }]
    }),
    transformResponse: (data) => 
      data.choices[0].message.content
  }
};
```

### 2. 添加新的剪辑模式

```typescript
// src/core/services/workflow/steps/plotClipStep.ts

export interface PlotClipConfig {
  enabled: boolean;
  // ... config options
}

export async function executePlotClipStep(
  videoInfo: VideoInfo,
  config: PlotClipConfig,
  updateProgress?: (progress: number) => void
): Promise<void> {
  // 实现逻辑
}
```

### 3. 添加新的服务模块

```typescript
// src/core/services/newService.service.ts

export class NewService {
  async doSomething(param: string): Promise<Result> {
    // 实现
  }
}

export const newService = new NewService();
```

---

## 测试

```bash
# 运行所有测试
npm run test

# 监听模式 (开发用)
npm run test -- --watch

# 生成覆盖率报告
npm run test:coverage

# UI 测试模式
npm run test:ui
```

### 编写测试

```typescript
// src/utils/__tests__/helpers.test.ts
import { describe, it, expect } from 'vitest';
import { yourFunction } from '../helpers';

describe('yourFunction', () => {
  it('should return expected result', () => {
    expect(yourFunction('input')).toBe('expected');
  });
});
```

---

## 构建发布

```bash
# 构建前端
npm run build

# 构建 Tauri 应用
npm run tauri build

# 仅构建特定平台
npm run tauri build -- --target x86_64-pc-windows-msvc
npm run tauri build -- --target x86_64-apple-darwin
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

---

## 代码规范

### TypeScript

- 使用 strict 模式
- 优先使用 `interface` 而非 `type`
- 导出类型而非实现细节

### React

- 使用函数组件 + Hooks
- 组件文件使用 PascalCase: `MyComponent.tsx`
- Hooks 使用 camelCase 以 `use` 开头

### CSS/LESS

- 使用 LESS 模块化样式
- 遵循 BEM 命名规范

---

## 常见问题

### Q: FFmpeg 未找到

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows (使用 winget)
winget install ffmpeg
```

### Q: Tauri 构建失败

```bash
# 更新 Rust
rustup update

# 清理缓存
cargo clean
npm run tauri build
```

### Q: AI API 调用失败

检查 `.env` 配置:
```bash
VITE_OPENAI_API_KEY=sk-xxx
VITE_ANTHROPIC_API_KEY=xxx
```

---

## 资源链接

- [Tauri 文档](https://tauri.app/v1/guides/)
- [React 文档](https://react.dev/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)
- [Ant Design](https://ant.design/components/overview/)
- [Zustand](https://github.com/pmndrs/zustand)

---

*Last updated: 2026-03-28*
