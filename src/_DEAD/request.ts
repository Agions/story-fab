/**
 * 请求工具函数
 */

import { logger } from './logger';

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: number;
  retryDelay?: number;
}

export interface RequestResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: RequestConfig = {
  timeout: 30000,
  retry: 0,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * 通用请求函数
 */
export async function request<T = unknown>(
  url: string,
  config: RequestConfig = {}
): Promise<RequestResult<T>> {
  const { timeout, retry, retryDelay, ...init } = { ...DEFAULT_CONFIG, ...config };
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  let lastError: Error | null = null;
  let attempts = 0;
  const maxAttempts = (retry || 0) + 1;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }
      
      const data = await response.json();
      return { success: true, data: data as T, status: response.status };
    } catch (error) {
      lastError = error as Error;
      attempts++;
      
      if (attempts < maxAttempts && retryDelay) {
        logger.info(`[Request] 重试 ${attempts}/${retry}`);
        await new Promise((r) => setTimeout(r, retryDelay));
      }
    }
  }
  
  clearTimeout(timeoutId);
  
  const errorMessage = lastError?.message || '请求失败';
  logger.error('[Request] 失败', { url, error: errorMessage });
  
  return { success: false, error: errorMessage };
}

/**
 * GET 请求
 */
export function get<T = unknown>(url: string, config?: RequestConfig): Promise<RequestResult<T>> {
  return request<T>(url, { ...config, method: 'GET' });
}

/**
 * POST 请求
 */
export function post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<RequestResult<T>> {
  return request<T>(url, {
    ...config,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT 请求
 */
export function put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<RequestResult<T>> {
  return request<T>(url, {
    ...config,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE 请求
 */
export function del<T = unknown>(url: string, config?: RequestConfig): Promise<RequestResult<T>> {
  return request<T>(url, { ...config, method: 'DELETE' });
}

/**
 * 文件上传
 */
export async function uploadFile(
  url: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<RequestResult<{ url: string }>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    
    xhr.open('POST', url);
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ success: true, data });
        } catch {
          resolve({ success: false, error: '解析响应失败' });
        }
      } else {
        resolve({ success: false, error: `上传失败: ${xhr.status}` });
      }
    };
    
    xhr.onerror = () => {
      resolve({ success: false, error: '网络错误' });
    };
    
    xhr.send(formData);
  });
}

/**
 * 批量请求
 */
export async function batchRequest<T>(
  requests: Array<() => Promise<RequestResult<T>>>
): Promise<RequestResult<T>[]> {
  const results = await Promise.all(requests.map((req) => req()));
  return results;
}

/**
 * 并发限制请求
 */
export async function limitedRequest<T>(
  requests: Array<() => Promise<RequestResult<T>>>,
  limit: number
): Promise<RequestResult<T>[]> {
  const results: RequestResult<T>[] = [];
  const executing: Promise<void>[] = [];
  
  for (const req of requests) {
    const promise = req().then((result) => {
      results.push(result);
    });
    
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }
  
  await Promise.all(executing);
  return results;
}
