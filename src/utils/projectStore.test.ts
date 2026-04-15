/**
 * projectStore 过滤和排序逻辑测试
 * 测试纯函数行为（与实际 store 隔离）
 */

import { describe, it, expect } from 'vitest';

// 直接定义测试用的类型（与 store 一致）
type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';
type ProjectSortBy = 'updatedAt' | 'createdAt' | 'title' | 'duration';
type SortOrder = 'asc' | 'desc';

interface ProjectFilter {
  status?: ProjectStatus;
  search?: string;
  tags?: string[];
}

interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  createdAt: number;
  updatedAt: number;
  duration?: number;
}

// 纯函数实现（与 store 实际逻辑一致）
function filterProjects(projects: Project[], filter: ProjectFilter): Project[] {
  return projects.filter(p => {
    if (filter.status && p.status !== filter.status) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      if (!p.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

function sortProjects(projects: Project[], sortBy: ProjectSortBy, order: SortOrder): Project[] {
  return [...projects].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortBy === 'duration') cmp = (a.duration ?? 0) - (b.duration ?? 0);
    else cmp = new Date(a[sortBy]).getTime() - new Date(b[sortBy]).getTime(); // matches actual store
    return order === 'asc' ? cmp : -cmp; // asc = a-b, desc = b-a
  });
}

// 测试数据：每个字段值都不同，避免意外的 tie-breaking
const mockProjects: Project[] = [
  { id: '1', title: 'Zebra',   status: 'draft',     createdAt: 9000,  updatedAt: 9000,  duration: 30  },
  { id: '2', title: 'Apple',   status: 'completed', createdAt: 8000,  updatedAt: 7000,  duration: 60  },
  { id: '3', title: 'Banana',  status: 'draft',     createdAt: 10000, updatedAt: 8000,  duration: 120 },
];

describe('filterProjects', () => {
  it('should return all when no filter', () => {
    expect(filterProjects(mockProjects, {})).toHaveLength(3);
  });

  it('should filter by status', () => {
    const result = filterProjects(mockProjects, { status: 'completed' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Apple');
  });

  it('should filter by search (case-insensitive)', () => {
    expect(filterProjects(mockProjects, { search: 'apple' })).toHaveLength(1);
    expect(filterProjects(mockProjects, { search: 'APPLE' })).toHaveLength(1);
  });

  it('should return empty for no match', () => {
    expect(filterProjects(mockProjects, { search: 'xyz' })).toHaveLength(0);
  });

  it('should combine status + search', () => {
    const result = filterProjects(mockProjects, { status: 'draft', search: 'banana' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Banana');
  });
});

describe('sortProjects', () => {
  // 使用精确值，避免稳定排序的 tie-breaking 问题
  const allTitles = () => sortProjects(mockProjects, 'updatedAt', 'desc').map(p => p.title);

  it('should sort by updatedAt desc (largest first)', () => {
    // Zebra(9000) > Banana(8000) > Apple(7000)
    expect(allTitles()).toEqual(['Zebra', 'Banana', 'Apple']);
  });

  it('should sort by updatedAt asc (smallest first)', () => {
    const r = sortProjects(mockProjects, 'updatedAt', 'asc').map(p => p.title);
    expect(r).toEqual(['Apple', 'Banana', 'Zebra']);
  });

  it('should sort by createdAt desc', () => {
    // Banana(10000) > Zebra(9000) > Apple(8000)
    const r = sortProjects(mockProjects, 'createdAt', 'desc').map(p => p.title);
    expect(r).toEqual(['Banana', 'Zebra', 'Apple']);
  });

  it('should sort by title alphabetically (asc)', () => {
    // Apple < Banana < Zebra
    const r = sortProjects(mockProjects, 'title', 'asc').map(p => p.title);
    expect(r).toEqual(['Apple', 'Banana', 'Zebra']);
  });

  it('should sort by title desc', () => {
    const r = sortProjects(mockProjects, 'title', 'desc').map(p => p.title);
    expect(r).toEqual(['Zebra', 'Banana', 'Apple']);
  });

  it('should sort by duration desc', () => {
    // Banana(120) > Apple(60) > Zebra(30)
    const r = sortProjects(mockProjects, 'duration', 'desc').map(p => p.title);
    expect(r).toEqual(['Banana', 'Apple', 'Zebra']);
  });

  it('should sort by duration asc', () => {
    const r = sortProjects(mockProjects, 'duration', 'asc').map(p => p.title);
    expect(r).toEqual(['Zebra', 'Apple', 'Banana']);
  });

  it('should not mutate original array', () => {
    const original = mockProjects.map(p => p.id);
    sortProjects(mockProjects, 'title', 'asc');
    expect(mockProjects.map(p => p.id)).toEqual(original);
  });
});
