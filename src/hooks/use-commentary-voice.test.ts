/**
 * use-commentary-voice 测试
 *
 * Stage 9 PR-11：配音音色管理 + 预览 hook 覆盖
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mocks
vi.mock('@/core/services/commentary', () => ({
  listCommentaryVoices: vi.fn(),
  synthesizeCommentaryAudio: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: vi.fn((path: string) => `tauri://localhost/${path}`),
}));

vi.mock('@/components/ui/sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { listCommentaryVoices, synthesizeCommentaryAudio } from '@/core/services/commentary';
import { convertFileSrc } from '@tauri-apps/api/core';
import { toast } from '@/components/ui/sonner';
import { useCommentaryVoice } from './use-commentary-voice';
import type { VoiceInfo } from '@/types';

const mockVoices: VoiceInfo[] = [
  { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓', locale: 'zh-CN' },
  { id: 'en-US-JennyNeural', name: 'Jenny', locale: 'en-US' },
] as unknown as VoiceInfo[];

describe('useCommentaryVoice', () => {
  beforeEach(() => {
    vi.mocked(listCommentaryVoices).mockResolvedValue(mockVoices);
    vi.mocked(synthesizeCommentaryAudio).mockResolvedValue({
      audioPath: '/tmp/preview.mp3',
      durationMs: 1500,
    } as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initialises with default selection and isPreviewing=false', () => {
    const { result } = renderHook(() => useCommentaryVoice());
    expect(result.current.voices).toEqual([]);
    expect(result.current.selectedVoice).toBe('zh-CN-XiaoxiaoNeural');
    expect(result.current.isPreviewing).toBe(false);
  });

  it('loads voices on mount and clears loading flag', async () => {
    const { result } = renderHook(() => useCommentaryVoice());
    await waitFor(() => {
      expect(result.current.voices).toEqual(mockVoices);
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('keeps loading=false when voice fetch fails (logged, not thrown)', async () => {
    vi.mocked(listCommentaryVoices).mockRejectedValue(new Error('catalog down'));
    const { result } = renderHook(() => useCommentaryVoice());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.voices).toEqual([]);
  });

  it('updates selectedVoice via setter', () => {
    const { result } = renderHook(() => useCommentaryVoice());
    act(() => result.current.setSelectedVoice('en-US-JennyNeural'));
    expect(result.current.selectedVoice).toBe('en-US-JennyNeural');
  });

  it('previewVoice with empty script toasts an error and skips synthesis', async () => {
    const { result } = renderHook(() => useCommentaryVoice());
    await act(async () => {
      await result.current.previewVoice('', 'zh-CN-XiaoxiaoNeural');
    });
    expect(toast.error).toHaveBeenCalledWith('请先生成脚本');
    expect(synthesizeCommentaryAudio).not.toHaveBeenCalled();
  });

  it('previewVoice with whitespace-only script toasts an error', async () => {
    const { result } = renderHook(() => useCommentaryVoice());
    await act(async () => {
      await result.current.previewVoice('   \n  ', 'zh-CN-XiaoxiaoNeural');
    });
    expect(toast.error).toHaveBeenCalledWith('请先生成脚本');
  });

  it('previewVoice synthesises audio using a 200-char slice', async () => {
    const longScript = 'a'.repeat(500);
    const { result } = renderHook(() => useCommentaryVoice());
    await act(async () => {
      await result.current.previewVoice(longScript, 'en-US-JennyNeural');
    });
    expect(synthesizeCommentaryAudio).toHaveBeenCalledWith('a'.repeat(200), 'en-US-JennyNeural');
    expect(convertFileSrc).toHaveBeenCalledWith('/tmp/preview.mp3');
  });

  it('previewVoice error path surfaces toast and clears state', async () => {
    vi.mocked(synthesizeCommentaryAudio).mockRejectedValue(new Error('tts failed'));
    const { result } = renderHook(() => useCommentaryVoice());
    await act(async () => {
      await result.current.previewVoice('hello world', 'zh-CN-XiaoxiaoNeural');
    });
    expect(toast.error).toHaveBeenCalled();
    expect(result.current.isPreviewing).toBe(false);
  });

  it('stopPreview is a no-op when nothing is playing', () => {
    const { result } = renderHook(() => useCommentaryVoice());
    expect(() => act(() => result.current.stopPreview())).not.toThrow();
    expect(result.current.isPreviewing).toBe(false);
  });
});
