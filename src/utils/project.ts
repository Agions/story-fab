/**
 * 项目工具函数
 */

import type { Project, ProjectStatus } from '@/core/types';

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

/**
 * 格式化项目大小
 */
export function formatProjectSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * 格式化项目时长
 */
export function formatProjectDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 过滤项目
 */
export function filterProjects(
  projects: Project[],
  filters: {
    status?: ProjectStatus;
    starred?: boolean;
    tags?: string[];
    search?: string;
  }
): Project[] {
  let result = [...projects];
  
  if (filters.status) {
    result = result.filter(p => p.status === filters.status);
  }
  
  if (filters.starred !== undefined) {
    result = result.filter(p => p.starred === filters.starred);
  }
  
  if (filters.tags?.length) {
    result = result.filter(p => 
      filters.tags!.some(tag => p.tags.includes(tag))
    );
  }
  
  if (filters.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(p => 
      p.title.toLowerCase().includes(search) ||
      p.description?.toLowerCase().includes(search)
    );
  }
  
  return result;
}

/**
 * 排序项目
 */
export function sortProjects(
  projects: Project[],
  sortBy: 'updatedAt' | 'createdAt' | 'title' | 'duration',
  order: 'asc' | 'desc' = 'desc'
): Project[] {
  const sorted = [...projects].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
    }
    
    return order === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}
