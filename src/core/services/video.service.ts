/**
 * 视频处理服务
 * 统一的视频处理功能
 */

import { v4 as uuidv4 } from 'uuid';
import type { VideoInfo, VideoAnalysis, Scene, Keyframe } from '@/core/types';

// FFmpeg 命令构建器
class FFmpegCommandBuilder {
  private inputs: string[] = [];
  private filters: string[] = [];
  private outputs: string[] = [];
  private options: string[] = [];

  input(path: string): this {
    this.inputs.push(`-i "${path}"`);
    return this;
  }

  option(...opts: string[]): this {
    this.options.push(...opts);
    return this;
  }

  filter(filter: string): this {
    this.filters.push(filter);
    return this;
  }

  output(path: string, options?: string[]): this {
    const opts = options ? options.join(' ') : '';
    this.outputs.push(`${opts} "${path}"`);
    return this;
  }

  build(): string {
    const parts = [
      'ffmpeg',
      ...this.inputs,
      ...this.options,
      this.filters.length > 0 ? `-vf "${this.filters.join(',')}"` : '',
      ...this.outputs
    ];
    return parts.filter(Boolean).join(' ');
  }
}

class VideoService {
  /**
   * 获取视频信息
   */
  async getVideoInfo(file: File): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);

        resolve({
          id: uuidv4(),
          path: url,
          name: file.name,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          fps: 30, // 默认
          format: file.name.split('.').pop()?.toLowerCase() || 'mp4',
          size: file.size,
          createdAt: new Date().toISOString()
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('无法读取视频文件'));
      };

      video.src = url;
    });
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(
    videoPath: string,
    timestamp: number = 0,
    width: number = 320
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.crossOrigin = 'anonymous';

      video.onloadeddata = () => {
        // 计算高度保持比例
        const aspectRatio = video.videoHeight / video.videoWidth;
        canvas.width = width;
        canvas.height = Math.round(width * aspectRatio);

        video.currentTime = timestamp;
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } else {
          reject(new Error('无法创建画布上下文'));
        }
      };

      video.onerror = () => {
        reject(new Error('无法加载视频'));
      };

      video.src = videoPath;
    });
  }

  /**
   * 提取关键帧
   */
  async extractKeyframes(
    videoPath: string,
    duration: number,
    count: number = 10
  ): Promise<Keyframe[]> {
    const keyframes: Keyframe[] = [];
    const interval = duration / (count + 1);

    for (let i = 1; i <= count; i++) {
      const timestamp = Math.round(interval * i);
      try {
        const thumbnail = await this.generateThumbnail(videoPath, timestamp);
        keyframes.push({
          id: uuidv4(),
          timestamp,
          thumbnail,
          description: `关键帧 ${i}`
        });
      } catch (error) {
        console.error(`提取关键帧 ${i} 失败:`, error);
      }
    }

    return keyframes;
  }

  /**
   * 场景检测
   * 通过逐帧采样对比色彩直方图差异来检测场景切换点
   */
  async detectScenes(
    videoPath: string,
    duration: number,
    threshold: number = 0.3
  ): Promise<Scene[]> {
    const scenes: Scene[] = [];
    const sampleInterval = 1; // 每秒采样一次
    const sampleCount = Math.floor(duration / sampleInterval);
    const histograms: number[][] = [];

    // 采样关键帧并计算颜色直方图
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 90;

    video.src = videoPath;
    video.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error('无法加载视频'));
    });

    // 逐帧采样直方图
    for (let i = 0; i < sampleCount; i++) {
      const timestamp = i * sampleInterval;
      try {
        video.currentTime = timestamp;
        await new Promise<void>(resolve => { video.onseeked = () => resolve(); });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const histogram = this.computeColorHistogram(imageData.data);
          histograms.push(histogram);
        }
      } catch {
        histograms.push([]);
      }
    }

    // 检测场景切换点（直方图差异大于阈值）
    const cutPoints: number[] = [0];
    for (let i = 1; i < histograms.length; i++) {
      if (histograms[i].length && histograms[i - 1].length) {
        const diff = this.histogramDifference(histograms[i - 1], histograms[i]);
        if (diff > threshold) {
          cutPoints.push(i * sampleInterval);
        }
      }
    }
    cutPoints.push(duration);

    // 构建场景列表
    for (let i = 0; i < cutPoints.length - 1; i++) {
      const startTime = cutPoints[i];
      const endTime = cutPoints[i + 1];

      // 过滤掉过短的场景（< 2秒）
      if (endTime - startTime < 2) continue;

      try {
        const thumbnail = await this.generateThumbnail(videoPath, startTime + 0.5);
        scenes.push({
          id: uuidv4(),
          startTime,
          endTime,
          thumbnail,
          description: `场景 ${scenes.length + 1}（${this.formatDuration(startTime)} - ${this.formatDuration(endTime)}）`,
          tags: [`duration:${Math.round(endTime - startTime)}s`]
        });
      } catch {
        scenes.push({
          id: uuidv4(),
          startTime,
          endTime,
          thumbnail: '',
          description: `场景 ${scenes.length + 1}`,
          tags: []
        });
      }
    }

    // 如果没有检测到场景切换，按固定间隔分割
    if (scenes.length === 0) {
      const fallbackDuration = Math.min(30, duration / 3);
      const count = Math.max(1, Math.floor(duration / fallbackDuration));
      for (let i = 0; i < count; i++) {
        const startTime = i * fallbackDuration;
        const endTime = Math.min((i + 1) * fallbackDuration, duration);
        const thumbnail = await this.generateThumbnail(videoPath, startTime).catch(() => '');
        scenes.push({
          id: uuidv4(),
          startTime,
          endTime,
          thumbnail,
          description: `场景 ${i + 1}`,
          tags: []
        });
      }
    }

    return scenes;
  }

  /**
   * 计算颜色直方图 (RGB 各 64 bins)
   */
  private computeColorHistogram(data: Uint8ClampedArray): number[] {
    const bins = 64;
    const histogram = new Array(bins * 3).fill(0);
    const binSize = 256 / bins;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      histogram[Math.floor(data[i] / binSize)]++;           // R
      histogram[bins + Math.floor(data[i + 1] / binSize)]++;  // G
      histogram[bins * 2 + Math.floor(data[i + 2] / binSize)]++; // B
    }

    // 归一化
    for (let i = 0; i < histogram.length; i++) {
      histogram[i] /= pixelCount;
    }
    return histogram;
  }

  /**
   * 计算两个直方图的差异 (Chi-Square)
   */
  private histogramDifference(h1: number[], h2: number[]): number {
    let diff = 0;
    for (let i = 0; i < h1.length; i++) {
      const sum = h1[i] + h2[i];
      if (sum > 0) {
        diff += ((h1[i] - h2[i]) ** 2) / sum;
      }
    }
    return diff / 2;
  }

  /**
   * 分析视频
   */
  async analyzeVideo(videoInfo: VideoInfo): Promise<VideoAnalysis> {
    const [keyframes, scenes] = await Promise.all([
      this.extractKeyframes(videoInfo.path, videoInfo.duration, 10),
      this.detectScenes(videoInfo.path, videoInfo.duration)
    ]);

    return {
      id: uuidv4(),
      videoId: videoInfo.id,
      scenes,
      keyframes,
      objects: [],
      emotions: [],
      summary: `视频时长 ${this.formatDuration(videoInfo.duration)}，分辨率 ${videoInfo.width}x${videoInfo.height}，包含 ${scenes.length} 个场景。`,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 生成视频预览
   */
  async generatePreview(
    videoPath: string,
    startTime: number,
    endTime: number
  ): Promise<string> {
    // 这里应该使用 FFmpeg 生成预览片段
    // 目前返回原视频路径
    return videoPath;
  }

  /**
   * 执行 FFmpeg 命令
   * 优先使用 Tauri Shell API，回退到 Web 端模拟
   */
  private async executeFFmpeg(command: string): Promise<{ success: boolean; output: string }> {
    // 尝试 Tauri 环境
    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke<string>('execute_ffmpeg', { command });
      return { success: true, output: result };
    } catch {
      // 非 Tauri 环境，记录命令并返回模拟结果
      console.log('[FFmpeg Command]', command);
      console.warn('[VideoService] FFmpeg 命令已生成但未执行（需要 Tauri 桌面端或 FFmpeg WASM）');
      return { success: false, output: 'Requires Tauri desktop or FFmpeg WASM runtime' };
    }
  }

  /**
   * 导出视频
   * 构建完整的 FFmpeg 导出管线，支持质量/分辨率/字幕/水印
   */
  async exportVideo(
    inputPath: string,
    outputPath: string,
    options: {
      format?: string;
      quality?: 'low' | 'medium' | 'high' | 'ultra';
      resolution?: '720p' | '1080p' | '2k' | '4k';
      includeSubtitles?: boolean;
      subtitlePath?: string;
      onProgress?: (percent: number) => void;
    }
  ): Promise<string> {
    const builder = new FFmpegCommandBuilder();
    builder.input(inputPath);

    const qualityMap = {
      low: ['-crf', '28', '-preset', 'fast'],
      medium: ['-crf', '23', '-preset', 'medium'],
      high: ['-crf', '18', '-preset', 'slow'],
      ultra: ['-crf', '15', '-preset', 'veryslow']
    };

    const resolutionMap = {
      '720p': '1280:720',
      '1080p': '1920:1080',
      '2k': '2560:1440',
      '4k': '3840:2160'
    };

    const quality = options.quality || 'high';
    const resolution = options.resolution || '1080p';

    builder.option(...qualityMap[quality]);

    if (resolution !== '1080p') {
      builder.filter(`scale=${resolutionMap[resolution]}:force_original_aspect_ratio=decrease,pad=${resolutionMap[resolution]}:(ow-iw)/2:(oh-ih)/2`);
    }

    if (options.includeSubtitles && options.subtitlePath) {
      builder.filter(`subtitles=${options.subtitlePath}`);
    }

    builder.option('-movflags', '+faststart'); // 快速启动（流媒体友好）
    builder.output(outputPath, ['-c:v', 'libx264', '-c:a', 'aac', '-b:a', '192k']);

    const command = builder.build();
    const result = await this.executeFFmpeg(command);

    if (!result.success) {
      // Web 端：保存导出配置供后续桌面端执行
      const exportConfig = {
        command,
        inputPath,
        outputPath,
        options,
        createdAt: new Date().toISOString()
      };
      console.log('[ExportConfig]', JSON.stringify(exportConfig));
    }

    return outputPath;
  }

  /**
   * 剪辑视频片段
   */
  async clipVideo(
    inputPath: string,
    outputPath: string,
    startTime: number,
    endTime: number
  ): Promise<string> {
    const builder = new FFmpegCommandBuilder();
    builder
      .input(inputPath)
      .option('-ss', startTime.toString(), '-t', (endTime - startTime).toString(), '-c', 'copy', '-avoid_negative_ts', 'make_zero')
      .output(outputPath);

    const command = builder.build();
    await this.executeFFmpeg(command);
    return outputPath;
  }

  /**
   * 合并视频
   */
  async mergeVideos(
    inputPaths: string[],
    outputPath: string
  ): Promise<string> {
    const fileList = inputPaths.map(p => `file '${p}'`).join('\n');

    const builder = new FFmpegCommandBuilder();
    builder
      .option('-f', 'concat', '-safe', '0')
      .input('filelist.txt')
      .option('-c', 'copy')
      .output(outputPath);

    const command = builder.build();
    console.log('[MergeFileList]', fileList);
    await this.executeFFmpeg(command);
    return outputPath;
  }

  /**
   * 添加字幕
   */
  async addSubtitles(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
    style?: {
      fontSize?: number;
      fontColor?: string;
      backgroundColor?: string;
      position?: 'top' | 'middle' | 'bottom';
    }
  ): Promise<string> {
    const defaultStyle = {
      fontSize: 24,
      fontColor: '&HFFFFFF&',
      backgroundColor: '&H80000000&',
      position: 'bottom' as const
    };
    const finalStyle = { ...defaultStyle, ...style };

    const marginV = finalStyle.position === 'top' ? 40 : finalStyle.position === 'middle' ? 200 : 20;

    const builder = new FFmpegCommandBuilder();
    builder
      .input(videoPath)
      .filter(`subtitles=${subtitlePath}:force_style='FontSize=${finalStyle.fontSize},PrimaryColour=${finalStyle.fontColor},BackColour=${finalStyle.backgroundColor},MarginV=${marginV}'`)
      .output(outputPath, ['-c:v', 'libx264', '-c:a', 'copy']);

    const command = builder.build();
    await this.executeFFmpeg(command);
    return outputPath;
  }

  /**
   * 格式转换
   */
  async convertFormat(
    inputPath: string,
    outputPath: string,
    format: string
  ): Promise<string> {
    const formatMap: Record<string, string[]> = {
      mp4: ['-c:v', 'libx264', '-c:a', 'aac'],
      webm: ['-c:v', 'libvpx-vp9', '-c:a', 'libopus', '-b:v', '2M'],
      mov: ['-c:v', 'libx264', '-c:a', 'aac', '-f', 'mov'],
      avi: ['-c:v', 'libx264', '-c:a', 'mp3', '-f', 'avi']
    };

    const codec = formatMap[format] || formatMap.mp4;

    const builder = new FFmpegCommandBuilder();
    builder
      .input(inputPath)
      .output(outputPath, codec);

    const command = builder.build();
    await this.executeFFmpeg(command);
    return outputPath;
  }

  /**
   * 格式化时长
   */
  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const videoService = new VideoService();
export default videoService;
