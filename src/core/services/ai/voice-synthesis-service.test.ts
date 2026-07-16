/**
 * voice-synthesis-service 测试
 *
 * Stage 9 PR-3：TTS 配音服务覆盖
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the tauri module
vi.mock('@/core/tauri', () => ({
  tauri: {
    synthesizeSpeech: vi.fn().mockResolvedValue('/tmp/audio.mp3'),
    listTTSBackends: vi.fn().mockResolvedValue([{ id: 'edge', name: 'Edge TTS', voices: 12 }]),
    checkTTSAvailable: vi.fn().mockResolvedValue(true),
  },
}));

import { tauri } from '@/core/tauri';
import {
  BUILTIN_VOICES,
  voiceSynthesisService,
  VoiceSynthesisService,
} from './voice-synthesis-service';

describe('VoiceSynthesisService', () => {
  beforeEach(() => {
    // Restore default mock implementations after vi.clearAllMocks() in other tests
    vi.mocked(tauri.listTTSBackends).mockResolvedValue([{ id: 'edge', name: 'Edge TTS', voices: 12 }] as unknown as Awaited<ReturnType<typeof tauri.listTTSBackends>>);
    vi.mocked(tauri.checkTTSAvailable).mockResolvedValue(true);
    vi.mocked(tauri.synthesizeSpeech).mockResolvedValue('/tmp/audio.mp3');
  });

  describe('constructor + config', () => {
    it('uses defaults when no config provided', () => {
      const svc = new VoiceSynthesisService();
      const config = svc.getConfig();
      expect(config.voice).toBe('zh-CN-YunxiNeural');
      expect(config.language).toBe('zh-CN');
      expect(config.rate).toBe(1);
      expect(config.format).toBe('mp3');
      expect(config.backend).toBe('edge');
    });

    it('merges partial config with defaults', () => {
      const svc = new VoiceSynthesisService({ voice: 'en-US-GuyNeural', rate: 1.5 });
      const config = svc.getConfig();
      expect(config.voice).toBe('en-US-GuyNeural');
      expect(config.rate).toBe(1.5);
      expect(config.language).toBe('zh-CN'); // default preserved
    });

    it('getConfig returns a copy (not the internal reference)', () => {
      const svc = new VoiceSynthesisService();
      const c1 = svc.getConfig();
      c1.voice = 'MUTATED';
      const c2 = svc.getConfig();
      expect(c2.voice).toBe('zh-CN-YunxiNeural');
    });

    it('updateConfig merges and preserves unspecified fields', () => {
      const svc = new VoiceSynthesisService();
      svc.updateConfig({ pitch: 1.5 });
      const config = svc.getConfig();
      expect(config.pitch).toBe(1.5);
      expect(config.voice).toBe('zh-CN-YunxiNeural');
    });
  });

  describe('getVoices + getChineseVoices', () => {
    it('getVoices returns BUILTIN_VOICES', () => {
      const voices = voiceSynthesisService.getVoices();
      expect(voices.length).toBe(BUILTIN_VOICES.length);
      expect(voices[0]?.id).toBe('zh-CN-XiaoxiaoNeural');
    });

    it('getChineseVoices filters by lang=zh-CN', () => {
      const chinese = voiceSynthesisService.getChineseVoices();
      expect(chinese.length).toBeGreaterThan(0);
      for (const v of chinese) {
        expect(v.lang).toBe('zh-CN');
      }
    });

    it('BUILTIN_VOICES includes multiple languages', () => {
      const langs = new Set(BUILTIN_VOICES.map((v) => v.lang));
      expect(langs.has('zh-CN')).toBe(true);
      expect(langs.has('en')).toBe(true);
      expect(langs.has('ja')).toBe(true);
      expect(langs.has('ko')).toBe(true);
    });
  });

  describe('listBackends + checkAvailable', () => {
    it('listBackends returns tauri listTTSBackends result', async () => {
      const backends = await voiceSynthesisService.listBackends();
      expect(backends).toEqual([{ id: 'edge', name: 'Edge TTS', voices: 12 }]);
    });

    it('listBackends returns [] when tauri call fails', async () => {
      vi.mocked(tauri.listTTSBackends).mockRejectedValueOnce(new Error('backend error'));
      const backends = await voiceSynthesisService.listBackends();
      expect(backends).toEqual([]);
    });

    it('checkAvailable returns tauri result when successful', async () => {
      const result = await voiceSynthesisService.checkAvailable();
      expect(result).toBe(true);
    });

    it('checkAvailable returns false when tauri call fails', async () => {
      vi.mocked(tauri.checkTTSAvailable).mockRejectedValueOnce(new Error('not available'));
      const result = await voiceSynthesisService.checkAvailable();
      expect(result).toBe(false);
    });
  });

  describe('getInstallGuide', () => {
    it('returns Edge TTS guide for edge backend', () => {
      const guide = voiceSynthesisService.getInstallGuide('edge');
      expect(guide).not.toBeNull();
      expect(guide?.title).toContain('Edge TTS');
      expect(guide?.url).toContain('github.com');
    });

    it('returns null for unknown backend', () => {
      const guide = voiceSynthesisService.getInstallGuide('azure' as 'edge');
      expect(guide).toBeNull();
    });
  });

  describe('synthesize', () => {
    it('calls tauri.synthesizeSpeech and returns result', async () => {
      const result = await voiceSynthesisService.synthesize('你好世界');
      expect(tauri.synthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '你好世界',
          voice: 'zh-CN-YunxiNeural',
          format: 'mp3',
          backend: 'edge',
        }),
      );
      expect(result.audioPath).toBe('/tmp/audio.mp3');
      expect(result.text).toBe('你好世界');
      expect(result.id).toBeDefined();
    });

    it('merges options into config for this call', async () => {
      await voiceSynthesisService.synthesize('hi', { voice: 'en-US-GuyNeural', rate: 1.5 });
      expect(tauri.synthesizeSpeech).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'hi',
          voice: 'en-US-GuyNeural',
          speed: 1.5,
        }),
      );
    });

    it('invokes onProgress callback with correct stages', async () => {
      const stages: string[] = [];
      await voiceSynthesisService.synthesize('test', undefined, (p) => {
        stages.push(p.stage);
      });
      expect(stages).toEqual(['queued', 'synthesizing', 'encoding', 'done']);
    });

    it('emits error stage and rethrows on tauri failure', async () => {
      vi.mocked(tauri.synthesizeSpeech).mockRejectedValueOnce(new Error('synth failed'));

      const stages: string[] = [];
      await expect(
        voiceSynthesisService.synthesize('test', undefined, (p) => {
          stages.push(p.stage);
        }),
      ).rejects.toThrow('synth failed');

      expect(stages).toContain('error');
    });

    it('returns unique id per call', async () => {
      const r1 = await voiceSynthesisService.synthesize('a');
      const r2 = await voiceSynthesisService.synthesize('b');
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('preview (Web Speech API)', () => {
    it('does not throw in jsdom environment', () => {
      expect(() => voiceSynthesisService.preview('测试')).not.toThrow();
    });
  });
});
