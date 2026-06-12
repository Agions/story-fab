/**
 * 播放控制 Hook
 * 职责：编辑器播放、暂停、跳转和速率控制
 *
 * 重构说明：
 * - 从原 useEditorState.ts (451行) 中提取播放控制逻辑
 * - 职责单一：只负责播放状态管理
 * - 与播放帧动画逻辑解耦
 */

import { useCallback, useRef } from 'react';
import { logger } from '../shared/utils/logging';

// ============================================
// Hook 参数
// ============================================

export interface UsePlaybackControlParams {
  /** 当前时间线 */
  timeline: { duration: number } | null;
  /** 是否正在播放 */
  isPlaying: boolean;
  /** 当前播放时间 */
  currentTime: number;
  /** 状态更新回调 */
  onStateChange: (updates: {
    isPlaying?: boolean;
    currentTime?: number;
  }) => void;
}

// ============================================
// 播放控制 Hook
// ============================================

/**
 * 播放控制 Hook
 * @param params Hook 参数
 * @returns 播放控制方法
 */
export function usePlaybackControl(params: UsePlaybackControlParams) {
  const { timeline, isPlaying, currentTime, onStateChange } = params;

  // 播放状态引用
  const playbackRef = useRef<{
    isPlaying: boolean;
    startTime: number;
    startPosition: number;
    animationFrame: number | null;
  }>({
    isPlaying: false,
    startTime: 0,
    startPosition: 0,
    animationFrame: null,
  });

  /**
   * 开始播放
   */
  const play = useCallback(() => {
    if (!timeline || isPlaying) return;

    // Capture current timeline ref to avoid stale closure in animation loop
    const timelineRef = timeline;

    playbackRef.current = {
      isPlaying: true,
      startTime: performance.now(),
      startPosition: currentTime,
      animationFrame: null,
    };

    const animate = () => {
      const elapsed = (performance.now() - playbackRef.current.startTime) / 1000;
      const newTime = playbackRef.current.startPosition + elapsed;

      // Use captured timelineRef instead of state.timeline to avoid stale closure
      if (newTime >= timelineRef.duration) {
        // 播放结束
        onStateChange({
          isPlaying: false,
          currentTime: timelineRef.duration,
        });
        return;
      }

      onStateChange({ currentTime: newTime });
      playbackRef.current.animationFrame = requestAnimationFrame(animate);
    };

    playbackRef.current.animationFrame = requestAnimationFrame(animate);
    onStateChange({ isPlaying: true });
  }, [timeline, currentTime, isPlaying, onStateChange]);

  /**
   * 暂停播放
   */
  const pause = useCallback(() => {
    if (playbackRef.current.animationFrame) {
      cancelAnimationFrame(playbackRef.current.animationFrame);
    }
    playbackRef.current.isPlaying = false;
    onStateChange({ isPlaying: false });
  }, [onStateChange]);

  /**
   * 跳转到指定时间
   * @param time 目标时间（秒）
   */
  const seek = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, timeline?.duration || 0));
      onStateChange({ currentTime: clampedTime });
    },
    [timeline?.duration, onStateChange]
  );

  /**
   * 设置播放速率
   * @param rate 播放速率
   */
  const setPlaybackRate = useCallback((rate: number) => {
    // 当前实现为占位符，实际应控制视频元素的 playbackRate
    logger.debug('[Editor] 设置播放速度', { rate });
  }, []);

  /**
   * 清理资源（卸载时调用）
   */
  const cleanup = useCallback(() => {
    if (playbackRef.current.animationFrame) {
      cancelAnimationFrame(playbackRef.current.animationFrame);
    }
  }, []);

  return {
    play,
    pause,
    seek,
    setPlaybackRate,
    cleanup,
  };
}
