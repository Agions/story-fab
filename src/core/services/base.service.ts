/**
 * BaseService - 统一的服务层抽象基类
 * 提供统一的错误处理、请求拦截和日志记录
 */

import { message } from 'antd';

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
 * 统一响应格式
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
  requestId?: string;
}

/**
 * 分页响应格式
 */
export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * 请求配置接口
 */
export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  retryOn?: (error: ServiceError) => boolean;
}

/**
 * 默认请求配置
 */
const DEFAULT_CONFIG: RequestConfig = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000
};

/**
 * 可重试的状态码
 */
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

/**
 * 默认的重试判断函数
 */
const defaultRetryOn = (error: ServiceError): boolean => {
  // 网络错误可以重试
  if (!error.statusCode) return true;
  // 特定状态码可以重试
  return RETRYABLE_STATUS_CODES.includes(error.statusCode);
};

/**
 * 服务基类
 */
export abstract class BaseService {
  protected name: string;
  protected config: RequestConfig;

  constructor(name: string, config: RequestConfig = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 统一的错误处理
   */
  protected handleError(error: unknown, context?: string): never {
    const serviceError = this.normalizeError(error);
    
    console.error(`[${this.name}] ${context || '操作失败'}:`, serviceError);
    
    // 显示用户友好的错误消息
    if (serviceError.statusCode === 401) {
      message.error('认证失败，请检查API密钥设置');
    } else if (serviceError.statusCode === 429) {
      message.error('请求过于频繁，请稍后重试');
    } else if (serviceError.statusCode >= 500) {
      message.error('服务器错误，请稍后重试');
    } else {
      message.error(serviceError.message);
    }
    
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
    options?: {
      showLoading?: boolean;
      loadingMessage?: string;
    }
  ): Promise<T> {
    const { showLoading = true, loadingMessage = '加载中...' } = options || {};
    
    try {
      if (showLoading) {
        // 可以在这里添加全局 loading 状态
        console.log(`[${this.name}] ${loadingMessage}`);
      }
      
      const result = await requestFn();
      return result;
    } catch (error) {
      return this.handleError(error, context);
    }
  }

  /**
   * 带重试的请求 - 增强版
   */
  protected async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries?: number,
    delay?: number,
    retryOn?: (error: ServiceError) => boolean
  ): Promise<T> {
    const maxRetries = retries ?? this.config.retries ?? 3;
    const retryDelay = delay ?? this.config.retryDelay ?? 1000;
    const shouldRetry = retryOn ?? this.config.retryOn ?? defaultRetryOn;
    
    let lastError: ServiceError | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        const serviceError = this.normalizeError(error);
        lastError = serviceError;
        
        // 检查是否应该重试
        const shouldRetryAttempt = attempt < maxRetries && shouldRetry(serviceError);
        
        if (shouldRetryAttempt) {
          const backoffMs = retryDelay * Math.pow(2, attempt); // 指数退避
          this.log('warn', `请求失败 (尝试 ${attempt + 1}/${maxRetries + 1}), ${backoffMs}ms 后重试...`, serviceError.message);
          await this.delay(backoffMs);
        } else if (attempt < maxRetries) {
          // 即使不重试，也记录错误
          this.log('error', `请求失败:`, serviceError.message);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 统一响应格式处理
   */
  protected formatResponse<T>(data: T, requestId?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * 统一错误响应
   */
  protected formatError(error: ServiceError, requestId?: string): ApiResponse {
    return {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message
      },
      timestamp: new Date().toISOString(),
      requestId
    };
  }

  /**
   * 包装 Promise 为统一响应格式
   */
  protected async withResponse<T>(
    requestFn: () => Promise<T>,
    context?: string
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    try {
      const data = await requestFn();
      return this.formatResponse(data, requestId);
    } catch (error) {
      const serviceError = this.normalizeError(error);
      this.log('error', `${context || '请求'}失败:`, serviceError.message);
      return this.formatError(serviceError, requestId) as ApiResponse<T>;
    }
  }

  /**
   * 生成请求 ID
   */
  private generateRequestId(): string {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延迟函数
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 请求拦截器 - 在请求前执行
   */
  protected beforeRequest?(config: RequestConfig): RequestConfig;

  /**
   * 响应拦截器 - 在响应后执行
   */
  protected afterResponse?<T>(response: T): T;

  /**
   * 日志记录
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, ...args: unknown[]): void {
    const prefix = `[${this.name}]`;
    switch (level) {
      case 'info':
        console.log(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
    }
  }

  /**
   * 封装 fetch 请求 - 带超时和错误处理
   */
  protected async fetch<T = unknown>(
    url: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    const { timeout = this.config.timeout, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new ServiceError(
          `HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
          'HTTP_ERROR',
          response.status,
          undefined,
          RETRYABLE_STATUS_CODES.includes(response.status)
        );
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ServiceError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ServiceError('请求超时', 'TIMEOUT', 408, error, true);
        }
        throw new ServiceError(error.message, 'NETWORK_ERROR', undefined, error, true);
      }
      
      throw new ServiceError(String(error));
    }
  }

  /**
   * 封装 fetch 请求 - 带重试
   */
  protected fetchWithRetry<T = unknown>(
    url: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    return this.retryRequest(
      () => this.fetch<T>(url, options),
      this.config.retries,
      this.config.retryDelay,
      this.config.retryOn
    );
  }
}

export default BaseService;
