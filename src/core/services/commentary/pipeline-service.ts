/**
 * Commentary Pipeline Service
 *
 * 职责：一键调用 `run_commentary_pipeline` 后端命令，并监听进度事件。
 *
 * 设计原则：
 * - pipeline-service 是 pipeline 命令的唯一调用入口
 * - 通过 `app.listen` 订阅事件，返回 cleanup 函数
 * - 不依赖 React，可在任何上下文中使用
 */

import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { tauri } from '@/core/tauri';
import type {
  CommentaryPipelineInput,
  CommentaryPipelineOutput,
  PipelineProgressEvent,
  PipelineCompleteEvent,
  PipelineErrorEvent,
} from '@/types';

// ─── Pipeline Invoke ──────────────────────────────────────────────────

/**
 * 执行一键解说流水线（导演规划 + 脚本生成 + 配音合成）
 *
 * @param input 流水线输入参数
 * @returns 流水线输出结果
 */
export async function runCommentaryPipeline(
  input: CommentaryPipelineInput,
): Promise<CommentaryPipelineOutput> {
  // P0: 确保 autoApprove 始终为 true
  const payload: CommentaryPipelineInput = {
    ...input,
    autoApprove: true,
  };

  return tauri.runCommentaryPipeline(payload);
}

// ─── Event Listeners ──────────────────────────────────────────────────

/**
 * 监听流水线进度事件
 *
 * @param onProgress 进度回调
 * @returns cleanup 函数（调用后取消监听）
 */
export function onPipelineProgress(
  onProgress: (event: PipelineProgressEvent) => void,
): Promise<UnlistenFn> {
  return listen<PipelineProgressEvent>('pipeline-progress', (event) => {
    onProgress(event.payload);
  });
}

/**
 * 监听流水线完成事件
 *
 * @param onComplete 完成回调
 * @returns cleanup 函数
 */
export function onPipelineComplete(
  onComplete: (event: PipelineCompleteEvent) => void,
): Promise<UnlistenFn> {
  return listen<PipelineCompleteEvent>('pipeline-complete', (event) => {
    onComplete(event.payload);
  });
}

/**
 * 监听流水线错误事件
 *
 * @param onError 错误回调
 * @returns cleanup 函数
 */
export function onPipelineError(
  onError: (event: PipelineErrorEvent) => void,
): Promise<UnlistenFn> {
  return listen<PipelineErrorEvent>('pipeline-error', (event) => {
    onError(event.payload);
  });
}
