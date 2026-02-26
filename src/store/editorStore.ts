import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VideoData, ScriptData, VoiceData, EditorPanel } from './types';

// ============================================
// Editor Store - 编辑器状态
// ============================================
export interface EditorState {
  // 当前编辑状态
  video: VideoData | null;
  script: ScriptData | null;
  voice: VoiceData | null;

  // UI 状态
  activePanel: EditorPanel;
  previewPlaying: boolean;
  currentTime: number;

  // Actions
  setVideo: (video: VideoData | null) => void;
  setScript: (script: ScriptData | null) => void;
  setVoice: (voice: VoiceData | null) => void;
  setActivePanel: (panel: EditorPanel) => void;
  setPreviewPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  reset: () => void;
}

const initialEditorState: Pick<
  EditorState,
  'video' | 'script' | 'voice' | 'activePanel' | 'previewPlaying' | 'currentTime'
> = {
  video: null,
  script: null,
  voice: null,
  activePanel: 'video',
  previewPlaying: false,
  currentTime: 0,
};

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      ...initialEditorState,

      setVideo: (video) => set({ video }),
      setScript: (script) => set({ script }),
      setVoice: (voice) => set({ voice }),
      setActivePanel: (activePanel) => set({ activePanel }),
      setPreviewPlaying: (previewPlaying) => set({ previewPlaying }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      reset: () => set(initialEditorState),
    }),
    { name: 'clipflow-editor' }
  )
);

export default useEditorStore;
