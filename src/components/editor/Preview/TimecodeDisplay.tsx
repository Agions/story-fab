/**
 * TimecodeDisplay — 时间码显示组件
 * JetBrains Mono 字体，橙色当前时间
 * 格式: HH:MM:SS:FF
 */
import React, { memo } from 'react';
import { formatTimecode } from '@/shared/utils';

interface TimecodeDisplayProps {
  currentTime: number;  // 秒
  duration: number;     // 秒
}

export const TimecodeDisplay = memo<TimecodeDisplayProps>(({ currentTime, duration }) => {
  return (
    <div
      className="text-xs text-text-secondary font-mono tabular-nums"
      style={{ fontFamily: 'JetBrains Mono, monospace' }}
    >
      <span className="text-accent-primary">{formatTimecode(currentTime)}</span>
      <span className="mx-1 text-text-disabled">/</span>
      <span>{formatTimecode(duration)}</span>
    </div>
  );
});

TimecodeDisplay.displayName = 'TimecodeDisplay';
