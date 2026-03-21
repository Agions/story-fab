/**
 * 自动配乐服务
 * 支持本地上传 + AI音乐API推荐
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
  url?: string;          // 在线URL
  localPath?: string;    // 本地文件路径
  bpm?: number;
  tags: string[];
  source: 'preset' | 'upload' | 'ai';
}

export interface MusicMatchResult {
  track: MusicTrack;
  score: number; // 0-1 匹配度
  startTime: number;
  fadeIn: number;
  fadeOut: number;
  volume: number;
}

export interface AutoMusicConfig {
  videoDuration: number;
  preferredGenre?: MusicGenre;
  preferredMood?: MusicMood;
  loopEnabled?: boolean;
  autoFade?: boolean;
  volume?: number;
}

export interface AutoMusicResult {
  tracks: MusicMatchResult[];
  totalDuration: number;
  recommendations: MusicTrack[];
}

export interface MusicUploadOptions {
  file: File;
  name?: string;
  genre?: MusicGenre;
  mood?: MusicMood[];
  tags?: string[];
}

export interface AIMusicRecommendOptions {
  videoDescription?: string;
  videoTags?: string[];
  genre?: MusicGenre;
  mood?: MusicMood;
  duration?: number;
}

/**
 * 预置背景音乐库
 */
const PRESET_MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: 'preset-1',
    name: 'Inspiring Corporate',
    genre: 'cinematic',
    mood: ['upbeat', 'energetic'],
    duration: 180,
    bpm: 120,
    tags: ['企业', '励志', '积极', '片头'],
    source: 'preset',
  },
  {
    id: 'preset-2',
    name: 'Peaceful Ambient',
    genre: 'ambient',
    mood: ['calm', 'neutral'],
    duration: 240,
    bpm: 70,
    tags: ['氛围', '放松', '冥想', '背景'],
    source: 'preset',
  },
  {
    id: 'preset-3',
    name: 'Electronic Pulse',
    genre: 'electronic',
    mood: ['energetic', 'upbeat'],
    duration: 150,
    bpm: 128,
    tags: ['电子', '科技', '未来感', '节奏'],
    source: 'preset',
  },
  {
    id: 'preset-4',
    name: 'Emotional Piano',
    genre: 'classical',
    mood: ['emotional', 'sad'],
    duration: 200,
    bpm: 60,
    tags: ['钢琴', '情感', '感人', '叙事'],
    source: 'preset',
  },
  {
    id: 'preset-5',
    name: 'Happy Ukulele',
    genre: 'folk',
    mood: ['happy', 'upbeat'],
    duration: 120,
    bpm: 110,
    tags: ['尤克里里', '轻快', '阳光', '生活'],
    source: 'preset',
  },
  {
    id: 'preset-6',
    name: 'Cinematic Epic',
    genre: 'cinematic',
    mood: ['tense', 'energetic'],
    duration: 300,
    bpm: 90,
    tags: ['史诗', '大气', '电影', '高潮'],
    source: 'preset',
  },
];

/**
 * 自动配乐服务
 */
export class AutoMusicService {
  private presetLibrary: MusicTrack[];
  private userLibrary: MusicTrack[];
  private config: AutoMusicConfig;
  private aiApiKey?: string;
  private aiApiEndpoint?: string;

  constructor(config?: Partial<AutoMusicConfig>) {
    this.presetLibrary = PRESET_MUSIC_LIBRARY;
    this.userLibrary = [];
    this.config = {
      videoDuration: 60,
      loopEnabled: true,
      autoFade: true,
      volume: 0.5,
      ...config,
    };
  }

  /**
   * 配置AI音乐API
   */
  configureAIApi(apiKey: string, endpoint?: string): void {
    this.aiApiKey = apiKey;
    this.aiApiEndpoint = endpoint;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AutoMusicConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取完整音乐库（预置 + 用户上传）
   */
  getMusicLibrary(): MusicTrack[] {
    return [...this.presetLibrary, ...this.userLibrary];
  }

  /**
   * 获取预置音乐
   */
  getPresetLibrary(): MusicTrack[] {
    return [...this.presetLibrary];
  }

  /**
   * 获取用户上传的音乐
   */
  getUserLibrary(): MusicTrack[] {
    return [...this.userLibrary];
  }

  /**
   * 本地上传音乐
   */
  async uploadMusic(options: MusicUploadOptions): Promise<MusicTrack> {
    const { file, name, genre = 'electronic', mood = ['neutral'], tags = [] } = options;

    // 获取音频时长
    const duration = await this.getAudioDuration(file);
    
    const track: MusicTrack = {
      id: `upload-${uuidv4()}`,
      name: name || file.name.replace(/\.[^/.]+$/, ''),
      genre,
      mood,
      duration: Math.round(duration),
      localPath: URL.createObjectURL(file),
      tags: ['用户上传', ...tags],
      source: 'upload',
    };

    this.userLibrary.push(track);
    logger.info('音乐上传成功:', track.name);
    
    return track;
  }

  /**
   * 从URL添加在线音乐
   */
  async addMusicFromUrl(url: string, metadata: Partial<MusicTrack>): Promise<MusicTrack> {
    const track: MusicTrack = {
      id: `url-${uuidv4()}`,
      name: metadata.name || '在线音乐',
      genre: metadata.genre || 'electronic',
      mood: metadata.mood || ['neutral'],
      duration: metadata.duration || 180,
      url,
      tags: metadata.tags || ['在线'],
      source: 'preset',
    };

    this.presetLibrary.push(track);
    return track;
  }

  /**
   * 删除用户上传的音乐
   */
  removeMusic(musicId: string): boolean {
    const index = this.userLibrary.findIndex(m => m.id === musicId);
    if (index > -1) {
      const track = this.userLibrary[index];
      // 释放URL对象
      if (track.localPath && track.source === 'upload') {
        URL.revokeObjectURL(track.localPath);
      }
      this.userLibrary.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * AI音乐推荐（需要API）
   */
  async recommendAIMusic(options: AIMusicRecommendOptions): Promise<MusicTrack[]> {
    // 如果没有配置API，返回空
    if (!this.aiApiKey) {
      logger.warn('未配置AI音乐API，请先配置或使用本地上传');
      return [];
    }

    // TODO: 实现AI音乐API调用
    // 可接入的服务：
    // - Suno AI (https://suno.ai/) - 主要推荐，支持情绪/风格生成
    // - Udio (https://udio.ai/) - 备选方案
    // - ElevenLabs (音频增强) - 用于音频后处理
    
    logger.info('AI音乐推荐:', options);
    
    // 模拟API调用
    try {
      // 这里应该调用实际的AI音乐生成API
      // const response = await fetch(this.aiApiEndpoint || 'https://api.suno.ai/generate', {...});
      
      // 暂时返回空，等待实际API接入
      return [];
    } catch (error) {
      logger.error('AI音乐推荐失败:', { error });
      return [];
    }
  }

  /**
   * 根据视频分析推荐音乐（使用本地库）
   */
  async recommendMusic(options?: Partial<AutoMusicConfig>): Promise<AutoMusicResult> {
    const config = { ...this.config, ...options };
    logger.info('音乐推荐分析中...', config);

    const library = this.getMusicLibrary();
    let filtered = library;
    
    if (config.preferredGenre) {
      filtered = filtered.filter(m => m.genre === config.preferredGenre);
    }
    
    if (config.preferredMood) {
      filtered = filtered.filter(m => m.mood.includes(config.preferredMood!));
    }

    if (filtered.length === 0) {
      filtered = library;
    }

    // 计算匹配度
    const scored = filtered.map(track => ({
      track,
      score: this.calculateMatchScore(track, config),
    }));

    scored.sort((a, b) => b.score - a.score);

    const recommendations = scored.slice(0, 5).map(s => s.track);
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
   * 计算匹配度
   */
  private calculateMatchScore(track: MusicTrack, config: AutoMusicConfig): number {
    let score = 0.5;

    if (config.preferredGenre && track.genre === config.preferredGenre) {
      score += 0.3;
    }

    if (config.preferredMood && track.mood.includes(config.preferredMood)) {
      score += 0.2;
    }

    const durationDiff = Math.abs(track.duration - config.videoDuration);
    if (durationDiff < 30) score += 0.1;
    else if (durationDiff < 60) score += 0.05;

    return Math.min(score, 1);
  }

  /**
   * 获取音频文件时长
   */
  private getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => reject(new Error('无法读取音频文件'));
      audio.src = URL.createObjectURL(file);
    });
  }

  /**
   * 筛选音乐
   */
  filterMusic(genre?: MusicGenre, mood?: MusicMood): MusicTrack[] {
    let library = this.getMusicLibrary();
    
    if (genre) {
      library = library.filter(m => m.genre === genre);
    }
    if (mood) {
      library = library.filter(m => m.mood.includes(mood));
    }
    
    return library;
  }

  /**
   * 搜索音乐
   */
  searchMusic(keyword: string): MusicTrack[] {
    const lower = keyword.toLowerCase();
    return this.getMusicLibrary().filter(m => 
      m.name.toLowerCase().includes(lower) ||
      m.tags.some(t => t.toLowerCase().includes(lower)) ||
      m.genre.toLowerCase().includes(lower)
    );
  }
}

export const autoMusicService = new AutoMusicService();
export default autoMusicService;
