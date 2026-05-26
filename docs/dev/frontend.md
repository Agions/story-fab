# 前端架构

## 目录结构

```
src/
├── components/          # React UI 组件
│   └── StoryFab/          # 主编辑器工作区
│       ├── context/       # React Context（StoryFabProvider）
│       ├── workspace/     # 步骤式编辑器 UI
│       └── types/         # 工作流状态类型
├── core/                 # 核心业务逻辑层
│   ├── services/          # AI、导出、字幕服务
│   ├── tauri/             # TauriBridge（IPC）
│   ├── pipeline/          # AI 剪辑管道
│   └── types/             # 共享 TypeScript 类型
├── hooks/                 # 自定义 React Hooks
├── store/                 # Zustand 状态管理
├── pages/                 # 路由级组件
└── styles/                # 全局 CSS
```

## 状态管理

StoryFab 采用**双状态**架构：

1. **React Context**（`StoryFabProvider`）— 管理主编辑器工作流状态（步骤、当前视频、片段、导出设置）。基于步骤，可预测的流转。
2. **Zustand Stores** — 跨领域独立 store：
   - `appStore` — 应用级状态（主题、设置）
   - `projectStore` — 项目元数据和文件管理
   - `editorStore` — 时间轴和片段状态
   - `timelineStore` — 时间轴特有 UI 状态

## TauriBridge

`src/core/tauri/TauriBridge.ts` 是所有前端 → Rust IPC 调用的单一入口，提供：

- 类型化命令调用（无魔法字符串）
- 一致的错误处理
- 事件订阅辅助函数

```typescript
// 所有命令通过 TauriBridge
import tauri from '@/core/tauri/TauriBridge'

// 调用命令
const result = await tauri.transcribeVideo({ videoPath, model: 'base' })

// 订阅事件
tauri.onProgress((data) => { /* ... */ })
tauri.onSubtitleUpdate((data) => { /* ... */ })
```

## 服务层

```
src/core/services/
├── providers/      # AI Provider 抽象（OpenAI / Anthropic / DeepSeek / SiliconFlow）
├── ai/             # 脚本生成、AI 分析
├── export/         # 视频导出服务
├── subtitle/       # 字幕解析和烧录
├── editor/         # 剪辑操作
├── video/          # 视频处理（含 audio-mix.service.ts）
└── pipeline/       # AI 剪辑管道（评分 → 候选 → SEO → 导出）
```

每个服务独立，可单独测试。
