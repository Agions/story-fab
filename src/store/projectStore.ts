/**
 * Project Store - 项目状态
 * 包含: 项目列表、当前项目、加载状态
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Project } from './types';

// ============================================
// 类型定义
// ============================================
export interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;

  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
}

// ============================================
// Store 创建
// ============================================
export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      currentProject: null,
      loading: false,

      setProjects: (projects) => set({ projects }),
      
      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),
      
      updateProject: (id, data) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id
              ? { ...p, ...data, updatedAt: new Date().toISOString() }
              : p
          ),
        })),
      
      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          // 如果删除的是当前项目，清空当前项目
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
        })),
      
      setCurrentProject: (project) => set({ currentProject: project }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'clipflow-projects',
      storage: createJSONStorage(() => localStorage),
      // 持久化项目列表和当前项目
      partialize: (state) => ({
        projects: state.projects,
        currentProject: state.currentProject,
      }),
    }
  )
);

export default useProjectStore;
