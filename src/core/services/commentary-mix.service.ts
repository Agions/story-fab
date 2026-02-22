/**
 * 解说混剪服务 (优化版)
 * 简化的解说/混剪工作流
 */

import { v4 as uuidv4 } from 'uuid';
import { visionService } from './vision.service';
import { aiService } from './ai.service';
import { videoService } from './video.service';
import type { VideoInfo, VideoAnalysis, ScriptData, ScriptSegment } from '@/core/types';

// 混剪配置
interface MixConfig {
  // 视频选择
  maxClips: number;
  minClipDuration: number;
  maxClipDuration: number;
  
  // 排序方式
  sortBy: 'random' | 'scene' | 'emotion' | 'motion';
  
  // 解说配置
  scriptStyle: 'narrative' | 'humor' | 'professional' | 'casual';
  scriptLength: 'short' | 'medium' | 'long';
  
  // 过渡效果
  transitionType: 'fade' | 'dissolve' | 'cut' | 'slide';
  transitionDuration: number;
  
  // 输出
  targetDuration?: number;
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
}

// 混剪结果
export interface MixResult {
  videoClips: VideoClipInfo[];
  script: ScriptData;
  timeline: TimelineData;
  metadata: {
    processedAt: string;
    totalDuration: number;
    clipCount: number;
    config: MixConfig;
  };
}

// 视频片段信息
interface VideoClipInfo {
  id: string;
  sourceId: string;
  startTime: number;
  endTime: number;
  duration: number;
  sceneType?: string;
  emotion?: string;
  motionLevel?: number;
}

// 时间轴数据
interface TimelineData {
  tracks: Array<{
    id: string;
    type: 'video' | 'audio' | 'subtitle' | 'effect';
    clips: any[];
  }>;
  duration: number;
}

// 默认配置
const DEFAULT_CONFIG: MixConfig = {
  maxClips: 10,
  minClipDuration: 3,
  maxClipDuration: 30,
  sortBy: 'scene',
  scriptStyle: 'professional',
  scriptLength: 'medium',
  transitionType: 'fade',
  transitionDuration: 0.5,
  aspectRatio: '16:9',
};

class CommentaryMixService {
  private config: MixConfig;

  constructor(config: Partial<MixConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 执行解说混剪
   * 1. 分析多个视频 -> 2. 智能选段 -> 3. 生成解说 -> 4. 生成时间轴
   */
  async process(
    videos: VideoInfo[],
    options?: { targetDuration?: number }
  ): Promise<MixResult> {
    const startTime = Date.now();
    
    // Step 1: 分析所有视频
    const analyses = await this.analyzeVideos(videos);
    
    // Step 2: 智能选段
    const clips = this.selectClips(analyses, options?.targetDuration);
    
    // Step 3: 生成解说脚本
    const script = await this.generateScript(clips, analyses);
    
    // Step 4: 生成时间轴
    const timeline = this.generateTimeline(clips, script);
    
    const totalDuration = timeline.duration;
    
    return {
      videoClips: clips,
      script,
      timeline,
      metadata: {
        processedAt: new Date().toISOString(),
        totalDuration,
        clipCount: clips.length,
        config: this.config,
      },
    };
  }

  /**
   * 分析多个视频
   */
  private async analyzeVideos(videos: VideoInfo[]): Promise<VideoAnalysis[]> {
    const analyses: VideoAnalysis[] = [];
    
    for (const video of videos) {
      const analysis = await visionService.analyzeVideo(video);
      analysis.videoId = video.id || uuidv4();
      analyses.push(analysis);
    }
    
    return analyses;
  }

  /**
   * 智能选段
   */
  private selectClips(analyses: VideoAnalysis[], targetDuration?: number): VideoClipInfo[] {
    const allClips: VideoClipInfo[] = [];
    
    // 从每个视频中提取片段
    for (const analysis of analyses) {
      const clips = this.extractClipsFromAnalysis(analysis);
      allClips.push(...clips);
    }
    
    // 排序
    allClips.sort((a, b) => {
      switch (this.config.sortBy) {
        case 'scene':
          return (b.sceneType === 'action' ? 1 : 0) - (a.sceneType === 'action' ? 1 : 0);
        case 'emotion':
          return (b.emotion ? 1 : 0) - (a.emotion ? 1 : 0);
        case 'motion':
          return (b.motionLevel || 0) - (a.motionLevel || 0);
        case 'random':
        default:
          return Math.random() - 0.5;
      }
    });
    
    // 限制数量
    const limitedClips = allClips.slice(0, this.config.maxClips);
    
    // 调整时长
    if (targetDuration) {
      return this.adjustDuration(limitedClips, targetDuration);
    }
    
    return limitedClips;
  }

  /**
   * 从分析结果提取片段
   */
  private extractClipsFromAnalysis(analysis: VideoAnalysis): VideoClipInfo[] {
    const clips: VideoClipInfo[] = [];
    const scenes = analysis.scenes || [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const duration = scene.endTime - scene.startTime;
      
      // 跳过太短或太长的片段
      if (duration < this.config.minClipDuration) continue;
      if (duration > this.config.maxClipDuration) {
        // 分割太长的片段
        const subClips = this.splitLongClip(analysis.videoId || '', scene);
        clips.push(...subClips);
      } else {
        clips.push({
          id: uuidv4(),
          sourceId: analysis.videoId || '',
          startTime: scene.startTime,
          endTime: scene.endTime,
          duration,
          sceneType: scene.type || 'general',
          emotion: scene.emotion,
          motionLevel: scene.motionScore,
        });
      }
    }
    
    return clips;
  }

  /**
   * 分割长片段
   */
  private splitLongClip(sourceId: string, scene: any): VideoClipInfo[] {
    const clips: VideoClipInfo[] = [];
    const duration = scene.endTime - scene.startTime;
    const maxDuration = this.config.maxClipDuration;
    const count = Math.ceil(duration / maxDuration);
    
    for (let i = 0; i < count; i++) {
      const start = scene.startTime + i * maxDuration;
      const end = Math.min(start + maxDuration, scene.endTime);
      
      clips.push({
        id: uuidv4(),
        sourceId,
        startTime: start,
        endTime: end,
        duration: end - start,
        sceneType: scene.type || 'general',
      });
    }
    
    return clips;
  }

  /**
   * 调整片段时长
   */
  private adjustDuration(clips: VideoClipInfo[], targetDuration: number): VideoClipInfo[] {
    const currentDuration = clips.reduce((sum, c) => sum + c.duration, 0);
    
    if (currentDuration <= targetDuration) {
      return clips;
    }
    
    // 按重要性排序后裁剪
    const sorted = [...clips].sort((a, b) => {
      const priorityA = (a.sceneType === 'action' ? 2 : 0) + (a.emotion ? 1 : 0);
      const priorityB = (b.sceneType === 'action' ? 2 : 0) + (b.emotion ? 1 : 0);
      return priorityB - priorityA;
    });
    
    let remaining = targetDuration;
    const result: VideoClipInfo[] = [];
    
    for (const clip of sorted) {
      if (remaining <= 0) break;
      
      const newClip = { ...clip };
      if (newClip.duration > remaining) {
        newClip.duration = remaining;
        newClip.endTime = newClip.startTime + remaining;
      }
      
      result.push(newClip);
      remaining -= newClip.duration;
    }
    
    // 按时间排序
    return result.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * 生成解说脚本
   */
  private async generateScript(clips: VideoClipInfo[], analyses: VideoAnalysis[]): Promise<ScriptData> {
    const stylePrompts = {
      narrative: '以叙事风格解说',
      humor: '以幽默风趣的方式解说',
      professional: '以专业正式的风格解说',
      casual: '以轻松随意的方式解说',
    };
    
    const lengthGuide = {
      short: '简短精炼',
      medium: '适中',
      long: '详细丰富',
    };
    
    const prompt = `
请为以下视频片段生成解说脚本：
风格：${stylePrompts[this.config.scriptStyle]}
长度：${lengthGuide[this.config.scriptLength]}
      
片段数量：${clips.length}
总时长：${clips.reduce((s, c) => s + c.duration, 0)}秒

请生成匹配每个片段时长的解说文本。
    `.trim();
    
    try {
      const response = await aiService.generateScript(prompt, {
        style: this.config.scriptStyle,
        length: this.config.scriptLength,
      });
      
      return response;
    } catch (error) {
      // 返回空脚本
      return {
        id: uuidv4(),
        title: '解说脚本',
        segments: clips.map((clip, i) => ({
          id: uuidv4(),
          order: i,
          text: '',
          startTime: clip.startTime,
          endTime: clip.endTime,
          duration: clip.duration,
        })),
        totalDuration: clips.reduce((s, c) => s + c.duration, 0),
      };
    }
  }

  /**
   * 生成时间轴
   */
  private generateTimeline(clips: VideoClipInfo[], script: ScriptData): TimelineData {
    const tracks = [
      {
        id: 'video-track-1',
        type: 'video' as const,
        clips: clips.map((clip, index) => ({
          id: clip.id,
          sourceId: clip.sourceId,
          startTime: 0,
          endTime: clip.duration,
          sourceStart: clip.startTime,
          sourceEnd: clip.endTime,
          transition: index > 0 ? this.config.transitionType : undefined,
          transitionDuration: this.config.transitionDuration,
        })),
      },
      {
        id: 'subtitle-track-1',
        type: 'subtitle' as const,
        clips: (script.segments || []).map(seg => ({
          id: seg.id,
          text: seg.text,
          startTime: seg.startTime,
          endTime: seg.endTime,
        })),
      },
    ];
    
    const duration = clips.reduce((sum, c) => sum + c.duration, 0);
    
    return { tracks, duration };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<MixConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): MixConfig {
    return { ...this.config };
  }
}

// 导出单例
export const commentaryMixService = new CommentaryMixService();
export default commentaryMixService;
