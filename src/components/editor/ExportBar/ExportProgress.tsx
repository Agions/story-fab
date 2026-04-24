/**
 * ExportProgress — 导出进度条
 * shadcn Progress bar
 * Shows: current/total clips, percentage
 * States: idle (hidden), processing (visible), complete (green)
 */
import React, { memo } from 'react';
import { Progress, ProgressIndicator } from '../../ui/progress';
import { CheckCircle2 } from 'lucide-react';

interface ExportProgressProps {
  state: 'idle' | 'processing' | 'complete' | 'error';
  progress: number;      // 0-100
  currentClip?: number;
  totalClips?: number;
}

export const ExportProgress = memo<ExportProgressProps>(({
  state,
  progress,
  currentClip = 0,
  totalClips = 0,
}) => {
  if (state === 'idle') return null;

  const indicatorClass =
    state === 'complete'
      ? 'bg-accent-success'
      : state === 'error'
        ? 'bg-accent-danger'
        : 'bg-accent-primary';

  return (
    <div className="flex items-center gap-3 w-full max-w-xs">
      {state === 'complete' ? (
        <>
          <CheckCircle2 className="size-4 text-accent-success shrink-0" />
          <span className="text-xs text-accent-success">导出完成</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#27272A' }}>
            <div className="h-full bg-accent-success rounded-full transition-all" style={{ width: '100%' }} />
          </div>
        </>
      ) : state === 'error' ? (
        <>
          <span className="text-xs text-accent-danger">导出失败</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#27272A' }}>
            <div className="h-full bg-accent-danger rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </>
      ) : (
        <>
          <span className="text-xs text-text-secondary shrink-0 whitespace-nowrap">
            {currentClip}/{totalClips} clips
          </span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#27272A' }}>
            <div
              className={`h-full rounded-full transition-all ${indicatorClass}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span
            className="text-[11px] text-text-secondary w-10 text-right"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {Math.round(progress)}%
          </span>
        </>
      )}
    </div>
  );
});

ExportProgress.displayName = 'ExportProgress';
