/**
 * 音画同步服务
 * 提供专业的音视频同步功能
 */
import { logger } from '../../shared/utils/logging';


// 同步配置
export interface SyncConfig {
  // 静音检测
  silenceThreshold: number;    // dB
  minSilenceDuration: number;  // 秒
  
  // 偏移校正
  audioOffset: number;         // 毫秒
  videoOffset: number;         // 毫秒
  
  // 同步模式
  mode: 'auto' | 'manual' | 'adaptive';
  
  // 适应性同步
  adaptiveSensitivity: number;  // 0-1
}

// 同步结果
export interface SyncResult {
  success: boolean;
  offset: number;
  confidence: number;
  issues: SyncIssue[];
  timeline: SyncTimeline;
}

// 同步问题
export interface SyncIssue {
  timestamp: number;
  type: 'drift' | 'gap' | 'overlap';
  severity: 'low' | 'medium' | 'high';
  suggestedFix: number;
}

// 时间线数据
export interface SyncTimeline {
  videoSegments: Array<{
    start: number;
    end: number;
    audioStart?: number;
    audioEnd?: number;
  }>;
  issues: SyncIssue[];
}

type TimelineSegment = SyncTimeline['videoSegments'][number];

// 默认配置
const DEFAULT_CONFIG: SyncConfig = {
  silenceThreshold: -40,
  minSilenceDuration: 0.5,
  audioOffset: 0,
  videoOffset: 0,
  mode: 'auto',
  adaptiveSensitivity: 0.5,
};

export class AudioVideoSyncService {
  private config: SyncConfig;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 分析音视频同步状态
   */
  async analyzeSync(videoPath: string, audioPath?: string): Promise<SyncResult> {
    // 模拟分析过程
    // 实际实现需要调用 FFmpeg 或其他视频处理库
    
    const timeline = await this.analyzeTimeline(videoPath);
    const issues = this.detectIssues(timeline);
    const offset = this.calculateOffset(issues);
    const confidence = this.calculateConfidence(issues);
    
    return {
      success: issues.length === 0,
      offset,
      confidence,
      issues,
      timeline,
    };
  }

  /**
   * 自动同步
   */
  async autoSync(videoPath: string, audioPath?: string): Promise<SyncResult> {
    const analysis = await this.analyzeSync(videoPath, audioPath);
    
    if (analysis.confidence > 0.8) {
      // 高置信度，自动应用校正
      this.config.audioOffset = analysis.offset;
    }
    
    return analysis;
  }

  /**
   * 手动调整偏移
   */
  setOffset(offsetMs: number): void {
    this.config.audioOffset = offsetMs;
  }

  /**
   * 获取当前配置
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 分析时间线
   */
  private async analyzeTimeline(videoPath: string): Promise<SyncTimeline> {
    try {
      // 用 FFprobe 提取视频音频流时间戳
      const videoStreamIndex = await this.getStreamIndex(videoPath, 'v');

      if (videoStreamIndex === -1) {
        return { videoSegments: [], issues: [] };
      }

      // 提取关键帧时间点用于分段
      const keyframes = await this.getKeyframes(videoPath);
      if (keyframes.length === 0) {
        // 没有关键帧数据，按固定长度分段
        const duration = await this.getDuration(videoPath);
        const segments = [];
        for (let t = 0; t < duration; t += 30) {
          segments.push({ start: t, end: Math.min(t + 30, duration) });
        }
        return { videoSegments: segments, issues: [] };
      }

      // 按关键帧分段的简化逻辑
      const videoSegments = [];
      for (let i = 0; i < keyframes.length - 1; i++) {
        videoSegments.push({
          start: keyframes[i],
          end: keyframes[i + 1],
          audioStart: undefined,
          audioEnd: undefined,
        });
      }
      return { videoSegments, issues: [] };
    } catch (err) {
      logger.warn('[AudioVideoSync] FFprobe 分析失败，使用默认分段:', err);
      const duration = await this.getDuration(videoPath);
      const segments = [];
      for (let t = 0; t < duration; t += 30) {
        segments.push({ start: t, end: Math.min(t + 30, duration) });
      }
      return { videoSegments: segments, issues: [] };
    }
  }

  private async getStreamIndex(filePath: string, codec: 'v' | 'a'): Promise<number> {
    const flag = codec === 'v' ? 'v:0' : 'a:0';
    const probe = await this.ffprobeOutput(['-select_streams', flag, '-show_entries', 'stream=index', '-of', 'csv=p=0', filePath]);
    const line = probe.trim().split('\n').filter(Boolean)[0];
    return line ? parseInt(line, 10) : -1;
  }

  private async getKeyframes(filePath: string): Promise<number[]> {
    // 提取视频关键帧时间戳（I帧），用于分段
    const probe = await this.ffprobeOutput([
      '-select_streams', 'v:0',
      '-read_intervals', '%+#(keyframes)',
      '-show_entries', 'packet=pts_time',
      '-of', 'csv=p=0',
      '-skip_frame', 'nokey',
      filePath,
    ]);
    return probe.trim().split('\n').filter(Boolean).map(parseFloat).filter(t => !isNaN(t));
  }

  private async getDuration(filePath: string): Promise<number> {
    const probe = await this.ffprobeOutput([
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      filePath,
    ]);
    return parseFloat(probe.trim()) || 0;
  }

  private async ffprobeOutput(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const proc = spawn('ffprobe', args, { shell: false });
      let stdout = '', stderr = '';
      proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
      proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });
      proc.on('close', (code: number) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(`ffprobe exited ${code}: ${stderr}`));
      });
      proc.on('error', reject);
    });
  }

  /**
   * 检测同步问题
   */
  private detectIssues(timeline: SyncTimeline): SyncIssue[] {
    const issues: SyncIssue[] = [];
    
    // 检测时间漂移
    for (const segment of timeline.videoSegments) {
      const drift = Math.random() * 100 - 50; // 模拟
      if (Math.abs(drift) > 30) {
        issues.push({
          timestamp: segment.start,
          type: 'drift',
          severity: Math.abs(drift) > 50 ? 'high' : 'medium',
          suggestedFix: -drift,
        });
      }
    }
    
    return issues;
  }

  /**
   * 计算偏移量
   */
  private calculateOffset(issues: SyncIssue[]): number {
    if (issues.length === 0) return 0;
    
    const weightedSum = issues.reduce((sum, issue) => {
      const weight = issue.severity === 'high' ? 3 : issue.severity === 'medium' ? 2 : 1;
      return sum + issue.suggestedFix * weight;
    }, 0);
    
    const totalWeight = issues.reduce((sum, issue) => {
      return sum + (issue.severity === 'high' ? 3 : issue.severity === 'medium' ? 2 : 1);
    }, 0);
    
    return Math.round(weightedSum / totalWeight);
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(issues: SyncIssue[]): number {
    if (issues.length === 0) return 1.0;
    
    const severityScore = issues.reduce((sum, issue) => {
      return sum + (issue.severity === 'high' ? 0.3 : issue.severity === 'medium' ? 0.2 : 0.1);
    }, 0);
    
    return Math.max(0, 1 - severityScore);
  }

  /**
   * 导出同步后的时间轴
   */
  exportTimeline(segments: TimelineSegment[]): SyncTimeline {
    const offsetSeconds = this.config.audioOffset / 1000;
    
    return {
      videoSegments: segments.map(seg => ({
        start: seg.start,
        end: seg.end,
        audioStart: seg.start + offsetSeconds,
        audioEnd: seg.end + offsetSeconds,
      })),
      issues: [],
    };
  }
}

// 导出单例
export const audioVideoSyncService = new AudioVideoSyncService();
export default audioVideoSyncService;
