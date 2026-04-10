/**
 * 工作流缓存服务
 * 支持步骤结果缓存、断点续传、错误恢复
 */

import { WorkflowData, WorkflowStep } from './types';

export interface WorkflowCache {
  /** 项目ID */
  projectId: string;
  /** 当前步骤 */
  currentStep: WorkflowStep;
  /** 完成状态 */
  completedSteps: WorkflowStep[];
  /** 步骤数据 */
  stepData: Partial<WorkflowData>;
  /** 步骤时间戳 */
  stepTimestamps: Record<WorkflowStep, number>;
  /** 错误记录 */
  errors: Array<{
    step: WorkflowStep;
    message: string;
    timestamp: number;
    recoverable: boolean;
  }>;
  /** 创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  updatedAt: number;
}

export interface WorkflowCheckpoint {
  /** 检查点ID */
  id: string;
  /** 检查点名称 */
  name: string;
  /** 步骤数据快照 */
  data: Partial<WorkflowData>;
  /** 创建时间 */
  createdAt: number;
}

/**
 * 工作流缓存管理器
 */
export class WorkflowCacheManager {
  private cache: Map<string, WorkflowCache> = new Map();
  private checkpoints: Map<string, WorkflowCheckpoint[]> = new Map();
  private readonly MAX_CACHE_SIZE = 10;
  private readonly MAX_CHECKPOINTS = 5;

  /**
   * 创建工作流缓存
   */
  createCache(projectId: string): WorkflowCache {
    const cache: WorkflowCache = {
      projectId,
      currentStep: 'upload',
      completedSteps: [],
      stepData: {},
      stepTimestamps: {} as Record<WorkflowStep, number>,
      errors: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.cache.set(projectId, cache);
    this.cleanup();
    return cache;
  }

  /**
   * 获取缓存
   */
  getCache(projectId: string): WorkflowCache | null {
    return this.cache.get(projectId) || null;
  }

  /**
   * 更新当前步骤
   */
  updateStep(projectId: string, step: WorkflowStep): void {
    const cache = this.getCache(projectId);
    if (!cache) return;

    cache.currentStep = step;
    cache.stepTimestamps[step] = Date.now();
    cache.updatedAt = Date.now();
  }

  /**
   * 标记步骤完成
   */
  completeStep(projectId: string, step: WorkflowStep, data?: Partial<WorkflowData>): void {
    const cache = this.getCache(projectId);
    if (!cache) return;

    if (!cache.completedSteps.includes(step)) {
      cache.completedSteps.push(step);
    }

    if (data) {
      cache.stepData = { ...cache.stepData, ...data };
    }

    cache.updatedAt = Date.now();
  }

  /**
   * 获取步骤数据
   */
  getStepData(projectId: string, step: WorkflowStep): Partial<WorkflowData> | null {
    const cache = this.getCache(projectId);
    return cache?.stepData || null;
  }

  /**
   * 检查步骤是否已完成
   */
  isStepCompleted(projectId: string, step: WorkflowStep): boolean {
    const cache = this.getCache(projectId);
    return cache?.completedSteps.includes(step) || false;
  }

  /**
   * 添加错误记录
   */
  addError(projectId: string, step: WorkflowStep, message: string, recoverable: boolean = true): void {
    const cache = this.getCache(projectId);
    if (!cache) return;

    cache.errors.push({
      step,
      message,
      timestamp: Date.now(),
      recoverable,
    });
    cache.updatedAt = Date.now();
  }

  /**
   * 获取可恢复的错误
   */
  getRecoverableErrors(projectId: string): WorkflowCache['errors'] {
    const cache = this.getCache(projectId);
    return cache?.errors.filter(e => e.recoverable) || [];
  }

  /**
   * 创建检查点
   */
  createCheckpoint(projectId: string, name: string): WorkflowCheckpoint | null {
    const cache = this.getCache(projectId);
    if (!cache) return null;

    const checkpoint: WorkflowCheckpoint = {
      id: `cp_${Date.now()}`,
      name,
      data: structuredClone(cache.stepData),
      createdAt: Date.now(),
    };

    const existing = this.checkpoints.get(projectId) || [];
    existing.push(checkpoint);

    // 限制检查点数量
    if (existing.length > this.MAX_CHECKPOINTS) {
      existing.shift();
    }

    this.checkpoints.set(projectId, existing);
    return checkpoint;
  }

  /**
   * 恢复到检查点
   */
  restoreCheckpoint(projectId: string, checkpointId: string): Partial<WorkflowData> | null {
    const checkpoints = this.checkpoints.get(projectId);
    const checkpoint = checkpoints?.find(cp => cp.id === checkpointId);
    return checkpoint?.data || null;
  }

  /**
   * 获取检查点列表
   */
  getCheckpoints(projectId: string): WorkflowCheckpoint[] {
    return this.checkpoints.get(projectId) || [];
  }

  /**
   * 清除缓存
   */
  clearCache(projectId: string): void {
    this.cache.delete(projectId);
    this.checkpoints.delete(projectId);
  }

  /**
   * 导出缓存数据
   */
  exportCache(projectId: string): string | null {
    const cache = this.getCache(projectId);
    if (!cache) return null;
    return JSON.stringify(cache);
  }

  /**
   * 导入缓存数据
   */
  importCache(projectId: string, data: string): boolean {
    try {
      const cache = JSON.parse(data) as WorkflowCache;
      cache.projectId = projectId;
      cache.updatedAt = Date.now();
      this.cache.set(projectId, cache);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取工作流进度百分比
   */
  getProgress(projectId: string, totalSteps: number): number {
    const cache = this.getCache(projectId);
    if (!cache || totalSteps === 0) return 0;
    return Math.round((cache.completedSteps.length / totalSteps) * 100);
  }

  /**
   * 估算剩余时间(分钟)
   */
  estimateRemainingTime(projectId: string): number {
    const cache = this.getCache(projectId);
    if (!cache) return 0;

    const now = Date.now();
    const completedCount = cache.completedSteps.length;
    
    if (completedCount === 0) return 0;

    // 计算平均每步耗时
    const totalTime = now - cache.createdAt;
    const avgTimePerStep = totalTime / completedCount;
    
    const remainingSteps = 10 - completedCount; // 假设总共10步
    return Math.round((avgTimePerStep * remainingSteps) / 1000 / 60);
  }

  /**
   * 清理旧缓存
   */
  private cleanup(): void {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      // 删除最老的缓存
      let oldestKey: string | null = null;
      let oldestTime = Date.now();

      for (const [key, cache] of this.cache.entries()) {
        if (cache.updatedAt < oldestTime) {
          oldestTime = cache.updatedAt;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.checkpoints.delete(oldestKey);
      }
    }
  }
}

// 导出单例
export const workflowCacheManager = new WorkflowCacheManager();
