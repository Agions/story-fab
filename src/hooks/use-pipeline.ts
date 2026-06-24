/**
 * usePipeline Hook - 流水线状态管理
 *
 * 提供流水线的 React 绑定，包括：
 * - 状态订阅
 * - 步骤执行控制
 * - 进度追踪
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PipelineEngine,
  createPipeline,
  type StepName,
  type PipelineState,
  type PipelineDataContext,
  type ScriptStepConfig,
  type VoiceStepConfig,
  type ComposeStepConfig,
  type ExportStepConfig,
} from '@/pipeline';
import { ingestStep } from '@/pipeline/steps/ingest';
import { analyzeStep } from '@/pipeline/steps/analyze';
import { createScriptStep } from '@/pipeline/steps/script';
import { createVoiceStep } from '@/pipeline/steps/voice';
import { createComposeStep } from '@/pipeline/steps/compose';
import { createExportStep } from '@/pipeline/steps/export';

// ─── Hook 配置 ───

export interface UsePipelineConfig {
  projectId: string;
  videoPath: string;
  script?: ScriptStepConfig;
  voice?: VoiceStepConfig;
  compose?: ComposeStepConfig;
  export?: ExportStepConfig;
}

// ─── Hook 返回值 ───

export interface UsePipelineReturn {
  state: PipelineState;
  context: PipelineDataContext;
  executeStep: (step: StepName) => Promise<void>;
  executeTo: (step: StepName) => Promise<void>;
  executeAll: () => Promise<void>;
  reexecuteFrom: (step: StepName) => Promise<void>;
  canExecute: (step: StepName) => boolean;
  isStepCompleted: (step: StepName) => boolean;
  isStepRunning: (step: StepName) => boolean;
}

// ─── Hook 实现 ───

export function usePipeline(config: UsePipelineConfig): UsePipelineReturn {
  const {
    projectId,
    videoPath,
    script: scriptConfig = {},
    voice: voiceConfig = {},
    compose: composeConfig = {},
    export: exportConfig = {},
  } = config;

  // 创建流水线引擎（仅一次）
  const engineRef = useRef<PipelineEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = createPipeline(projectId, videoPath);

    // 注册所有步骤
    engineRef.current
      .registerStep(ingestStep)
      .registerStep(analyzeStep)
      .registerStep(createScriptStep({ ...scriptConfig, apiKey: scriptConfig.apiKey ?? '' }))
      .registerStep(createVoiceStep(voiceConfig))
      .registerStep(createComposeStep(composeConfig))
      .registerStep(createExportStep(exportConfig));
  }

  const engine = engineRef.current;

  // 状态管理
  const [state, setState] = useState<PipelineState>(engine.getState());
  const [context, setContext] = useState<PipelineDataContext>(engine.getContext());

  // 订阅状态变化
  useEffect(() => {
    const unsubscribe = engine.subscribe((newState) => {
      setState({ ...newState });
      setContext({ ...engine.getContext() });
    });

    return unsubscribe;
  }, [engine]);

  // 执行单个步骤
  const executeStep = useCallback(async (step: StepName) => {
    try {
      await engine.executeStep(step);
    } catch (err) {
      console.error(`[usePipeline] Step ${step} failed:`, err);
      throw err;
    }
  }, [engine]);

  // 执行到指定步骤
  const executeTo = useCallback(async (step: StepName) => {
    try {
      await engine.executeTo(step);
    } catch (err) {
      console.error(`[usePipeline] Execute to ${step} failed:`, err);
      throw err;
    }
  }, [engine]);

  // 执行完整流水线
  const executeAll = useCallback(async () => {
    try {
      await engine.executeAll();
    } catch (err) {
      console.error('[usePipeline] Execute all failed:', err);
      throw err;
    }
  }, [engine]);

  // 从指定步骤重新执行
  const reexecuteFrom = useCallback(async (step: StepName) => {
    try {
      await engine.reexecuteFrom(step);
    } catch (err) {
      console.error(`[usePipeline] Reexecute from ${step} failed:`, err);
      throw err;
    }
  }, [engine]);

  // 检查步骤是否可以执行
  const canExecute = useCallback((step: StepName): boolean => {
    if (state.status === 'running') return false;

    const stepIndex = ['ingest', 'analyze', 'script', 'voice', 'compose', 'export'].indexOf(step);
    if (stepIndex === 0) return true;

    // 检查前一步是否完成
    const prevStep = ['ingest', 'analyze', 'script', 'voice', 'compose', 'export'][stepIndex - 1] as StepName;
    return state.stepProgress[prevStep] === 100;
  }, [state]);

  // 检查步骤是否已完成
  const isStepCompleted = useCallback((step: StepName): boolean => {
    return state.stepProgress[step] === 100;
  }, [state]);

  // 检查步骤是否正在运行
  const isStepRunning = useCallback((step: StepName): boolean => {
    return state.status === 'running' && state.currentStep === step;
  }, [state]);

  return {
    state,
    context,
    executeStep,
    executeTo,
    executeAll,
    reexecuteFrom,
    canExecute,
    isStepCompleted,
    isStepRunning,
  };
}
