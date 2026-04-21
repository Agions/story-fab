/**
 * useVirtualTimeline — 时间线虚拟化 Hook
 *
 * 问题：100+ clips 时全部渲染导致卡顿
 * 解决：只渲染可见区域内的 clips（基于 scroll position + viewport width）
 *
 * 使用方式：
 *   const { visibleClips, totalWidth, offsetLeft, containerRef } = useVirtualTimeline({
 *     clips: allClips,
 *     duration: 300000,        // ms
 *     scale: 0.1,              // px/ms
 *     containerWidth: 800,     // viewport width
 *     scrollLeft: 0,          // current scroll
 *   });
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import type { TimelineClip } from '@/components/editor/Timeline/types';

export interface VirtualTimelineOptions {
  clips: TimelineClip[];
  duration: number;       // 总时长 ms
  scale: number;          // px/ms（时间轴缩放）
  containerWidth: number; // 视口宽度
  scrollLeft: number;    // 滚动位置
  /** 每侧额外渲染的 buffer clips（防止快速滚动白块），默认 3 */
  buffer?: number;
}

export interface VirtualClip extends TimelineClip {
  /** 该 clip 在可见区域的像素偏移（相对于时间线起点） */
  pixelLeft: number;
  /** 该 clip 的像素宽度 */
  pixelWidth: number;
}

export interface VirtualTimelineResult {
  visibleClips: VirtualClip[];
  totalWidth: number;    // 时间线总像素宽度
  offsetLeft: number;     // 可见区域相对时间线起点的像素偏移
  firstClipIndex: number; // 可见区域第一个 clip 的索引
  lastClipIndex: number;  // 可见区域最后一个 clip 的索引
  containerRef: React.RefObject<HTMLDivElement | null>;
}

const DEFAULT_BUFFER = 3;

/**
 * 计算可见 clips 的窗口范围
 */
function computeVisibleRange(
  clips: TimelineClip[],
  scale: number,
  containerWidth: number,
  scrollLeft: number,
  buffer: number,
): { startIndex: number; endIndex: number } {
  if (!clips.length) return { startIndex: -1, endIndex: -1 };

  const visibleStartMs = scrollLeft / scale;
  const visibleEndMs = (scrollLeft + containerWidth) / scale;

  let startIndex = 0;
  let endIndex = clips.length - 1;

  // 二分查找 startIndex（第一个 endMs > visibleStartMs 的 clip）
  let lo = 0, hi = clips.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((clips[mid].endMs) <= visibleStartMs) lo = mid + 1;
    else hi = mid;
  }
  startIndex = Math.max(0, lo - buffer);

  // 二分查找 endIndex（最后一个 startMs < visibleEndMs 的 clip）
  lo = startIndex;
  hi = clips.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((clips[mid].startMs) >= visibleEndMs) hi = mid - 1;
    else lo = mid;
  }
  endIndex = Math.min(clips.length - 1, lo + buffer);

  return { startIndex, endIndex };
}

export function useVirtualTimeline(options: VirtualTimelineOptions): VirtualTimelineResult {
  const {
    clips,
    duration,
    scale,
    containerWidth,
    scrollLeft,
    buffer = DEFAULT_BUFFER,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidthState, setContainerWidthState] = useState(containerWidth);

  // 监听容器宽度变化（窗口 resize）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidthState(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const effectiveWidth = containerWidthState || containerWidth;
  const totalWidth = duration * scale;

  const { visibleClips, firstClipIndex, lastClipIndex } = useMemo(() => {
    if (!clips.length || duration <= 0) {
      return { visibleClips: [], firstClipIndex: -1, lastClipIndex: -1 };
    }

    const { startIndex, endIndex } = computeVisibleRange(
      clips, scale, effectiveWidth, scrollLeft, buffer
    );

    if (startIndex < 0 || startIndex > endIndex) {
      return { visibleClips: [], firstClipIndex: -1, lastClipIndex: -1 };
    }

    const visible = clips.slice(startIndex, endIndex + 1).map(clip => ({
      ...clip,
      pixelLeft: clip.startMs * scale,
      pixelWidth: Math.max(4, (clip.endMs - clip.startMs) * scale),
    }));

    return { visibleClips: visible, firstClipIndex: startIndex, lastClipIndex: endIndex };
  }, [clips, scale, duration, effectiveWidth, scrollLeft, buffer]);

  return {
    visibleClips,
    totalWidth,
    offsetLeft: 0,
    firstClipIndex,
    lastClipIndex,
    containerRef,
  };
}
