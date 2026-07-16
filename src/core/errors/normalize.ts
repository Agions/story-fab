/**
 * normalize.ts — 统一错误归一层
 *
 * 任意 unknown 错误 → AppError，保留各类型特有上下文。
 *
 * 优先级链（从最具体到最通用）：
 *   1. AppError 原样返回
 *   2. TauriBridgeError → command / retryable 写入 context（kind 在 PR-2.3 合并后可用）
 *   3. ServiceError → code / statusCode 写入 context，severity='error'
 *   4. Error → 通用 message + originalError
 *   5. 其他 (string/object) → fallback message
 *
 * Stage 8 PR-5.2。配合 ErrorBoundary / notify / logger 使用。
 */

import { AppError } from '@/shared/errors';
import { TauriBridgeError } from '@/core/tauri/invoke';

/**
 * Interface 适配 ServiceError（避免直接 import 内部类）
 * 内部 ServiceError 来自 providers/base-service.ts，仅暴露核心字段
 */
interface ServiceErrorLike {
  name: string;
  message: string;
  code?: string;
  statusCode?: number;
  originalError?: Error;
}

function isServiceErrorLike(err: unknown): err is ServiceErrorLike {
  return (
    err instanceof Error &&
    'code' in err &&
    ('statusCode' in err || true) // statusCode 可选
  );
}

function isTauriBridgeError(err: unknown): err is TauriBridgeError {
  return err instanceof TauriBridgeError;
}

/**
 * 归一化任意 unknown 错误为 AppError。
 *
 * @param err 任意 catch 块捕获的值
 * @param fallbackCode 当 err 不属于已知类型时使用的 code（默认 'APP_UNKNOWN'）
 * @returns AppError，永不抛错
 */
export function normalizeError(err: unknown, fallbackCode = 'APP_UNKNOWN'): AppError {
  // 1. 已是 AppError → 原样返回
  if (err instanceof AppError) return err;

  // 2. TauriBridgeError → 保留 command / retryable
  // 注：PR-2.3 合并后 kind 字段可用，会自动包含在 context.bridge.kind
  if (isTauriBridgeError(err)) {
    const kind = 'kind' in err ? (err as { kind: unknown }).kind : undefined;
    return new AppError('APP_TAURI_BRIDGE', err.message, {
      severity: err.retryable ? 'warning' : 'error',
      retryable: err.retryable,
      originalError: err,
      context: {
        bridge: {
          command: err.command,
          retryable: err.retryable,
          ...(kind !== undefined ? { kind } : {}),
        },
      },
    });
  }

  // 3. ServiceError → 保留 code / statusCode
  if (isServiceErrorLike(err)) {
    return new AppError(err.code ?? 'APP_SERVICE_ERROR', err.message, {
      severity: 'error',
      statusCode: err.statusCode,
      originalError: err.originalError ?? err,
      context: {
        service: {
          code: err.code,
          statusCode: err.statusCode,
        },
      },
    });
  }

  // 4. 普通 Error
  if (err instanceof Error) {
    return new AppError(fallbackCode, err.message, {
      severity: 'error',
      originalError: err,
    });
  }

  // 5. 字符串 / 对象 / null / undefined
  return new AppError(fallbackCode, typeof err === 'string' ? err : 'Unknown error', {
    severity: 'error',
    originalError: err,
  });
}

/**
 * 检查错误是否可重试（基于归一化结果）
 */
export function isRetryable(err: unknown): boolean {
  return normalizeError(err).retryable;
}
