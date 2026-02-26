/**
 * Store 统一导出
 */
export { useAppStore, useProjectStore, useEditorStore } from './unifiedStore';

// 兼容旧代码
export const useStore = useAppStore;
