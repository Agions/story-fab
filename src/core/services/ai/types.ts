/**
 * AI Services Shared Types
 * Consolidated from vision.service.ts, useVideo.ts, and aiClip/types.ts
 */

// ============================================
// Shared Task Status
// ============================================

export interface TaskStatusInfo {
  id?: string;
  type?: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  error?: string;
}

// ============================================
// Vision Service Shared Types
// ============================================

export interface SceneType {
  id: string;
  name: string;
  keywords: string[];
  description: string;
}

export interface SceneFeatureSet {
  brightness: number;
  motion: number;
  complexity: number;
  dominantColors: string[];
  hasText: boolean;
  hasFaces: boolean;
  tags: string[];
}

export interface EmotionDimension {
  id: string;
  name: string;
  score: number;
}

// Predefined scene types
export const SCENE_TYPES: SceneType[] = [
  {
    id: 'intro',
    name: '开场',
    keywords: ['开场', '片头', '介绍', '欢迎'],
    description: '视频开头部分，通常包含标题或介绍'
  },
  {
    id: 'product',
    name: '产品展示',
    keywords: ['产品', '展示', '特写', '细节'],
    description: '产品或物体的详细展示'
  },
  {
    id: 'demo',
    name: '演示',
    keywords: ['演示', '操作', '步骤', '教程'],
    description: '操作演示或教程步骤'
  },
  {
    id: 'interview',
    name: '访谈',
    keywords: ['访谈', '对话', '人物', '讲述'],
    description: '人物访谈或对话场景'
  },
  {
    id: 'landscape',
    name: '风景',
    keywords: ['风景', '外景', '自然', '环境'],
    description: '自然风光或环境展示'
  },
  {
    id: 'action',
    name: '动作',
    keywords: ['动作', '运动', '动态', '快节奏'],
    description: '动作或运动场景'
  },
  {
    id: 'emotion',
    name: '情感',
    keywords: ['情感', '表情', '反应', '情绪'],
    description: '表达情感或情绪的场景'
  },
  {
    id: 'text',
    name: '文字',
    keywords: ['文字', '字幕', '标题', '说明'],
    description: '包含重要文字信息的场景'
  }
];

// Emotion analysis dimensions
export const EMOTION_DIMENSIONS: EmotionDimension[] = [
  { id: 'positive', name: '积极', score: 0 },
  { id: 'negative', name: '消极', score: 0 },
  { id: 'neutral', name: '中性', score: 0 },
  { id: 'excited', name: '兴奋', score: 0 },
  { id: 'calm', name: '平静', score: 0 }
];

// Object detection categories
export const OBJECT_CATEGORIES = [
  '人物', '产品', '文字', '建筑', '自然', '车辆', '动物', '食物', '工具', '电子设备'
];
