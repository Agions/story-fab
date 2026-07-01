/**
 * 字幕相关类型定义
 * 统一来源，避免跨模块重复定义
 */

import type { SubtitleEntry } from './media';

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  outline: boolean;
  outlineColor: string;
  position: 'top' | 'bottom' | 'center';
  alignment: 'left' | 'center' | 'right';
  opacity: number;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  entries: SubtitleEntry[];
  style?: SubtitleStyle;
}
