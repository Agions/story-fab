/**
 * Editor Store 类型定义
 */

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_SNAP_THRESHOLD_MS = 100;
export const DEFAULT_ZOOM = 1;
export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 10;
export const VOLUME_MIN = 0;
export const VOLUME_MAX = 1;

// =========================================
// Shared types
// =========================================
export interface VideoData {
  id: string;
  url: string;
  duration: number;
}

export interface ScriptData {
  id: string;
  content: string;
}

/** 解说片段数据（可编辑） */
export interface VoiceData {
  id: string;
  url: string;
}

export type EditorPanel = 'video' | 'script' | 'voice' | 'subtitles' | 'settings';

export interface TimelineSelection {
  segmentId?: string;
  multipleIds: string[];
}

// =========================================
// EditorStore full state & actions
// =========================================
interface EditorState {
  video: VideoData | null;
  script: ScriptData | null;
  voice: VoiceData | null;
  activePanel: EditorPanel;
  previewPlaying: boolean;
  currentTime: number;
  volume: number;
  muted: boolean;
  selection: TimelineSelection;
  zoom: number;
  scrollPosition: number;
}

type EditorActions = {
  // Media
  setVideo: (video: VideoData | null) => void;
  setScript: (script: ScriptData | null) => void;
  setVoice: (voice: VoiceData | null) => void;
  setActivePanel: (panel: EditorPanel) => void;
  setPreviewPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  // UI
  setSelection: (selection: Partial<TimelineSelection>) => void;
  clearSelection: () => void;
  setZoom: (zoom: number) => void;
  setScrollPosition: (position: number) => void;
  reset: () => void;
};

export type EditorStore = EditorState & EditorActions;