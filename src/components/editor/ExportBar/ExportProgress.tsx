/**
 * ExportProgress — 导出进度条
 * shadcn Progress bar
 * Shows: current/total clips, percentage
 * States: idle (hidden), processing (visible), complete (green)
 */
import React, { memo } from 'react';
import { Progress } from '@/components/ui/progress';
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

  return (
    <div className="flex items-center gap-3 w-full max-w-xs">
      {state === 'complete' ? (
        <>
          <CheckCircle2 className="size-4 text-accent-success shrink-0" />
          <span className="text-xs text-accent-success">导出完成</span>
          <Progress
            value={100}
            className="flex-1 h-1.5 [&>div]:bg-accent-success"
          />
        </>
      ) : state === 'error' ? (
        <>
          <span className="text-xs text-accent-danger">导出失败</span>
          <Progress
            value={progress}
            className="flex-1 h-1.5 [&>div]:bg-accent-danger"
          />
        </>
      ) : (
        <>
          <span className="text-xs text-text-secondary shrink-0 whitespace-nowrap">
            {currentClip}/{totalClips} clips
          </span>
          <Progress
            value={progress}
            className="flex-1 h-1.5"
          />
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
