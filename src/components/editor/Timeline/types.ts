/**
 * Timeline 类型定义
 */

// Track types
export type TrackType = 'video' | 'audio' | 'subtitle' | 'effect';

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  clips: Clip[];
  isMuted: boolean;
  isLocked: boolean;
  isVisible: boolean;
  volume?: number;
}

// Clip types
export interface Clip {
  id: string;
  trackId: string;
  name: string;
  startTime: number;
  endTime: number;
  sourceStart: number;
  sourceEnd: number;
  duration: number;
  color: string;
  keyframes: Keyframe[];
  transitions: {
    in?: Transition;
    out?: Transition;
  };
  properties: ClipProperties;
}

export interface ClipProperties {
  scale: number;
  rotation: number;
  opacity: number;
  x: number;
  y: number;
}

export interface Keyframe {
  id: string;
  time: number;
  properties: {
    scale?: number;
    rotation?: number;
    opacity?: number;
    x?: number;
    y?: number;
  };
}

export interface Transition {
  type: 'fade' | 'dissolve' | 'wipe' | 'slide';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

// Timeline props
export interface TimelineProps {
  currentTime: number;
  duration: number;
  tracks: Track[];
  onTimeUpdate: (time: number) => void;
  onTrackUpdate?: (tracks: Track[]) => void;
  onClipSelect?: (clip: Clip | null) => void;
  onClipUpdate?: (clip: Clip) => void;
}
