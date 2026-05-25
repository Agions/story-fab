/**
 * VideoProcessingController Types
 * Shared types for the VideoProcessingController module
 */

export interface BatchItem {
  id: string;
  /** 视频文件路径（支持多视频导入） */
  videoPath: string;
  segments: Array<{ start: number; end: number; type?: string; content?: string; duration?: number }>;
  name: string;
  completed: boolean;
}

export interface CustomQualitySettings {
  resolution: string;
  bitrate: number;
  framerate: number;
  useHardwareAcceleration: boolean;
}

export interface VideoProcessingControllerProps {
  videoPath: string;
  segments: Array<{ start: number; end: number; type?: string; content?: string }>;
  onProcessingComplete?: (outputPath: string) => void;
  defaultQuality?: string;
  defaultFormat?: string;
  defaultTransition?: string;
  defaultAudioProcess?: string;
}
