/**
 * PreviewPanel — 视频预览区
 * 16:9 比例居中，Professional dark tool aesthetic
 * Background: #09090B (bg-primary / zinc-950)
 */
import React, { memo } from 'react';

interface PreviewPanelProps {
  videoSrc?: string;
  poster?: string;
  isPlaying?: boolean;
  onFullscreen?: () => void;
}

export const PreviewPanel = memo<PreviewPanelProps>(({ videoSrc, poster }) => {
  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#09090B', aspectRatio: '16/9', maxHeight: '100%' }}
    >
      {videoSrc ? (
        <video
          src={videoSrc}
          poster={poster}
          className="max-w-full max-h-full object-contain"
          controls={false}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2" style={{ color: '#52525b' }}>
          {/* Play icon placeholder */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            className="opacity-20"
          >
            <rect x="8" y="16" width="48" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
            <polygon points="26,24 42,32 26,40" fill="currentColor" opacity="0.5" />
          </svg>
          <span className="text-sm" style={{ color: '#52525b' }}>预览画面</span>
        </div>
      )}
    </div>
  );
});

PreviewPanel.displayName = 'PreviewPanel';
