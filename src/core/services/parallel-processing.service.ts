/**
 * 并行视频处理服务
 * 利用 Web Worker 和多线程加速视频处理
 */

import { logger } from '@/utils/logger';

/**
 * 任务配置
 */
export interface ParallelTask<T, R> {
  id: string;
  input: T;
  processor: (input: T) => Promise<R>;
}

/**
 * 任务结果
 */
export interface TaskResult<R> {
  id: string;
  success: boolean;
  result?: R;
  error?: string;
  duration: number;
}

/**
 * 并行处理选项
 */
export interface ParallelOptions {
  /** 最大并行数 */
  maxParallel: number;
  /** 失败重试次数 */
  retry: number;
  /** 重试延迟 (ms) */
  retryDelay: number;
  /** 进度回调 */
  onProgress?: (completed: number, total: number) => void;
}

/**
 * 并行视频处理服务
 */
export class ParallelProcessingService {
  /**
   * 并行处理多个任务
   */
  async process<T, R>(
    tasks: ParallelTask<T, R>[],
    options: Partial<ParallelOptions> = {}
  ): Promise<TaskResult<R>[]> {
    const {
      maxParallel = 4,
      retry = 2,
      retryDelay = 1000,
      onProgress,
    } = options;

    logger.info('[Parallel] 开始并行处理', { 
      total: tasks.length, 
      maxParallel 
    });

    const results: TaskResult<R>[] = [];
    const executing: Promise<void>[] = [];
    let completed = 0;

    for (const task of tasks) {
      // 等待有空闲槽位
      if (executing.length >= maxParallel) {
        await Promise.race(executing);
      }

      const promise = this.executeTask(task, retry, retryDelay)
        .then(result => {
          results.push(result);
          completed++;
          onProgress?.(completed, tasks.length);
        })
        .catch(error => {
          results.push({
            id: task.id,
            success: false,
            error: error instanceof Error ? error.message : '未知错误',
            duration: 0,
          });
          completed++;
          onProgress?.(completed, tasks.length);
        });

      executing.push(promise);
    }

    // 等待所有任务完成
    await Promise.all(executing);

    logger.info('[Parallel] 并行处理完成', { 
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    });

    return results;
  }

  /**
   * 执行单个任务（带重试）
   */
  private async executeTask<T, R>(
    task: ParallelTask<T, R>,
    retry: number,
    retryDelay: number
  ): Promise<TaskResult<R>> {
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retry; attempt++) {
      try {
        const result = await task.processor(task.input);
        
        return {
          id: task.id,
          success: true,
          result,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('未知错误');
        
        if (attempt < retry) {
          logger.warn(`[Parallel] 任务 ${task.id} 第 ${attempt + 1} 次失败，${retryDelay}ms 后重试`);
          await this.delay(retryDelay);
        }
      }
    }

    return {
      id: task.id,
      success: false,
      error: lastError?.message,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 批量处理视频帧
   */
  async processVideoFrames(
    frames: ArrayBuffer[],
    processor: (frame: ArrayBuffer, index: number) => Promise<ArrayBuffer>,
    options: Partial<ParallelOptions> = {}
  ): Promise<ArrayBuffer[]> {
    const tasks: ParallelTask<ArrayBuffer, ArrayBuffer>[] = frames.map((frame, index) => ({
      id: `frame-${index}`,
      input: frame,
      processor: (input) => processor(input, index),
    }));

    const results = await this.process(tasks, options);
    
    // 按原始顺序返回结果
    const orderedResults: ArrayBuffer[] = new Array(frames.length);
    results.forEach((result, index) => {
      if (result.success && result.result) {
        orderedResults[index] = result.result;
      }
    });

    return orderedResults;
  }

  /**
   * 分片处理大文件
   */
  async processChunks<T, R>(
    data: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    chunkSize: number,
    options: Partial<ParallelOptions> = {}
  ): Promise<R[]> {
    // 分割数据
    const chunks: T[][] = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    const tasks: ParallelTask<T[], R[]>[] = chunks.map((chunk, index) => ({
      id: `chunk-${index}`,
      input: chunk,
      processor: processor,
    }));

    const results = await this.process(tasks, options);
    
    // 合并结果
    const merged: R[] = [];
    results.forEach(result => {
      if (result.success && result.result) {
        merged.push(...result.result);
      }
    });

    return merged;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
export const parallelProcessingService = new ParallelProcessingService();
export default parallelProcessingService;
