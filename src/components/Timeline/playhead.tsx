import React, { memo, useRef, useEffect } from 'react';
import { clamp } from '@/shared/utils';
import styles from '@/components/Timeline/Timeline.module.less';

interface PlayheadProps {
  playheadMs: number;
  zoom: number;
  scrollX: number;
  height: number;
  onSeek: (ms: number) => void;
}

export const Playhead = memo<PlayheadProps>(({ playheadMs, zoom, scrollX, height, onSeek }) => {
  const msPerPixel = 1000 / zoom;
  const x = playheadMs / msPerPixel - scrollX;
  const moveRef = useRef<((moveEvent: MouseEvent) => void) | null>(null);
  const upRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount — prevents listener leak if dragged when component unmounts
      if (moveRef.current) document.removeEventListener('mousemove', moveRef.current);
      if (upRef.current) document.removeEventListener('mouseup', upRef.current);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = e.currentTarget.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    moveRef.current = (moveEvent: MouseEvent) => {
      const newX = moveEvent.clientX - rect.left + scrollX;
      const newMs = clamp(newX * msPerPixel, 0, Infinity);
      onSeek(newMs);
    };

    upRef.current = () => {
      if (moveRef.current) document.removeEventListener('mousemove', moveRef.current);
      if (upRef.current) document.removeEventListener('mouseup', upRef.current);
      moveRef.current = null;
      upRef.current = null;
    };

    document.addEventListener('mousemove', moveRef.current);
    document.addEventListener('mouseup', upRef.current);
  };

  return (
    <div
      className={styles.playhead}
      style={{ left: x, height }}
      onMouseDown={onMouseDown}
    >
      <div className={styles.playheadHead} />
      <div className={styles.playheadLine} />
    </div>
  );
});
Playhead.displayName = 'Playhead';
