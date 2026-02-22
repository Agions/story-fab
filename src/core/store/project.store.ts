/**
 * 项目状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProjectData, ScriptData, VideoInfo, ExportRecord } from '@/core/types';
import { storageService } from '@/core/services';

export interface ProjectState {
  // 项目列表
  projects: ProjectData[];
  
  // 当前项目
  currentProject: ProjectData | null;
  
  // 过滤和搜索
  searchQuery: string;
  filterStatus: 'all' | 'draft' | 'completed' | 'archived';
  sortBy: 'updatedAt' | 'createdAt' | 'name';
  sortOrder: 'asc' | 'desc';
  
  // 导出历史
  exportHistory: ExportRecord[];
  
  // Computed
  filteredProjects: () => ProjectData[];
  recentProjects: () => ProjectData[];
  
  // Actions
  createProject: (project: Partial<ProjectData>) => ProjectData;
  updateProject: (id: string, updates: Partial<ProjectData>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: ProjectData | null) => void;
  loadProject: (id: string) => ProjectData | null;
  
  // 脚本操作
  addScript: (projectId: string, script: ScriptData) => void;
  updateScript: (projectId: string, scriptId: string, updates: Partial<ScriptData>) => void;
  deleteScript: (projectId: string, scriptId: string) => void;
  
  // 视频操作
  addVideo: (projectId: string, video: VideoInfo) => void;
  removeVideo: (projectId: string, videoId: string) => void;
  
  // 过滤和排序
  setSearchQuery: (query: string) => void;
  setFilterStatus: (status: ProjectState['filterStatus']) => void;
  setSortBy: (sortBy: ProjectState['sortBy']) => void;
  setSortOrder: (order: ProjectState['sortOrder']) => void;
  
  // 导出
  addExportRecord: (record: ExportRecord) => void;
  clearExportHistory: () => void;
  
  // 导入导出
  exportProject: (id: string) => string;
  importProject: (json: string) => ProjectData | null;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      // 初始状态
      projects: [],
      currentProject: null,
      searchQuery: '',
      filterStatus: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      exportHistory: [],

      // Computed
      filteredProjects: () => {
        const state = get();
        let result = [...state.projects];

        // 搜索过滤
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          result = result.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
          );
        }

        // 状态过滤
        if (state.filterStatus !== 'all') {
          result = result.filter(p => p.status === state.filterStatus);
        }

        // 排序
        result.sort((a, b) => {
          let comparison = 0;
          switch (state.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'createdAt':
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
            case 'updatedAt':
            default:
              comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
              break;
          }
          return state.sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
      },

      recentProjects: () => {
        return get().projects
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10);
      },

      // Actions
      createProject: (projectData) => {
        const newProject: ProjectData = {
          id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: projectData.name || '未命名项目',
          description: projectData.description || '',
          status: 'draft',
          videos: [],
          scripts: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...projectData
        };

        set(state => ({
          projects: [...state.projects, newProject],
          currentProject: newProject
        }));

        // 同步到 storage
        storageService.projects.save(newProject);

        return newProject;
      },

      updateProject: (id, updates) => {
        set(state => {
          const projects = state.projects.map(p =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          );

          const updatedProject = projects.find(p => p.id === id);
          if (updatedProject) {
            storageService.projects.save(updatedProject);
          }

          return {
            projects,
            currentProject: state.currentProject?.id === id
              ? updatedProject || null
              : state.currentProject
          };
        });
      },

      deleteProject: (id) => {
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject
        }));

        storageService.projects.delete(id);
      },

      setCurrentProject: (project) => {
        set({ currentProject: project });
      },

      loadProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        if (project) {
          set({ currentProject: project });
        }
        return project || null;
      },

      // 脚本操作
      addScript: (projectId, script) => {
        set(state => {
          const projects = state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  scripts: [...p.scripts, script],
                  updatedAt: new Date().toISOString()
                }
              : p
          );

          const updatedProject = projects.find(p => p.id === projectId);
          if (updatedProject) {
            storageService.projects.save(updatedProject);
          }

          return {
            projects,
            currentProject: state.currentProject?.id === projectId
              ? updatedProject || null
              : state.currentProject
          };
        });
      },

      updateScript: (projectId, scriptId, updates) => {
        set(state => {
          const projects = state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  scripts: p.scripts.map(s =>
                    s.id === scriptId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
                  ),
                  updatedAt: new Date().toISOString()
                }
              : p
          );

          const updatedProject = projects.find(p => p.id === projectId);
          if (updatedProject) {
            storageService.projects.save(updatedProject);
          }

          return {
            projects,
            currentProject: state.currentProject?.id === projectId
              ? updatedProject || null
              : state.currentProject
          };
        });
      },

      deleteScript: (projectId, scriptId) => {
        set(state => {
          const projects = state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  scripts: p.scripts.filter(s => s.id !== scriptId),
                  updatedAt: new Date().toISOString()
                }
              : p
          );

          const updatedProject = projects.find(p => p.id === projectId);
          if (updatedProject) {
            storageService.projects.save(updatedProject);
          }

          return {
            projects,
            currentProject: state.currentProject?.id === projectId
              ? updatedProject || null
              : state.currentProject
          };
        });
      },

      // 视频操作
      addVideo: (projectId, video) => {
        set(state => {
          const projects = state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  videos: [...p.videos, video],
                  updatedAt: new Date().toISOString()
                }
              : p
          );

          const updatedProject = projects.find(p => p.id === projectId);
          if (updatedProject) {
            storageService.projects.save(updatedProject);
          }

          return {
            projects,
            currentProject: state.currentProject?.id === projectId
              ? updatedProject || null
              : state.currentProject
          };
        });
      },

      removeVideo: (projectId, videoId) => {
        set(state => {
          const projects = state.projects.map(p =>
            p.id === projectId
              ? {
                  ...p,
                  videos: p.videos.filter(v => v.id !== videoId),
                  updatedAt: new Date().toISOString()
                }
              : p
          );

          const updatedProject = projects.find(p => p.id === projectId);
          if (updatedProject) {
            storageService.projects.save(updatedProject);
          }

          return {
            projects,
            currentProject: state.currentProject?.id === projectId
              ? updatedProject || null
              : state.currentProject
          };
        });
      },

      // 过滤和排序
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterStatus: (status) => set({ filterStatus: status }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),

      // 导出
      addExportRecord: (record) => {
        set(state => ({
          exportHistory: [record, ...state.exportHistory].slice(0, 100)
        }));
        storageService.exportHistory.add(record);
      },

      clearExportHistory: () => {
        set({ exportHistory: [] });
        storageService.exportHistory.clear();
      },

      // 导入导出
      exportProject: (id) => {
        const project = get().projects.find(p => p.id === id);
        return project ? JSON.stringify(project, null, 2) : '';
      },

      importProject: (json) => {
        try {
          const project = JSON.parse(json);
          project.id = `${project.id}_imported_${Date.now()}`;
          project.createdAt = new Date().toISOString();
          project.updatedAt = new Date().toISOString();

          set(state => ({
            projects: [...state.projects, project],
            currentProject: project
          }));

          storageService.projects.save(project);
          return project;
        } catch {
          return null;
        }
      }
    }),
    {
      name: 'reelforge-project-storage',
      partialize: (state) => ({
        projects: state.projects,
        exportHistory: state.exportHistory
      })
    }
  )
);
