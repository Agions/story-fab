import { describe, it, expect } from 'vitest';
import { PLATFORM_PRESETS, getPreset, type PlatformPreset } from './platform-presets';

describe('PlatformPresets', () => {
  it('should have all 7 platforms', () => {
    const keys = Object.keys(PLATFORM_PRESETS).sort();
    expect(keys).toEqual(['bilibili', 'douyin', 'kuaishou', 'tiktok', 'video号', 'xiaohongshu', 'youtube'].sort());
  });

  it('should return correct aspect ratio for douyin', () => {
    const preset = getPreset('douyin');
    expect(preset.aspectRatio).toBe('9:16');
    expect(preset.resolution.height).toBe(1920);
  });

  it('should return correct aspect ratio for bilibili', () => {
    const preset = getPreset('bilibili');
    expect(preset.aspectRatio).toBe('16:9');
    expect(preset.resolution.width).toBe(1920);
  });

  it('should throw for unknown platform', () => {
    expect(() => getPreset('unknown' as any)).toThrow();
  });

  it('should have frameRate and bitratePreset for all platforms', () => {
    Object.values(PLATFORM_PRESETS).forEach((preset: PlatformPreset) => {
      expect(typeof preset.frameRate).toBe('number');
      expect(['low', 'medium', 'high', 'ultra']).toContain(preset.bitratePreset);
    });
  });
});