// Re-export canonical types from core/types
export type { VideoSegment, ScriptSegment } from '@/core/types';

export interface VideoClip {
  id: string;
  sourceId?: string;
  sourceStart?: number;
  sourceEnd?: number;
  startTime: number;
  endTime: number;
  speed?: number;
  effects?: Array<{ type: string; params: Record<string, unknown> }>;
}

export interface AudioClip {
  id: string;
  sourceId?: string;
  startTime: number;
  endTime: number;
  duration?: number;
}

export interface TextItem {
  id: string;
  content: string;
  startTime: number;
  endTime: number;
  duration?: number;
  style?: Record<string, unknown>;
}

export interface Transition {
  id: string;
  fromClipId: string;
  toClipId: string;
  type: string;
  duration: number;
}

export interface VideoTrack {
  id: string;
  name: string;
  clips: VideoClip[];
  transitions?: Transition[];
  visible: boolean;
  locked: boolean;
}

export interface AudioTrack {
  id: string;
  name: string;
  clips: AudioClip[];
  visible: boolean;
  locked: boolean;
  volume: number;
}

export interface TextTrack {
  id: string;
  name: string;
  items: TextItem[];
  visible: boolean;
  locked: boolean;
}

export interface EffectTrack {
  id: string;
  name: string;
  effects: Array<Record<string, unknown>>;
  visible: boolean;
  locked: boolean;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label?: string;
}

export interface Timeline {
  id: string;
  duration: number;
  videoTracks: VideoTrack[];
  audioTracks: AudioTrack[];
  textTracks: TextTrack[];
  effectTracks: EffectTrack[];
  markers: TimelineMarker[];
  createdAt: string;
  updatedAt: string;
}

export interface EditorExportSettings {
  format: 'mp4' | 'mov' | 'webm' | 'mkv';
  resolution: '720p' | '1080p' | '2k' | '4k';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  fps: number;
  bitrate: string;
}

export interface EditorConfig {
  maxVideoTracks: number;
  maxAudioTracks: number;
  maxTextTracks: number;
  maxEffectTracks: number;
  previewQuality: 'low' | 'medium' | 'high';
  autoSave: boolean;
  autoSaveInterval: number;
  defaultExportSettings: EditorExportSettings;
}

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  maxVideoTracks: 4,
  maxAudioTracks: 4,
  maxTextTracks: 2,
  maxEffectTracks: 2,
  previewQuality: 'medium',
  autoSave: true,
  autoSaveInterval: 30,
  defaultExportSettings: {
    format: 'mp4',
    resolution: '1080p',
    quality: 'high',
    fps: 30,
    bitrate: '8M'
  }
};

export type EditorAction =
  | { type: 'ADD_CLIP'; trackId: string; clip: VideoClip; position: number }
  | { type: 'REMOVE_CLIP'; trackId: string; clipId: string }
  | { type: 'MOVE_CLIP'; trackId: string; clipId: string; newPosition: number }
  | { type: 'TRIM_CLIP'; clipId: string; startTime: number; endTime: number }
  | { type: 'SPLIT_CLIP'; clipId: string; splitTime: number }
  | { type: 'ADD_TRANSITION'; fromClipId: string; toClipId: string; transitionType: string; duration: number }
  | { type: 'ADD_EFFECT'; clipId: string; effect: string; params: Record<string, unknown> }
  | { type: 'ADD_TEXT'; trackId: string; text: TextItem; position: number }
  | { type: 'ADD_AUDIO'; trackId: string; audio: AudioClip; position: number }
  | { type: 'ADJUST_SPEED'; clipId: string; speed: number }
  | { type: 'ADJUST_VOLUME'; trackId: string; volume: number }
  | { type: 'COPY_CLIP'; clipId: string }
  | { type: 'UNDO' }
  | { type: 'REDO' };

export interface EditorHistory {
  past: Timeline[];
  present: Timeline;
  future: Timeline[];
}
