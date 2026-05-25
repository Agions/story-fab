/**
 * 项目列表 Hook
 * 从 Projects/index.tsx 提取的内联逻辑
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/shared/utils/logging';
import { notify } from '@/shared';
import { listProjects, deleteProject as deleteProjectFile, PROJECTS_CHANGED_EVENT } from '@/services/tauri';
import type { ProjectUIStatus, ProjectUIStats, ProjectView } from '../pages/Projects/types';

export type { ProjectUIStatus, ProjectUIStats, ProjectView };

// 类型：项目状态过滤器
export type ProjectStatusFilter = 'all' | ProjectUIStatus;

// 转换函数：将记录转换为 ProjectView
export const asProjectView = (record: Record<string, unknown>): ProjectView => ({
  id: String(record.id),
  name: String(record.name || '未命名项目'),
  description: typeof record.description === 'string' ? record.description : '',
  status: (record.status === 'processing' || record.status === 'completed') ? record.status as ProjectUIStatus : 'draft',
  createdAt: String(record.createdAt || new Date().toISOString()),
  updatedAt: String(record.updatedAt || record.createdAt || new Date().toISOString()),
  scripts: Array.isArray(record.scripts) ? record.scripts : [],
  videos: Array.isArray(record.videos) ? record.videos : [],
  videoPath: typeof record.videoPath === 'string' ? record.videoPath : '',
});

// 状态配置
export const statusConfig: Record<ProjectUIStatus, { color: string; text: string }> = {
  draft: { color: 'secondary', text: '草稿' },
  processing: { color: 'default', text: '制作中' },
  completed: { color: 'success', text: '已完成' },
};

// 计算项目 UI 状态
export function getProjectUIStatus(project: ProjectView): ProjectUIStats {
  const scriptCount = Array.isArray(project.scripts) ? project.scripts.length : 0;
  const videoCount = Array.isArray(project.videos) && project.videos.length > 0
    ? project.videos.length
    : (project.videoPath ? 1 : 0);
  const status: ProjectUIStatus = project.status === 'completed'
    ? 'completed'
    : project.status === 'processing'
      ? 'processing'
      : 'draft';
  let progress = 0;
  if (status === 'completed') progress = 100;
  else if (status === 'processing') progress = 65;
  else if (scriptCount > 0 && videoCount > 0) progress = 45;
  else if (videoCount > 0) progress = 20;
  return { scriptCount, videoCount, status, progress };
}

// 格式化日期
export function formatDate(d: string): string {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
  return date.toLocaleDateString('zh-CN');
}

export interface UseProjectListOptions {
  recentProjects?: string[];
}

export interface UseProjectListReturn {
  // 状态
  projects: ProjectView[];
  viewMode: 'grid' | 'list';
  searchText: string;
  statusFilter: ProjectStatusFilter;
  loading: boolean;
  loadFailed: boolean;
  deleteConfirmId: string | null;

  // 计算属性
  orderedProjects: ProjectView[];
  filteredProjects: ProjectView[];
  statusFilters: Array<{ label: string; value: number; color: string; filter: ProjectStatusFilter }>;

  // 操作方法
  loadProjectData: () => Promise<void>;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSearchText: (text: string) => void;
  setStatusFilter: (filter: ProjectStatusFilter) => void;
  setDeleteConfirmId: (id: string | null) => void;
  confirmDelete: (id: string) => Promise<void>;

  // 动作生成
  projectActions: (project: ProjectView) => Array<{
    key: string;
    label?: string;
    icon?: React.ReactNode;
    danger?: boolean;
    onClick?: () => void;
    type?: 'divider';
  }>;
}

export function useProjectList(options: UseProjectListOptions = {}): UseProjectListReturn {
  const { recentProjects = [] } = options;

  // 状态
  const [projects, setProjects] = useState<ProjectView[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 加载项目数据
  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadFailed(false);
      const data = await listProjects();
      const mapped = (Array.isArray(data) ? data : [])
        .filter((item) => typeof item.id === 'string')
        .map(asProjectView);
      setProjects(mapped);
    } catch (error) {
      logger.error('加载项目列表失败:', { error });
      notify.error(error, '加载项目列表失败，请稍后重试');
      setProjects([]);
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载 + 事件监听
  useEffect(() => {
    void loadProjectData();
    const handleProjectsChanged = () => { void loadProjectData(); };
    window.addEventListener(PROJECTS_CHANGED_EVENT, handleProjectsChanged);
    return () => { window.removeEventListener(PROJECTS_CHANGED_EVENT, handleProjectsChanged); };
  }, [loadProjectData]);

  // 排序后的项目（最近项目优先）
  const orderedProjects = useMemo(() => {
    const recentOrder = new Map(recentProjects.map((id, index) => [id, index]));
    return [...projects].sort((a, b) => {
      const aOrder = recentOrder.get(a.id);
      const bOrder = recentOrder.get(b.id);
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [projects, recentProjects]);

  // 过滤后的项目
  const filteredProjects = orderedProjects.filter(p => {
    const matchSearch = !searchText || p.name.includes(searchText) || p.description?.includes(searchText);
    const uiStatus = getProjectUIStatus(p).status;
    const matchStatus = statusFilter === 'all' || uiStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  // 删除确认
  const confirmDelete = useCallback(async (id: string) => {
    try {
      const ok = await deleteProjectFile(id);
      if (!ok) { notify.error(null, '删除项目失败'); return; }
      notify.success('项目已删除');
      await loadProjectData();
    } catch (error) {
      logger.error('删除项目失败:', { error });
      notify.error(error, '删除项目失败，请稍后重试');
    }
    setDeleteConfirmId(null);
  }, [loadProjectData]);

  // 生成项目操作按钮
  const projectActions = useCallback((project: ProjectView) => [
    { key: 'edit', label: '编辑项目', icon: null, onClick: () => {} },
    { key: 'editor', label: '进入工作台', icon: null, onClick: () => {} },
    { key: 'export', label: '导出', icon: null },
    { key: 'divider', type: 'divider' as const },
    { key: 'delete', label: '删除', icon: null, danger: true, onClick: () => setDeleteConfirmId(project.id) },
  ], []);

  // 状态过滤器数据
  const statusFilters = useMemo(() => [
    { label: '全部', value: projects.length, color: '#667eea', filter: 'all' as ProjectStatusFilter },
    { label: '草稿', value: projects.filter(p => getProjectUIStatus(p).status === 'draft').length, color: '#8c8c8c', filter: 'draft' as ProjectStatusFilter },
    { label: '制作中', value: projects.filter(p => getProjectUIStatus(p).status === 'processing').length, color: '#1890ff', filter: 'processing' as ProjectStatusFilter },
    { label: '已完成', value: projects.filter(p => getProjectUIStatus(p).status === 'completed').length, color: '#52c41a', filter: 'completed' as ProjectStatusFilter },
  ], [projects]);

  return {
    // 状态
    projects,
    viewMode,
    searchText,
    statusFilter,
    loading,
    loadFailed,
    deleteConfirmId,

    // 计算属性
    orderedProjects,
    filteredProjects,
    statusFilters,

    // 操作方法
    loadProjectData,
    setViewMode,
    setSearchText,
    setStatusFilter,
    setDeleteConfirmId,
    confirmDelete,

    // 动作生成
    projectActions,
  };
}