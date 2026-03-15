# ClipFlow 技术架构

## 目录结构

```
src/
├── components/     # UI 组件
├── pages/          # 页面组件
├── core/           # 核心逻辑
│   ├── services/   # 业务服务
│   ├── types/      # 类型定义
│   ├── store/      # 状态管理
│   ├── hooks/      # 自定义 Hooks
│   ├── config/     # 配置文件
│   └── utils/      # 工具函数
├── features/       # 功能模块
│   ├── ai/        # AI 功能
│   ├── project/   # 项目管理
│   └── editor/    # 编辑器
└── shared/        # 共享资源
```

## 服务模块

| 模块 | 职责 |
|------|------|
| ai.service | AI 基础服务 |
| vision.service | 视觉分析 |
| smart-cut.service | 智能剪辑 |
| subtitle.service | 字幕生成 |
| auto-music.service | 自动配乐 |
| export.service | 视频导出 |
| workflow.service | 工作流 |

## 数据流

```
用户操作 → Page → Hook → Service → API → Store → UI 更新
```

---

*更新于 2026-03-15*
