import type { WorkflowStep } from '@/core/types';

/**
 * 工作流模式定义
 * 支持三种AI创作模式
 */
export type WorkflowMode = 'ai-commentary' | 'ai-mixclip' | 'ai-first-person' | 'ai-repurposing';

/**
 * 工作流模式配置
 */
export interface WorkflowModeDefinition {
  id: WorkflowMode;
  label: string;
  description: string;
  icon: string;
  steps: Array<WorkflowStep | 'ai-clip'>;
  autoOriginalOverlayDefault: boolean;
  syncTarget: 'strict' | 'balanced';
  autonomy: 'full-auto' | 'auto-with-review';
  /** 预估耗时(分钟) */
  estimatedDuration: number;
}

/**
 * 工作流模式定义
 */
export const WORKFLOW_MODE_DEFINITIONS: Record<WorkflowMode, WorkflowModeDefinition> = {
  'ai-commentary': {
    id: 'ai-commentary',
    label: 'AI 解说',
    description: '以单素材或少量素材生成精准匹配解说，强调镜头与话术同步。',
    icon: 'Audio',
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
    estimatedDuration: 15,
  },
  'ai-mixclip': {
    id: 'ai-mixclip',
    label: 'AI 混剪',
    description: '多素材智能选段并自动补旁白，强调节奏和可看性。',
    icon: 'Scissor',
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
    estimatedDuration: 20,
  },
  'ai-first-person': {
    id: 'ai-first-person',
    label: 'AI 第一人称解说',
    description: '用第一人称口吻叙述，侧重代入感和镜头主观连贯。',
    icon: 'User',
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
    estimatedDuration: 18,
  },
  'ai-repurposing': {
    id: 'ai-repurposing',
    label: 'AI 内容复用',
    description: '长视频自动拆条为多个短视频，生成 SEO 元数据，一键多平台发布。',
    icon: 'Share',
    steps: [
      'upload',
      'analyze',
      'ai-clip',
      'preview',
      'export',
    ],
    autoOriginalOverlayDefault: false,
    syncTarget: 'balanced',
    autonomy: 'full-auto',
    estimatedDuration: 10,
  },
};

/**
 * 默认工作流模式
 */
/**
 * 获取工作流模式的简要描述
 */
/**
 * 工作流步骤配置
 */
export interface StepConfig {
  key: WorkflowStep | 'ai-clip';
  title: string;
  description: string;
  icon: string;
  /** 是否可跳过 */
  skippable: boolean;
  /** 是否可并行 */
  parallelable: boolean;
  /** 依赖的前置步骤 */
  dependencies: string[];
}

/**
 * 步骤配置映射
 */
