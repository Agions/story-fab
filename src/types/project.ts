/**
 * 项目相关类型定义
 * 合并自 core/types.ts + core/types/video-project.ts + shared/types/project.ts
 */

// ─── 项目状态 ───

export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

// ─── 项目模型 ───

export interface Project {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration: number;
  size: number;
  status: ProjectStatus;
  tags: string[];
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  templateId?: string;
  templateName?: string;
  scripts?: import('./script').Script[];
  videoAssets?: import('./media').VideoAsset[];
  videos?: import('./media').VideoInfo[];
  settings?: ProjectSettings;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── 项目设置 ───

export interface ProjectSettings {
  autoSave?: boolean;
  compactMode?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  projectSaveBehavior?: 'stay' | 'detail';
  videoQuality?: 'low' | 'medium' | 'high' | 'ultra';
  outputFormat?: 'mp4' | 'webm' | 'gif';
  resolution?: '720p' | '1080p' | '4k';
  frameRate?: 24 | 30 | 60;
  audioCodec?: string;
  videoCodec?: string;
  subtitleEnabled?: boolean;
  subtitleStyle?: SubtitleStyle;
  includeWatermark?: boolean;
}

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  outline: boolean;
  outlineColor: string;
  position: string;
  alignment: string;
}

// ─── 用户 ───

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: 'admin' | 'user';
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  autoSave?: boolean;
  notifications?: boolean;
  [key: string]: unknown;
}

export interface AppSettings {
  autoSave: boolean;
  defaultAIModel?: import('./analysis').ModelProvider;
  aiModelsSettings: Partial<Record<import('./analysis').ModelProvider, import('./analysis').AIModelSettings>>;
  theme?: 'light' | 'dark' | 'system';
}

// ─── 通用 ───

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
