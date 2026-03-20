/**
 * Timeline 常量定义
 */
import type { TrackType } from './types';

export const TRACK_COLORS: Record<TrackType, string> = {
  video: '#3b82f6',
  audio: '#10b981',
  subtitle: '#f59e0b',
  effect: '#ec4899'
};

export const TRANSITION_TYPES = [
  { value: 'fade', label: '淡入淡出' },
  { value: 'dissolve', label: '溶解' },
  { value: 'wipe', label: '擦除' },
  { value: 'slide', label: '滑动' }
];
