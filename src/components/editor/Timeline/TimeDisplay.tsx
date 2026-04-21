/**
 * TimeDisplay - 时间显示栏，显示当前时间、总时长及轨道/片段统计
 */
import React, { useMemo } from 'react';
import { formatTime } from './utils';

interface TimeDisplayTrack {
  id: string;
  name: string;
  type: string;
  clips?: TimeDisplayClip[];
}

interface TimeDisplayClip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
}

const TimeDisplay: React.FC<{
  currentTime: number;
  duration: number;
  tracks: TimeDisplayTrack[];
}> = ({ currentTime, duration, tracks }) => {
  const stats = useMemo(() => {
    const trackCount = tracks.length;
    const clipCount = tracks.reduce((sum, t) => sum + (t.clips?.length ?? 0), 0);
    return { trackCount, clipCount };
  }, [tracks]);

  return (
    <div
      className="time-display"
      style={{
        height: 32,
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'monospace',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'var(--primary-color)' }}>
        {formatTime(currentTime)}
      </span>
      <span style={{ color: 'var(--text-tertiary)', margin: '0 8px' }}>/</span>
      <span>{formatTime(duration)}</span>
      <div style={{ flex: 1 }} />
      <span style={{ color: 'var(--text-tertiary)' }}>
        {stats.trackCount} 轨道 | {stats.clipCount} 片段
      </span>
    </div>
  );
};

export default TimeDisplay;