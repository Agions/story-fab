/**
 * 项目工具函数
 */

import type { Project, ProjectStatus } from '@/types';

// Re-export filter/sort from store (single source of truth)
export { filterProjects, sortProjects } from '@/store/project-store';
export type { ProjectFilter, ProjectSortBy, SortOrder } from '@/store/project-store';

// Re-export formatting utilities
export { formatFileSize as formatProjectSize, formatDuration as formatProjectDuration } from './formatting';

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

