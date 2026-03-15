/**
 * 项目相关自定义 Hooks
 */

import { useState, useCallback, useEffect } from 'react';
import { useProjectStore, type ProjectFilter, type ProjectSortBy, type SortOrder } from '@/store/projectStore';
import type { Project, ProjectStatus } from '@/core/types';

/**
 * 项目列表 Hook
 */
export function useProjects() {
  const {
    projects,
    currentProject,
    loading,
    sortBy,
    sortOrder,
    filter,
    setProjects,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    setLoading,
    setSortBy,
    setSortOrder,
    setFilter,
    clearFilter,
    getFilteredProjects,
    getProjectById,
  } = useProjectStore();

  const filteredProjects = getFilteredProjects();

  return {
    // 数据
    projects,
    filteredProjects,
    currentProject,
    loading,
    sortBy,
    sortOrder,
    filter,
    
    // Actions
    setProjects,
    addProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    setLoading,
    setSortBy,
    setSortOrder,
    setFilter,
    clearFilter,
    getProjectById,
  };
}

/**
 * 项目筛选 Hook
 */
export function useProjectFilter() {
  const { filter, setFilter, clearFilter } = useProjectStore();
  
  const setStatusFilter = useCallback((status?: ProjectStatus) => {
    setFilter({ ...filter, status });
  }, [filter, setFilter]);
  
  const setStarredFilter = useCallback((starred?: boolean) => {
    setFilter({ ...filter, starred });
  }, [filter, setFilter]);
  
  const setSearchFilter = useCallback((search?: string) => {
    setFilter({ ...filter, search });
  }, [filter, setFilter]);
  
  const setTagsFilter = useCallback((tags?: string[]) => {
    setFilter({ ...filter, tags });
  }, [filter, setFilter]);

  return {
    filter,
    setStatusFilter,
    setStarredFilter,
    setSearchFilter,
    setTagsFilter,
    clearFilter,
  };
}

/**
 * 项目排序 Hook
 */
export function useProjectSort() {
  const { sortBy, sortOrder, setSortBy, setSortOrder } = useProjectStore();
  
  const toggleOrder = useCallback(() => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  }, [sortOrder, setSortOrder]);

  return {
    sortBy,
    sortOrder,
    setSortBy,
    setSortOrder,
    toggleOrder,
  };
}

/**
 * 创建项目 Hook
 */
export function useCreateProject() {
  const { addProject, setCurrentProject } = useProjectStore();
  
  const createProject = useCallback((data: Partial<Project>) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: `project-${Date.now()}`,
      title: data.title || '新项目',
      description: data.description,
      duration: 0,
      size: 0,
      status: 'draft',
      tags: data.tags || [],
      starred: false,
      createdAt: now,
      updatedAt: now,
    };
    
    addProject(project);
    setCurrentProject(project);
    
    return project;
  }, [addProject, setCurrentProject]);

  return { createProject };
}

/**
 * 删除项目 Hook
 */
export function useDeleteProject() {
  const { deleteProject, currentProject, setCurrentProject } = useProjectStore();
  
  const deleteProjectById = useCallback((id: string) => {
    deleteProject(id);
    
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  }, [deleteProject, currentProject, setCurrentProject]);

  return { deleteProject: deleteProjectById };
}
