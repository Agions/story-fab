/**
 * useCommentaryPipeline — React Hook for one-click commentary pipeline
 *
 * 封装 `runCommentaryPipeline` + 事件监听，提供：
 * - `run(input)`: 触发流水线
 * - `progress`: 最新进度状态
 * - `error`: 错误信息
 * - `isRunning`: 是否正在运行
 *
 * 自动清理事件监听（组件卸载时）。
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  runCommentaryPipeline,
  onPipelineProgress,
  onPipelineComplete,
  onPipelineError,
} from '@/core/services/commentary/pipeline-service';
import type {
  CommentaryPipelineInput,
  CommentaryPipelineOutput,
  PipelineProgressEvent,
  PipelineErrorEvent,
} from '@/types';

export interface UseCommentaryPipelineResult {
  /** 触发流水线 */
  run: (input: CommentaryPipelineInput) => Promise<CommentaryPipelineOutput | null>;
  /** 最新进度 */
  progress: PipelineProgressEvent | null;
  /** 错误信息 */
  error: PipelineErrorEvent | null;
  /** 是否正在运行 */
  isRunning: boolean;
}

export function useCommentaryPipeline(): UseCommentaryPipelineResult {
  const [progress, setProgress] = useState<PipelineProgressEvent | null>(null);
  const [error, setError] = useState<PipelineErrorEvent | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const unlistenRefs = useRef<(() => void)[]>([]);

  const clearListeners = useCallback(() => {
    unlistenRefs.current.forEach((fn) => fn());
    unlistenRefs.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearListeners();
    };
  }, [clearListeners]);

  const run = useCallback(
    async (input: CommentaryPipelineInput): Promise<CommentaryPipelineOutput | null> => {
      if (isRunning) return null;

      setIsRunning(true);
      setProgress(null);
      setError(null);
      clearListeners();

      let pipelineOutput: CommentaryPipelineOutput | null = null;

      try {
        // 注册事件监听
        const unlistenProgress = await onPipelineProgress((e) => {
          setProgress(e);
        });
        const unlistenComplete = await onPipelineComplete((e) => {
          // 流水线成功完成，记录最终状态
          console.log(`[Pipeline] Complete in ${e.totalDurationMs}ms`);
        });
        const unlistenError = await onPipelineError((e) => {
          setError(e);
        });

        unlistenRefs.current = [unlistenProgress, unlistenComplete, unlistenError];

        // 执行流水线
        pipelineOutput = await runCommentaryPipeline(input);
      } catch (e) {
        setError({
          stage: 'invoke',
          error: e instanceof Error ? e.message : String(e),
        });
      } finally {
        setIsRunning(false);
        clearListeners();
      }

      return pipelineOutput;
    },
    [isRunning, clearListeners],
  );

  return {
    run,
    progress,
    error,
    isRunning,
  };
}
