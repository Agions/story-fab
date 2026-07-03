---
title: '测试指南'
description: 'StoryFab 项目测试策略和实践指南'
---

# 测试指南

本文档提供 StoryFab 项目的测试策略、工具和实践指南。

## 📋 测试策略

StoryFab 采用多层次测试策略，确保代码质量和稳定性：

| 测试层级 | 工具 | 覆盖率目标 | 执行频率 |
|----------|------|-----------|---------|
| **单元测试** | Vitest | 90%+ | 每次提交 |
| **集成测试** | Vitest + Testing Library | 80%+ | 每次 PR |
| **E2E 测试** | Playwright（计划中） | 核心流程 | 每次发布 |
| **性能测试** | 自定义基准 | N/A | 每周 |

---

## 🧪 单元测试

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式（开发时）
npm test -- --watch

# 生成覆盖率报告
npm run test:coverage

# CI 模式
npm run test:ci
```

### 测试文件结构

```
src/
├── hooks/
│   ├── use-project-detail.ts
│   ├── use-project-detail.reducer.test.ts  # 单元测试
│   └── use-video-keyboard-shortcuts.test.ts # 单元测试
├── components/
│   ├── video-player/
│   │   ├── video-player.tsx
│   │   └── video-player.reducer.test.ts    # 单元测试
│   └── video-selector/
│       ├── video-selector.tsx
│       └── video-selector.reducer.test.ts  # 单元测试
└── shared/
    └── hooks/
        ├── useAutoSetters.ts
        └── useAutoSetters.test.ts          # 单元测试
```

### 编写测试用例

#### 基本结构

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useVideoKeyboardShortcuts } from './use-video-keyboard-shortcuts'

describe('useVideoKeyboardShortcuts', () => {
  it('应该调用 onTogglePlay 当按下空格键', () => {
    const onTogglePlay = vi.fn()
    const videoRef = { current: document.createElement('video') }

    renderHook(() =>
      useVideoKeyboardShortcuts({
        videoRef,
        onTogglePlay,
        onToggleFullscreen: vi.fn(),
        onSeek: vi.fn(),
        onVolumeChange: vi.fn(),
        onToggleMute: vi.fn(),
      }),
    )

    // 模拟键盘事件
    const event = new KeyboardEvent('keydown', { key: ' ' })
    window.dispatchEvent(event)

    expect(onTogglePlay).toHaveBeenCalledOnce()
  })
})
```

#### 测试 Reducer

```typescript
import { describe, it, expect } from 'vitest'
import { projectDetailReducer, initialProjectDetailState } from './use-project-detail.reducer'

describe('projectDetailReducer', () => {
  it('应该设置 activeStep', () => {
    const state = { ...initialProjectDetailState }
    const result = projectDetailReducer(state, {
      type: 'SET_ACTIVE_STEP',
      step: 'edit'
    })

    expect(result.activeStep).toBe('edit')
  })

  it('应该保留其他状态字段', () => {
    const state = {
      ...initialProjectDetailState,
      aiLoading: true
    }
    const result = projectDetailReducer(state, {
      type: 'SET_ACTIVE_STEP',
      step: 'edit'
    })

    expect(result.aiLoading).toBe(true)
  })
})
```

#### 测试 Hooks

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useProjectDetail } from './use-project-detail'

describe('useProjectDetail', () => {
  it('应该初始化默认状态', () => {
    const { result } = renderHook(() => useProjectDetail())

    expect(result.current.state.activeStep).toBe('analyze')
    expect(result.current.state.project).toBeNull()
    expect(result.current.state.aiLoading).toBe(false)
  })

  it('应该更新 project', () => {
    const { result } = renderHook(() => useProjectDetail())
    const mockProject = { id: '1', name: 'Test' }

    act(() => {
      result.current.setProject(mockProject as any)
    })

    expect(result.current.state.project).toEqual(mockProject)
  })
})
```

---

## 📊 覆盖率报告

### 查看覆盖率

```bash
# 生成 HTML 覆盖率报告
npm run test:coverage

# 报告输出位置
# coverage/index.html
```

### 覆盖率标准

- **Hooks**：95%+
- **Reducers**：100%
- **Services**：90%+
- **Components**：80%+

---

## 🔍 调试测试

### 调试失败用例

```bash
# 只运行失败的测试
npm test -- --reporter=verbose

# 运行特定测试文件
npm test -- src/hooks/use-project-detail.reducer.test.ts

# 运行匹配名称的测试
npm test -- -t "应该设置 activeStep"
```

### 使用 Debugger

```typescript
it('调试示例', () => {
  const result = projectDetailReducer(state, action)

  // 设置断点
  debugger

  expect(result).toBeDefined()
})
```

---

## 🚀 CI/CD 集成

### GitHub Actions 配置

测试在以下情况自动运行：

1. 推送到 `main` 分支
2. 创建 Pull Request
3. 手动触发 workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:ci
      - run: npm run lint
      - run: npm run type-check
```

---

## 📝 测试最佳实践

### ✅ 推荐做法

1. **测试行为，而非实现**
   ```typescript
   // ✅ 好 - 测试用户可见行为
   expect(onClick).toHaveBeenCalled()

   // ❌ 差 - 测试内部实现
   expect(component.state.count).toBe(1)
   ```

2. **使用描述性测试名称**
   ```typescript
   // ✅ 好
   it('应该显示错误消息当表单验证失败时')

   // ❌ 差
   it('测试表单验证')
   ```

3. **保持测试独立**
   ```typescript
   // 每个测试应该独立运行
   beforeEach(() => {
     // 重置状态
   })
   ```

4. **使用 Factory Functions**
   ```typescript
   function createMockProject(overrides?: Partial<Project>): Project {
     return {
       id: '1',
       name: 'Test Project',
       ...overrides
     }
   }
   ```

### ❌ 避免做法

1. **不要测试第三方库**
   ```typescript
   // ❌ 差 - 测试 React 本身
   it('应该渲染组件', () => {
     // ...
   })
   ```

2. **不要过度 Mock**
   ```typescript
   // ❌ 差 - Mock 所有东西
   // ✅ 好 - 只 Mock 外部依赖
   ```

3. **不要忽略失败的测试**
   ```typescript
   // ❌ 差
   it.skip('应该工作', () => {})

   // ✅ 好 - 修复或删除
   ```

---

## 🛠️ 测试工具

### Vitest

主要测试框架，提供：
- 快速热重载
- 原生 ESM 支持
- 兼容 Jest API
- 内置覆盖率

### Testing Library

React 组件测试：
- `@testing-library/react` - 组件渲染和交互
- `@testing-library/user-event` - 用户事件模拟
- `@testing-library/jest-dom` - 自定义断言

### MSW (Mock Service Worker)

Mock API 请求：
```typescript
import { mock, MockRequest } from 'mockttp'

const server = mock()
await server.start()

server.for('GET', '/api/projects').thenReply(200, {
  projects: []
})
```

---

## 📚 相关资源

- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/)
- [React 测试最佳实践](https://react.dev/learn/testing)
