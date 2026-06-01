/**
 * ASR 类型定义
 * Web Speech API 类型 + Rust Whisper 类型
 */

// ============================================
// Web Speech API 类型（TypeScript lib.dom.d.ts 不完整）
// ============================================

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
  [Symbol.iterator](): Iterator<SpeechRecognitionResult>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - _SpeechRecognitionEventMap reserved for future Web Speech API integration
export interface _SpeechRecognitionEventMap {
  'result': SpeechRecognitionEvent;
}

export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionCtor {
  new (): SpeechRecognition;
}

// Rust Whisper ASR 响应类型（来自 src-tauri/src/asr.rs）
export interface RustWhisperWord {
  word: string;
  start_ms: number;
  end_ms: number;
  probability: number;
}

export interface RustWhisperSegment {
  start_ms: number;
  end_ms: number;
  text: string;
  probability?: number;
  words?: RustWhisperWord[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore - _RustWhisperResult kept for backward compatibility with whisper backend payload
export interface _RustWhisperResult {
  segments: RustWhisperSegment[];
  language?: string;
  language_probability?: number;
}

export interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

// ============================================
// ASR Service 类型
// ============================================

export interface ASRResult {
  /** 识别的文本 */
  text: string;
  /** 分段结果 */
  segments: ASRSegment[];
  /** 语言 */
  language?: string;
  /** 置信度 */
  confidence?: number;
  /** 完整结果（含时间戳） */
  fullResult?: ASRFullResult[];
  /** 数据来源：rust-whisper | web-speech | mock */
  provider: 'rust-whisper' | 'web-speech' | 'mock';
}

export interface ASRSegment {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  words?: ASRWord[];
}

export interface ASRWord {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface ASRFullResult {
  start: number;
  end: number;
  text: string;
  confidence: number;
  words?: ASRWord[];
}

export interface ASROptions {
  /** 识别语言，默认为中文 */
  language?: 'zh_cn' | 'en_us' | 'ja_jp' | 'ko_kr';
  /** Whisper 模型大小，默认 base；高精度场景可选 large-v3 */
  model?: 'tiny' | 'base' | 'small' | 'medium' | 'large-v2' | 'large-v3';
  /** 是否启用时间戳 */
  enableTimestamp?: boolean;
  /** 是否启用标点 */
  enablePunctuation?: boolean;
  /** 采样率 */
  sampleRate?: number;
  /** 声道数 */
  channels?: 1 | 2;
}

export const DEFAULT_ASR_OPTIONS: Required<ASROptions> = {
  language: 'zh_cn',
  model: 'base',
  enableTimestamp: true,
  enablePunctuation: true,
  sampleRate: 16000,
  channels: 1,
};