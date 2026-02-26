import type {
  VideoInfo,
  VideoAnalysis,
  ScriptData,
  ScriptTemplate,
  ExportSettings,
  AIModel,
  Scene,
} from '@/core/types';

// 工作流步骤
export type WorkflowStep =
  | 'upload'
  | 'analyze'
  | 'template-select'
  | 'script-generate'
  | 'script-dedup'
  | 'script-edit'
  | 'timeline-edit'
  | 'preview'
  | 'export';

// 时间轴数据
export interface TimelineData {
  tracks: Array<{
    id: string;
    type: 'video' | 'audio' | 'subtitle';
    clips: Array<{
      id: string;
      startTime: number;
      endTime: number;
      sourceStart: number;
      sourceEnd: number;
      sourceId: string;
      scriptSegmentId?: string;
      transition?: string;
    }>;
  }>;
  duration: number;
}

// 工作流数据
export interface WorkflowData {
  projectId?: string;
  videoInfo?: VideoInfo;
  videoAnalysis?: VideoAnalysis;
  selectedTemplate?: ScriptTemplate;
  generatedScript?: ScriptData;
  dedupedScript?: ScriptData;
  uniqueScript?: ScriptData;
  editedScript?: ScriptData;
  timeline?: TimelineData;
  exportSettings?: ExportSettings;
  originalityReport?: {
    score: number;
    duplicates: any[];
    suggestions: string[];
  };
  uniquenessReport?: {
    fingerprint: any;
    check: {
      isUnique: boolean;
      similarity: number;
      suggestions: string[];
    };
    history: {
      totalScripts: number;
      recentScripts: number;
    };
  };
}

// 工作流状态
export interface WorkflowState {
  step: WorkflowStep;
  progress: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  error?: string;
  data: WorkflowData;
}

// 工作流配置
export interface WorkflowConfig {
  autoAnalyze: boolean;
  autoGenerateScript: boolean;
  autoDedup: boolean;
  enforceUniqueness: boolean;
  preferredTemplate?: string;
  model: AIModel;
  scriptParams: {
    style: string;
    tone: string;
    length: 'short' | 'medium' | 'long';
    targetAudience: string;
    language: string;
  };
  dedupConfig?: {
    enabled: boolean;
    autoFix: boolean;
    threshold: number;
    autoVariant?: boolean;
    variantIntensity?: number;
  };
  uniquenessConfig?: {
    enabled: boolean;
    autoRewrite: boolean;
    similarityThreshold: number;
    addRandomness: boolean;
  };
  aiClipConfig?: {
    enabled: boolean;
    autoClip: boolean;
    detectSceneChange: boolean;
    detectSilence: boolean;
    removeSilence: boolean;
    targetDuration?: number;
    pacingStyle: 'fast' | 'normal' | 'slow';
  };
}

// 工作流事件回调
export interface WorkflowCallbacks {
  onStepChange?: (step: WorkflowStep, prevStep: WorkflowStep) => void;
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: WorkflowState['status']) => void;
  onError?: (error: string) => void;
  onComplete?: (result: WorkflowData) => void;
}

// 步骤进度映射
export const STEP_PROGRESS: Record<WorkflowStep, number> = {
  upload: 0,
  analyze: 20,
  'template-select': 35,
  'script-generate': 40,
  'script-dedup': 50,
  'script-edit': 60,
  'timeline-edit': 70,
  preview: 90,
  export: 95,
};
