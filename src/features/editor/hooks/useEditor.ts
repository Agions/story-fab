/**
 * useEditor Hook - 编辑器 Hook
 */
import { useState, useCallback } from 'react';
import { useEditorStore } from '@/store';
import type { VideoAsset, Script, Voice, EditorPanel } from '../types';

export function useEditor() {
  const {
    video,
    script,
    voice,
    activePanel,
    previewPlaying,
    currentTime,
    setVideo,
    setScript,
    setVoice,
    setActivePanel,
    setPreviewPlaying,
    setCurrentTime,
    reset,
  } = useEditorStore();

  const [isPlaying, setIsPlaying] = useState(false);

  const loadVideo = useCallback((videoAsset: VideoAsset) => {
    setVideo(videoAsset);
  }, [setVideo]);

  const loadScript = useCallback((scriptData: Script) => {
    setScript(scriptData);
  }, [setScript]);

  const loadVoice = useCallback((voiceData: Voice) => {
    setVoice(voiceData);
  }, [setVoice]);

  const play = useCallback(() => {
    setPreviewPlaying(true);
    setIsPlaying(true);
  }, [setPreviewPlaying]);

  const pause = useCallback(() => {
    setPreviewPlaying(false);
    setIsPlaying(false);
  }, [setPreviewPlaying]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    setCurrentTime(time);
  }, [setCurrentTime]);

  const switchPanel = useCallback((panel: EditorPanel) => {
    setActivePanel(panel);
  }, [setActivePanel]);

  const clearEditor = useCallback(() => {
    reset();
    setIsPlaying(false);
  }, [reset]);

  return {
    video,
    script,
    voice,
    activePanel,
    previewPlaying,
    currentTime,
    isPlaying,
    loadVideo,
    loadScript,
    loadVoice,
    play,
    pause,
    togglePlay,
    seek,
    switchPanel,
    clearEditor,
    setCurrentTime,
  };
}

export default useEditor;
