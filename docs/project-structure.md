# 项目结构

StoryForge 使用 React + TypeScript + Vite 构建。

## 目录结构

```
StoryForge/
├── src/
│   ├── components/        # React 组件
│   │   ├── AIClipPanel/   # AI 剪辑面板
│   │   ├── AIPanel/       # AI 功能面板
│   │   ├── Dashboard/      # 仪表板
│   │   └── editor/         # 编辑器组件
│   ├── core/              # 核心逻辑
│   │   ├── services/       # 服务层
│   │   ├── types/          # TypeScript 类型
│   │   └── constants/      # 常量定义
│   ├── pages/             # 页面组件
│   ├── hooks/             # 自定义 Hooks
│   └── utils/             # 工具函数
├── public/                # 静态资源
├── docs/                  # 项目文档
├── package.json
└── vite.config.ts        # Vite 配置
```

## 主要模块

### components/

UI 组件库，包含所有可复用的界面组件。

### core/services/

核心服务层，包括：

- `ai.service.ts` - AI 模型调用服务
- `video.service.ts` - 视频处理服务
- `vision.service.ts` - 视觉分析服务
- `workflow.service.ts` - 工作流引擎

### core/types/

TypeScript 类型定义，确保类型安全。

### pages/

页面级组件，对应路由配置。

### hooks/

可复用的 React Hooks 逻辑。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite 6
- **UI 库**: Ant Design 5
- **状态管理**: React Context + useReducer
- **样式**: CSS Modules + Less
- **路由**: React Router 6
