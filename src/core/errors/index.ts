/**
 * 错误处理统一入口
 */

export { AppError } from './AppError';
export type { AppErrorSeverity, AppErrorOptions } from './AppError';

import { AppError } from './AppError';
import { logger } from '@/shared/utils/logging';

/**
 * 统一错误处理：记录 + 转 AppError + 返回
 * 用法：catch (e) { throw handleError(e, 'APP_VIDEO_LOAD') }
 */
export function handleError(err: unknown, code: string, context?: Record<string, unknown>): AppError {
  const appErr = AppError.from(err, code);
  if (context) {
    // 合并 context（保留已有）
    const merged = { ...(appErr.context ?? {}), ...context };
    Object.assign(appErr, { context: merged });
  }
  logger.error(`[${appErr.code}] ${appErr.message}`, {
    context: appErr.context,
    originalError: appErr.originalError,
  });
  return appErr;
}
