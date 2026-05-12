import { MS_PER_SECOND } from '@/shared/utils';
// Timeline 工具函数

/**
 * Shared time & ID generation utilities for Timeline components.
 * formatTime: frames-level timecode (MM:SS:FF at 30fps)
 * generateId: crypto.randomUUID-based collision-free IDs
 */

export function formatTime(ms: number): string {
  const totalSeconds = ms / MS_PER_SECOND;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((ms % 1000) / (1000 / 30));
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

export function generateId(prefix = 'clip'): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
