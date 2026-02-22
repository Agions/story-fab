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
    public originalError?: Error
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
  headers?: Record<string, string>;
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
   * 带重试的请求
   */
  protected async retryRequest<T>(
    requestFn: () => Promise<T>,
    retries?: number,
    delay?: number
  ): Promise<T> {
    const maxRetries = retries ?? this.config.retries ?? 3;
    const retryDelay = delay ?? this.config.retryDelay ?? 1000;
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          console.warn(`[${this.name}] 请求失败，${maxRetries - attempt}秒后重试...`);
          await this.delay(retryDelay * (attempt + 1));
        }
      }
    }
    
    throw lastError;
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
}

export default BaseService;
