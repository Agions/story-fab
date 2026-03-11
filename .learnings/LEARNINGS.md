## [LRN-20260310-002] best_practice

**Logged**: 2026-03-10T11:00:00.000Z
**Priority**: medium
**Status**: pending
**Area**: frontend

### Summary
常量配置应独立文件管理，便于维护和复用

### Details
将 Timeline 组件的常量(TRACK_COLORS, TIMELINE_CONFIG)提取到 timelineConstants.ts，将导出配置提取到 export.config.ts

### Suggested Action
大型组件应先识别常量、配置、工具函数，优先拆分到独立文件

### Metadata
- Source: simplify-and-harden
- Related Files: src/components/editor/timelineConstants.ts, src/core/config/export.config.ts
- Tags: refactor, code-organization

---
