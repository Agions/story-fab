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
  settings?: Record<string, unknown>;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type { SubtitleStyle } from './subtitle';

// ─── 用户 ───

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: 'admin' | 'user';
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

// ─── Detail-page project type (unified base) ─────────────────────────────────
// Replaces the duplicated base fields previously defined in both:
//   hooks/use-project-detail.reducer.ts  → ProjectDetailProject
//   hooks/use-script-detail.reducer.ts   → ScriptDetailProject
// Each consumer augments with its own `scripts` shape via intersection types.

export interface DetailProject {
  id: string;
  name: string;
  description?: string;
  status?: string;
  createdAt?: string;
  updatedAt: string;
  videoPath?: string;
  videos?: Array<{ path?: string }>;
  videoUrl?: string;
}

// Consumer-specific augmentations (kept narrow — only where actually needed)

export interface DetailProjectWithAIScripts extends DetailProject {
  scripts?: import('@/core/services/ai/script-service').AIScriptDraft[];
}
