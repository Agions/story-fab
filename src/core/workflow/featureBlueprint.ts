import type { WorkflowStep } from '@/core/types';

/**
 * 工作流模式定义
 * 支持三种AI创作模式
 */
export type WorkflowMode = 'ai-commentary' | 'ai-mixclip' | 'ai-first-person' | 'ai-repurposing';

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
