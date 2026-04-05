/**
 * CutDeck 状态管理 - 统一导出
 * 使用 Zustand v5 + 持久化存储
 *
 * 类型统一从 @/core/types 导入，不要在此目录定义类型。
 */

// 导出各个 store
export { useAppStore } from './appStore';
export { useProjectStore } from './projectStore';
export { useEditorStore } from './editorStore';

// mainStore 导出为 useModelStore（AI 模型相关状态）
export { useModelStore } from './mainStore';
