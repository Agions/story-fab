/**
 * story-fab 状态管理 - 统一导出
 * 使用 Zustand v5 + 持久化存储
 *
 * 类型统一从 @/core/types 导入，不要在此目录定义类型。
 */

// 导出各个 store
export { useAppStore } from './app-store';
export { useProjectStore } from './project-store';
export { useWorkspaceStore } from './workspace-store';

// AI 模型相关状态
export { useModelStore } from './model-store';

// story-fab workspace 专用 store（保留在 components/story-fab/context/）
// 注意：story-fab 使用 Context+Reducer 模式（useStoryFab），非 Zustand
