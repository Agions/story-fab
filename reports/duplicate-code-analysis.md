# CutDeck 项目重复代码分析报告

## 概述
扫描范围：`/home/ubuntu/workspace/CutDeck/src` 目录下的 440 个 .ts/.tsx/.less 文件
总计：67,281 行代码

---

## 🔴 严重重复 (High Priority)

### 1. CSS 变量重复定义 (影响 ~20 个文件)

**问题描述**：每个 `.module.less` 文件都重新定义相同的颜色变量，而非从 `variables.less` 导入。

**重复模式 A：film-amber 颜色系统**
```
文件A 行1 ↔ 文件B 行1 ↔ 文件C 行1：
@film-amber: #d4a574;
@film-amber-light: #e8c9a8;
@film-amber-glow: rgba(212, 165, 116, 0.35);
```

**受影响文件（20个）**：
- `pages/ProjectEdit/index.module.less`
- `pages/VideoEditor/index.module.less`
- `pages/ProjectDetail/index.module.less`
- `pages/Settings/index.module.less`
- `pages/ScriptDetail/index.module.less`
- `pages/Projects/index.module.less`
- `components/AIClipAssistant/index.module.less`
- `components/Timeline/Timeline.module.less`
- `components/VideoPlayer/index.module.less`
- `components/common/ProcessingProgress/ProcessingProgress.module.less`
- `components/common/PreviewModal/PreviewModal.module.less`
- `components/ScriptGenerator/index.module.less`
- `components/VideoSelector.module.less`
- `components/ModelSelector/index.module.less`
- `components/editor/Preview.module.less`
- `components/editor/AssetPanel.module.less`
- `components/Home/ApiKeyRequest.module.less`
- `components/Home/ModelCard.module.less`
- `components/editor/AIAssistant.module.less`

**重复模式 B：ink 颜色系统**
```
@ink-black: #0d0d0f;
@ink-deep: #141418;
@ink-surface: #242430;
```

**重复模式 C：border 颜色**
```
@border-subtle: rgba(255, 255, 255, 0.06);
@border-default: rgba(255, 255, 255, 0.1);
```

**重复模式 D：text 颜色**
```
@text-primary: #f8f8f2;
@text-secondary: #a8a8b3;
@text-muted: #6b6b7a;
```

**代码片段对比**：
```less
// 几乎每个 .module.less 文件顶部都有：
@film-amber: #d4a574;
@film-amber-light: #e8c9a8;
@film-amber-glow: rgba(212, 165, 116, 0.35);

@ink-black: #0d0d0f;
@ink-deep: #141418;
@ink-surface: #242430;

@border-subtle: rgba(255, 255, 255, 0.06);
@border-default: rgba(255, 255, 255, 0.1);

@text-primary: #f8f8f2;
@text-secondary: #a8a8b3;
@text-muted: #6b6b7a;
```

**整合建议**：
```less
// 删除各文件顶部变量定义，改为：
@import (reference) '@/styles/variables.less';

// 或者在 build tooling 中自动注入
```

---

### 2. vision.service.ts 重复 formatDuration 方法

**文件**：`src/core/services/ai/vision.service.ts` 行 601-605
**冲突对象**：`src/shared/utils/format.ts` 行 30-43

**代码对比**：

| vision.service.ts (私有) | format.ts (共享) |
|--------------------------|------------------|
| `private formatDuration(seconds: number): string` | `export function formatDuration(seconds: number): string` |
| `const mins = Math.floor(seconds / 60);` | `const hours = Math.floor(seconds / 3600);` |
| `const secs = Math.floor(seconds % 60);` | `const mins = Math.floor((seconds % 3600) / 60);` |
| `return mins > 0 ? ${mins}分${secs}秒 : ${secs}秒;` | `return ${hours}:${mins}:${secs}` (hh:mm:ss 格式) |

**问题**：vision.service.ts 的 formatDuration 输出中文格式（"5分30秒"），与共享的 formatDuration 输出时间码格式（"05:30"）语义不同，但名称相同造成混淆。

**整合建议**：
```typescript
// 在 vision.service.ts 中使用共享工具
import { formatDuration } from '@/shared/utils/format';

// 或者创建一个中文友好的格式化函数
export function formatDurationChinese(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
}
```

---

## 🟠 中等重复 (Medium Priority)

### 3. useTimeout/useInterval 重复 delay 实现

**文件**：`src/hooks/useTimeout.ts` 行 55-60
**文件**：`src/hooks/useInterval.ts` 行 55-60

**重复代码片段**：
```typescript
// useTimeout.ts
const delay = useCallback((ms: number): Promise<void> => {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms);
    timeoutIdsRef.current.push(id);
  });
}, []);

// useInterval.ts  
const delay = useCallback((ms: number): Promise<void> => {
  return new Promise(resolve => {
    const id = setInterval(resolve, ms);
    intervalIdsRef.current.push(id);
  });
}, []);
```

**问题**：两个 hook 的 delay 方法几乎完全相同，只是 setTimeout vs setInterval。

**整合建议**：
```typescript
// src/hooks/usePromiseDelay.ts
export function usePromiseDelay() {
  return {
    delay: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),
  };
}

// 然后 useTimeout 和 useInterval 组合使用
```

---

### 4. loading/error state 重复模式

**重复模式**：多个组件有完全相同的 loading/error 声明和使用模式。

**受影响文件**：
- `pages/ProjectEdit/index.tsx` 行 64: `const [loading, setLoading] = useState(false);`
- `pages/ProjectEdit/index.tsx` 行 74: `const [error, setError] = useState<string | null>(null);`
- `pages/Dashboard/hooks/useDashboard.ts` 行 60: `const [loading, setLoading] = useState(false);`
- `pages/VideoEditor/hooks/useVideoEditor.ts` 行 13: `const [loading, setLoading] = useState<boolean>(false);`
- `pages/ProjectDetail/index.tsx` 行 80: `const [loading, setLoading] = useState(true);`
- `core/hooks/useVideo.ts` 行 135: `const [error, setError] = useState<string | null>(null);`
- `components/VideoAnalyzer.tsx` 行 39: `const [loading, setLoading] = useState(false);`
- `components/VideoAnalyzer.tsx` 行 41: `const [error, setError] = useState<string | null>(null);`
- `components/CutDeck/workspace/ProjectSetup.tsx` 行 80: `const [loading, setLoading] = useState(false);`
- `components/CutDeck/workspace/HighlightList/HighlightList.tsx` 行 48: `const [loading, setLoading] = useState(false);`
- `hooks/useProjectList.ts` 行 114: `const [loading, setLoading] = useState(true);`

**重复代码模式**：
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// 典型使用
try {
  setLoading(true);
  setError(null);
  const result = await someAsyncOperation();
  // ...
} catch (err) {
  setError(err instanceof Error ? err.message : '操作失败');
} finally {
  setLoading(false);
}
```

**整合建议**：
```typescript
// src/hooks/useAsyncState.ts
export function useAsyncState<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (asyncFn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, execute, reset };
}
```

---

### 5. 重复的 linear-gradient 样式

**重复模式**：`linear-gradient(135deg, @film-amber 0%, #c49464 100%)`

**受影响位置**：
- `pages/ProjectEdit/index.module.less` 行 67, 156, 326
- `pages/VideoEditor/index.module.less` 行 80, 240, 255
- `pages/ProjectDetail/index.module.less` 行 102
- `pages/Settings/index.module.less` 行 273
- `pages/ScriptDetail/index.module.less` 行 66
- `pages/Projects/index.module.less` 行 67

**代码片段**：
```less
// 在多个文件中重复
background: linear-gradient(135deg, @film-amber 0%, #c49464 100%) !important;
```

**整合建议**：
```less
// 在 variables.less 中定义
@gradient-amber-button: linear-gradient(135deg, @film-amber 0%, #c49464 100%);

// 各文件引用
background: @gradient-amber-button !important;
```

---

### 6. 重复的 border-radius: 12px 样式

**受影响文件（11个）**：
- `pages/Home/index.module.less` (多处：行 89, 96, 105, 152, 205, 274, 303)
- `components/CutDeck/workspace/ClipRippling.module.css` 行 32, 120
- `components/CutDeck/workspace/VideoExport.module.less` 行 482
- `components/CutDeck/workspace/HighlightList/HighlightList.module.css` 行 8
- `components/CutDeck/workspace/ProjectSetup.module.less` 行 446
- `components/CutDeck/workspace/VideoComposing.module.less` 行 426
- `components/CutDeck/workspace/AIVisualizer.module.css` 行 527, 733
- `components/CutDeck/workspace/VideoUpload.module.css` 行 495
- `components/AIModelSelector.module.less` 行 117, 221
- `components/Home/ModelCard.module.less` 行 29
- `styles/index.less` 行 593, 671

**整合建议**：
```less
// variables.less
@radius-card: 12px;

// 各文件使用
border-radius: @radius-card;
```

---

## 🟡 轻微重复 (Low Priority)

### 7. transform: translateY(-1px) 悬停效果重复

**受影响文件**：
- `pages/ProjectEdit/index.module.less` 行 76, 333
- `pages/Dashboard/index.module.less` 行 138, 675, 740
- `pages/ProjectDetail/index.module.less` 行 109, 146
- `pages/Settings/index.module.less` 行 280, 332
- `pages/Projects/index.module.less` 行 76
- `pages/ScriptDetail/index.module.less` 行 79
- `components/Layout.module.less` 行 158, 192

**代码片段**：
```less
// 几乎完全相同的悬停效果
transform: translateY(-1px);
```

**整合建议**：提取为 mixin
```less
// _mixins.less
.hover-lift() {
  transition: transform 0.2s ease;
  &:hover {
    transform: translateY(-1px);
  }
}
```

---

### 8. 重复的 React.memo + useState 模式

**受影响组件**：
- `components/Home/ModelCard.tsx` 行 30
- `components/CutDeck/workspace/VideoExport.tsx` 行 4
- `components/CutDeck/workspace/VideoUpload.tsx` 行 7
- `components/CutDeck/workspace/VideoComposing.tsx` 行 6
- `components/CutDeck/workspace/ScriptWriting.tsx` 行 5
- `components/CutDeck/workspace/AIVisualizer.tsx` 行 5
- `components/ScriptEditor/WorkflowEditor.tsx` 行 2
- `components/ScriptEditor/OriginalEditor.tsx` 行 2
- `components/VideoEditor/index.tsx` 行 2
- `components/VideoProcessingController.tsx` 行 2

**模式**：
```typescript
const SomeComponent: React.FC<Props> = React.memo(({
  prop1,
  prop2
}) => {
  const [state, setState] = useState(...);
  // ...
});
```

---

### 9. 重复的 API_LINKS 常量定义

**文件**：`src/components/Home/ModelCard.tsx` 行 13-22

```typescript
const API_LINKS: Partial<Record<AIModelType, string>> = {
  openai: 'https://platform.openai.com/docs/quickstart',
  anthropic: 'https://docs.anthropic.com/en/api/getting-started',
  google: 'https://ai.google.dev/gemini-api/docs/api-key',
  alibaba: 'https://help.aliyun.com/zh/dashscope/developer-reference/activate-dashscope-and-create-an-api-key',
  zhipu: 'https://open.bigmodel.cn/dev/api#apikey',
  iflytek: 'https://www.xfyun.cn/doc/spark/Guide.html',
  deepseek: 'https://platform.deepseek.com/api',
  moonshot: 'https://platform.moonshot.cn/docs'
};
```

**整合建议**：移至 `src/core/config/aiModels.config.ts` 或共享常量文件。

---

### 10. 重复的 retry 指数退避模式

**文件**：`src/core/services/providers/base.service.ts` 行 173
**文件**：`src/services/tauri.ts` 行 234

**代码对比**：
```typescript
// base.service.ts
const backoffMs = retryDelay * Math.pow(2, attempt);

// tauri.ts
await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
```

**问题**：两个文件使用略有不同的指数退避公式。

**整合建议**：统一到共享工具函数。

---

## 总结统计

| 类别 | 重复次数 | 受影响文件数 | 优先级 |
|------|----------|--------------|--------|
| CSS 变量定义 | ~140 | 20 | 🔴 严重 |
| linear-gradient 样式 | 15+ | 6+ | 🟠 中等 |
| border-radius: 12px | 20+ | 11+ | 🟡 轻微 |
| loading/error state | 11+ | 11+ | 🟠 中等 |
| formatDuration 重复 | 1 | 2 | 🟠 中等 |
| useTimeout/useInterval delay | 1 | 2 | 🟡 轻微 |
| translateY(-1px) hover | 10+ | 7+ | 🟡 轻微 |
| API_LINKS 常量 | 1 | 1 | 🟡 轻微 |
| retry 模式 | 2 | 2 | 🟡 轻微 |

---

## 建议优先处理顺序

1. **立即处理**：CSS 变量重复 → 创建 CSS custom properties 自动注入机制
2. **短期内处理**：loading/error state 模式 → 创建 useAsyncState hook
3. **中期处理**：linear-gradient 样式 → 提取为 variables.less 变量
4. **长期优化**：vision.service.ts formatDuration → 统一使用共享工具

---

*报告生成时间：2026-05-07*
*工具：Hermes Agent 自动化扫描*
