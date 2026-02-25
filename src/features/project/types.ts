/**
 * Project Types - 项目类型定义
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  status: ProjectStatus;
  videos: string[];
  scripts: string[];
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface ProjectSettings {
  resolution: string;
  frameRate: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  outputFormat: string;
  template?: string;
}

export interface ProjectFormData {
  name: string;
  description?: string;
  template?: string;
  resolution?: string;
  frameRate?: number;
}
