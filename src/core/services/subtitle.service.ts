/**
 * 字幕服务
 * 提供字幕生成、提取、翻译和渲染能力
 */

import { logger } from '@/utils/logger';
import type { SubtitleEntry } from '@/core/types';

// ============================================
// 类型定义
// ============================================

export interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  outline: boolean;
  outlineColor: string;
  position: 'top' | 'bottom' | 'center';
  alignment: 'left' | 'center' | 'right';
  opacity: number;
}

export interface SubtitleTrack {
  id: string;
  language: string;
  entries: SubtitleEntry[];
  style?: SubtitleStyle;
}

export interface SubtitleExtractOptions {
  language?: string;
  maxDuration?: number;
}

export interface SubtitleTranslateOptions {
  targetLanguage: string;
  apiKey?: string;
  provider?: 'google' | 'deepl' | 'youdao';
}

const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: 'Arial, sans-serif',
  fontSize: 24,
  color: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  outline: true,
  outlineColor: '#000000',
  position: 'bottom',
  alignment: 'center',
  opacity: 1,
};

// ============================================
// 字幕服务
// ============================================

class SubtitleService {
  /**
   * 从视频中提取字幕（OCR + ASR）
   * @param videoPath 视频路径
   * @param options 提取选项
   */
  async extractSubtitles(
    videoPath: string,
    options?: SubtitleExtractOptions
  ): Promise<SubtitleTrack> {
    const { language = 'zh-CN', maxDuration } = options || {};

    logger.info('[SubtitleService] 提取字幕:', { videoPath, language });

    // 导入 ASR 服务（延迟导入避免循环依赖）
    const { asrService } = await import('./asr.service');

    // 语言映射
    const langMap: Record<string, 'zh_cn' | 'en_us' | 'ja_jp' | 'ko_kr'> = {
      'zh-CN': 'zh_cn',
      'en': 'en_us',
      'ja-JP': 'ja_jp',
      'ko-KR': 'ko_kr',
    };

    try {
      // 调用 ASR 服务提取语音
      // 需要构建 VideoInfo 对象
      const videoInfo = {
        id: crypto.randomUUID(),
        path: videoPath,
        name: videoPath.split('/').pop() || 'video',
        duration: 0, // ASR 服务会自行获取
        size: 0,
        format: '',
        fps: 0,
        width: 0,
        height: 0,
        bitrate: 0,
        hasAudio: true,
        hasVideo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const asrResult = await asrService.recognizeSpeech(videoInfo, {
        language: langMap[language] || 'zh_cn',
        enableTimestamp: true,
        enablePunctuation: true,
      });

      // 转换 ASR 结果为字幕条目
      const entries: SubtitleEntry[] = asrResult.segments.map((segment, index) => ({
        id: `subtitle-${index}`,
        startTime: segment.startTime,
        endTime: segment.endTime,
        text: segment.text,
        confidence: segment.confidence,
      }));

      // 如果指定了最大时长，截断字幕
      let finalEntries = entries;
      if (maxDuration && entries.length > 0) {
        const lastValidIndex = entries.findIndex(e => e.endTime > maxDuration);
        if (lastValidIndex > 0) {
          finalEntries = entries.slice(0, lastValidIndex);
        }
      }

      logger.info('[SubtitleService] 字幕提取完成:', {
        count: finalEntries.length,
        language,
      });

      return {
        id: crypto.randomUUID(),
        language,
        entries: finalEntries,
        style: DEFAULT_SUBTITLE_STYLE,
      };
    } catch (error) {
      logger.error('[SubtitleService] ASR 识别失败:', error);
      // 返回空字幕而非抛出异常
      return {
        id: crypto.randomUUID(),
        language,
        entries: [],
        style: DEFAULT_SUBTITLE_STYLE,
      };
    }
  }

  /**
   * 生成字幕文件（SRT / VTT / ASS）
   * @param track 字幕轨道
   * @param format 格式
   */
  async generateSubtitleFile(
    track: SubtitleTrack,
    format: 'srt' | 'vtt' | 'ass'
  ): Promise<string> {
    logger.info('[SubtitleService] 生成字幕文件:', {
      trackId: track.id,
      format,
      entries: track.entries.length,
    });

    switch (format) {
      case 'srt':
        return this.toSRT(track);
      case 'vtt':
        return this.toVTT(track);
      case 'ass':
        return this.toASS(track);
      default:
        throw new Error(`不支持的格式: ${format}`);
    }
  }

  /**
   * 翻译字幕
   * @param track 字幕轨道
   * @param options 翻译选项
   */
  async translateSubtitles(
    track: SubtitleTrack,
    options: SubtitleTranslateOptions
  ): Promise<SubtitleTrack> {
    const { targetLanguage, apiKey, provider = 'google' } = options;

    logger.info('[SubtitleService] 翻译字幕:', {
      sourceLang: track.language,
      targetLang: targetLanguage,
      provider,
    });

    // TODO: 接入翻译 API（Google / DeepL / 有道）
    // 目前返回原字幕
    return {
      ...track,
      id: crypto.randomUUID(),
      language: targetLanguage,
    };
  }

  /**
   * 烧录字幕到视频
   * @param videoPath 视频路径
   * @param subtitlePath 字幕文件路径
   * @param outputPath 输出路径
   * @param style 字幕样式
   */
  async burnSubtitles(
    videoPath: string,
    subtitlePath: string,
    outputPath: string,
    style?: Partial<SubtitleStyle>
  ): Promise<string> {
    const mergedStyle = { ...DEFAULT_SUBTITLE_STYLE, ...style };

    logger.info('[SubtitleService] 烧录字幕:', {
      video: videoPath,
      subtitle: subtitlePath,
      output: outputPath,
    });

    // TODO: 通过 Tauri 后端调用 FFmpeg 烧录字幕
    return outputPath;
  }

  /**
   * 转为 SRT 格式
   */
  private toSRT(track: SubtitleTrack): string {
    return track.entries
      .map((entry, index) => {
        const start = this.formatSRTTime(entry.startTime);
        const end = this.formatSRTTime(entry.endTime);
        return `${index + 1}\n${start} --> ${end}\n${entry.text}`;
      })
      .join('\n\n');
  }

  /**
   * 转为 VTT 格式
   */
  private toVTT(track: SubtitleTrack): string {
    const header = 'WEBVTT\n\n';
    const body = track.entries
      .map((entry) => {
        const start = this.formatVTTTime(entry.startTime);
        const end = this.formatVTTTime(entry.endTime);
        return `${start} --> ${end}\n${entry.text}`;
      })
      .join('\n\n');
    return header + body;
  }

  /**
   * 转为 ASS 格式（Advanced SubStation Alpha）
   */
  private toASS(track: SubtitleTrack): string {
    const header = `[Script Info]
Title: Generated by CutDeck
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    const body = track.entries
      .map((entry) => {
        const start = this.formatASSTime(entry.startTime);
        const end = this.formatASSTime(entry.endTime);
        const text = entry.text.replace(/\n/g, '\\N');
        return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
      })
      .join('\n');

    return header + body;
  }

  private formatSRTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  private formatVTTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  private formatASSTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const cs = Math.floor((seconds % 1) * 100);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }
}

export const subtitleService = new SubtitleService();
export default subtitleService;
