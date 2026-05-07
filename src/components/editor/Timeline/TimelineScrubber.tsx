/**
 * TimelineScrubber — 播放头 (橙色竖线)
 * 位置 = currentTime * pixelsPerSecond
 * 颜色: --accent-primary (#f97316)
 * 2px 宽，高度覆盖整个时间线区域
 */
import React, { memo, useRef, useEffect } from 'react';

interface TimelineScrubberProps {
  currentTime: number;      // 秒
  pixelsPerSecond: number;
  scrollX: number;
  totalHeight: number;      // 总轨道高度
  onSeek: (time: number) => void;
}

export const TimelineScrubber = memo<TimelineScrubberProps>(({
  currentTime,
  pixelsPerSecond,
  scrollX,
  totalHeight,
  onSeek,
}) => {
  const position = currentTime * pixelsPerSecond - scrollX;

  const moveRef = useRef<((moveEvent: PointerEvent) => void) | null>(null);
  const upRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (moveRef.current) document.removeEventListener('pointermove', moveRef.current);
      if (upRef.current) document.removeEventListener('pointerup', upRef.current);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    const container = e.currentTarget.closest('[data-timeline-tracks]') as HTMLElement | null;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    moveRef.current = (moveEvent: PointerEvent) => {
      const x = moveEvent.clientX - rect.left + scrollX;
      const time = Math.max(0, x / pixelsPerSecond);
      onSeek(time);
    };

    upRef.current = () => {
      if (moveRef.current) document.removeEventListener('pointermove', moveRef.current);
      if (upRef.current) document.removeEventListener('pointerup', upRef.current);
      moveRef.current = null;
      upRef.current = null;
    };

    document.addEventListener('pointermove', moveRef.current);
    document.addEventListener('pointerup', upRef.current);
  };

  return (
    <div
      className="absolute top-0 pointer-events-auto cursor-ew-resize z-20"
      style={{
        left: position,
        width: 16,
        height: totalHeight,
        transform: 'translateX(-50%)',
      }}
      onPointerDown={onPointerDown}
    >
      {/* Scrubber line */}
      <div
        className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
        style={{
          backgroundColor: 'var(--accent-primary, #f97316)',
          boxShadow: '0 0 8px var(--accent-primary, #f97316)',
        }}
      />
      {/* Scrubber head (triangle) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0"
        style={{
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `8px solid var(--accent-primary, #f97316)`,
        }}
      />
    </div>
  );
});

TimelineScrubber.displayName = 'TimelineScrubber';
