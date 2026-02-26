// ============================================
// 用户类型
// ============================================
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// ============================================
// 项目类型
// ============================================
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'processing' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 编辑器类型
// ============================================
export interface VideoData {
  id: string;
  url: string;
  duration: number;
}

export interface ScriptData {
  id: string;
  content: string;
}

export interface VoiceData {
  id: string;
  url: string;
}

export type EditorPanel = 'video' | 'script' | 'subtitle' | 'voice';
