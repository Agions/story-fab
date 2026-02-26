import { useState, useCallback } from 'react';
import { message } from 'antd';
import { useWorkflow, useModel, useAIClip } from '@/core/hooks';
import { scriptTemplateService } from '@/core/services';
import type { ScriptTemplate, AIModel, WorkflowStep } from '@/core/types';
import { WORKFLOW_STEPS } from '../constants';

export interface AIClipConfig {
  enabled: boolean;
  autoClip: boolean;
  detectSceneChange: boolean;
  detectSilence: boolean;
  removeSilence: boolean;
  targetDuration?: number;
  pacingStyle: 'fast' | 'normal' | 'slow';
}

export interface ScriptParams {
  style: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
  targetAudience: string;
  language: 'zh' | 'en';
}

export const useWorkflowPage = () => {
  // 本地状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptTemplate | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [scriptParams, setScriptParams] = useState<ScriptParams>({
    style: 'professional',
    tone: 'friendly',
    length: 'medium',
    targetAudience: 'general',
    language: 'zh',
  });
  const [aiClipConfig, setAiClipConfig] = useState<AIClipConfig>({
    enabled: true,
    autoClip: false,
    detectSceneChange: true,
    detectSilence: true,
    removeSilence: true,
    pacingStyle: 'normal',
  });

  // Hooks
  const {
    state,
    isRunning,
    isPaused,
    isCompleted,
    hasError,
    error,
    currentStep,
    progress,
    data,
    start,
    editScript,
    editTimeline,
    export: exportVideo,
    pause,
    resume,
    cancel,
    reset,
    jumpToStep,
  } = useWorkflow({
    onStepChange: (step) => {
      const stepInfo = WORKFLOW_STEPS.find((s) => s.key === step);
      message.info(`进入步骤: ${stepInfo?.title}`);
    },
    onError: (err) => {
      message.error(err);
    },
    onComplete: () => {
      message.success('工作流完成！');
    },
  });

  const { allModels: models } = useModel();
  const templates = scriptTemplateService.getAllTemplates();

  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === currentStep);

  // 开始工作流
  const handleStart = useCallback(async () => {
    if (!selectedFile || !selectedModel) {
      message.error('请选择视频文件和 AI 模型');
      return;
    }

    try {
      await start('project_' + Date.now(), selectedFile, {
        autoAnalyze: true,
        autoGenerateScript: true,
        preferredTemplate: selectedTemplate?.id,
        model: selectedModel,
        scriptParams,
        aiClipConfig: aiClipConfig.enabled ? aiClipConfig : undefined,
      });
    } catch (err) {
      // 错误已在回调中处理
    }
  }, [selectedFile, selectedModel, selectedTemplate, scriptParams, aiClipConfig, start]);

  // 更新脚本参数
  const updateScriptParams = useCallback((updates: Partial<ScriptParams>) => {
    setScriptParams((prev) => ({ ...prev, ...updates }));
  }, []);

  // 更新 AI 剪辑配置
  const updateAIClipConfig = useCallback((updates: Partial<AIClipConfig>) => {
    setAIClipConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return {
    // 状态
    selectedFile,
    selectedTemplate,
    selectedModel,
    scriptParams,
    aiClipConfig,
    isRunning,
    isPaused,
    isCompleted,
    hasError,
    error,
    currentStep,
    currentStepIndex,
    progress,
    data,
    models,
    templates,

    // 状态设置
    setSelectedFile,
    setSelectedTemplate,
    setSelectedModel,
    updateScriptParams,
    updateAIClipConfig,

    // 操作
    handleStart,
    editScript,
    editTimeline,
    exportVideo,
    pause,
    resume,
    cancel,
    reset,
    jumpToStep,
  };
};
