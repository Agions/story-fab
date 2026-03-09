/**
 * 简单请求缓存工具
 * 用于缓存 API 请求结果，减少重复网络请求
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface CacheOptions {
  ttl?: number; // 缓存过期时间（毫秒），默认 5 分钟
}

interface CacheParams {
  [key: string]: unknown;
}

/**
 * 简单内存缓存实现
 */
class RequestCache {
  private cache: Map<string, CacheItem<unknown>>;
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
    
    // 定期清理过期缓存
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  /**
   * 生成缓存 key
   */
  private generateKey(url: string, params?: CacheParams): string {
    return params ? `${url}?${JSON.stringify(params)}` : url;
  }

  /**
   * 获取缓存
   */
  get<T>(url: string, params?: CacheParams): T | null {
    const key = this.generateKey(url, params);
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * 设置缓存
   */
  set<T>(url: string, data: T, params?: CacheParams, options?: CacheOptions): void {
    const key = this.generateKey(url, params);
    const ttl = options?.ttl || this.defaultTTL;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    });
  }

  /**
   * 删除缓存
   */
  delete(url: string, params?: CacheParams): void {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp) {
        this.cache.delete(key);
      }
    }
  }
}

// 导出单例
export const requestCache = new RequestCache();
export default RequestCache;
