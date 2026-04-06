/**
 * 自动配乐服务
 * 支持本地上传 + 预置音乐库
 */
import { logger } from '@/utils/logger';

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
  source: 'preset' | 'upload';
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
  {
    id: 'preset-7',
    name: 'Morning Coffee',
    genre: 'folk',
    mood: ['calm', 'happy'],
    duration: 160,
    bpm: 95,
    tags: ['咖啡', '早晨', '轻松', '日常'],
    source: 'preset',
  },
  {
    id: 'preset-8',
    name: 'Retro Synthwave',
    genre: 'electronic',
    mood: ['energetic', 'tense'],
    duration: 180,
    bpm: 118,
    tags: ['复古', '合成器', '赛博朋克', '80s'],
    source: 'preset',
  },
  {
    id: 'preset-9',
    name: 'Tension Builder',
    genre: 'cinematic',
    mood: ['tense', 'emotional'],
    duration: 240,
    bpm: 80,
    tags: ['紧张', '悬疑', '纪录片', '铺垫'],
    source: 'preset',
  },
  {
    id: 'preset-10',
    name: 'Acoustic Morning',
    genre: 'folk',
    mood: ['calm', 'neutral'],
    duration: 140,
    bpm: 85,
    tags: ['原声', '吉他', '平静', '开场'],
    source: 'preset',
  },
  {
    id: 'preset-11',
    name: 'News Pulse',
    genre: 'electronic',
    mood: ['upbeat', 'neutral'],
    duration: 90,
    bpm: 115,
    tags: ['新闻', '信息流', '快节奏', '现代'],
    source: 'preset',
  },
  {
    id: 'preset-12',
    name: 'Cinematic Strings',
    genre: 'classical',
    mood: ['emotional', 'neutral'],
    duration: 220,
    bpm: 65,
    tags: ['弦乐', '电影', '抒情', '过渡'],
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
      id: `upload-${crypto.randomUUID()}`,
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
      id: `url-${crypto.randomUUID()}`,
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
