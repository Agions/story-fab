/**
 * 数组工具函数
 */

/**
 * 去重
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * 根据键去重
 */
export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set();
  return arr.filter((item) => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * 分组
 */
export function groupBy<T>(arr: T[], key: keyof T | ((item: T) => string)): Record<string, T[]> {
  return arr.reduce((groups, item) => {
    const k = typeof key === 'function' ? key(item) : String(item[key]);
    (groups[k] = groups[k] || []).push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * 排序
 */
export function sortBy<T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * 过滤空值
 */
export function compact<T>(arr: (T | null | undefined | false | 0 | '')[]): T[] {
  return arr.filter(Boolean) as T[];
}

/**
 * 扁平化
 */
export function flatten<T>(arr: (T | T[])[]): T[] {
  return arr.reduce<T[]>((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
}

/**
 * 差集
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => !set2.has(item));
}

/**
 * 交集
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => set2.has(item));
}

/**
 * 并集
 */
export function union<T>(arr1: T[], arr2: T[]): T[] {
  return [...new Set([...arr1, ...arr2])];
}

/**
 * 随机选择
 */
export function sample<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 随机打乱
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Chunks
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/**
 * 范围数组
 */
export function range(start: number, end: number, step = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * 驼峰命名
 */
export function camelCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^\w/, (c) => c.toLowerCase());
}

/**
 * 下划线命名
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * 首字母大写
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 模板字符串
 */
export function template(str: string, data: Record<string, unknown>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''));
}
