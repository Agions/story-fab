/**
 * StoryFab 状态管理 - 统一导出
 * 使用 Zustand v5 + 持久化存储
 */

// 导出各个 store
export { useAppStore } from './app-store';
export { useWorkspaceStore } from './workspace-store';

// 用户偏好持久层 (原 model-store)
export { useSettingsStore, useModelStore } from './settings-store';

// Workspace 状态机（已迁移至 Zustand）
export { useStoryFabStore } from './storyfab-store';
