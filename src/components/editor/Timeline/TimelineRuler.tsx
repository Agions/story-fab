/**
 * TimelineRuler — 时间刻度尺组件
 * 显示时间码标记 (00:00:00 格式)，JetBrains Mono 字体
 * 1px 刻度线每秒，更长刻度每分钟
 */
import React, { memo, useMemo } from 'react';

interface TimelineRulerProps {
  duration: number;      // 总时长 (秒)
  pixelsPerSecond: number;
  scrollX: number;      // 水平滚动偏移 (像素)
  width: number;        // 可视区域宽度
}

function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const TimelineRuler = memo<TimelineRulerProps>(({
  duration,
  pixelsPerSecond,
  scrollX,
  width,
}) => {
  const ticks = useMemo(() => {
    const result: { x: number; major: boolean; label: string }[] = [];
    const totalSeconds = Math.max(duration, 60);

    // 计算可见范围
    const visibleStartSec = scrollX / pixelsPerSecond;
    const visibleEndSec = visibleStartSec + width / pixelsPerSecond;

    // 计算刻度间隔
    let majorInterval = 10; // 秒
    if (pixelsPerSecond < 5) majorInterval = 60;
    else if (pixelsPerSecond < 15) majorInterval = 30;
    else if (pixelsPerSecond < 30) majorInterval = 10;
    else if (pixelsPerSecond < 60) majorInterval = 5;
    else majorInterval = 1;

    const minorDivisions = 4;
    const minorInterval = majorInterval / minorDivisions;

    const startSec = Math.floor(visibleStartSec / minorInterval) * minorInterval;
    const endSec = Math.ceil(visibleEndSec / minorInterval) * minorInterval;

    for (let sec = startSec; sec <= endSec; sec += minorInterval) {
      if (sec < 0) continue;
      const x = sec * pixelsPerSecond - scrollX;
      const major = Math.abs(sec % majorInterval) < 0.001;
      result.push({
        x,
        major,
        label: major ? formatTimecode(sec) : '',
      });
    }

    return result;
  }, [duration, pixelsPerSecond, scrollX, width]);

  return (
    <div
      className="relative h-8 bg-bg-secondary border-b border-border-subtle select-none overflow-hidden"
      style={{ width }}
    >
      {ticks.map(({ x, major, label }, i) => (
        <div
          key={i}
          className="absolute top-0"
          style={{ left: x }}
        >
          <div
            className={`w-px ${major ? 'h-4 bg-text-secondary' : 'h-2 bg-border-subtle'}`}
          />
          {major && label && (
            <span
              className="absolute top-4 left-1 text-[10px] font-mono text-text-secondary whitespace-nowrap"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
});

TimelineRuler.displayName = 'TimelineRuler';
