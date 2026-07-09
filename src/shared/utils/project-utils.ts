/**
 * 项目工具函数
 */

import type { Project, ProjectStatus } from '@/types';

export type ProjectSortBy = 'updatedAt' | 'createdAt' | 'title' | 'duration';
export type SortOrder = 'asc' | 'desc';

export interface ProjectFilter {
  status?: ProjectStatus;
  starred?: boolean;
  tags?: string[];
  search?: string;
}

export function filterProjects(projects: Project[], filter: ProjectFilter): Project[] {
  return projects.filter(p => {
    if (filter.status && p.status !== filter.status) return false;
    if (filter.starred !== undefined && p.starred !== filter.starred) return false;
    if (filter.tags?.length && !filter.tags.some(tag => p.tags.includes(tag))) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (
        !p.title.toLowerCase().includes(q) &&
        !(p.description?.toLowerCase().includes(q))
      ) return false;
    }
    return true;
  });
}

export function sortProjects(projects: Project[], sortBy: ProjectSortBy, order: SortOrder): Project[] {
  return [...projects].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortBy === 'duration') cmp = (a.duration ?? 0) - (b.duration ?? 0);
    else cmp = new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime();
    return order === 'asc' ? cmp : -cmp;
  });
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
