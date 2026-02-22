/**
 * 字幕服务
 * 支持语音转文字、自动字幕生成
 */

import { v4 as uuidv4 } from 'uuid';

// 字幕配置
export interface SubtitleConfig {
  // 语言
  language: 'zh' | 'en' | 'ja' | 'ko' | 'auto';
  
  // 输出格式
  format: 'srt' | 'vtt' | 'ass' | 'txt';
  
  // 识别选项
  continuous: boolean;      // 连续识别
  interimResults: boolean; // 实时结果
  profanityFilter: boolean;// 脏话过滤
  
  // 翻译
  translateTo?: 'zh' | 'en' | 'ja';
}

// 字幕条目
export interface SubtitleEntry {
  id: string;
  index: number;
  startTime: number;  // 秒
  endTime: number;    // 秒
  text: string;
  confidence?: number;
}

// 字幕数据
export interface SubtitleData {
  id: string;
  language: string;
  entries: SubtitleEntry[];
  duration: number;
  createdAt: string;
}

// 语音识别结果
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

// 默认配置
const DEFAULT_CONFIG: SubtitleConfig = {
  language: 'auto',
  format: 'srt',
  continuous: true,
  interimResults: true,
  profanityFilter: false,
};

class SubtitleService {
  private config: SubtitleConfig;
  private recognition: any = null;
  private isListening: boolean = false;

  constructor(config: Partial<SubtitleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initRecognition();
  }

  /**
   * 初始化语音识别
   */
  private initRecognition(): void {
    // 使用 Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.lang = this.getLanguageCode(this.config.language);
    }
  }

  /**
   * 获取语言代码
   */
  private getLanguageCode(lang: string): string {
    const langMap: Record<string, string> = {
      'zh': 'zh-CN',
      'en': 'en-US',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'auto': 'zh-CN',
    };
    return langMap[lang] || 'zh-CN';
  }

  /**
   * 实时语音识别
   */
  onResult(callback: (result: SpeechRecognitionResult) => void): void {
    if (!this.recognition) {
      console.warn('语音识别不可用');
      return;
    }

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      callback({
        transcript: result[0].transcript,
        confidence: result[0].confidence,
        isFinal: result.isFinal,
        timestamp: Date.now(),
      });
    };
  }

  /**
   * 开始识别
   */
  start(): boolean {
    if (!this.recognition) {
      console.error('语音识别不可用');
      return false;
    }

    if (this.isListening) {
      return true;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('启动语音识别失败:', error);
      return false;
    }
  }

  /**
   * 停止识别
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * 生成字幕数据 (模拟)
   * 实际需要调用 Whisper API
   */
  async generateFromAudio(audioUrl: string): Promise<SubtitleData> {
    // 模拟生成字幕
    // 实际实现需要调用 Whisper API
    
    const entries: SubtitleEntry[] = [
      { id: uuidv4(), index: 1, startTime: 0, endTime: 3, text: '欢迎使用 ClipFlow', confidence: 0.95 },
      { id: uuidv4(), index: 2, startTime: 3, endTime: 6, text: '智能字幕生成功能', confidence: 0.93 },
      { id: uuidv4(), index: 3, startTime: 6, endTime: 10, text: '支持多种语言识别', confidence: 0.91 },
    ];

    return {
      id: uuidv4(),
      language: this.config.language === 'auto' ? 'zh' : this.config.language,
      entries,
      duration: 10,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 导出 SRT 格式
   */
  exportSRT(subtitles: SubtitleEntry[]): string {
    return subtitles.map(entry => {
      return `${entry.index}\n${this.formatSRTTime(entry.startTime)} --> ${this.formatSRTTime(entry.endTime)}\n${entry.text}\n`;
    }).join('\n');
  }

  /**
   * 导出 VTT 格式
   */
  exportVTT(subtitles: SubtitleEntry[]): string {
    const header = 'WEBVTT\n\n';
    const content = subtitles.map(entry => {
      return `${this.formatVTTTime(entry.startTime)} --> ${this.formatVTTTime(entry.endTime)}\n${entry.text}\n`;
    }).join('\n');
    return header + content;
  }

  /**
   * 格式化 SRT 时间
   */
  private formatSRTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  /**
   * 格式化 VTT 时间
   */
  private formatVTTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  /**
   * 导出字幕
   */
  export(subtitles: SubtitleEntry[], format?: string): string {
    const fmt = format || this.config.format;
    
    switch (fmt) {
      case 'srt':
        return this.exportSRT(subtitles);
      case 'vtt':
        return this.exportVTT(subtitles);
      case 'txt':
        return subtitles.map(e => e.text).join('\n');
      default:
        return this.exportSRT(subtitles);
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SubtitleConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.recognition) {
      this.recognition.lang = this.getLanguageCode(this.config.language);
    }
  }

  /**
   * 获取配置
   */
  getConfig(): SubtitleConfig {
    return { ...this.config };
  }
}

// 导出单例
export const subtitleService = new SubtitleService();
export default subtitleService;
