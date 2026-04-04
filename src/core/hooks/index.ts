/**
 * Core Hooks 统一导出
 *
 * 命名规范：kebab-case（use-ai-clip.ts, use-auto-save.ts）
 */

// AI 剪辑
export { useAIClip } from './use-ai-clip';
export { useAutoSave } from './use-auto-save';
export { useSmartModel } from './use-smart-model';

// 工作流
export { useWorkflow } from './use-workflow';           // 旧版：基于 WorkflowService 单例，逐步执行
export { useWorkflowEngine } from './useWorkflowEngine'; // 新版：基于 WorkflowEngine 状态机，自动执行
export { useProject } from './use-project';
export { useVideo } from './use-video';
export { useModel } from './use-model';
export { useProjectEdit } from './use-project-edit';
export { useEditor } from './use-editor-state';
