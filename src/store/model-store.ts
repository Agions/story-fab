import { createPersistedStore } from './create-persisted-store';
import { createJSONStorage } from 'zustand/middleware';
import { AIModelType, AIModelSettings } from '@/types';

/**
 * AIModelState - AI 模型相关全局状态
 *
 * Store 边界（见 src/store/README.md）：
 * - modelStore 是「平行 store」，不依赖 project/editor/timeline
 * - 可被 appStore / projectStore / editorStore 通过 hook 读取
 * - 不应该反过来引用其他 store（避免循环依赖）
 */
export interface AIModelState {
  selectedAIModel: AIModelType;
  aiModelsSettings: Record<AIModelType, AIModelSettings>;
  setSelectedAIModel: (model: AIModelType) => void;
  updateAIModelSettings: (model: AIModelType, settings: Partial<AIModelSettings>) => void;
}

const defaultSettings: Record<AIModelType, AIModelSettings> = {
  openai: { enabled: false },
  anthropic: { enabled: false },
  google: { enabled: false },
  alibaba: { enabled: false },
  zhipu: { enabled: false },
  iflytek: { enabled: false },
  deepseek: { enabled: false },
  moonshot: { enabled: false },
  local: { enabled: false },
  custom: { enabled: false },
};

export const useModelStore = createPersistedStore<AIModelState>({
  name: 'StoryFab-app-settings',
  devtoolsName: 'ModelStore',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    selectedAIModel: state.selectedAIModel,
    aiModelsSettings: state.aiModelsSettings,
  }),
  state: (set) => ({
    selectedAIModel: 'openai',
    aiModelsSettings: { ...defaultSettings },
    setSelectedAIModel: (model) => set({ selectedAIModel: model }),
    updateAIModelSettings: (model, settings) =>
      set((state) => ({
        aiModelsSettings: {
          ...state.aiModelsSettings,
          [model]: { ...state.aiModelsSettings[model], ...settings },
        },
      })),
  }),
});
