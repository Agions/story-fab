/**
 * BaseService - 统一的服务层抽象基类
 * 提供统一的错误处理和重试能力
 */
import { logger } from '@/shared/utils/logging';
import { delay } from '@/shared';

/**
 * 服务错误类型
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public originalError?: Error,
    public retryable?: boolean
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

/**
 * 请求配置接口
 */
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  retryOn?: (error: ServiceError) => boolean;
}

/**
 * 服务基类
 */
export abstract class BaseService {
  protected name: string;
  protected config: RequestConfig;

  constructor(name: string, config: RequestConfig = {}) {
    this.name = name;
    this.config = config;
  }

  /**
   * 统一的错误处理
   */
  protected handleError(error: unknown, context?: string): ServiceError {
    const serviceError = this.normalizeError(error);

    logger.error(`[${this.name}] ${context || '操作失败'}:`, { error: serviceError });
    throw serviceError;
  }

  /**
   * 标准化错误
   */
  private normalizeError(error: unknown): ServiceError {
    if (error instanceof ServiceError) {
      return error;
    }

    if (error instanceof Error) {
      return new ServiceError(error.message, undefined, undefined, error);
    }

    return new ServiceError(String(error));
  }

  /**
   * 统一的请求包装器
   */
  protected async executeRequest<T>(
    requestFn: () => Promise<T>,
    context?: string,
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      throw this.handleError(error, context);
    }
  }

  /**
   * 带重试的请求
   */
  protected async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries?: number,
    delayMs?: number,
    retryOn?: (error: ServiceError) => boolean,
  ): Promise<T> {
    const maxRetries = retries ?? this.config.retries ?? 3;
    const retryDelay = delayMs ?? this.config.retryDelay ?? 1000;
    const shouldRetry = retryOn ?? this.config.retryOn ?? defaultRetryOn;

    let lastError: ServiceError | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        const serviceError = this.normalizeError(error);
        lastError = serviceError;

        const shouldRetryAttempt = attempt < maxRetries && shouldRetry(serviceError);

        if (shouldRetryAttempt) {
          const backoffMs = retryDelay * Math.pow(2, attempt);
          logger.warn(
            `[${this.name}] 请求失败 (尝试 ${attempt + 1}/${maxRetries + 1}), ${backoffMs}ms 后重试...`,
            serviceError.message,
          );
          await delay(backoffMs);
        } else if (attempt < maxRetries) {
          logger.error(`[${this.name}] 请求失败:`, serviceError.message);
        }
      }
    }

    throw lastError;
  }
}

/**
 * 默认的重试判断函数
 */
function defaultRetryOn(error: ServiceError): boolean {
  if (!error.statusCode) return true;
  return [408, 429, 500, 502, 503, 504].includes(error.statusCode);
}

export default BaseService;
