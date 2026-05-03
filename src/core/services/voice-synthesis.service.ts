/**
 * 语音合成服务
 * 通过 Tauri invoke 调用 Rust synthesize_speech 命令（Edge TTS 后端）
 *
 * 注意：此服务运行在 Tauri WebView 上下文中，
 * 通过 @tauri-apps/api/core 的 invoke 调用 Rust 后端，
 * 不使用任何 Node.js / child_process API。
 */

import { invoke } from '@tauri-apps/api/core';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../shared/utils/logging';

// ============================================
// 类型定义
// ============================================

export type TtsBackendName = 'edge';

export interface TtsBackend {
  name: TtsBackendName;
  label: string;
  description: string;
  requiresNetwork: boolean;
  requiresModelDownload: boolean;
  modelPath: string | null;
}

export interface VoiceConfig {
  voice: string;        // Edge TTS voice ID (e.g. zh-CN-YunxiNeural)
  language: string;      // zh-CN / en / ja / ko ...
  rate: number;          // 0.5 - 2.0 (speed multiplier)
  pitch: number;         // 0.5 - 2.0
  volume: number;        // 0.0 - 1.0
  format: 'mp3' | 'wav' | 'ogg';
  backend: TtsBackendName;
}

export interface VoiceItem {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female' | 'neutral';
}

export interface SynthesisResult {
  id: string;
  audioPath: string;   // 生成的音频文件路径
  duration: number;    // 秒
  text: string;
  config: VoiceConfig;
}

export interface SynthesisProgress {
  stage: 'queued' | 'synthesizing' | 'encoding' | 'done' | 'error';
  progress: number;
  message?: string;
}

// Rust Tauri 命令输入/输出
interface TauriSynthesizeInput {
  text: string;
  voice: string;
  speed: number;
  format: string;
  backend: string;
}

interface TauriSynthesizeOutput {
  audio_path: string;
  duration_secs: number;
}

// ============================================
// 内置音色映射（Edge TTS voices，中文优先，供 UI 下拉使用）
// ============================================

export const BUILTIN_VOICES: VoiceItem[] = [
  // 中文女声
  { id: 'zh-CN-XiaoxiaoNeural',   name: '晓晓（温柔女声）', lang: 'zh-CN', gender: 'female' },
  { id: 'zh-CN-XiaoyiNeural',     name: '小艺（活泼女声）', lang: 'zh-CN', gender: 'female' },
  { id: 'zh-CN-YunyangNeural',    name: '云扬（专业男声）', lang: 'zh-CN', gender: 'male' },
  { id: 'zh-CN-YunjianNeural',    name: '云健（运动男声）', lang: 'zh-CN', gender: 'male' },
  { id: 'zh-CN-YunxiNeural',      name: '云希（阳光男声）', lang: 'zh-CN', gender: 'male' },
  { id: 'zh-CN-YunxiaNeural',     name: '云夏（可爱男声）', lang: 'zh-CN', gender: 'male' },
  // 影视解说常用
  { id: 'zh-CN-liaoning-XiaobeiNeural', name: '小北（东北话）', lang: 'zh-CN', gender: 'female' },
  { id: 'zh-CN-shaanxi-XiaoniNeural',   name: '小妮（陕西话）', lang: 'zh-CN', gender: 'female' },
  // 英文
  { id: 'en-US-EmmaMultilingualNeural', name: 'Emma（英文女声）', lang: 'en', gender: 'female' },
  { id: 'en-US-GuyNeural',              name: 'Guy（英文男声）', lang: 'en', gender: 'male' },
  // 日文
  { id: 'ja-JP-NanamiNeural',      name: '七海（日文女声）', lang: 'ja', gender: 'female' },
  { id: 'ja-JP-KeitaNeural',       name: '圭太（日文男声）', lang: 'ja', gender: 'male' },
  // 韩文
  { id: 'ko-KR-SunhiNeural',        name: 'Sunhi（韩文女声）', lang: 'ko', gender: 'female' },
];

// 默认配置
const DEFAULT_CONFIG: VoiceConfig = {
  voice: 'zh-CN-YunxiNeural',
  language: 'zh-CN',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  format: 'mp3',
  backend: 'edge',
};

// ============================================
// 语音合成服务
// ============================================

export class VoiceSynthesisService {
  private config: VoiceConfig;

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 获取可用音色列表（内置，固定不变）
   * 真实音色列表由 edge-tts --list-voices 获取
   */
  getVoices(): VoiceItem[] {
    return BUILTIN_VOICES;
  }

  /**
   * 获取中文音色（优先推荐）
   */
  getChineseVoices(): VoiceItem[] {
    return BUILTIN_VOICES.filter(v => v.lang === 'zh-CN');
  }

  /**
   * 获取可用 TTS 后端列表（自动检测本地已安装的后端）
   */
  async listBackends(): Promise<TtsBackend[]> {
    try {
      return await invoke<TtsBackend[]>('list_tts_backends');
    } catch {
      return [];
    }
  }

  /**
   * 检查 TTS 是否可用（任一后端）
   */
  async checkAvailable(): Promise<boolean> {
    try {
      return await invoke<boolean>('check_tts_available');
    } catch {
      return false;
    }
  }

  /**
   * 获取安装指南 URL（用于提示用户安装）
   */
  getInstallGuide(backendName: TtsBackendName): { title: string; command: string; url: string } | null {
    switch (backendName) {
      case 'edge':
        return {
          title: '安装 Edge TTS',
          command: 'uv tool install edge-tts',
          url: 'https://github.com/rany2/edge-tts',
        };
      default:
        return null;
    }
  }

  /**
   * 预览语音（浏览器 Web Speech，仅用于快速试听）
   * 注意：预览使用浏览器合成器，与最终合成音色可能不同
   */
  preview(text: string): void {
    if (typeof window === 'undefined') return;
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.config.language;
      utterance.rate = this.config.rate;
      utterance.pitch = this.config.pitch;
      utterance.volume = this.config.volume;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      logger.warn('[VoiceSynthesis] Preview not available:', error);
    }
  }

  /**
   * 文字转语音（通过 Tauri invoke 调用 Rust edge-tts）
   * @param text 合成文本
   * @param options 合成选项
   * @param onProgress 进度回调
   */
  async synthesize(
    text: string,
    options?: Partial<VoiceConfig>,
    onProgress?: (p: SynthesisProgress) => void
  ): Promise<SynthesisResult> {
    const config = { ...this.config, ...options };
    const id = uuidv4();

    onProgress?.({ stage: 'queued', progress: 10, message: '准备合成...' });
    onProgress?.({ stage: 'synthesizing', progress: 30, message: '正在合成...' });

    try {
      const input: TauriSynthesizeInput = {
        text,
        voice: config.voice,
        speed: config.rate,
        format: config.format,
        backend: config.backend,
      };

      const output = await invoke<TauriSynthesizeOutput>('synthesize_speech', { input });

      onProgress?.({ stage: 'encoding', progress: 90, message: '编码完成...' });
      onProgress?.({ stage: 'done', progress: 100 });

      logger.info('[VoiceSynthesis] Synthesized:', {
        id,
        voice: config.voice,
        duration: output.duration_secs,
        textLength: text.length,
      });

      return {
        id,
        audioPath: output.audio_path,
        duration: output.duration_secs,
        text,
        config,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onProgress?.({ stage: 'error', progress: 0, message });
      logger.error('[VoiceSynthesis] synthesize failed:', error);
      throw error;
    }
  }

  /**
   * 合成并读取为 ArrayBuffer（适合 Web 环境播放）
   */
  async synthesizeToBuffer(
    text: string,
    options?: Partial<VoiceConfig>,
    onProgress?: (p: SynthesisProgress) => void
  ): Promise<{ buffer: ArrayBuffer; duration: number; contentType: string }> {
    const result = await this.synthesize(text, options, onProgress);

    // 通过 Tauri 插件读取文件（而不是 Node.js fs）
    const { readFile } = await import('@tauri-apps/plugin-fs');
    const bytes = await readFile(result.audioPath);

    const contentType = result.config.format === 'wav'
      ? 'audio/wav'
      : result.config.format === 'ogg'
        ? 'audio/ogg'
        : 'audio/mpeg';

    return {
      buffer: bytes.buffer as ArrayBuffer,
      duration: result.duration,
      contentType,
    };
  }

  /**
   * 生成语音并下载到指定路径
   */
  async synthesizeAndSave(
    text: string,
    outputPath: string,
    options?: Partial<VoiceConfig>,
    onProgress?: (p: SynthesisProgress) => void
  ): Promise<SynthesisResult> {
    const result = await this.synthesize(text, options, onProgress);

    // 移动文件到目标路径
    const { readFile, writeFile, remove } = await import('@tauri-apps/plugin-fs');
    const bytes = await readFile(result.audioPath);
    await writeFile(outputPath, bytes);
    await remove(result.audioPath);

    return { ...result, audioPath: outputPath };
  }

  /**
   * 获取当前配置
   */
  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// 导出单例
export const voiceSynthesisService = new VoiceSynthesisService();
export default voiceSynthesisService;
