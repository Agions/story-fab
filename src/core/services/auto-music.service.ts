/**
 * 自动配乐服务
 * 根据视频内容智能推荐和匹配背景音乐
 */
import { logger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export type MusicGenre = 'pop' | 'electronic' | 'cinematic' | 'ambient' | 'rock' | 'jazz' | 'classical' | 'folk';
export type MusicMood = 'upbeat' | 'calm' | 'energetic' | 'emotional' | 'neutral' | 'happy' | 'sad' | 'tense';

export interface MusicTrack {
  id: string;
  name: string;
  artist?: string;
  genre: MusicGenre;
  mood: MusicMood[];
  duration: number; // 秒
  url?: string;
  localPath?: string;
  bpm?: number;
  tags: string[];
}

export interface MusicMatchResult {
  track: MusicTrack;
  score: number; // 0-1 匹配度
  startTime: number; // 建议开始时间
  fadeIn: number; // 淡入时间(秒)
  fadeOut: number; // 淡出时间(秒)
  volume: number; // 0-1
}

export interface AutoMusicConfig {
  /** 视频总时长 */
  videoDuration: number;
  /** 目标音乐风格 */
  preferredGenre?: MusicGenre;
  /** 目标音乐情绪 */
  preferredMood?: MusicMood;
  /** 是否循环播放 */
  loopEnabled?: boolean;
  /** 是否自动淡入淡出 */
  autoFade?: boolean;
  /** 音乐音量 */
  volume?: number;
}

export interface AutoMusicResult {
  tracks: MusicMatchResult[];
  totalDuration: number;
  recommendations: MusicTrack[];
}

/**
 * 预置背景音乐库
 */
const PRESET_MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: 'music-1',
    name: 'Inspiring Corporate',
    genre: 'cinematic',
    mood: ['upbeat', 'energetic'],
    duration: 180,
    bpm: 120,
    tags: ['企业', '励志', '积极', '片头'],
  },
  {
    id: 'music-2',
    name: 'Peaceful Ambient',
    genre: 'ambient',
    mood: ['calm', 'neutral'],
    duration: 240,
    bpm: 70,
    tags: ['氛围', '放松', '冥想', '背景'],
  },
  {
    id: 'music-3',
    name: 'Electronic Pulse',
    genre: 'electronic',
    mood: ['energetic', 'upbeat'],
    duration: 150,
    bpm: 128,
    tags: ['电子', '科技', '未来感', '节奏'],
  },
  {
    id: 'music-4',
    name: 'Emotional Piano',
    genre: 'classical',
    mood: ['emotional', 'sad'],
    duration: 200,
    bpm: 60,
    tags: ['钢琴', '情感', '感人', '叙事'],
  },
  {
    id: 'music-5',
    name: 'Happy Ukulele',
    genre: 'folk',
    mood: ['happy', 'upbeat'],
    duration: 120,
    bpm: 110,
    tags: ['尤克里里', '轻快', '阳光', '生活'],
  },
  {
    id: 'music-6',
    name: 'Cinematic Epic',
    genre: 'cinematic',
    mood: ['tense', 'energetic'],
    duration: 300,
    bpm: 90,
    tags: ['史诗', '大气', '电影', '高潮'],
  },
  {
    id: 'music-7',
    name: 'Chill Lounge',
    genre: 'electronic',
    mood: ['calm', 'neutral'],
    duration: 220,
    bpm: 85,
    tags: ['沙发音乐', '放松', '酒吧', '休息'],
  },
  {
    id: 'music-8',
    name: 'Rock Energy',
    genre: 'rock',
    mood: ['energetic', 'upbeat'],
    duration: 180,
    bpm: 140,
    tags: ['摇滚', '力量', '运动', '激情'],
  },
];

/**
 * 自动配乐服务
 */
export class AutoMusicService {
  private musicLibrary: MusicTrack[];
  private config: AutoMusicConfig;

  constructor(config?: Partial<AutoMusicConfig>) {
    this.musicLibrary = PRESET_MUSIC_LIBRARY;
    this.config = {
      videoDuration: 60,
      loopEnabled: true,
      autoFade: true,
      volume: 0.5,
      ...config,
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AutoMusicConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 根据视频分析推荐音乐
   */
  async recommendMusic(options?: Partial<AutoMusicConfig>): Promise<AutoMusicResult> {
    const config = { ...this.config, ...options };
    logger.info('自动配乐分析中...', config);

    // 根据偏好过滤音乐
    let filtered = this.musicLibrary;
    
    if (config.preferredGenre) {
      filtered = filtered.filter(m => m.genre === config.preferredGenre);
    }
    
    if (config.preferredMood) {
      filtered = filtered.filter(m => m.mood.includes(config.preferredMood!));
    }

    // 如果没有匹配的音乐，返回空建议
    if (filtered.length === 0) {
      filtered = this.musicLibrary;
    }

    // 计算匹配度并排序
    const scored = filtered.map(track => ({
      track,
      score: this.calculateMatchScore(track, config),
    }));

    scored.sort((a, b) => b.score - a.score);

    // 生成配乐建议
    const recommendations = scored.slice(0, 3).map(s => s.track);
    const tracks: MusicMatchResult[] = [];

    if (recommendations.length > 0) {
      const mainTrack = recommendations[0];
      const trackDuration = mainTrack.duration;
      const loopsNeeded = Math.ceil(config.videoDuration / trackDuration);
      
      for (let i = 0; i < loopsNeeded; i++) {
        tracks.push({
          track: mainTrack,
          score: 0.85,
          startTime: i * trackDuration,
          fadeIn: config.autoFade ? 2 : 0,
          fadeOut: config.autoFade && i === loopsNeeded - 1 ? 3 : 0,
          volume: config.volume || 0.5,
        });
      }
    }

    return {
      tracks,
      totalDuration: tracks.reduce((sum, t) => sum + t.track.duration, 0),
      recommendations,
    };
  }

  /**
   * 计算音乐匹配度
   */
  private calculateMatchScore(track: MusicTrack, config: AutoMusicConfig): number {
    let score = 0.5; // 基础分

    // 风格匹配
    if (config.preferredGenre && track.genre === config.preferredGenre) {
      score += 0.3;
    }

    // 情绪匹配
    if (config.preferredMood && track.mood.includes(config.preferredMood)) {
      score += 0.2;
    }

    // 时长适配 (越接近视频时长越好)
    const durationDiff = Math.abs(track.duration - config.videoDuration);
    if (durationDiff < 30) {
      score += 0.1;
    } else if (durationDiff < 60) {
      score += 0.05;
    }

    return Math.min(score, 1);
  }

  /**
   * 获取音乐库列表
   */
  getMusicLibrary(): MusicTrack[] {
    return this.musicLibrary;
  }

  /**
   * 按风格筛选音乐
   */
  filterByGenre(genre: MusicGenre): MusicTrack[] {
    return this.musicLibrary.filter(m => m.genre === genre);
  }

  /**
   * 按情绪筛选音乐
   */
  filterByMood(mood: MusicMood): MusicTrack[] {
    return this.musicLibrary.filter(m => m.mood.includes(mood));
  }

  /**
   * 搜索音乐
   */
  searchMusic(keyword: string): MusicTrack[] {
    const lower = keyword.toLowerCase();
    return this.musicLibrary.filter(m => 
      m.name.toLowerCase().includes(lower) ||
      m.tags.some(t => t.toLowerCase().includes(lower)) ||
      m.genre.toLowerCase().includes(lower)
    );
  }
}

// 导出单例
export const autoMusicService = new AutoMusicService();
export default autoMusicService;
