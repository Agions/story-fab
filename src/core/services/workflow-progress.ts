/**
 * 工作流进度追踪器
 * 用于跟踪工作流执行进度
 */

import { logger } from '@/utils/logger';

export type ProgressCallback = (progress: ProgressInfo) => void;

export interface ProgressInfo {
  step: string;
  progress: number; // 0-100
  message?: string;
  detail?: string;
}

/**
 * 工作流步骤定义
 */
export interface WorkflowStepDefinition {
  id: string;
  name: string;
  estimatedDuration?: number; // 预估时长(秒)
  weight?: number; // 权重，用于计算整体进度
}

/**
 * 步骤权重配置
 */
export const DEFAULT_STEPS: WorkflowStepDefinition[] = [
  { id: 'import', name: '导入视频', weight: 5 },
  { id: 'analysis', name: '视觉分析', weight: 15 },
  { id: 'script', name: '生成脚本', weight: 20 },
  { id: 'audio', name: '语音合成', weight: 20 },
  { id: 'subtitle', name: '字幕生成', weight: 10 },
  { id: 'music', name: '配乐选择', weight: 10 },
  { id: 'timeline', name: '时间线编排', weight: 10 },
  { id: 'render', name: '渲染导出', weight: 10 },
];

/**
 * 工作流进度追踪器
 */
export class WorkflowProgressTracker {
  private steps: WorkflowStepDefinition[];
  private currentStepIndex: number = 0;
  private stepProgress: number = 0;
  private callbacks: ProgressCallback[] = [];
  private startTime: number = 0;
  private paused: boolean = false;

  constructor(steps?: WorkflowStepDefinition[]) {
    this.steps = steps || DEFAULT_STEPS;
  }

  /**
   * 开始追踪
   */
  start(): void {
    this.startTime = Date.now();
    this.currentStepIndex = 0;
    this.stepProgress = 0;
    this.paused = false;
    this.notify();
    logger.info('[WorkflowTracker] 开始追踪', { steps: this.steps.map(s => s.name) });
  }

  /**
   * 设置当前步骤
   */
  setStep(stepId: string): void {
    const index = this.steps.findIndex(s => s.id === stepId);
    if (index !== -1) {
      this.currentStepIndex = index;
      this.stepProgress = 0;
      this.notify();
      logger.info('[WorkflowTracker] 步骤切换', { step: stepId });
    }
  }

  /**
   * 更新步骤进度
   */
  updateStepProgress(progress: number): void {
    this.stepProgress = Math.min(100, Math.max(0, progress));
    this.notify();
  }

  /**
   * 步骤完成
   */
  completeStep(): void {
    this.stepProgress = 100;
    this.notify();
    
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.stepProgress = 0;
    }
  }

  /**
   * 暂停追踪
   */
  pause(): void {
    this.paused = true;
    logger.info('[WorkflowTracker] 暂停');
  }

  /**
   * 恢复追踪
   */
  resume(): void {
    this.paused = false;
    this.notify();
    logger.info('[WorkflowTracker] 恢复');
  }

  /**
   * 获取当前进度
   */
  getProgress(): ProgressInfo {
    const totalWeight = this.steps.reduce((sum, s) => sum + (s.weight || 0), 0);
    
    let completedWeight = 0;
    for (let i = 0; i < this.currentStepIndex; i++) {
      completedWeight += this.steps[i].weight || 0;
    }
    
    const currentStepWeight = this.steps[this.currentStepIndex]?.weight || 0;
    const currentProgress = (this.stepProgress / 100) * currentStepWeight;
    
    const totalProgress = Math.round(((completedWeight + currentProgress) / totalWeight) * 100);
    
    return {
      step: this.steps[this.currentStepIndex]?.name || '未知',
      progress: totalProgress,
      message: this.getStepMessage(),
      detail: `${this.currentStepIndex + 1}/${this.steps.length}`,
    };
  }

  /**
   * 获取步骤消息
   */
  private getStepMessage(): string {
    const step = this.steps[this.currentStepIndex];
    if (!step) return '';
    
    const progress = this.stepProgress;
    if (progress < 30) return `正在开始${step.name}...`;
    if (progress < 70) return `正在进行${step.name}...`;
    return `即将完成${step.name}...`;
  }

  /**
   * 注册进度回调
   */
  onProgress(callback: ProgressCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 通知所有回调
   */
  private notify(): void {
    if (this.paused) return;
    
    const progress = this.getProgress();
    this.callbacks.forEach(cb => cb(progress));
  }

  /**
   * 重置追踪器
   */
  reset(): void {
    this.currentStepIndex = 0;
    this.stepProgress = 0;
    this.startTime = 0;
    this.paused = false;
    this.notify();
  }

  /**
   * 销毁追踪器
   */
  destroy(): void {
    this.callbacks = [];
    this.reset();
  }

  /**
   * 获取预估剩余时间(秒)
   */
  getEstimatedTimeRemaining(): number {
    const progress = this.getProgress();
    if (progress.progress >= 100) return 0;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    const estimated = (elapsed / progress.progress) * (100 - progress.progress);
    
    return Math.round(estimated);
  }
}
