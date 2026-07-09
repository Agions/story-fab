/**
 * 字幕服务回归基线测试
 * 目的：D2 修复命令契约后，为 subtitle-service.ts 的两条核心公开路径建立回归基线。
 *       transcribeWithWhisper 现在直接调用 whisperService.transcribe，
 *       失败自动回退到 extractSubtitles (ASR)，不再有 checkFasterWhisper 可用性门控
 *       （那道门控会调用未注册的 Tauri 命令，把 Whisper 永远判为不可用）。
 *
 * 注意：本文件仅为测试，不修改任何业务代码。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subtitleService } from './subtitle-service';
import { whisperService } from './whisper-service';
import { asrService } from '../asr/asr-service';
import type { ASRResult, ASRSegment } from '../asr/asr-types';

// jsdom 可能未实现 crypto.randomUUID，而 SubtitleService 在生成 track / videoInfo id 时会调用。
// 这里补一个最小 polyfill，保证测试环境确定可跑（不影响被测试代码的真实行为）。
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  const target: any = globalThis.crypto ?? globalThis;
  Object.defineProperty(target, 'randomUUID', {
    value: () => `uuid-${Math.random().toString(36).slice(2, 10)}`,
    configurable: true,
  });
}

// ── 隔离外部依赖（Tauri / whisper / asr）──────────────────────────────────────
vi.mock('@/core/tauri', () => ({
  invoke: vi.fn(),
  TauriCommand: {},
}));

// D2：checkFasterWhisper 已删除，这里只 mock 真实使用的 transcribe / toSubtitleFormat。
vi.mock('./whisper-service', () => ({
  whisperService: {
    transcribe: vi.fn(),
    toSubtitleFormat: vi.fn(),
  },
}));

vi.mock('../asr/asr-service', () => ({
  asrService: {
    recognizeSpeech: vi.fn(),
  },
}));

const mockedWhisper = vi.mocked(whisperService);
const mockedAsr = vi.mocked(asrService);

// ASR 返回的标准分段（字段与方法内部读取的 segment.startTime/endTime/text/confidence 对应）
const sampleSegments: ASRSegment[] = [
  { id: 's0', startTime: 0.0, endTime: 1.2, text: '你好世界', confidence: 0.95 },
  { id: 's1', startTime: 1.2, endTime: 2.0, text: '第二句', confidence: 0.88 },
];

const mockAsrResult = (segments: ASRSegment[]): ASRResult => ({
  text: segments.map((s) => s.text).join(''),
  segments,
  provider: 'mock',
});

beforeEach(() => {
  mockedWhisper.transcribe.mockReset();
  mockedWhisper.toSubtitleFormat.mockReset();
  mockedAsr.recognizeSpeech.mockReset();
});

// ============================================================
// extractSubtitles（真实 UI 路径 / ASR）
// ============================================================

describe('extractSubtitles (ASR path)', () => {
  it('returns a SubtitleTrack with id / language / entries / style', async () => {
    mockedAsr.recognizeSpeech.mockResolvedValue(mockAsrResult(sampleSegments));

    const track = await subtitleService.extractSubtitles('/videos/clip.mp4', {
      language: 'zh-CN',
    });

    expect(track).toBeDefined();
    expect(typeof track.id).toBe('string');
    expect(track.language).toBe('zh-CN');
    expect(Array.isArray(track.entries)).toBe(true);
    expect(track.style).toBeDefined();
    expect(track.entries).toHaveLength(2);

    // 分段映射正确（id 形如 subtitle-N）
    expect(track.entries[0]).toMatchObject({
      id: 'subtitle-0',
      text: '你好世界',
      startTime: 0.0,
      endTime: 1.2,
      confidence: 0.95,
    });
    expect(track.entries[1].id).toBe('subtitle-1');

    // ASR 被以映射后的语言码调用
    expect(mockedAsr.recognizeSpeech).toHaveBeenCalledTimes(1);
  });

  it('merges consecutive short segments (<0.5s) into a single entry', async () => {
    mockedAsr.recognizeSpeech.mockResolvedValue(
      mockAsrResult([
        { id: 'a', startTime: 0, endTime: 0.2, text: '短句一', confidence: 0.9 },
        { id: 'b', startTime: 0.2, endTime: 0.4, text: '短句二', confidence: 0.9 },
      ]),
    );

    const track = await subtitleService.extractSubtitles('/v.mp4', { language: 'zh-CN' });

    expect(track.entries).toHaveLength(1);
    expect(track.entries[0].text).toBe('短句一 短句二');
    expect(track.entries[0].endTime).toBe(0.4);
    // 质量分级标签被附加
    expect(['high', 'medium', 'low']).toContain((track.entries[0] as any).quality);
  });

  it('truncates entries beyond maxDuration', async () => {
    mockedAsr.recognizeSpeech.mockResolvedValue(
      mockAsrResult([
        { id: 'a', startTime: 0, endTime: 1.0, text: '一', confidence: 0.9 },
        { id: 'b', startTime: 1.0, endTime: 2.0, text: '二', confidence: 0.9 },
        { id: 'c', startTime: 2.0, endTime: 3.0, text: '三', confidence: 0.9 },
      ]),
    );

    const track = await subtitleService.extractSubtitles('/v.mp4', {
      language: 'en',
      maxDuration: 1.5,
    });

    // endTime > 1.5 的分段（二、三）被裁剪，仅保留「一」
    expect(track.entries).toHaveLength(1);
    expect(track.entries[0].text).toBe('一');
  });

  it('returns an empty-entries track (graceful) when ASR fails', async () => {
    mockedAsr.recognizeSpeech.mockRejectedValue(new Error('asr boom'));

    const track = await subtitleService.extractSubtitles('/v.mp4', { language: 'en' });

    expect(track).toBeDefined();
    expect(track.language).toBe('en');
    expect(track.entries).toEqual([]);
    expect(track.style).toBeDefined();
  });
});

// ============================================================
// transcribeWithWhisper（D2 新契约 —— 直接试 Whisper，失败回退 ASR）
// ============================================================

describe('transcribeWithWhisper', () => {
  // 分支①：直接调用 whisperService.transcribe 成功 → 走 whisper 路径
  it('uses whisperService.transcribe directly when available (no availability gate)', async () => {
    const whisperResult = {
      language: 'en',
      language_probability: 0.99,
      duration_ms: 2000,
      segments: [{ start_ms: 0, end_ms: 1200, text: 'hello' }],
    };
    mockedWhisper.transcribe.mockResolvedValue(whisperResult);
    mockedWhisper.toSubtitleFormat.mockReturnValue({
      language: 'en',
      entries: [{ id: 'whisper-0', startTime: 0, endTime: 1.2, text: 'hello' }],
    });

    const onProgress = vi.fn();
    const track = await subtitleService.transcribeWithWhisper(
      '/a.mp3',
      'base',
      'auto',
      onProgress,
    );

    expect(mockedWhisper.transcribe).toHaveBeenCalledTimes(1);
    expect(mockedWhisper.transcribe).toHaveBeenCalledWith('/a.mp3', 'base', 'auto', onProgress);
    expect(mockedWhisper.toSubtitleFormat).toHaveBeenCalledWith(whisperResult);

    // 返回结构为 SubtitleTrack 形状
    expect(typeof track.id).toBe('string');
    expect(track.language).toBe('en');
    expect(track.entries).toHaveLength(1);
    expect(track.entries[0].text).toBe('hello');
    expect(track.style).toBeDefined();

    // ASR fallback 不应被触发
    expect(mockedAsr.recognizeSpeech).not.toHaveBeenCalled();
  });

  // 分支②：whisperService.transcribe 抛错 → catch 后回退到 extractSubtitles (ASR)
  it('falls back to ASR when whisperService.transcribe throws', async () => {
    mockedWhisper.transcribe.mockRejectedValue(new Error('whisper boom'));
    mockedAsr.recognizeSpeech.mockResolvedValue(mockAsrResult(sampleSegments));

    const track = await subtitleService.transcribeWithWhisper('/a.mp3', 'small', 'en');

    expect(mockedWhisper.transcribe).toHaveBeenCalledTimes(1);
    expect(mockedAsr.recognizeSpeech).toHaveBeenCalledTimes(1);

    expect(track.language).toBe('en');
    expect(track.entries).toHaveLength(2);
    expect(track.style).toBeDefined();
  });

  it('defaults modelSize=base and language=auto', async () => {
    mockedWhisper.transcribe.mockResolvedValue({
      language: 'ja',
      language_probability: 0.9,
      duration_ms: 1000,
      segments: [],
    });
    mockedWhisper.toSubtitleFormat.mockReturnValue({ language: 'ja', entries: [] });

    await subtitleService.transcribeWithWhisper('/a.mp3');

    expect(mockedWhisper.transcribe).toHaveBeenCalledWith('/a.mp3', 'base', 'auto', undefined);
  });
});
