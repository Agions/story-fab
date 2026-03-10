/**
 * 智能字幕服务
 * 语音转字幕、翻译、导入导出
 * 
 * 实现说明：
 * - ASR: 使用 Web Speech API 或 Whisper API
 * - 翻译: 使用 LLM API
 * - 导出: 支持 SRT/ASS/VTT/LRC 格式
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { aiService } from './ai.service';

export interface SubtitleEntry {
  id: string;
  startTime: number; // 毫秒
  endTime: number;
  text: string;
  language?: string;
  confidence?: number; // 识别置信度
}

export interface SubtitleFormat {
  type: 'srt' | 'ass' | 'vtt' | 'lrc';
}

export interface SubtitleData {
  entries: SubtitleEntry[];
  language: string;
  format: SubtitleFormat;
}

export interface TranslationResult {
  original: string;
  translated: string;
  language: string;
}

export interface ASROptions {
  language?: string;
  model?: 'base' | 'small' | 'medium' | 'large';
  timestamp?: boolean;
}

export interface SubtitleStyle {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  position?: 'top' | 'bottom';
}

/**
 * 智能字幕服务
 */
export class SubtitleService {
  private apiKey?: string;

  /**
   * 配置 API 密钥
   */
  configure(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * 语音转字幕 (ASR)
   * 优先使用 Web Speech API，回退到模拟实现
   */
  async recognizeSpeech(
    audioBuffer: ArrayBuffer,
    options?: ASROptions
  ): Promise<SubtitleData> {
    const language = options?.language || 'zh-CN';
    logger.info('[Subtitle] 开始语音识别...', { language, model: options?.model });

    try {
      // 方法1: 尝试使用 Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        return await this.recognizeWithWebSpeech(audioBuffer, language);
      }

      // 方法2: 尝试使用 Whisper API
      if (this.apiKey) {
        return await this.recognizeWithWhisper(audioBuffer, options);
      }

      // 方法3: 返回示例数据（开发调试用）
      logger.warn('[Subtitle] 无可用 ASR 引擎，返回示例数据');
      return this.getSampleSubtitles(language);
    } catch (error) {
      logger.error('[Subtitle] 语音识别失败', error);
      throw error;
    }
  }

  /**
   * 使用 Web Speech API
   */
  private async recognizeWithWebSpeech(
    _audioBuffer: ArrayBuffer,
    language: string
  ): Promise<SubtitleData> {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (!SpeechRecognition) {
        reject(new Error('Speech API 不可用'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      const entries: SubtitleEntry[] = [];
      let currentId = 0;
      let lastEndTime = 0;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const text = result[0].transcript.trim();
            if (text) {
              const startTime = lastEndTime;
              const duration = text.length * 100; // 估算
              lastEndTime = startTime + duration;

              entries.push({
                id: uuidv4(),
                startTime,
                endTime: lastEndTime,
                text,
                language,
                confidence: result[0].confidence,
              });
            }
          }
        }
      };

      recognition.onerror = (error: any) => {
        logger.error('[Subtitle] Web Speech 识别错误', error);
        reject(error);
      };

      recognition.onend = () => {
        resolve({
          entries,
          language,
          format: { type: 'srt' },
        });
      };

      recognition.start();
      
      // 5秒后自动停止
      setTimeout(() => recognition.stop(), 5000);
    });
  }

  /**
   * 使用 Whisper API
   */
  private async recognizeWithWhisper(
    audioBuffer: ArrayBuffer,
    options?: ASROptions
  ): Promise<SubtitleData> {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', options?.model || 'whisper-1');
    formData.append('language', options?.language?.split('-')[0] || 'zh');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities', 'segment');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Whisper API 错误: ${response.statusText}`);
    }

    const data = await response.json();
    
    const entries: SubtitleEntry[] = data.segments?.map((seg: any) => ({
      id: uuidv4(),
      startTime: seg.start * 1000,
      endTime: seg.end * 1000,
      text: seg.text.trim(),
      language: options?.language || 'zh-CN',
      confidence: seg.avg_log_prob ? Math.exp(seg.avg_log_prob) : undefined,
    })) || [];

    return {
      entries,
      language: options?.language || 'zh-CN',
      format: { type: 'srt' },
    };
  }

  /**
   * 翻译字幕
   */
  async translateSubtitles(
    subtitles: SubtitleData,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<SubtitleData> {
    logger.info('[Subtitle] 翻译字幕', { 
      from: sourceLanguage || subtitles.language, 
      to: targetLanguage,
      count: subtitles.entries.length,
    });

    try {
      // 使用 LLM 进行翻译
      const translatedEntries = await Promise.all(
        subtitles.entries.map(async (entry) => {
          try {
            const translated = await this.translateText(entry.text, targetLanguage, sourceLanguage);
            return {
              ...entry,
              text: translated,
            };
          } catch (error) {
            logger.warn('[Subtitle] 翻译失败，使用原文', error);
            return entry;
          }
        })
      );

      return {
        ...subtitles,
        entries: translatedEntries,
        language: targetLanguage,
      };
    } catch (error) {
      logger.error('[Subtitle] 字幕翻译失败', error);
      throw error;
    }
  }

  /**
   * 翻译单条文本
   */
  private async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string> {
    if (!this.apiKey) {
      // 无 API 时返回原文
      return `[${targetLanguage}] ${text}`;
    }

    const prompt = `将以下${sourceLanguage || '中文'}文本翻译成${targetLanguage}，只返回翻译结果，不需要其他解释：\n\n${text}`;

    try {
      const response = await aiService.generateText(prompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
      });
      
      return response.text?.trim() || text;
    } catch (error) {
      logger.error('[Subtitle] 翻译请求失败', error);
      return text;
    }
  }

  /**
   * 生成字幕样式
   */
  generateStyle(style: SubtitleStyle): string {
    const styles: string[] = [];
    
    if (style.fontFamily) styles.push(`font-family: ${style.fontFamily}`);
    if (style.fontSize) styles.push(`font-size: ${style.fontSize}px`);
    if (style.color) styles.push(`color: ${style.color}`);
    if (style.backgroundColor) styles.push(`background-color: ${style.backgroundColor}`);
    
    return styles.join('; ');
  }

  /**
   * 导出 SRT 格式
   */
  exportToSRT(subtitles: SubtitleData): string {
    return subtitles.entries.map((entry, index) => {
      const startTime = this.formatSRTTime(entry.startTime);
      const endTime = this.formatSRTTime(entry.endTime);
      return `${index + 1}\n${startTime} --> ${endTime}\n${entry.text}\n`;
    }).join('\n');
  }

  /**
   * 导出 ASS 格式
   */
  exportToASS(subtitles: SubtitleData, style?: SubtitleStyle): string {
    const header = `[Script Info]
Title: ClipFlow Subtitles
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style?.fontFamily || 'Arial'},${style?.fontSize || 20},${style?.color || '&H00FFFFFF'},&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,${style?.position === 'top' ? '8' : '2'},10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    
    const events = subtitles.entries.map(entry => {
      const startTime = this.formatASSTime(entry.startTime);
      const endTime = this.formatASSTime(entry.endTime);
      return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${entry.text}`;
    }).join('\n');
    
    return header + events;
  }

  /**
   * 导出 VTT 格式
   */
  exportToVTT(subtitles: SubtitleData): string {
    let vtt = 'WEBVTT\n\n';
    vtt += subtitles.entries.map(entry => {
      const startTime = this.formatVTTTime(entry.startTime);
      const endTime = this.formatVTTTime(entry.endTime);
      return `${startTime} --> ${endTime}\n${entry.text}\n`;
    }).join('\n');
    return vtt;
  }

  /**
   * 导出 LRC 格式
   */
  exportToLRC(subtitles: SubtitleData): string {
    return subtitles.entries.map(entry => {
      const time = this.formatLRCTime(entry.startTime);
      return `[${time}]${entry.text}`;
    }).join('\n');
  }

  /**
   * 导出指定格式
   */
  export(subtitles: SubtitleData, format: SubtitleFormat['type']): string {
    switch (format) {
      case 'srt': return this.exportToSRT(subtitles);
      case 'ass': return this.exportToASS(subtitles);
      case 'vtt': return this.exportToVTT(subtitles);
      case 'lrc': return this.exportToLRC(subtitles);
      default: return this.exportToSRT(subtitles);
    }
  }

  /**
   * 导入 SRT 格式
   */
  importFromSRT(content: string): SubtitleData {
    const entries: SubtitleEntry[] = [];
    const blocks = content.trim().split(/\n\n+/);
    
    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;
      
      const timeLine = lines[1];
      const timeMatch = timeLine.match(
        /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
      );
      
      if (!timeMatch) continue;
      
      const startTime = 
        parseInt(timeMatch[1]) * 3600000 +
        parseInt(timeMatch[2]) * 60000 +
        parseInt(timeMatch[3]) * 1000 +
        parseInt(timeMatch[4]);
        
      const endTime = 
        parseInt(timeMatch[5]) * 3600000 +
        parseInt(timeMatch[6]) * 60000 +
        parseInt(timeMatch[7]) * 1000 +
        parseInt(timeMatch[8]);
        
      const text = lines.slice(2).join('\n');
      
      entries.push({
        id: uuidv4(),
        startTime,
        endTime,
        text,
      });
    }
    
    return {
      entries,
      language: 'unknown',
      format: { type: 'srt' },
    };
  }

  /**
   * 导入文件（自动检测格式）
   */
  async importFromFile(file: File): Promise<SubtitleData> {
    const content = await file.text();
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    switch (ext) {
      case 'srt': return this.importFromSRT(content);
      // 可扩展其他格式
      default: throw new Error(`不支持的格式: ${ext}`);
    }
  }

  /**
   * 示例字幕数据
   */
  private getSampleSubtitles(language: string): SubtitleData {
    return {
      entries: [
        { id: uuidv4(), startTime: 0, endTime: 3000, text: '欢迎使用 ClipFlow', language },
        { id: uuidv4(), startTime: 3500, endTime: 7000, text: 'AI 驱动的智能视频剪辑工具', language },
        { id: uuidv4(), startTime: 7500, endTime: 12000, text: '让创作变得更简单', language },
      ],
      language,
      format: { type: 'srt' },
    };
  }

  // ==================== 时间格式化 ====================

  private formatSRTTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms %  1000);
60000) /    const milliseconds = ms % 1000;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }

  private formatASSTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  private formatVTTTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }

  private formatLRCTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }
}

export const subtitleService = new SubtitleService();
export default SubtitleService;
