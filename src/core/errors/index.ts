/**
 * 错误处理统一入口
 *
 * AppError 已下沉到 @/shared/errors（leaf 层）以打破 shared<->core 循环依赖。
 * 此处保留 handleError（依赖 logger）并 re-export AppError 以兼容既有导入点。
 */

import { AppError } from '@/shared/errors';
import { logger } from '@/shared/utils/logging';

export { AppError } from '@/shared/errors';
export type { AppErrorSeverity, AppErrorOptions } from '@/shared/errors';

// 统一错误归一层（PR-5.2）
export { normalizeError, isRetryable } from './normalize';

/**
 * 统一错误处理：记录 + 转 AppError + 返回
 * 用法：catch (e) { throw handleError(e, 'APP_VIDEO_LOAD') }
 */
export function handleError(err: unknown, code: string, context?: Record<string, unknown>): AppError {
  const appErr = AppError.from(err, code);
  if (context) {
    const merged = { ...(appErr.context ?? {}), ...context };
    Object.assign(appErr, { context: merged });
  }
  logger.error(`[${appErr.code}] ${appErr.message}`, {
    context: appErr.context,
    originalError: appErr.originalError,
  });
  return appErr;
}
