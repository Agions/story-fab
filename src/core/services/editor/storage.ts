import type { Timeline } from '@/core/types';

const STORAGE_KEY = 'reelforge_timeline';

export function saveToStorage(timeline: Timeline): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timeline));
  } catch (error) {
    console.error('自动保存失败:', error);
  }
}

export function loadFromStorage(): Timeline | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载失败:', error);
  }
  return null;
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
