import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIModelType, AIModelSettings } from '@/types';

interface AppState {
  // AI 模型相关状态
  selectedAIModel: AIModelType;
  aiModelsSettings: Record<AIModelType, AIModelSettings>;
  
  // AI 模型相关操作
  setSelectedAIModel: (model: AIModelType) => void;
  updateAIModelSettings: (model: AIModelType, settings: Partial<AIModelSettings>) => void;
  
  // 应用设置
  autoSave: boolean;
  setAutoSave: (autoSave: boolean) => void;
  
  // 主题设置
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
}

// 创建 store
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始 AI 模型为文心一言
      selectedAIModel: 'wenxin',
      
      // 初始化各个 AI 模型的设置
      aiModelsSettings: {
        wenxin: { enabled: false },
        qianwen: { enabled: false },
        spark: { enabled: false },
        chatglm: { enabled: false },
        doubao: { enabled: false },
        deepseek: { enabled: false }
      },
      
      // 设置选中的 AI 模型
      setSelectedAIModel: (model: AIModelType) => set({ selectedAIModel: model }),
      
      // 更新 AI 模型设置
      updateAIModelSettings: (model: AIModelType, settings: Partial<AIModelSettings>) => 
        set((state) => ({
          aiModelsSettings: {
            ...state.aiModelsSettings,
            [model]: {
              ...state.aiModelsSettings[model],
              ...settings
            }
          }
        })),
      
      // 自动保存设置
      autoSave: true,
      setAutoSave: (autoSave: boolean) => set({ autoSave }),
      
      // 深色模式设置
      isDarkMode: false,
      setIsDarkMode: (isDarkMode: boolean) => set({ isDarkMode })
    }),
    {
      name: 'reelforge-store', // 存储在 localStorage 中的键名
      partialize: (state) => ({
        selectedAIModel: state.selectedAIModel,
        aiModelsSettings: state.aiModelsSettings,
        autoSave: state.autoSave,
        isDarkMode: state.isDarkMode
      })
    }
  )
);

// 导出类型，方便使用
export type AppStore = ReturnType<typeof useStore>; 