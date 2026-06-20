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
