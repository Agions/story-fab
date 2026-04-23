/**
 * TimecodeDisplay — 时间码显示组件
 * JetBrains Mono 字体，橙色当前时间
 * 格式: HH:MM:SS:FF
 */
import React, { memo } from 'react';

interface TimecodeDisplayProps {
  currentTime: number;  // 秒
  duration: number;     // 秒
}

function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
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
