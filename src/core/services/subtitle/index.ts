/**
 * 字幕服务模块
 * 统一导出所有字幕相关服务
 *
 * 重构说明：
 * - 原 subtitleService.ts (558行) 拆分为 2 个独立服务
 * - whisperService.ts: Whisper 模型管理和语音转录
 * - subtitleService.ts: 字幕格式处理、翻译和渲染
 */

// 导出字幕服务
export {
  SubtitleService,
  subtitleService,
  type SubtitleStyle,
  type SubtitleTrack,
  type SubtitleExtractOptions,
  type SubtitleTranslateOptions,
} from './subtitle-service';

// 导出 Whisper 服务
export {
  WhisperService,
  whisperService,
  type WhisperSegment,
  type WhisperResult,
  type WhisperModelInfo,
  type WhisperProgress,
} from './whisper-service';
