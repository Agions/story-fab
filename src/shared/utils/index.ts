/**
 * 通用工具函数
 */

import { message } from 'antd';

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item)) as unknown as T;

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * 生成唯一 ID
 */
export function generateId(prefix?: string): string {
  const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return prefix ? `${prefix}_${id}` : id;
}

/**
 * 延迟
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < attempts - 1) {
        await delay(delayMs * Math.pow(2, i));
      }
    }
  }

  throw lastError!;
}

/**
 * 检测文件类型
 */
export function detectFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  const typeMap: Record<string, string> = {
    // 视频
    mp4: 'video', mov: 'video', avi: 'video', mkv: 'video',
    webm: 'video', flv: 'video', wmv: 'video',
    // 音频
    mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio',
    // 图片
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
    webp: 'image', svg: 'image',
    // 文档
    pdf: 'document', doc: 'document', docx: 'document',
    txt: 'text', json: 'code', js: 'code', ts: 'code',
    // 字幕
    srt: 'subtitle', vtt: 'subtitle', ass: 'subtitle'
  };

  return typeMap[ext] || 'unknown';
}

/**
 * 验证邮箱
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * 验证 URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 安全 JSON 解析
 */
export function safeJSONParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * 计算哈希
 */
export async function computeHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 下载文件
 */
export function downloadFile(content: string | Blob, filename: string, mimeType?: string): void {
  const blob = content instanceof Blob
    ? content
    : new Blob([content], { type: mimeType || 'text/plain' });

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
 * 读取文件为 Data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 读取文件为文本
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

/**
 * 从剪贴板读取
 */
export async function readFromClipboard(): Promise<string> {
  try {
    return await navigator.clipboard.readText();
  } catch {
    return '';
  }
}

/**
 * 显示成功消息
 */
export function showSuccess(msg: string): void {
  message.success(msg);
}

/**
 * 显示错误消息
 */
export function showError(msg: string): void {
  message.error(msg);
}

/**
 * 显示警告消息
 */
export function showWarning(msg: string): void {
  message.warning(msg);
}

/**
 * 显示信息消息
 */
export function showInfo(msg: string): void {
  message.info(msg);
}
