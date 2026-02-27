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

/**
 * 简单内存缓存实现
 */
class RequestCache {
  private cache: Map<string, CacheItem<any>>;
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
  private generateKey(url: string, params?: any): string {
    if (!params) return url;
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    return `${url}?${sortedParams}`;
  }

  /**
   * 获取缓存
   */
  get<T>(url: string, params?: any): T | null {
    const key = this.generateKey(url, params);
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  /**
   * 设置缓存
   */
  set<T>(url: string, data: T, params?: any, options?: CacheOptions): void {
    const key = this.generateKey(url, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * 删除指定缓存
   */
  delete(url: string, params?: any): void {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
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
      if (now - item.timestamp > this.defaultTTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

// 导出单例
export const requestCache = new RequestCache();

// 导出类以便自定义实例
export { RequestCache };
