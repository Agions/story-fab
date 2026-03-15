/**
 * 视频工具函数
 */

import type { VideoSegment } from '@/core/types';

/**
 * 创建视频片段
 */
export function createSegment(data: Partial<VideoSegment>): VideoSegment {
  return {
    id: data.id || `segment-${Date.now()}`,
    sourceIndex: data.sourceIndex || 0,
    startTime: data.startTime || 0,
    endTime: data.endTime || 0,
    duration: data.duration || 0,
    scenes: data.scenes,
    audioPeaks: data.audioPeaks,
  };
}

/**
 * 计算片段时长
 */
export function calculateDuration(startTime: number, endTime: number): number {
  return Math.max(0, endTime - startTime);
}

/**
 * 检测片段是否相交
 */
export function segmentsOverlap(
  seg1: VideoSegment,
  seg2: VideoSegment
): boolean {
  return seg1.startTime < seg2.endTime && seg2.startTime < seg1.endTime;
}

/**
 * 合并重叠片段
 */
export function mergeOverlappingSegments(segments: VideoSegment[]): VideoSegment[] {
  if (segments.length <= 1) return segments;
  
  // 按开始时间排序
  const sorted = [...segments].sort((a, b) => a.startTime - b.startTime);
  const merged: VideoSegment[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    if (current.startTime <= last.endTime) {
      // 重叠，合并
      last.endTime = Math.max(last.endTime, current.endTime);
      last.duration = calculateDuration(last.startTime, last.endTime);
    } else {
      merged.push(current);
    }
  }
  
  return merged;
}

/**
 * 片段排序
 */
export function sortSegments(
  segments: VideoSegment[],
  by: 'startTime' | 'endTime' | 'duration' = 'startTime'
): VideoSegment[] {
  return [...segments].sort((a, b) => {
    switch (by) {
      case 'startTime':
        return a.startTime - b.startTime;
      case 'endTime':
        return a.endTime - b.endTime;
      case 'duration':
        return a.duration - b.duration;
      default:
        return 0;
    }
  });
}

/**
 * 过滤片段范围
 */
export function filterSegmentsInRange(
  segments: VideoSegment[],
  start: number,
  end: number
): VideoSegment[] {
  return segments.filter(
    seg => seg.startTime < end && seg.endTime > start
  );
}

/**
 * 截取片段
 */
export function sliceSegment(
  segment: VideoSegment,
  start: number,
  end: number
): VideoSegment {
  const newStart = Math.max(segment.startTime, start);
  const newEnd = Math.min(segment.endTime, end);
  
  return {
    ...segment,
    startTime: newStart,
    endTime: newEnd,
    duration: calculateDuration(newStart, newEnd),
  };
}

/**
 * 移动片段
 */
export function moveSegment(
  segment: VideoSegment,
  offset: number
): VideoSegment {
  return {
    ...segment,
    startTime: Math.max(0, segment.startTime + offset),
    endTime: segment.endTime + offset,
  };
}

/**
 * 缩放片段
 */
export function scaleSegment(
  segment: VideoSegment,
  scale: number,
  anchor: 'start' | 'center' | 'end' = 'start'
): VideoSegment {
  const duration = segment.duration * scale;
  let newStart = segment.startTime;
  
  switch (anchor) {
    case 'center':
      newStart = segment.startTime - (duration - segment.duration) / 2;
      break;
    case 'end':
      newStart = segment.startTime - (duration - segment.duration);
      break;
  }
  
  return {
    ...segment,
    startTime: Math.max(0, newStart),
    endTime: Math.max(0, newStart + duration),
    duration,
  };
}

/**
 * 验证片段数据
 */
export function validateSegment(segment: VideoSegment): string[] {
  const errors: string[] = [];
  
  if (segment.startTime < 0) {
    errors.push('开始时间不能为负');
  }
  
  if (segment.endTime <= segment.startTime) {
    errors.push('结束时间必须大于开始时间');
  }
  
  if (segment.duration <= 0) {
    errors.push('时长必须大于0');
  }
  
  return errors;
}
