/**
 * 增强版解说混剪服务
 * 集成 AI 视频分析、自动剪辑、智能配乐
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { visionService } from './vision.service';
import { aiService } from './ai.service';
import { smartCutService, type SceneChange, type AudioPeak } from './smart-cut.service';
import { subtitleService as _subtitleService } from './subtitle.service';

/**
 * 增强解说配置
 */
export interface EnhancedCommentaryConfig {
  /** 模式 */
  mode: 'commentary' | 'mixclip' | 'first-person';
  
  /** 视频分析 */
  analyzeScene: boolean;
  analyzeEmotion: boolean;
  analyzeAudio: boolean;
  
  /** 剪辑 */
  autoClip: boolean;
  clipStrategy: 'highlight' | 'balance' | 'fast';
  minClipDuration: number;
  maxClipDuration: number;
  
  /** 解说 */
  scriptStyle: 'professional' | 'casual' | 'humor' | 'emotional';
  scriptTone: 'formal' | 'neutral' | 'relaxed';
  voiceId?: string;
  
  /** 配乐 */
  autoMusic: boolean;
  musicStyle: 'upbeat' | 'calm' | 'epic' | 'cinematic';
  
  /** 字幕 */
  autoSubtitle: boolean;
  subtitleLanguage: string;
  
  /** 输出 */
  outputFormat: 'mp4' | 'webm';
  outputResolution: '720p' | '1080p' | '4k';
}

/**
 * 视频分析结果
 */
export interface VideoAnalysisResult {
  videoId: string;
  duration: number;
  scenes: SceneInfo[];
  emotions: EmotionSegment[];
  audioPeaks: AudioPeakInfo[];
  keyframes: KeyFrameInfo[];
  transcript?: string;
}

/**
 * 场景信息
 */
export interface SceneInfo {
  startTime: number;
  endTime: number;
  type: 'action' | 'dialog' | 'nature' | 'closeup' | 'wide';
  score: number;
}

/**
 * 情绪片段
 */
export interface EmotionSegment {
  startTime: number;
  endTime: number;
  emotion: 'happy' | 'sad' | 'excited' | 'calm' | 'tense';
  score: number;
}

/**
 * 音频峰值
 */
export interface AudioPeakInfo {
  timestamp: number;
  type: 'speech' | 'music' | 'applause' | 'effect';
  volume: number;
}

/**
 * 关键帧
 */
export interface KeyFrameInfo {
  timestamp: number;
  type: 'scene_change' | 'motion' | 'face' | 'text';
  score: number;
}

/**
 * 解说片段
 */
export interface CommentarySegment {
  id: string;
  videoStartTime: number;
  videoEndTime: number;
  text: string;
  voiceUrl?: string;
  backgroundMusic?: string;
}

/**
 * 增强解说结果
 */
export interface EnhancedCommentaryResult {
  videoId: string;
  originalDuration: number;
  finalDuration: number;
  
  // 分析
  analysis: VideoAnalysisResult;
  
  // 剪辑
  clips: ClipSegment[];
  
  // 解说
  commentary: CommentarySegment[];
  
  // 配乐
  backgroundMusic?: MusicSegment[];
  
  // 字幕
  subtitles: SubtitleEntry[];
  
  // 元数据
  metadata: {
    _config: EnhancedCommentaryConfig;
    processedAt: string;
    processingTime: number;
  };
}

/**
 * 剪辑片段
 */
export interface ClipSegment {
  id: string;
  sourceIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  transition?: string;
  reason: string;
}

/**
 * 配乐片段
 */
export interface MusicSegment {
  id: string;
  startTime: number;
  endTime: number;
  url: string;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

/**
 * 字幕条目
 */
export interface SubtitleEntry {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker?: string;
}

/**
 * 增强解说服务
 */
export class EnhancedCommentaryService {
  private defaultConfig: EnhancedCommentaryConfig = {
    mode: 'commentary',
    analyzeScene: true,
    analyzeEmotion: true,
    analyzeAudio: true,
    autoClip: true,
    clipStrategy: 'highlight',
    minClipDuration: 3,
    maxClipDuration: 30,
    scriptStyle: 'professional',
    scriptTone: 'neutral',
    autoMusic: true,
    musicStyle: 'cinematic',
    autoSubtitle: true,
    subtitleLanguage: 'zh-CN',
    outputFormat: 'mp4',
    outputResolution: '1080p',
  };

  /**
   * 执行增强解说流程
   */
  async process(
    videoData: ArrayBuffer,
    config?: Partial<EnhancedCommentaryConfig>
  ): Promise<EnhancedCommentaryResult> {
    const cfg = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    
    logger.info('[EnhancedCommentary] 开始处理', { mode: cfg.mode });

    // 1. 视频分析
    const analysis = await this.analyzeVideo(videoData, cfg);
    
    // 2. 智能剪辑
    const clips = cfg.autoClip 
      ? await this.generateClips(analysis, cfg)
      : [];
    
    // 3. 生成解说
    const commentary = await this.generateCommentary(analysis, cfg);
    
    // 4. 配乐选择
    const backgroundMusic = cfg.autoMusic
      ? await this.selectMusic(analysis, cfg)
      : [];
    
    // 5. 生成字幕
    const subtitles = cfg.autoSubtitle
      ? await this.generateSubtitles(commentary, cfg)
      : [];

    // 计算最终时长
    const finalDuration = clips.reduce((sum, c) => sum + c.duration, 0);
    
    const result: EnhancedCommentaryResult = {
      videoId: uuidv4(),
      originalDuration: analysis.duration,
      finalDuration,
      analysis,
      clips,
      commentary,
      backgroundMusic,
      subtitles,
      metadata: {
        config: cfg,
        processedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
      },
    };

    logger.info('[EnhancedCommentary] 处理完成', {
      duration: result.finalDuration,
      clips: clips.length,
      commentary: commentary.length,
    });

    return result;
  }

  /**
   * 分析视频
   */
  private async analyzeVideo(
    videoData: ArrayBuffer,
    _config: EnhancedCommentaryConfig
  ): Promise<VideoAnalysisResult> {
    logger.info('[EnhancedCommentary] 视频分析中...');
    
    // 创建默认 VideoInfo 对象
    const defaultVideoInfo: VideoInfo = {
      id: uuidv4(),
      name: 'video',
      path: '',
      duration: 0,
      width: 1920,
      height: 1080,
      size: 0,
      fps: 30,
      format: 'mp4',
    };
    
    // 调用 Vision 服务进行视频分析
    const visionResult = await visionService.analyzeVideo(defaultVideoInfo);
    
    // 调用 SmartCut 服务进行智能分析
    const smartCutResult = await smartCutService.process(defaultVideoInfo);
    
    return {
      videoId: uuidv4(),
      duration: visionResult.duration || 0,
      scenes: this.convertScenes(smartCutResult.sceneChanges),
      emotions: [], // 从 visionResult 提取
      audioPeaks: this.convertAudioPeaks(smartCutResult.audioPeaks),
      keyframes: [], // 从 visionResult 提取
      transcript: visionResult.transcript,
    };
  }

  /**
   * 生成剪辑片段
   */
  private async generateClips(
    analysis: VideoAnalysisResult,
    _config: EnhancedCommentaryConfig
  ): Promise<ClipSegment[]> {
    logger.info('[EnhancedCommentary] 生成剪辑片段...');
    
    // 使用 SmartCut 的精彩片段
    const smartResult = await smartCutService.process(new ArrayBuffer(0));
    
    return smartResult.highlights.map((hl, index) => ({
      id: uuidv4(),
      sourceIndex: 0,
      startTime: hl.startTime,
      endTime: hl.endTime,
      duration: hl.endTime - hl.startTime,
      transition: index > 0 ? 'fade' : undefined,
      reason: hl.reasons.join(', '),
    }));
  }

  /**
   * 生成解说
   */
  private async generateCommentary(
    analysis: VideoAnalysisResult,
    _config: EnhancedCommentaryConfig
  ): Promise<CommentarySegment[]> {
    logger.info('[EnhancedCommentary] 生成解说...');
    
    // 调用 AI 服务生成解说
    const scriptResult = await aiService.generateScript(
      'openai',
      '',
      { videoDuration: 0, scenes: [], language: 'zh-CN' },
      { 
        style: config.scriptStyle,
        tone: config.scriptTone,
      }
    );
    
    // generateScript 返回 string，需要自行解析
    const scriptText = typeof scriptResult === 'string' ? scriptResult : String(scriptResult);
    const lines = scriptText.split('\n').filter((l: string) => l.trim());
    
    // 转换为解说片段
    return lines.map((line: string, idx: number) => ({
      id: uuidv4(),
      videoStartTime: idx * 10,
      videoEndTime: (idx + 1) * 10,
      text: line,
    }));
  }

  /**
   * 选择配乐
   */
  private async selectMusic(
    analysis: VideoAnalysisResult,
    _config: EnhancedCommentaryConfig
  ): Promise<MusicSegment[]> {
    logger.info('[EnhancedCommentary] 选择配乐...');
    
    // 根据视频情绪和风格选择配乐
    return [{
      id: uuidv4(),
      startTime: 0,
      endTime: analysis.duration,
      url: `music/${config.musicStyle}.mp3`,
      volume: 0.3,
      fadeIn: 2,
      fadeOut: 2,
    }];
  }

  /**
   * 生成字幕
   */
  private generateSubtitles(
    commentary: CommentarySegment[],
    _config: EnhancedCommentaryConfig
  ): SubtitleEntry[] {
    return commentary.map(c => ({
      id: uuidv4(),
      startTime: c.videoStartTime,
      endTime: c.videoEndTime,
      text: c.text,
    }));
  }

  /**
   * 转换场景
   */
  private convertScenes(scenes: SceneChange[]): SceneInfo[] {
    return scenes.map(s => ({
      startTime: s.startTime,
      endTime: s.endTime,
      type: 'action' as const,
      score: s.score,
    }));
  }

  /**
   * 转换音频峰值
   */
  private convertAudioPeaks(peaks: AudioPeak[]): AudioPeakInfo[] {
    return peaks.map(p => ({
      timestamp: p.timestamp,
      type: p.type as AudioPeakInfo["type"],
      volume: p.score,
    }));
  }
}

export const enhancedCommentaryService = new EnhancedCommentaryService();
export default EnhancedCommentaryService;
