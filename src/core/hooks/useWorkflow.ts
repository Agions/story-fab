/**
 * 工作流 Hook
 * 用于管理解说混剪完整流程
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { workflowService } from '@/core/services';
import type {
  WorkflowState,
  WorkflowData,
  WorkflowConfig,
  WorkflowCallbacks,
  WorkflowStep,
  ScriptData,
  ExportSettings,
  VideoAnalysis,
  ScriptTemplate
} from '@/core/types';

export interface UseWorkflowReturn {
  // 状态
  state: WorkflowState;
  isRunning: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  hasError: boolean;
  error: string | null;
  currentStep: WorkflowStep;
  progress: number;

  // 数据
  data: WorkflowData;
  videoInfo: WorkflowData['videoInfo'];
  videoAnalysis: WorkflowData['videoAnalysis'];
  selectedTemplate: WorkflowData['selectedTemplate'];
  generatedScript: WorkflowData['generatedScript'];
  dedupedScript: WorkflowData['dedupedScript'];
  uniqueScript: WorkflowData['uniqueScript'];
  editedScript: WorkflowData['editedScript'];
  timeline: WorkflowData['timeline'];
  originalityReport: WorkflowData['originalityReport'];
  uniquenessReport: WorkflowData['uniquenessReport'];

  // 操作
  start: (projectId: string, videoFile: File, config: WorkflowConfig) => Promise<void>;
  analyze: () => Promise<VideoAnalysis>;
  selectTemplate: (templateId?: string) => Promise<ScriptTemplate>;
  generateScript: (model: any, params: any) => Promise<ScriptData>;
  dedupScript: (config?: any) => Promise<{ script: ScriptData; report: any }>;
  ensureUniqueness: (config?: any) => Promise<{ script: ScriptData; isUnique: boolean; attempts: number }>;
  editScript: (script: ScriptData) => Promise<ScriptData>;
  editTimeline: (autoMatch?: boolean) => Promise<any>;
  preview: () => Promise<string>;
  export: (settings: ExportSettings) => Promise<string>;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  reset: () => void;
  jumpToStep: (step: WorkflowStep) => void;
}

export function useWorkflow(callbacks?: WorkflowCallbacks): UseWorkflowReturn {
  // 本地状态
  const [state, setState] = useState<WorkflowState>(workflowService.getState());
  const callbacksRef = useRef(callbacks);

  // 同步状态
  useEffect(() => {
    const unsubscribe = () => {
      // 清理函数
    };

    // 设置回调来同步状态
    workflowService.setCallbacks({
      onStepChange: (step, prevStep) => {
        setState(workflowService.getState());
        callbacksRef.current?.onStepChange?.(step, prevStep);
      },
      onProgress: (progress) => {
        setState(workflowService.getState());
        callbacksRef.current?.onProgress?.(progress);
      },
      onStatusChange: (status) => {
        setState(workflowService.getState());
        callbacksRef.current?.onStatusChange?.(status);
      },
      onError: (error) => {
        setState(workflowService.getState());
        callbacksRef.current?.onError?.(error);
      },
      onComplete: (result) => {
        setState(workflowService.getState());
        callbacksRef.current?.onComplete?.(result);
      }
    });

    return unsubscribe;
  }, []);

  // 更新回调引用
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // 计算属性
  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isCompleted = state.status === 'completed';
  const hasError = state.status === 'error';

  // 操作函数
  const start = useCallback(async (projectId: string, videoFile: File, config: WorkflowConfig) => {
    await workflowService.start(projectId, videoFile, config);
    setState(workflowService.getState());
  }, []);

  const analyze = useCallback(async () => {
    const result = await workflowService.stepAnalyze();
    setState(workflowService.getState());
    return result;
  }, []);

  const selectTemplate = useCallback(async (templateId?: string) => {
    const result = await workflowService.stepTemplateSelect(templateId);
    setState(workflowService.getState());
    return result;
  }, []);

  const generateScript = useCallback(async (model: any, params: any) => {
    const result = await workflowService.stepGenerateScript(model, params);
    setState(workflowService.getState());
    return result;
  }, []);

  const dedupScript = useCallback(async (config?: any) => {
    const result = await workflowService.stepDedupScript(config);
    setState(workflowService.getState());
    return result;
  }, []);

  const ensureUniqueness = useCallback(async (config?: any) => {
    const result = await workflowService.stepEnsureUniqueness(config);
    setState(workflowService.getState());
    return result;
  }, []);

  const editScript = useCallback(async (script: ScriptData) => {
    const result = await workflowService.stepEditScript(script);
    setState(workflowService.getState());
    return result;
  }, []);

  const editTimeline = useCallback(async (autoMatch: boolean = true) => {
    const result = await workflowService.stepTimelineEdit(autoMatch);
    setState(workflowService.getState());
    return result;
  }, []);

  const preview = useCallback(async () => {
    const result = await workflowService.stepPreview();
    setState(workflowService.getState());
    return result;
  }, []);

  const exportVideo = useCallback(async (settings: ExportSettings) => {
    const result = await workflowService.stepExport(settings);
    setState(workflowService.getState());
    return result;
  }, []);

  const pause = useCallback(() => {
    workflowService.pause();
    setState(workflowService.getState());
  }, []);

  const resume = useCallback(() => {
    workflowService.resume();
    setState(workflowService.getState());
  }, []);

  const cancel = useCallback(() => {
    workflowService.cancel();
    setState(workflowService.getState());
  }, []);

  const reset = useCallback(() => {
    workflowService.reset();
    setState(workflowService.getState());
  }, []);

  const jumpToStep = useCallback((step: WorkflowStep) => {
    workflowService.jumpToStep(step);
    setState(workflowService.getState());
  }, []);

  return {
    // 状态
    state,
    isRunning,
    isPaused,
    isCompleted,
    hasError,
    error: state.error || null,
    currentStep: state.step,
    progress: state.progress,

    // 数据
    data: state.data,
    videoInfo: state.data.videoInfo,
    videoAnalysis: state.data.videoAnalysis,
    selectedTemplate: state.data.selectedTemplate,
    generatedScript: state.data.generatedScript,
    dedupedScript: state.data.dedupedScript,
    uniqueScript: state.data.uniqueScript,
    editedScript: state.data.editedScript,
    timeline: state.data.timeline,
    originalityReport: state.data.originalityReport,
    uniquenessReport: state.data.uniquenessReport,

    // 操作
    start,
    analyze,
    selectTemplate,
    generateScript,
    dedupScript,
    ensureUniqueness,
    editScript,
    editTimeline,
    preview,
    export: exportVideo,
    pause,
    resume,
    cancel,
    reset,
    jumpToStep
  };
}

export default useWorkflow;
