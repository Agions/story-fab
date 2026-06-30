import { createPersistedStore } from './create-persisted-store';
import { createJSONStorage } from 'zustand/middleware';
import type { Project, ProjectStatus } from '@/types';
import { filterProjects, sortProjects, type ProjectFilter, type ProjectSortBy, type SortOrder } from '@/shared/utils/project-utils';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  sortBy: ProjectSortBy;
  sortOrder: SortOrder;
  filter: ProjectFilter;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setSortBy: (sortBy: ProjectSortBy) => void;
  setSortOrder: (order: SortOrder) => void;
  setFilter: (filter: ProjectFilter) => void;
  clearFilter: () => void;
  getFilteredProjects: () => Project[];
  getProjectById: (id: string) => Project | undefined;
}

export const useProjectStore = createPersistedStore<ProjectState>({
  name: 'StoryFab-projects',
  devtoolsName: 'ProjectStore',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    projects: state.projects,
    currentProject: state.currentProject,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
  }),
  state: (set, get) => ({
    projects: [],
    currentProject: null,
    loading: false,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    filter: {},
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
        currentProject: state.currentProject?.id === id
          ? { ...state.currentProject, ...data, updatedAt: new Date().toISOString() }
          : state.currentProject,
      })),
    deleteProject: (id) =>
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      })),
    setCurrentProject: (project) => set({ currentProject: project }),
    setLoading: (loading) => set({ loading }),
    setSortBy: (sortBy) => set({ sortBy }),
    setSortOrder: (sortOrder) => set({ sortOrder }),
    setFilter: (filter) => set({ filter }),
    clearFilter: () => set({ filter: {} }),
    getFilteredProjects: () => {
      const { projects, sortBy, sortOrder, filter } = get();
      return sortProjects(filterProjects(projects, filter), sortBy, sortOrder);
    },
    getProjectById: (id) => {
      return get().projects.find(p => p.id === id);
    },
  }),
});
