/**
 * StoryFab 状态管理 - 统一导出
 * 使用 Zustand v5 + 持久化存储
 */

// ── 运行时外观 (theme / sidebar / 最近项目 / autoSave) ──
export { useAppStore } from './app-store';

// ── 项目元数据与步骤状态机 (原 storyfab-store) ──
export { useProjectStore, useStoryFabStore } from './project-store';

// ── 时间线 / 剪辑 / 播放 (原 workspace-store) ──
export { useEditorStore, useWorkspaceStore } from './editor-store';

// ── 用户偏好持久层 (原 model-store) ──
export { useSettingsStore } from './settings-store';
