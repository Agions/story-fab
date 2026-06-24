/**
 * 通用工具函数 — 统一导出
 *
 * 【优化思路】原始文件混合了通用工具和项目特定逻辑，
 * 已将项目指标解析函数提取到 projectMetrics.ts。
 * 本文件保留为通用工具的 barrel 导出。
 */

import { notify } from './notify';
import { AppError } from '@/core/errors';
export * from './notify';

// Time formatting & timestamps
export { formatTime, formatDuration, formatDate, formatDateTime, formatRelativeTime, clamp, formatTimecodeMs, formatTimecode, formatTimecodeSimple, now, nowISO, MS_PER_SECOND } from './formatting';

// 项目指标解析（已提取到独立模块）
export { readNumberField, resolveProjectVideoPath, extractProjectMediaMetrics, pickPreferredSizeMb, type RawProjectRecord } from './project-metrics';

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 生成唯一 ID（通用版，时间戳+随机数）
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
 * 带指数退避的重试
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  if (attempts < 1) {
    throw new AppError('APP_RETRY_INVALID', 'retry: attempts must be >= 1', {
      userMessage: 'retry 调用参数错误',
    });
  }

  let lastError: Error | undefined;

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

  throw lastError ?? new Error('retry: failed without capturing an error');
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
 * 复制到剪贴板（带降级方案）
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
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
  notify.success(msg);
}

/**
 * 显示错误消息
 */
export function showError(msg: string): void {
  notify.error(null, msg);
}

/**
 * 显示警告消息
 */
export function showWarning(msg: string): void {
  notify.warning(msg);
}

/**
 * 显示信息消息
 */
export function showInfo(msg: string): void {
  notify.info(msg);
}

/**
 * 并发映射：并行处理数组元素，限制同时运行的任务数
 *
 * @example
 * ```ts
 * const results = await concurrentMap(urls, fetch, 4);
 * ```
 */
export async function concurrentMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  limit = 8
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
    (async () => {
      let i: number;
      while ((i = index++) < items.length) {
        results[i] = await fn(items[i]);
      }
    })()
  );
  await Promise.all(workers);
  return results;
}
