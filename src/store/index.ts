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
export { useTimelineStore } from './timelineStore'; // Phase 3: Timeline 状态拆分

// mainStore 导出为 useModelStore（AI 模型相关状态）
export { useModelStore } from './mainStore';

// CutDeck workspace 专用 store（保留在 components/CutDeck/context/）
export { useCutDeckStore, useCutDeckStoreShallow } from '../components/CutDeck/context/cutDeckStore';
export type { CutDeckStore } from '../components/CutDeck/context/cutDeckStore';
