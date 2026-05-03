import type { Timeline } from './types';
import { logger } from '../../../shared/utils/logging';
import { STORAGE_KEYS } from '@/constants';

// Timeline storage key - 使用统一的键名，兼容旧数据
const CURRENT_KEY = STORAGE_KEYS.timeline;
const LEGACY_KEY = 'reelforge_timeline'; // 旧键名，保留用于数据迁移

export function saveToStorage(timeline: Timeline): void {
  try {
    // 同时保存到新旧键名，确保兼容性
    localStorage.setItem(CURRENT_KEY, JSON.stringify(timeline));
    localStorage.setItem(LEGACY_KEY, JSON.stringify(timeline));
  } catch (error) {
    logger.error('自动保存失败:', { error });
  }
}

export function loadFromStorage(): Timeline | null {
  try {
    // 优先读取新键名，兼容旧键名
    const data = localStorage.getItem(CURRENT_KEY) || localStorage.getItem(LEGACY_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error('加载失败:', { error });
  }
  return null;
}

export function clearStorage(): void {
  localStorage.removeItem(CURRENT_KEY);
  localStorage.removeItem(LEGACY_KEY);
}
