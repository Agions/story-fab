import { useEffect, useCallback } from 'react';

export interface UseVideoKeyboardShortcutsOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onTogglePlay: () => void;
  onToggleFullscreen: () => void;
  onSeek: (seconds: number) => void;
  onVolumeChange: (delta: number) => void;
  onToggleMute: () => void;
  disabled?: boolean;
}

const SEEK_STEP = 5;   // seconds for arrow keys
const SEEK_LONG = 10;  // seconds for J/L keys
const VOLUME_STEP = 0.1;

export function useVideoKeyboardShortcuts({
  videoRef,
  onTogglePlay,
  onToggleFullscreen,
  onSeek,
  onVolumeChange,
  onToggleMute,
  disabled = false,
}: UseVideoKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      // Skip if focus is inside an input/textarea/contenteditable
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
      }

      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          onTogglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onSeek(-SEEK_STEP);
          break;
        case 'ArrowRight':
          e.preventDefault();
          onSeek(SEEK_STEP);
          break;
        case 'j':
        case 'J':
          e.preventDefault();
          onSeek(-SEEK_LONG);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          onSeek(SEEK_LONG);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          onToggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          onToggleFullscreen();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onVolumeChange(VOLUME_STEP);
          break;
        case 'ArrowDown':
          e.preventDefault();
          onVolumeChange(-VOLUME_STEP);
          break;
        default:
          break;
      }
    },
    [disabled, onTogglePlay, onToggleFullscreen, onSeek, onVolumeChange, onToggleMute, videoRef],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
