import { logger } from '@/shared/utils/logging';

/**
 * Execute an async function with graceful degradation.
 * On error: logs a warning + returns the fallback value instead of throwing.
 *
 * Use when the caller INTENTIONALLY wants to continue with a default
 * value on failure (e.g., return empty array, return mock data).
 *
 * Contrast with BaseService.executeRequest() which always throws.
 */
export async function withFallback<T, F>(
  fn: () => Promise<T>,
  fallback: F,
  context?: string,
): Promise<T | F> {
  try {
    return await fn();
  } catch (error) {
    logger.warn(
      `[withFallback] ${context || '操作'} 失败，使用降级方案:`,
      error instanceof Error ? error.message : String(error),
    );
    return fallback;
  }
}
