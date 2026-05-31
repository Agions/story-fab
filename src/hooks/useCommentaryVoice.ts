/**
 * useCommentaryVoice — Voice management with preview
 *
 * - voices list, selectedVoice, preview state
 * - Audio preview using convertFileSrc (not file://) + useRef<HTMLAudioElement> cleanup
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { listCommentaryVoices, synthesizeCommentaryAudio } from '@/core/services/commentary';
import { convertFileSrc } from '@tauri-apps/api/core';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/shared/utils/logging';
import type { VoiceInfo } from '@/core/services/commentary';

export interface UseCommentaryVoiceResult {
  voices: VoiceInfo[];
  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;
  previewVoice: (script: string, voice: string) => Promise<void>;
  isPreviewing: boolean;
  stopPreview: () => void;
  isLoading: boolean;
}

export function useCommentaryVoice(): UseCommentaryVoiceResult {
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('zh-CN-XiaoxiaoNeural');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load voices list on mount
  useEffect(() => {
    setIsLoading(true);
    listCommentaryVoices()
      .then(setVoices)
      .catch((e) => {
        logger.error('[useCommentaryVoice] 加载音色列表失败:', e);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPreviewing(false);
  }, []);

  const previewVoice = useCallback(async (script: string, voice: string) => {
    if (!script?.trim()) {
      toast.error('请先生成脚本');
      return;
    }

    // Stop any existing preview
    stopPreview();

    setIsPreviewing(true);
    try {
      const result = await synthesizeCommentaryAudio(
        script.slice(0, 200), // Only first 200 chars for preview
        voice,
      );

      // Use convertFileSrc for cross-platform audio URI (not file://)
      const audioUrl = convertFileSrc(result.audioPath);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPreviewing(false);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        logger.error('[useCommentaryVoice] Audio playback error:', e);
        toast.error('配音预览播放失败');
        setIsPreviewing(false);
        audioRef.current = null;
      };

      await audio.play();
      toast.success('配音预览已播放 🔊');
    } catch (e) {
      logger.error('[useCommentaryVoice] 配音预览失败:', e);
      toast.error(`预览失败: ${e}`);
      setIsPreviewing(false);
      audioRef.current = null;
    }
  }, [stopPreview]);

  return {
    voices,
    selectedVoice,
    setSelectedVoice,
    previewVoice,
    isPreviewing,
    stopPreview,
    isLoading,
  };
}