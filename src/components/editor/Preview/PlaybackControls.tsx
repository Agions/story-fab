/**
 * PlaybackControls — 播放控制栏
 * Play/Pause/StepBack/StepForward/Stop
 * Timecode display: "00:00:00:00" in JetBrains Mono
 */
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
    <div className="flex items-center justify-between px-4 h-10 bg-bg-secondary border-t border-border-subtle shrink-0">
      {/* Left: playback buttons */}
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onStop} className="text-text-secondary">
              <Square className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>停止</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onStepBack} className="text-text-secondary">
              <SkipBack className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>上一帧</p></TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onPlayPause}
              className="text-text-primary"
            >
              {isPlaying ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5 ml-0.5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isPlaying ? '暂停 (Space)' : '播放 (Space)'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onStepForward} className="text-text-secondary">
              <SkipForward className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>下一帧</p></TooltipContent>
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={onFullscreen} className="text-text-secondary">
              <Maximize className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top"><p>全屏</p></TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});

PlaybackControls.displayName = 'PlaybackControls';
