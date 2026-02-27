/**
 * Editor Store - 编辑器状态
 * 包含: 视频、脚本、语音、预览状态
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { VideoData, ScriptData, VoiceData, EditorPanel } from './types';

// ============================================
// 类型定义
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

// ============================================
// 初始状态
// ============================================
const initialState: Pick<
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

// ============================================
// Store 创建
// ============================================
export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      ...initialState,

      setVideo: (video) => set({ video }),
      setScript: (script) => set({ script }),
      setVoice: (voice) => set({ voice }),
      setActivePanel: (activePanel) => set({ activePanel }),
      setPreviewPlaying: (previewPlaying) => set({ previewPlaying }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      reset: () => set(initialState),
    }),
    {
      name: 'clipflow-editor',
      storage: createJSONStorage(() => localStorage),
      // 只持久化 UI 状态，不持久化大型数据
      partialize: (state) => ({
        activePanel: state.activePanel,
        // currentTime 可能需要根据具体场景决定是否持久化
      }),
    }
  )
);

export default useEditorStore;
