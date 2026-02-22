/**
 * 语音合成服务
 * 支持文字转语音、多种声音选项
 */

import { v4 as uuidv4 } from 'uuid';

// 语音配置
export interface VoiceConfig {
  // 语音类型
  voice: 'male' | 'female' | 'neutral';
  
  // 语言
  language: 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';
  
  // 声音参数
  rate: number;     // 语速 0.1 - 10
  pitch: number;    // 音调 0 - 2
  volume: number;   // 音量 0 - 1
  
  // 输出格式
  format: 'audio/wav' | 'audio/mp3' | 'audio/ogg';
}

// 语音项
export interface VoiceItem {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female';
}

// 合成结果
export interface SynthesisResult {
  id: string;
  audioUrl?: string;
  audioBlob?: Blob;
  duration: number;
  text: string;
  config: VoiceConfig;
}

// 可用的语音列表
const AVAILABLE_VOICES: VoiceItem[] = [
  { id: 'zh-CN-female-1', name: '晓晓 (中文女声)', lang: 'zh-CN', gender: 'female' },
  { id: 'zh-CN-male-1', name: '云飞 (中文男声)', lang: 'zh-CN', gender: 'male' },
  { id: 'en-US-female-1', name: 'Samantha (English)', lang: 'en-US', gender: 'female' },
  { id: 'en-US-male-1', name: 'Daniel (English)', lang: 'en-US', gender: 'male' },
  { id: 'ja-JP-female-1', name: '日本語女性', lang: 'ja-JP', gender: 'female' },
  { id: 'ko-KR-male-1', name: '한국어 남자', lang: 'ko-KR', gender: 'male' },
];

// 默认配置
const DEFAULT_CONFIG: VoiceConfig = {
  voice: 'female',
  language: 'zh-CN',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  format: 'audio/wav',
};

class VoiceSynthesisService {
  private config: VoiceConfig;
  private synthesis: SpeechSynthesis;
  private audioContext: AudioContext | null = null;

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.synthesis = window.speechSynthesis;
    this.initAudioContext();
  }

  /**
   * 初始化 AudioContext
   */
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext 不可用:', error);
    }
  }

  /**
   * 获取可用语音列表
   */
  getVoices(): VoiceItem[] {
    // 先尝试获取系统语音
    const systemVoices = this.synthesis.getVoices();
    
    if (systemVoices && systemVoices.length > 0) {
      return systemVoices.map((voice: SpeechSynthesisVoice, index: number) => ({
        id: voice.voiceURI || `voice-${index}`,
        name: voice.name,
        lang: voice.lang,
        gender: voice.name.toLowerCase().includes('female') ? 'female' : 'male',
      }));
    }
    
    return AVAILABLE_VOICES;
  }

  /**
   * 预览语音
   */
  preview(text: string): void {
    this.speak(text, { preview: true });
  }

  /**
   * 文字转语音
   */
  speak(
    text: string, 
    options?: { 
      onStart?: () => void; 
      onEnd?: () => void; 
      onError?: (error: Error) => void;
      preview?: boolean;
    }
  ): SpeechSynthesisUtterance | null {
    // 停止当前播放
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 设置语音
    const voices = this.synthesis.getVoices();
    const selectedVoice = voices.find((v: SpeechSynthesisVoice) => 
      v.lang.startsWith(this.config.language.split('-')[0])
    );
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // 设置参数
    utterance.rate = this.config.rate;
    utterance.pitch = this.config.pitch;
    utterance.volume = this.config.volume;

    // 事件回调
    utterance.onstart = () => options?.onStart?.();
    utterance.onend = () => options?.onEnd?.();
    utterance.onerror = (event) => {
      console.error('语音合成错误:', event);
      options?.onError?.(new Error('语音合成失败'));
    };

    this.synthesis.speak(utterance);
    return utterance;
  }

  /**
   * 生成音频 (模拟)
   * 实际需要调用 TTS API
   */
  async synthesize(text: string): Promise<SynthesisResult> {
    // 模拟合成
    // 实际实现需要调用 ElevenLabs 或其他 TTS API
    
    const result: SynthesisResult = {
      id: uuidv4(),
      duration: text.length * 0.1, // 估算时长
      text,
      config: { ...this.config },
    };

    return new Promise((resolve) => {
      // 模拟异步生成
      setTimeout(() => {
        resolve(result);
      }, 500);
    });
  }

  /**
   * 生成语音并下载
   */
  async synthesizeAndDownload(text: string, filename?: string): Promise<void> {
    const result = await this.synthesize(text);
    
    // 创建下载链接
    // 实际需要生成真实音频
    console.log('合成完成:', result);
    
    // 触发下载
    // const url = URL.createObjectURL(result.audioBlob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = filename || 'speech.wav';
    // a.click();
  }

  /**
   * 暂停
   */
  pause(): void {
    this.synthesis.pause();
  }

  /**
   * 继续
   */
  resume(): void {
    this.synthesis.resume();
  }

  /**
   * 停止
   */
  stop(): void {
    this.synthesis.cancel();
  }

  /**
   * 是否正在播放
   */
  isSpeaking(): boolean {
    return this.synthesis.speaking;
  }

  /**
   * 获取配置
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
