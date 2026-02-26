import type {
  VideoClip,
  VideoTrack,
  AudioTrack,
  TextTrack,
  EffectTrack,
  Timeline,
  ExportSettings,
  VideoSegment,
  ScriptSegment
} from '@/core/types';

// 剪辑配置
export interface EditorConfig {
  maxVideoTracks: number;
  maxAudioTracks: number;
  maxTextTracks: number;
  maxEffectTracks: number;
  previewQuality: 'low' | 'medium' | 'high';
  autoSave: boolean;
  autoSaveInterval: number;
  defaultExportSettings: ExportSettings;
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

// 剪辑操作类型
export type EditorAction =
  | { type: 'ADD_CLIP'; trackId: string; clip: VideoClip; position: number }
  | { type: 'REMOVE_CLIP'; trackId: string; clipId: string }
  | { type: 'MOVE_CLIP'; trackId: string; clipId: string; newPosition: number }
  | { type: 'TRIM_CLIP'; clipId: string; startTime: number; endTime: number }
  | { type: 'SPLIT_CLIP'; clipId: string; splitTime: number }
  | { type: 'ADD_TRANSITION'; fromClipId: string; toClipId: string; type: string; duration: number }
  | { type: 'ADD_EFFECT'; clipId: string; effect: string; params: Record<string, any> }
  | { type: 'ADD_TEXT'; trackId: string; text: any; position: number }
  | { type: 'ADD_AUDIO'; trackId: string; audio: any; position: number }
  | { type: 'ADJUST_SPEED'; clipId: string; speed: number }
  | { type: 'ADJUST_VOLUME'; trackId: string; volume: number }
  | { type: 'UNDO' }
  | { type: 'REDO' };

// 剪辑历史记录
export interface EditorHistory {
  past: Timeline[];
  present: Timeline;
  future: Timeline[];
}
