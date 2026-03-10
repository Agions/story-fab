/**
 * 视频生成优化服务
 * 通过多种策略优化视频生成速度
 */

import { logger } from '@/utils/logger';

/**
 * 编码优化配置
 */
export interface EncodingOptimizeConfig {
  /** 使用硬件加速 */
  useHardwareAcceleration: boolean;
  /** 编码预设 (速度优先) */
  encodingPreset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium';
  /** 并行任务数 */
  parallelTasks: number;
  /** 是否使用 CRF 模式 */
  useCRF: boolean;
  /** CRF 值 (质量 0-51, 越低越快) */
  crf: number;
  /** 是否跳过重复帧 */
  skipDuplicateFrames: boolean;
  /** 视频切片大小 (MB) */
  chunkSize: number;
}

/**
 * 性能优化策略
 */
export interface PerformanceStrategy {
  /** 策略名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 适合场景 */
  suitableFor: 'speed' | 'quality' | 'balanced';
  /** 配置 */
  config: Partial<EncodingOptimizeConfig>;
}

/**
 * 预定义优化策略
 */
export const PERFORMANCE_STRATEGIES: PerformanceStrategy[] = [
  {
    name: '极速模式',
    description: '最快生成速度，适合预览和测试',
    suitableFor: 'speed',
    config: {
      useHardwareAcceleration: true,
      encodingPreset: 'ultrafast',
      parallelTasks: 4,
      useCRF: true,
      crf: 28,
      skipDuplicateFrames: true,
      chunkSize: 50,
    },
  },
  {
    name: '均衡模式',
    description: '速度和质量的平衡',
    suitableFor: 'balanced',
    config: {
      useHardwareAcceleration: true,
      encodingPreset: 'fast',
      parallelTasks: 2,
      useCRF: true,
      crf: 23,
      skipDuplicateFrames: true,
      chunkSize: 100,
    },
  },
  {
    name: '质量优先',
    description: '最高输出质量，较慢',
    suitableFor: 'quality',
    config: {
      useHardwareAcceleration: true,
      encodingPreset: 'slow',
      parallelTasks: 1,
      useCRF: true,
      crf: 18,
      skipDuplicateFrames: false,
      chunkSize: 200,
    },
  },
];

/**
 * 视频生成优化服务
 */
export class VideoGenerateOptimizeService {
  private config: EncodingOptimizeConfig;
  private isProcessing: boolean = false;

  constructor(config?: Partial<EncodingOptimizeConfig>) {
    this.config = {
      useHardwareAcceleration: true,
      encodingPreset: 'fast',
      parallelTasks: 2,
      useCRF: true,
      crf: 23,
      skipDuplicateFrames: true,
      chunkSize: 100,
      ...config,
    };
  }

  /**
   * 应用优化策略
   */
  applyStrategy(strategy: PerformanceStrategy): void {
    this.config = { ...this.config, ...strategy.config };
    logger.info('[VideoOptimize] 应用优化策略:', strategy.name);
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<EncodingOptimizeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): EncodingOptimizeConfig {
    return { ...this.config };
  }

  /**
   * 获取优化后的 FFmpeg 参数
   */
  getOptimizedFFmpegParams(): string[] {
    const params: string[] = [];
    const { useHardwareAcceleration, encodingPreset, useCRF, crf, skipDuplicateFrames } = this.config;

    // 硬件加速
    if (useHardwareAcceleration) {
      params.push('-hwaccel', 'auto');
      // 尝试使用 NVIDIA/AMD/Intel 硬件加速
      params.push('-hwaccel_device', '0');
    }

    // 编码预设
    params.push('-preset', encodingPreset);

    // CRF 模式
    if (useCRF) {
      params.push('-crf', crf.toString());
    }

    // 跳过重复帧
    if (skipDuplicateFrames) {
      params.push('-skip_frame', 'nodup');
    }

    // 多线程编码
    params.push('-threads', (this.config.parallelTasks * 2).toString());

    return params;
  }

  /**
   * 估算优化后的速度提升
   * @param originalDuration 原始视频时长(秒)
   * @returns 预估速度提升倍数
   */
  estimateSpeedImprovement(originalDuration: number): number {
    let improvement = 1;

    // 硬件加速
    if (this.config.useHardwareAcceleration) {
      improvement *= 2;
    }

    // 编码预设
    const presetSpeeds: Record<string, number> = {
      ultrafast: 4,
      superfast: 3.5,
      veryfast: 3,
      faster: 2.5,
      fast: 2,
      medium: 1.5,
      slow: 1,
      veryslow: 0.7,
    };
    improvement *= presetSpeeds[this.config.encodingPreset] || 1;

    // CRF 值
    if (this.config.useCRF) {
      // CRF 越高越快
      improvement *= 1 + (this.config.crf - 18) * 0.05;
    }

    // 跳过重复帧
    if (this.config.skipDuplicateFrames) {
      improvement *= 1.2;
    }

    // 时长越长优化效果越明显
    if (originalDuration > 300) { // 5分钟以上
      improvement *= 1.3;
    }

    return Math.min(improvement, 8); // 最大 8 倍
  }

  /**
   * 获取预估导出时间
   */
  getEstimatedExportTime(videoDuration: number): {
    hours: number;
    minutes: number;
    seconds: number;
  } {
    // 假设基准导出时间为视频时长的 3 倍
    const baseTime = videoDuration * 3;
    const improvement = this.estimateSpeedImprovement(videoDuration);
    const optimizedTime = baseTime / improvement;

    const hours = Math.floor(optimizedTime / 3600);
    const minutes = Math.floor((optimizedTime % 3600) / 60);
    const seconds = Math.floor(optimizedTime % 60);

    return { hours, minutes, seconds };
  }

  /**
   * 启用极速模式
   */
  enableSpeedMode(): void {
    this.applyStrategy(PERFORMANCE_STRATEGIES[0]);
  }

  /**
   * 启用均衡模式
   */
  enableBalancedMode(): void {
    this.applyStrategy(PERFORMANCE_STRATEGIES[1]);
  }

  /**
   * 启用质量模式
   */
  enableQualityMode(): void {
    this.applyStrategy(PERFORMANCE_STRATEGIES[2]);
  }

  /**
   * 获取所有策略
   */
  getStrategies(): PerformanceStrategy[] {
    return PERFORMANCE_STRATEGIES;
  }

  /**
   * 根据场景自动选择策略
   */
  autoSelectStrategy(scenario: 'preview' | 'draft' | 'final'): PerformanceStrategy {
    switch (scenario) {
      case 'preview':
        return PERFORMANCE_STRATEGIES[0]; // 极速
      case 'draft':
        return PERFORMANCE_STRATEGIES[1]; // 均衡
      case 'final':
        return PERFORMANCE_STRATEGIES[2]; // 质量
      default:
        return PERFORMANCE_STRATEGIES[1];
    }
  }
}

// 导出单例
export const videoGenerateOptimizeService = new VideoGenerateOptimizeService();
export default videoGenerateOptimizeService;
