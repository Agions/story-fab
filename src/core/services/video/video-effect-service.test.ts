/**
 * Video Effect Service — 单元测试
 */

import { describe, it, expect } from 'vitest';
import { VideoEffectService, videoEffectService, EFFECT_PRESETS } from './video-effect-service';

describe('VideoEffectService', () => {
  describe('constructor', () => {
    it('creates with default config when no args', () => {
      const svc = new VideoEffectService();
      expect(svc.getConfig()).toEqual({
        filter: { enabled: false, type: 'none', intensity: 0 },
        transition: { enabled: false, type: 'none', duration: 0.5 },
        animation: { enabled: false, type: 'none', duration: 0.5, delay: 0 },
        colorCorrection: { enabled: false, brightness: 0, contrast: 0, saturation: 0, hue: 0, temperature: 0, tint: 0 },
      });
    });

    it('merges partial config', () => {
      const svc = new VideoEffectService({
        filter: { enabled: true, type: 'grayscale', intensity: 0.5 },
      });
      const cfg = svc.getConfig();
      expect(cfg.filter.enabled).toBe(true);
      expect(cfg.filter.type).toBe('grayscale');
      expect(cfg.transition.enabled).toBe(false);
    });
  });

  describe('applyPreset', () => {
    it('applies preset by id', () => {
      const svc = new VideoEffectService();
      svc.applyPreset('vintage');
      expect(svc.getConfig().filter.type).toBe('sepia');
      expect(svc.getConfig().filter.intensity).toBeCloseTo(0.6);
    });

    it('ignores unknown preset id', () => {
      const svc = new VideoEffectService();
      svc.applyPreset('nonexistent');
      expect(svc.getConfig()).toEqual({
        filter: { enabled: false, type: 'none', intensity: 0 },
        transition: { enabled: false, type: 'none', duration: 0.5 },
        animation: { enabled: false, type: 'none', duration: 0.5, delay: 0 },
        colorCorrection: { enabled: false, brightness: 0, contrast: 0, saturation: 0, hue: 0, temperature: 0, tint: 0 },
      });
    });
  });

  describe('getPresets', () => {
    it('returns all presets when no category', () => {
      expect(videoEffectService.getPresets()).toHaveLength(EFFECT_PRESETS.length);
    });

    it('filters by category', () => {
      expect(videoEffectService.getPresets('filter')).toHaveLength(3);
    });
  });

  describe('getCSSFilter', () => {
    it('returns none when filter disabled', () => {
      const svc = new VideoEffectService();
      expect(svc.getCSSFilter()).toBe('none');
    });

    it('maps grayscale type', () => {
      const svc = new VideoEffectService({
        filter: { enabled: true, type: 'grayscale', intensity: 1 },
      });
      expect(svc.getCSSFilter()).toBe('grayscale(1)');
    });

    it('maps sepia type', () => {
      const svc = new VideoEffectService({
        filter: { enabled: true, type: 'sepia', intensity: 0.8 },
      });
      expect(svc.getCSSFilter()).toBe('sepia(0.8)');
    });

    it('maps blur type with px unit', () => {
      const svc = new VideoEffectService({
        filter: { enabled: true, type: 'blur', intensity: 0.5 },
      });
      expect(svc.getCSSFilter()).toBe('blur(5px)');
    });

    it('maps hue-rotate type with deg unit', () => {
      const svc = new VideoEffectService({
        filter: { enabled: true, type: 'hue-rotate', intensity: 0.5 },
      });
      expect(svc.getCSSFilter()).toBe('hue-rotate(180deg)');
    });

    it('returns none for unknown type', () => {
      const svc = new VideoEffectService({
        filter: { enabled: true, type: 'none', intensity: 1 },
      });
      expect(svc.getCSSFilter()).toBe('none');
    });
  });

  describe('applyToVideoElement', () => {
    it('sets style.filter on video element', () => {
      const svc = new VideoEffectService({
        filter: { enabled: true, type: 'grayscale', intensity: 1 },
      });
      const video = document.createElement('video');
      svc.applyToVideoElement(video);
      expect(video.style.filter).toBe('grayscale(1)');
    });
  });

  describe('updateConfig', () => {
    it('merges partial config', () => {
      const svc = new VideoEffectService();
      svc.updateConfig({ filter: { enabled: true, type: 'brightness', intensity: 0.2 } });
      const cfg = svc.getConfig();
      expect(cfg.filter.enabled).toBe(true);
      expect(cfg.filter.type).toBe('brightness');
      expect(cfg.transition.enabled).toBe(false);
    });
  });

  describe('reset', () => {
    it('restores default config', () => {
      const svc = new VideoEffectService();
      svc.applyPreset('noir');
      svc.reset();
      expect(svc.getConfig().filter.type).toBe('none');
      expect(svc.getConfig().filter.enabled).toBe(false);
    });
  });
});
