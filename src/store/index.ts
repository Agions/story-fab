/**
 * StoryForge 状态管理 - 统一导出
 * 使用 Zustand v5 + 持久化存储
 */

// 导出类型
export * from './types';

// 导出各个 store
export { useAppStore } from './appStore';
export { useProjectStore } from './projectStore';
export { useEditorStore } from './editorStore';

// mainStore 导出为 useStore（包含 AI 模型相关状态）
export { useStore } from './mainStore';
