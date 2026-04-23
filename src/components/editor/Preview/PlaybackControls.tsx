/**
 * PlaybackControls — 播放控制栏
 * Play/Pause/StepBack/StepForward/Stop
 * Timecode display: "00:00:00:00" in JetBrains Mono
 */
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Maximize,
} from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onStop: () => void;
  onFullscreen?: () => void;
}

function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 30);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
}

export const PlaybackControls = memo<PlaybackControlsProps>(({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onStepBack,
  onStepForward,
  onStop,
  onFullscreen,
}) => {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-4 h-10 bg-bg-secondary border-t border-border-subtle shrink-0">
        {/* Left: playback buttons */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-accent transition-colors" onClick={onStop}>
              <Square className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">停止</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-accent transition-colors" onClick={onStepBack}>
              <SkipBack className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">上一帧</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-primary hover:bg-accent transition-colors" onClick={onPlayPause}>
              {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            </TooltipTrigger>
            <TooltipContent side="top">
              {isPlaying ? '暂停 (Space)' : '播放 (Space)'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-accent transition-colors" onClick={onStepForward}>
              <SkipForward className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent side="top">下一帧</TooltipContent>
          </Tooltip>
        </div>

        {/* Center: timecode */}
        <div
          className="text-xs text-text-secondary"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          <span className="text-accent-primary">{formatTimecode(currentTime)}</span>
          <span className="mx-1 text-text-disabled">/</span>
          <span>{formatTimecode(duration)}</span>
        </div>

        {/* Right: fullscreen */}
        <div className="flex items-center gap-1">
          {onFullscreen && (
            <Tooltip>
              <TooltipTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-secondary hover:text-text-primary hover:bg-accent transition-colors" onClick={onFullscreen}>
                <Maximize className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="top">全屏</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
});

PlaybackControls.displayName = 'PlaybackControls';
