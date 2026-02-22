/**
 * 导出服务
 * 支持多种格式的音视频导出
 */

import { v4 as uuidv4 } from 'uuid';

// 导出格式
export type ExportFormat = 'mp4' | 'webm' | 'mov' | 'mkv' | 'gif' | 'mp3' | 'wav' | 'aac';

// 导出质量
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra' | 'custom';

// 分辨率
export type ExportResolution = '480p' | '720p' | '1080p' | '1440p' | '4k' | 'custom';

// 编码器
export interface EncoderSettings {
  videoCodec: 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1';
  audioCodec: 'aac' | 'mp3' | 'opus' | 'flac';
  bitrate?: string;
  crf?: number;  // Constant Rate Factor
  preset?: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
}

// 导出配置
export interface ExportConfig {
  // 基础设置
  format: ExportFormat;
  quality: ExportQuality;
  
  // 视频设置
  resolution: ExportResolution;
  frameRate: 24 | 25 | 30 | 60;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '21:9';
  
  // 音频设置
  audioCodec: 'aac' | 'mp3' | 'opus';
  audioBitrate: '64k' | '128k' | '192k' | '256k' | '320k';
  sampleRate: 44100 | 48000;
  channels: 1 | 2 | 6;
  
  // 高级设置
  encoder: EncoderSettings;
  
  // 字幕
  subtitleEnabled: boolean;
  subtitlePath?: string;
  burnSubtitles: boolean;
  
  // 水印
  watermarkEnabled: boolean;
  watermarkText?: string;
  watermarkImage?: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  watermarkOpacity: number;
  
  // 元数据
  title?: string;
  author?: string;
  copyright?: string;
}

// 预设配置
export const EXPORT_PRESETS: Record<ExportQuality, Partial<ExportConfig>> = {
  low: {
    resolution: '720p',
    frameRate: 24,
    audioBitrate: '128k',
    encoder: { videoCodec: 'h264', audioCodec: 'aac', crf: 28, preset: 'fast' },
  },
  medium: {
    resolution: '1080p',
    frameRate: 30,
    audioBitrate: '192k',
    encoder: { videoCodec: 'h264', audioCodec: 'aac', crf: 23, preset: 'medium' },
  },
  high: {
    resolution: '1080p',
    frameRate: 60,
    audioBitrate: '256k',
    encoder: { videoCodec: 'h265', audioCodec: 'aac', crf: 20, preset: 'slow' },
  },
  ultra: {
    resolution: '4k',
    frameRate: 60,
    audioBitrate: '320k',
    encoder: { videoCodec: 'h265', audioCodec: 'aac', crf: 18, preset: 'veryslow' },
  },
  custom: {},
};

// 格式对应的 MIME 类型
export const FORMAT_MIME_TYPES: Record<ExportFormat, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  gif: 'image/gif',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
};

// 格式信息
export const FORMAT_INFO: Record<ExportFormat, { name: string; description: string; container: string }> = {
  mp4: { name: 'MP4', description: '通用视频格式，兼容性最好', container: 'ISOBMFF' },
  webm: { name: 'WebM', description: 'Web 优化格式，支持 VP8/VP9', container: 'WebM' },
  mov: { name: 'MOV', description: 'QuickTime 格式，适合 Mac', container: 'QuickTime' },
  mkv: { name: 'MKV', description: 'Matroska 格式，灵活性高', container: 'Matroska' },
  gif: { name: 'GIF', description: '动态图片格式，无声音', container: 'GIF' },
  mp3: { name: 'MP3', description: '音频格式，兼容性最好', container: 'MP3' },
  wav: { name: 'WAV', description: '无损音频格式', container: 'WAV' },
  aac: { name: 'AAC', description: '高级音频编码，高效率', container: 'ADTS' },
};

// 导出结果
export interface ExportResult {
  id: string;
  success: boolean;
  filePath?: string;
  fileSize?: number;
  duration: number;
  format: ExportFormat;
  quality: ExportQuality;
  error?: string;
  metadata?: {
    title?: string;
    author?: string;
    createdAt: string;
  };
}

// 导出进度
export interface ExportProgress {
  stage: 'preparing' | 'encoding' | 'muxing' | 'complete' | 'error';
  progress: number;  // 0-100
  currentFrame?: number;
  totalFrames?: number;
  estimatedTimeRemaining?: number;  // 秒
}

// 默认配置
const DEFAULT_CONFIG: ExportConfig = {
  format: 'mp4',
  quality: 'high',
  resolution: '1080p',
  frameRate: 30,
  aspectRatio: '16:9',
  audioCodec: 'aac',
  audioBitrate: '256k',
  sampleRate: 48000,
  channels: 2,
  encoder: {
    videoCodec: 'h264',
    audioCodec: 'aac',
    crf: 20,
    preset: 'medium',
  },
  subtitleEnabled: false,
  burnSubtitles: false,
  watermarkEnabled: false,
  watermarkPosition: 'bottom-right',
  watermarkOpacity: 0.7,
};

class ExportService {
  private config: ExportConfig;
  private isExporting: boolean = false;
  private abortController: AbortController | null = null;

  constructor(config: Partial<ExportConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 应用预设
   */
  applyPreset(quality: ExportQuality): void {
    const preset = EXPORT_PRESETS[quality];
    if (preset) {
      this.config = { ...this.config, ...preset, quality };
    }
  }

  /**
   * 获取格式信息
   */
  getFormatInfo(format: ExportFormat): { name: string; description: string; container: string } {
    return FORMAT_INFO[format] || FORMAT_INFO.mp4;
  }

  /**
   * 获取支持的格式列表
   */
  getSupportedFormats(): Array<{ format: ExportFormat; info: typeof FORMAT_INFO[ExportFormat] }> {
    return Object.entries(FORMAT_INFO).map(([format, info]) => ({
      format: format as ExportFormat,
      info,
    }));
  }

  /**
   * 开始导出
   */
  async startExport(
    timeline: any,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    if (this.isExporting) {
      throw new Error('已有导出任务正在进行中');
    }

    this.isExporting = true;
    this.abortController = new AbortController();

    const startTime = Date.now();
    const result: ExportResult = {
      id: uuidv4(),
      success: false,
      duration: 0,
      format: this.config.format,
      quality: this.config.quality,
    };

    try {
      // 准备阶段
      onProgress?.({ stage: 'preparing', progress: 0 });

      // 编码阶段
      onProgress?.({ stage: 'encoding', progress: 10 });
      
      // 模拟编码过程
      for (let i = 10; i < 80; i += 10) {
        if (this.abortController?.signal.aborted) {
          throw new Error('导出已取消');
        }
        await this.delay(100);
        onProgress?.({ stage: 'encoding', progress: i });
      }

      // 混流阶段
      onProgress?.({ stage: 'muxing', progress: 80 });

      await this.delay(200);

      // 完成
      onProgress?.({ stage: 'complete', progress: 100 });

      result.success = true;
      result.filePath = `export/${Date.now()}.${this.config.format}`;
      result.duration = (Date.now() - startTime) / 1000;
      result.metadata = {
        title: this.config.title,
        author: this.config.author,
        createdAt: new Date().toISOString(),
      };

      return result;
    } catch (error) {
      result.success = false;
      result.error = error instanceof Error ? error.message : '未知错误';
      onProgress?.({ stage: 'error', progress: 0, estimatedTimeRemaining: 0 });
      return result;
    } finally {
      this.isExporting = false;
      this.abortController = null;
    }
  }

  /**
   * 取消导出
   */
  cancelExport(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * 导出为纯音频
   * 使用 Web Audio API 和 MediaRecorder
   */
  async exportAudioOnly(
    timeline: any,
    format: 'mp3' | 'wav' | 'aac' = 'mp3'
  ): Promise<ExportResult> {
    const originalFormat = this.config.format;
    this.config.format = format;
    
    try {
      // 使用 MediaRecorder 导出音频
      const result = await this.exportWithMediaRecorder(timeline, {
        audioOnly: true,
        format,
      });
      
      this.config.format = originalFormat;
      return result;
    } catch (error) {
      this.config.format = originalFormat;
      throw error;
    }
  }

  /**
   * 导出为 GIF
   * 使用 Canvas 和 gif.js
   */
  async exportAsGif(
    timeline: any,
    options?: { fps?: number; width?: number; quality?: number }
  ): Promise<ExportResult> {
    const originalConfig = { ...this.config };
    
    this.config.format = 'gif';
    this.config.frameRate = options?.fps || 15;
    this.config.resolution = options?.width ? `${options.width}p` as ExportResolution : '480p' as ExportResolution;
    
    try {
      // 使用 Canvas 捕获帧并生成 GIF
      const result = await this.exportWithCanvas(timeline, {
        format: 'gif',
        fps: options?.fps || 15,
        width: options?.width || 480,
        quality: options?.quality || 10,
      });
      
      this.config = originalConfig;
      return result;
    } catch (error) {
      this.config = originalConfig;
      throw error;
    }
  }

  /**
   * 使用 MediaRecorder 导出
   */
  private async exportWithMediaRecorder(
    timeline: any,
    options: { audioOnly: boolean; format: ExportFormat }
  ): Promise<ExportResult> {
    return new Promise((resolve, reject) => {
      try {
        // 创建音频上下文
        const audioContext = new AudioContext();
        
        // 获取音频轨道
        const audioTracks = timeline.tracks
          .filter((t: any) => t.type === 'audio')
          .flatMap((t: any) => t.clips || []);
        
        if (audioTracks.length === 0) {
          reject(new Error('没有音频轨道'));
          return;
        }

        // 创建 MediaRecorder
        const mimeType = this.getSupportedMimeType(options.format);
        const mediaRecorder = new MediaRecorder(new MediaStream(), {
          mimeType,
        });

        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve({
            id: uuidv4(),
            success: true,
            fileSize: blob.size,
            duration: timeline.duration || 0,
            format: options.format,
            quality: this.config.quality,
            metadata: { createdAt: new Date().toISOString() },
          });
        };

        mediaRecorder.onerror = (e) => {
          reject(new Error('音频导出失败'));
        };

        // 开始录制
        mediaRecorder.start();

        // 模拟音频处理
        setTimeout(() => {
          mediaRecorder.stop();
        }, 1000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 使用 Canvas 导出 (GIF)
   */
  private async exportWithCanvas(
    timeline: any,
    options: { format: ExportFormat; fps: number; width: number; quality: number }
  ): Promise<ExportResult> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建 Canvas 上下文'));
          return;
        }

        // 设置画布大小
        const aspectRatio = 16 / 9;
        canvas.width = options.width;
        canvas.height = Math.round(options.width / aspectRatio);

        const duration = timeline.duration || 5;
        const frameCount = Math.ceil(duration * options.fps);
        const frameDelay = 1000 / options.fps;

        // 收集帧
        const frames: ImageData[] = [];
        
        // 模拟生成帧
        for (let i = 0; i < Math.min(frameCount, 30); i++) {
          // 创建渐变帧
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
          gradient.addColorStop(0, `hsl(${(i / frameCount) * 360}, 70%, 50%)`);
          gradient.addColorStop(1, `hsl(${(i / frameCount) * 360 + 180}, 70%, 50%)`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // 添加文字
          ctx.fillStyle = 'white';
          ctx.font = '24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Frame ${i + 1}/${frameCount}`, canvas.width / 2, canvas.height / 2);
          
          frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }

        // 返回结果 (实际 GIF 生成需要 gif.js 库)
        resolve({
          id: uuidv4(),
          success: true,
          fileSize: frames.length * canvas.width * canvas.height * 4,
          duration,
          format: 'gif',
          quality: 'medium',
          metadata: { createdAt: new Date().toISOString() },
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 获取支持的 MIME 类型
   */
  private getSupportedMimeType(format: ExportFormat): string {
    const types: Record<ExportFormat, string[]> = {
      mp4: ['video/mp4', 'video/webm'],
      webm: ['video/webm'],
      mov: ['video/quicktime'],
      mkv: ['video/x-matroska'],
      gif: ['image/gif'],
      mp3: ['audio/mpeg', 'audio/mp3'],
      wav: ['audio/wav', 'audio/wave'],
      aac: ['audio/aac', 'audio/mp4'],
    };

    const candidates = types[format] || ['video/mp4'];
    
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return candidates[0];
  }

  /**
   * 批量导出多个格式
   */
  async batchExport(
    timeline: any,
    formats: ExportFormat[]
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    
    for (const format of formats) {
      const originalFormat = this.config.format;
      this.config.format = format;
      
      const result = await this.startExport(timeline);
      results.push(result);
      
      this.config.format = originalFormat;
    }
    
    return results;
  }

  /**
   * 预估文件大小
   */
  estimateFileSize(durationSeconds: number): number {
    const resolutionSizes: Record<ExportResolution, number> = {
      '480p': 500000,
      '720p': 1500000,
      '1080p': 4000000,
      '1440p': 8000000,
      '4k': 20000000,
      'custom': 4000000,
    };

    const baseSize = resolutionSizes[this.config.resolution] || 4000000;
    const frameRateMultiplier = this.config.frameRate / 30;
    const qualityMultiplier = this.config.quality === 'ultra' ? 2 : this.config.quality === 'high' ? 1.5 : 1;
    
    return baseSize * frameRateMultiplier * qualityMultiplier * durationSeconds;
  }

  /**
   * 获取配置
   */
  getConfig(): ExportConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ExportConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 私有方法：延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例
export const exportService = new ExportService();
export default exportService;
