/**
 * 用户偏好持久层 — 由 model-store 升级。
 *
 * 职责：AI 模型选择 + 各 provider 密钥/参数。
 * 单一数据源：动态 provider 列表从 `core/config/ai-models` 派生，
 * 不再维护静态枚举（消除第三份重复）。
 */
import { createPersistedStore } from './create-persisted-store';
import { createJSONStorage } from 'zustand/middleware';
import type { AIModelSettings, ModelProvider } from '@/types';
import { MODEL_PROVIDERS } from '@/core/config/ai-models';

/** 派生默认停用 settings（每 provider 一条 enabled:false） */
const deriveDefaultSettings = (): Record<ModelProvider, AIModelSettings> =>
  Object.fromEntries(
    Object.keys(MODEL_PROVIDERS).map((p) => [p, { enabled: false }] as const),
  ) as Record<ModelProvider, AIModelSettings>;

export interface SettingsState {
  selectedAIModel: ModelProvider;
  aiModelsSettings: Record<ModelProvider, AIModelSettings>;
  updateAIModelSettings: (model: ModelProvider, settings: Partial<AIModelSettings>) => void;
}

export const useSettingsStore = createPersistedStore<SettingsState>({
  name: 'StoryFab-app-settings',
  devtoolsName: 'SettingsStore',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    selectedAIModel: state.selectedAIModel,
    aiModelsSettings: state.aiModelsSettings,
  }),
  state: (set) => ({
    selectedAIModel: 'openai',
    aiModelsSettings: deriveDefaultSettings(),
    updateAIModelSettings: (model, settings) =>
      set((state) => ({
        aiModelsSettings: {
          ...state.aiModelsSettings,
          [model]: { ...state.aiModelsSettings[model], ...settings },
        },
      })),
  }),
});

/**
 * 兼容别名 — 保留 useModelStore 6 个月过渡期。
 * @deprecated 使用 useSettingsStore
 */
export const useModelStore = useSettingsStore;
