/**
 * 工作流相关自定义 Hooks
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { WorkflowProgressTracker, type ProgressInfo } from '@/core/services/workflow-progress';
import { exportProgress, type ExportProgress } from '@/core/services/export-progress';

/**
 * 工作流进度 Hook
 */
export function useWorkflowProgress() {
  const [progress, setProgress] = useState<ProgressInfo>({
    step: 'idle',
    progress: 0,
    message: '',
  });
  
  const trackerRef = useRef<WorkflowProgressTracker | null>(null);

  useEffect(() => {
    trackerRef.current = new WorkflowProgressTracker();
    
    const unsubscribe = trackerRef.current.onProgress((p) => {
      setProgress(p);
    });
    
    return () => {
      unsubscribe();
      trackerRef.current?.destroy();
    };
  }, []);

  const start = useCallback(() => {
    trackerRef.current?.start();
  }, []);

  const setStep = useCallback((stepId: string) => {
    trackerRef.current?.setStep(stepId);
  }, []);

  const updateProgress = useCallback((p: number) => {
    trackerRef.current?.updateStepProgress(p);
  }, []);

  const completeStep = useCallback(() => {
    trackerRef.current?.completeStep();
  }, []);

  const pause = useCallback(() => {
    trackerRef.current?.pause();
  }, []);

  const resume = useCallback(() => {
    trackerRef.current?.resume();
  }, []);

  const reset = useCallback(() => {
    trackerRef.current?.reset();
  }, []);

  return {
    progress,
    start,
    setStep,
    updateProgress,
    completeStep,
    pause,
    resume,
    reset,
  };
}

/**
 * 导出进度 Hook
 */
export function useExportProgress() {
  const [progress, setProgress] = useState<ExportProgress>({
    stage: 'preparing',
    progress: 0,
  });

  useEffect(() => {
    const unsubscribe = exportProgress.subscribe((p) => {
      setProgress(p);
    });
    
    return unsubscribe;
  }, []);

  const isExporting = progress.stage !== 'complete' && progress.stage !== 'error';
  
  const progressPercent = progress.progress;

  return {
    progress,
    isExporting,
    progressPercent,
  };
}

/**
 * 工作流状态 Hook
 */
export function useWorkflowState() {
  const [state, setState] = useState({
    status: 'idle' as 'idle' | 'running' | 'completed' | 'error',
    currentStep: '',
    progress: 0,
    error: null as string | null,
  });

  const startWorkflow = useCallback(() => {
    setState(s => ({ ...s, status: 'running', error: null }));
  }, []);

  const completeWorkflow = useCallback(() => {
    setState(s => ({ ...s, status: 'completed', progress: 100 }));
  }, []);

  const errorWorkflow = useCallback((err: string) => {
    setState(s => ({ ...s, status: 'error', error: err }));
  }, []);

  const updateStep = useCallback((step: string, progress: number) => {
    setState(s => ({ ...s, currentStep: step, progress }));
  }, []);

  return {
    ...state,
    startWorkflow,
    completeWorkflow,
    errorWorkflow,
    updateStep,
  };
}
