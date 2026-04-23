/**
 * TimelineToolbar — 时间线工具栏
 * 缩放控制 + 播放/暂停按钮
 */
import React, { memo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

interface TimelineToolbarProps {
  zoomPercent: number;
  isPlaying: boolean;
  currentTimecode: string;
  totalTimecode: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitAll: () => void;
  onPlayPause: () => void;
}

export const TimelineToolbar = memo<TimelineToolbarProps>(({
  zoomPercent,
  isPlaying,
  currentTimecode,
  totalTimecode,
  onZoomIn,
  onZoomOut,
  onFitAll,
  onPlayPause,
}) => {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-3 h-10 bg-bg-secondary border-b border-border-subtle shrink-0">
        {/* Left: Play controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg-secondary text-text-primary hover:bg-accent transition-colors"
              onClick={onPlayPause}
            >
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isPlaying ? '暂停 (Space)' : '播放 (Space)'}
            </TooltipContent>
          </Tooltip>

          {/* Timecode display */}
          <div className="flex items-center gap-2 ml-2 font-mono text-xs">
            <span className="text-accent-primary font-semibold" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {currentTimecode}
            </span>
            <span className="text-text-disabled">/</span>
            <span className="text-text-secondary" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {totalTimecode}
            </span>
          </div>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-accent transition-colors"
              onClick={onZoomOut}
            >
              <ZoomOut className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">缩小</TooltipContent>
          </Tooltip>

          <span
            className="text-[11px] text-text-secondary min-w-[44px] text-center"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {zoomPercent}%
          </span>

          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-accent transition-colors"
              onClick={onZoomIn}
            >
              <ZoomIn className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">放大</TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-border-subtle mx-1" />

          <Tooltip>
            <TooltipTrigger
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-accent transition-colors"
              onClick={onFitAll}
            >
              <Maximize2 className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="bottom">适应全部</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
});

TimelineToolbar.displayName = 'TimelineToolbar';
