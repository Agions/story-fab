import type { WorkflowStep } from '@/core/types';

export type WorkflowMode = 'ai-commentary' | 'ai-mixclip' | 'ai-first-person';

export interface WorkflowModeDefinition {
  id: WorkflowMode;
  label: string;
  description: string;
  steps: Array<WorkflowStep | 'ai-clip'>;
  autoOriginalOverlayDefault: boolean;
  syncTarget: 'strict' | 'balanced';
  autonomy: 'full-auto' | 'auto-with-review';
}

export const WORKFLOW_MODE_DEFINITIONS: Record<WorkflowMode, WorkflowModeDefinition> = {
  'ai-commentary': {
    id: 'ai-commentary',
    label: 'AI 解说',
    description: '以单素材或少量素材生成精准匹配解说，强调镜头与话术同步。',
    steps: [
      'upload',
      'analyze',
      'template-select',
      'script-generate',
      'script-dedup',
      'script-edit',
      'timeline-edit',
      'preview',
      'export',
    ],
    autoOriginalOverlayDefault: true,
    syncTarget: 'strict',
    autonomy: 'auto-with-review',
  },
  'ai-mixclip': {
    id: 'ai-mixclip',
    label: 'AI 混剪',
    description: '多素材智能选段并自动补旁白，强调节奏和可看性。',
    steps: [
      'upload',
      'analyze',
      'template-select',
      'script-generate',
      'script-dedup',
      'ai-clip',
      'timeline-edit',
      'preview',
      'export',
    ],
    autoOriginalOverlayDefault: true,
    syncTarget: 'balanced',
    autonomy: 'full-auto',
  },
  'ai-first-person': {
    id: 'ai-first-person',
    label: 'AI 第一人称解说',
    description: '用第一人称口吻叙述，侧重代入感和镜头主观连贯。',
    steps: [
      'upload',
      'analyze',
      'template-select',
      'script-generate',
      'script-dedup',
      'script-edit',
      'ai-clip',
      'timeline-edit',
      'preview',
      'export',
    ],
    autoOriginalOverlayDefault: true,
    syncTarget: 'strict',
    autonomy: 'auto-with-review',
  },
};

export const DEFAULT_WORKFLOW_MODE: WorkflowMode = 'ai-commentary';
