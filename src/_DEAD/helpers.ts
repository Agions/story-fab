/**
 * 通用工具函数
 * 包含: 防抖节流、剪贴板、文件下载、深拷贝、类型判断等
 */
import { notify } from '@/shared';

// 从 array.ts 重新导出数组工具函数（避免重复实现）
export { unique, groupBy, sortBy, shuffle } from './array';

/**
 * 生成唯一 ID
 */
export function generateId(prefix = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function(this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    notify.success('已复制到剪贴板');
    return true;
  } catch {
    notify.error(null, '复制失败');
    return false;
  }
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, type = 'text/plain'): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 判断对象是否为空
 */
export function isEmpty(obj: unknown): boolean {
  if (obj == null) return true;
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * 等待指定时间
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 随机字符串
 */
export function randomString(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 截断文本
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * 验证 URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

/**
 * 验证文件类型
 */
export function isValidFileType(filename: string, allowedTypes: string[]): boolean {
  const ext = getFileExtension(filename);
  return allowedTypes.includes(ext);
}

// ========== 其他工具函数 ==========

/**
 * 数字补零
 */
export function padZero(num: number, length = 2): string {
  return num.toString().padStart(length, '0');
}

/**
 * 范围限制
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 随机整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 判断是否为同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 获取相对时间描述
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const target = typeof date === 'string' ? new Date(date) : date;
  const diff = now.getTime() - target.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
}

/**
 * 安全获取对象属性
 */
export function get<T>(obj: unknown, path: string, defaultValue?: T): T | undefined {
  const keys = path.split('.');
  let result: unknown = obj;
  for (const key of keys) {
    if (result == null) return defaultValue;
    if (typeof result !== 'object') return defaultValue;
    result = (result as Record<string, unknown>)[key];
  }
  return (result as T | undefined) ?? defaultValue;
}

/**
 * 创建防抖函数（支持 cancel）
 */
export function debounceWithCancel<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  const debounced = function(this: unknown, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as ((...args: Parameters<T>) => void) & { cancel: () => void };
  
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };
  
  return debounced;
}

/**
 * 创建节流函数（支持 cancel 和 flush）
 */
export function throttleWithCancel<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) & { cancel: () => void; flush: () => void } {
  let lastRun = 0;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  const throttled = function(this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = limit - (now - lastRun);
    
    lastArgs = args;
    
    if (remaining <= 0) {
      if (timeout) clearTimeout(timeout);
      lastRun = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        lastRun = Date.now();
        timeout = null;
        if (lastArgs) func.apply(this, lastArgs);
      }, remaining);
    }
  } as ((...args: Parameters<T>) => void) & { cancel: () => void; flush: () => void };
  
  throttled.cancel = () => {
    if (timeout) clearTimeout(timeout);
  };
  
  throttled.flush = () => {
    if (lastRun > 0 && lastArgs) {
      if (timeout) clearTimeout(timeout);
      lastRun = Date.now();
      func(...lastArgs);
    }
  };
  
  return throttled;
}
