/**
 * useProject Hook - 项目管理 Hook
 */
import { useState, useCallback } from 'react';
import { useProjectStore } from '@/store';
import type { Project, ProjectFormData } from '../types';

export function useProject() {
  const {
    projects,
    currentProject,
    loading,
    setProjects,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    setLoading,
  } = useProjectStore();

  const [error, setError] = useState<Error | null>(null);

  const createProject = useCallback(async (data: ProjectFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newProject: Project = {
        id: `project_${Date.now()}`,
        name: data.name,
        description: data.description,
        status: 'draft',
        videos: [],
        scripts: [],
        settings: {
          resolution: data.resolution || '1080p',
          frameRate: data.frameRate || 30,
          quality: 'high',
          outputFormat: 'mp4',
          template: data.template,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      addProject(newProject);
      return newProject;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [addProject, setLoading]);

  const removeProject = useCallback(async (id: string) => {
    setLoading(true);
    try {
      deleteProject(id);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [deleteProject, setLoading]);

  const editProject = useCallback(async (id: string, data: Partial<Project>) => {
    try {
      updateProject(id, { ...data, updatedAt: new Date().toISOString() });
    } catch (e) {
      setError(e as Error);
    }
  }, [updateProject]);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id) || null;
  }, [projects]);

  return {
    projects,
    currentProject,
    loading,
    error,
    createProject,
    removeProject,
    editProject,
    getProject,
    setCurrentProject,
  };
}

export default useProject;
