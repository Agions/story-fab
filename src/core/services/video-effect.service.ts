/**
 * 视频特效服务
 * 提供滤镜、转场、动画等视觉效果
 */

// 特效配置
export interface EffectConfig {
  filter: FilterEffect;
  transition: TransitionEffect;
  animation: AnimationEffect;
  colorCorrection: ColorCorrection;
}

// 滤镜效果
export interface FilterEffect {
  enabled: boolean;
  type: 'none' | 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast' | 'saturate' | 'hue-rotate';
  intensity: number;
}

// 转场效果
export interface TransitionEffect {
  enabled: boolean;
  type: 'none' | 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'glitch';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

// 动画效果
export interface AnimationEffect {
  enabled: boolean;
  type: 'none' | 'fade-in' | 'fade-out' | 'slide-in' | 'zoom-in' | 'bounce' | 'pulse';
  duration: number;
  delay: number;
}

// 颜色校正
export interface ColorCorrection {
  enabled: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  temperature: number;
  tint: number;
}

// 预设特效
export interface EffectPreset {
  id: string;
  name: string;
  category: 'filter' | 'transition' | 'color' | 'animation';
  config: Partial<EffectConfig>;
}

// 内置预设
export const EFFECT_PRESETS: EffectPreset[] = [
  { id: 'vintage', name: '复古', category: 'filter', config: { filter: { type: 'sepia', intensity: 0.6, enabled: true } } },
  { id: 'noir', name: '黑白电影', category: 'filter', config: { filter: { type: 'grayscale', intensity: 1, enabled: true } } },
  { id: 'vibrant', name: '鲜艳', category: 'filter', config: { filter: { type: 'saturate', intensity: 1.5, enabled: true } } },
  { id: 'warm', name: '暖色调', category: 'color', config: { colorCorrection: { enabled: true, temperature: 30 } } },
  { id: 'cool', name: '冷色调', category: 'color', config: { colorCorrection: { enabled: true, temperature: -30 } } },
  { id: 'smooth-fade', name: '平滑淡入淡出', category: 'transition', config: { transition: { type: 'fade', duration: 1, enabled: true } } },
];

const DEFAULT_CONFIG: EffectConfig = {
  filter: { enabled: false, type: 'none', intensity: 0 },
  transition: { enabled: false, type: 'none', duration: 0.5 },
  animation: { enabled: false, type: 'none', duration: 0.5, delay: 0 },
  colorCorrection: { enabled: false, brightness: 0, contrast: 0, saturation: 0, hue: 0, temperature: 0, tint: 0 },
};

class VideoEffectService {
  private config: EffectConfig;

  constructor(config: Partial<EffectConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  applyPreset(presetId: string): void {
    const preset = EFFECT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      this.config = { ...this.config, ...preset.config };
    }
  }

  getPresets(category?: string): EffectPreset[] {
    if (category) return EFFECT_PRESETS.filter(p => p.category === category);
    return EFFECT_PRESETS;
  }

  getCSSFilter(): string {
    if (!this.config.filter.enabled) return 'none';
    const { type, intensity } = this.config.filter;
    const map: Record<string, string> = {
      grayscale: `grayscale(${intensity})`,
      sepia: `sepia(${intensity})`,
      blur: `blur(${intensity * 10}px)`,
      brightness: `brightness(${1 + intensity})`,
      contrast: `contrast(${1 + intensity})`,
      saturate: `saturate(${1 + intensity})`,
      'hue-rotate': `hue-rotate(${intensity * 360}deg)`,
    };
    return map[type] || 'none';
  }

  applyToVideoElement(video: HTMLVideoElement): void {
    video.style.filter = this.getCSSFilter();
  }

  getConfig(): EffectConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<EffectConfig>): void {
    this.config = { ...this.config, ...config };
  }

  reset(): void {
    this.config = { ...DEFAULT_CONFIG };
  }
}

export const videoEffectService = new VideoEffectService();
export default videoEffectService;
