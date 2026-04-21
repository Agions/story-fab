/**
 * Timeline 常量定义
 * 统一管理时间轴相关的颜色、配置、快捷键等常量
 */
import type { TrackType } from './types';

export type { TrackType };

// ============================================
// 轨道颜色
// ============================================
export const TRACK_COLORS: Record<TrackType, string> = {
  video: '#1890ff',
  audio: '#52c41a',
  subtitle: '#faad14',
  effect: '#722ed1',
};

// ============================================
// 转场类型
// ============================================
export const TRANSITION_TYPES = [
  { value: 'none', label: '无' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'dissolve', label: '溶解' },
  { value: 'wipe', label: '擦除' },
  { value: 'slide', label: '滑动' },
] as const;

// ============================================
// 时间轴配置
// ============================================
export const TIMELINE_CONFIG = {
  minZoom: 0.1,
  maxZoom: 10,
  defaultZoom: 1,
  snapThreshold: 5, // 像素
  minClipDuration: 0.1, // 秒
  maxClipDuration: 3600, // 秒
  defaultTrackHeight: 60,
  rulerHeight: 30,
  waveformHeight: 40,
} as const;

// ============================================
// 键盘快捷键
// ============================================
export const TIMELINE_SHORTCUTS = {
  play: 'Space',
  zoomIn: '=',
  zoomOut: '-',
  fitToScreen: '0',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  delete: 'Delete',
  split: 'Ctrl+K',
  copy: 'Ctrl+C',
  paste: 'Ctrl+V',
} as const;

// ============================================
// 吸附点类型
// ============================================
export const SNAP_POINTS = [
  'playhead',
  'clipStart',
  'clipEnd',
  'marker',
] as const;

// ============================================
// ID 生成器
// ============================================
export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
