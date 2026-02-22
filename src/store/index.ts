import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, AIModelType } from '@/types';

// 示例数据
const sampleProjects: Project[] = [];

interface AppState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  selectedAIModel: AIModelType;
  aiModelsSettings: Record<AIModelType, { apiKey?: string; enabled: boolean }>;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedAIModel: (model: AIModelType) => void;
  updateAIModelSettings: (model: AIModelType, settings: { apiKey?: string; enabled?: boolean }) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      projects: sampleProjects, // 使用示例数据初始化
      currentProject: null,
      loading: false,
      error: null,
      selectedAIModel: 'wenxin' as AIModelType,
      aiModelsSettings: {
        wenxin: { enabled: true },
        qianwen: { enabled: false },
        spark: { enabled: false },
        chatglm: { enabled: false },
        doubao: { enabled: false },
        deepseek: { enabled: false },
        minimax: { enabled: false }
      },
      setProjects: (projects) => set({ projects }),
      setCurrentProject: (project) => set({ currentProject: project }),
      addProject: (project) => set((state) => ({
        projects: [...state.projects, project]
      })),
      updateProject: (project) => set((state) => ({
        projects: state.projects.map((p) =>
          p.id === project.id ? project : p
        ),
        currentProject: state.currentProject?.id === project.id ? project : state.currentProject,
      })),
      deleteProject: (projectId) => set((state) => ({
        projects: state.projects.filter((p) => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
      })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setSelectedAIModel: (model) => set({ selectedAIModel: model }),
      updateAIModelSettings: (model, settings) => set((state) => ({
        aiModelsSettings: {
          ...state.aiModelsSettings,
          [model]: {
            ...state.aiModelsSettings[model],
            ...settings
          }
        }
      })),
    }),
    {
      name: 'ClipFlow-storage',
      partialize: (state) => ({
        projects: state.projects,
        aiModelsSettings: state.aiModelsSettings,
        selectedAIModel: state.selectedAIModel
      }),
    }
  )
); 