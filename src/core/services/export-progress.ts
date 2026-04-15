/**
 * 导出进度事件发射器
 * 用于前端监听导出进度
 */

import { logger } from '@/utils/logger';

export type ExportProgressCallback = (progress: ExportProgress) => void;

/**
 * 导出进度信息
 */
export interface ExportProgress {
  stage: 'idle' | 'preparing' | 'encoding' | 'muxing' | 'complete' | 'error' | 'cancelled';
  progress: number; // 0-100
  message?: string;
  currentFrame?: number;
  totalFrames?: number;
  elapsedTime?: number;      // milliseconds elapsed since start
  estimatedTimeRemaining?: number; // milliseconds remaining
  outputPath?: string;
  fileSize?: number;
}

/**
 * 导出进度监听器
 */
class ExportProgressEmitter {
  private listeners: Set<ExportProgressCallback> = new Set();
  private startTime: number = 0;
  private cancelled: boolean = false;
  private lastProgress: ExportProgress = {
    stage: 'idle',
    progress: 0,
  };

  /**
   * 订阅进度
   */
  subscribe(callback: ExportProgressCallback): () => void {
    this.listeners.add(callback);
    // 立即发送当前进度
    callback(this.lastProgress);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 发射进度
   */
  emit(progress: ExportProgress): void {
    // Skip if cancelled
    if (this.cancelled && progress.stage !== 'cancelled') {
      return;
    }
    this.lastProgress = progress;
    this.listeners.forEach(cb => cb(progress));

    // 记录日志
    if (progress.stage === 'encoding' && progress.progress % 10 === 0) {
      logger.info(`[Export] ${progress.progress}% - ${progress.message || ''}`);
    }
  }

  /**
   * 开始导出（重置状态）
   */
  start(): void {
    this.startTime = Date.now();
    this.cancelled = false;
    this.lastProgress = { stage: 'preparing', progress: 0 };
  }

  /**
   * 准备阶段
   */
  preparing(message?: string): void {
    this.emit({
      stage: 'preparing',
      progress: 0,
      message: message || '准备导出...',
    });
  }

  /**
   * 编码阶段
   */
  encoding(currentFrame: number, totalFrames: number, message?: string): void {
    const progress = Math.round((currentFrame / totalFrames) * 100);
    const elapsed = Date.now() - this.startTime;
    // Estimate: if 50% done in elapsed ms, total = elapsed / 0.5, remaining = total - elapsed
    const estimatedTotal = progress > 0 ? (elapsed / progress) * 100 : 0;
    const estimatedRemaining = Math.max(0, estimatedTotal - elapsed);

    this.emit({
      stage: 'encoding',
      progress,
      message: message || `编码中 ${progress}%`,
      currentFrame,
      totalFrames,
      elapsedTime: elapsed,
      estimatedTimeRemaining: Math.round(estimatedRemaining),
    });
  }

  /**
   * 混流阶段
   */
  muxing(message?: string): void {
    this.emit({
      stage: 'muxing',
      progress: 95,
      message: message || '合成视频...',
    });
  }

  /**
   * 完成
   */
  complete(outputPath: string, fileSize: number): void {
    this.emit({
      stage: 'complete',
      progress: 100,
      message: '导出完成!',
      outputPath,
      fileSize,
    });
    logger.info('[Export] 完成', { outputPath, fileSize });
  }

  /**
   * 错误
   */
  error(err: string): void {
    this.emit({
      stage: 'error',
      progress: 0,
      message: err,
    });
    logger.error('[Export] 错误', { err });
  }

  /**
   * 取消导出
   */
  cancel(): void {
    this.cancelled = true;
    this.emit({
      stage: 'cancelled',
      progress: 0,
      message: '导出已取消',
    });
    logger.info('[Export] 导出已取消');
  }

  /**
   * 重置
   */
  reset(): void {
    this.startTime = 0;
    this.cancelled = false;
    this.lastProgress = {
      stage: 'idle',
      progress: 0,
    };
  }
}

// 导出单例
export const exportProgress = new ExportProgressEmitter();
