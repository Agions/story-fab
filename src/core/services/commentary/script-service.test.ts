/**
 * Commentary Script Service — 单元测试
 *
 * 覆盖：
 * - generateCommentaryScript 调用 tauri.generateScript
 * - quickCommentary 组合脚本+音频
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCommentaryScript, quickCommentary, type GenerateScriptInput } from './script-service';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockTauri = {
  generateScript: vi.fn(),
};

vi.mock('@/core/tauri', () => ({
  tauri: {
    generateScript: (...args: unknown[]) => mockTauri.generateScript(...args),
  },
}));

const mockSynthesizeAudio = vi.fn();
vi.mock('./audio-service', () => ({
  synthesizeCommentaryAudio: (...args: unknown[]) => mockSynthesizeAudio(...args),
}));

beforeEach(() => {
  vi.resetAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('generateCommentaryScript', () => {
  it('calls tauri.generateScript with correct input', async () => {
    const input: GenerateScriptInput = {
      subtitles: 'test subtitles',
      apiKey: 'test-key',
      style: 'humorous',
    };
    mockTauri.generateScript.mockResolvedValue({
      fullScript: 'content',
      segments: [],
      estimatedDurationSecs: 10,
      modelUsed: 'gpt-4',
      provider: 'openai',
    });

    const result = await generateCommentaryScript(input);
    expect(mockTauri.generateScript).toHaveBeenCalledWith(input);
    expect(result.fullScript).toBe('content');
  });
});

describe('quickCommentary', () => {
  it('generates script then synthesizes audio for each segment', async () => {
    mockTauri.generateScript.mockResolvedValue({
      fullScript: 'content',
      segments: [
        { startTime: 0, endTime: 5, text: 'Hello', emotion: 'neutral' },
        { startTime: 5, endTime: 10, text: 'World', emotion: 'neutral' },
      ],
      estimatedDurationSecs: 10,
      modelUsed: 'gpt-4',
      provider: 'openai',
    });

    mockSynthesizeAudio.mockResolvedValue({ url: 'audio_1' });

    const result = await quickCommentary('subtitles', 'key', 'serious', 'voice-1');

    expect(mockTauri.generateScript).toHaveBeenCalledWith({
      subtitles: 'subtitles',
      style: 'serious',
      apiKey: 'key',
      provider: 'openai',
    });
    expect(mockSynthesizeAudio).toHaveBeenCalledTimes(2);
    expect(result.audioFiles).toHaveLength(2);
  });
});
