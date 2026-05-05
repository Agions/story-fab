/**
 * 项目工具函数
 */

import type { Project, ProjectStatus } from '@/core/types';

// Re-export filter/sort from store (single source of truth)
export { filterProjects, sortProjects } from '@/store/projectStore';
export type { ProjectFilter, ProjectSortBy, SortOrder } from '@/store/projectStore';

// Re-export formatting utilities
export { formatFileSize as formatProjectSize, formatDuration as formatProjectDuration } from './format';

/**
 * 创建新项目
 */
export function createProject(data: Partial<Project> = {}): Project {
  const now = new Date().toISOString();

  return {
    id: data.id || `project-${Date.now()}`,
    title: data.title || '新项目',
    description: data.description,
    thumbnail: data.thumbnail,
    duration: data.duration || 0,
    size: data.size || 0,
    status: data.status || 'draft',
    tags: data.tags || [],
    starred: data.starred || false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

/**
 * 更新项目
 */
export function updateProject(
  project: Project,
  updates: Partial<Project>
): Project {
  return {
    ...project,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 获取项目状态标签颜色
 */
export function getStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    draft: 'default',
    processing: 'processing',
    completed: 'success',
    failed: 'error',
  };
  return colors[status] || 'default';
}

/**
 * 获取项目状态中文名
 */
export function getStatusText(status: ProjectStatus): string {
  const texts: Record<ProjectStatus, string> = {
    draft: '草稿',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
  };
  return texts[status] || status;
}

