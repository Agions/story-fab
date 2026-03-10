/**
 * ClipFlow 核心类型定义
 * 集中管理项目通用类型
 */
import type { ReactNode } from 'react';

// ==================== 项目相关类型 ====================

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

export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

export interface ProjectSettings {
  autoSave: boolean;
  compactMode: boolean;
  theme: 'light' | 'dark' | 'auto';
  projectSaveBehavior: 'stay' | 'detail';
}

// ==================== 视频相关类型 ====================

export interface VideoAsset {
  id: string;
  name: string;
  path: string;
  url?: string;
  duration: number;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface VideoSegment {
  id: string;
  sourceIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  scenes?: Scene[];
  audioPeaks?: AudioPeak[];
}

export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  type: 'action' | 'dialog' | 'landscape' | 'closeup';
  score: number;
}

export interface AudioPeak {
  id: string;
  timestamp: number;
  duration: number;
  score: number;
  type: 'applause' | 'laughter' | 'music' | 'speech';
}

// ==================== 脚本相关类型 ====================

export interface Script {
  id: string;
  segments: ScriptSegment[];
  totalDuration: number;
  language: string;
}

export interface ScriptSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  voice?: string;
}

export interface ScriptMetadata {
  title?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== 音频相关类型 ====================

export interface Voice {
  id: string;
  name: string;
  provider: string;
  model?: string;
  settings?: VoiceSettings;
}

export interface VoiceSettings {
  speed?: number;
  pitch?: number;
  volume?: number;
}

// ==================== 字幕相关类型 ====================

export interface Subtitle {
  id: string;
  entries: SubtitleEntry[];
  language: string;
}

export interface SubtitleEntry {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  language?: string;
  confidence?: number;
}

// ==================== 编辑器相关类型 ====================

export interface EditorTimeline {
  duration: number;
  currentTime: number;
  zoom: number;
  tracks: Track[];
}

export interface Track {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  segments: TrackSegment[];
  muted?: boolean;
  locked?: boolean;
}

export interface TrackSegment {
  id: string;
  startTime: number;
  endTime: number;
  assetId: string;
  effects?: Effect[];
}

export interface Effect {
  id: string;
  type: string;
  params: Record<string, unknown>;
}

export type EditorPanel = 'video' | 'script' | 'subtitle' | 'voice' | 'effect';

// ==================== AI 相关类型 ====================

export type AIFeatureType = 'video-narration' | 'first-person' | 'remix' | 'smart-clip';

export interface AnalysisResult {
  scenes: Scene[];
  keyframes: Keyframe[];
  objects: DetectedObject[];
  emotions: EmotionData[];
  stats: AnalysisStats;
}

export interface Keyframe {
  id: string;
  timestamp: number;
  imageUrl?: string;
  description?: string;
}

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
}

export interface EmotionData {
  timestamp: number;
  emotion: string;
  intensity: number;
}

export interface AnalysisStats {
  totalDuration: number;
  sceneCount: number;
  keyframeCount: number;
  objectCount: number;
}

// ==================== 工作流相关类型 ====================

export interface WorkflowState {
  id: string;
  status: WorkflowStatus;
  progress: number;
  currentStep: string;
  steps: WorkflowStep[];
  result?: WorkflowResult;
}

export type WorkflowStatus = 'idle' | 'running' | 'completed' | 'error' | 'paused';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  duration?: number;
}

export interface WorkflowResult {
  videoId: string;
  videoPath: string;
  duration: number;
  clips: VideoSegment[];
  script?: Script;
  subtitles?: Subtitle;
}

// ==================== 用户相关类型 ====================

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: 'admin' | 'user';
}

// ==================== 通用类型 ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface ModalProps {
  open: boolean;
  title?: string;
  content?: ReactNode;
  onClose?: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  width?: number | string;
  footer?: ReactNode;
}
