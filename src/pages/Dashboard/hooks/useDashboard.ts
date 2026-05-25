/**
 * useDashboard Hook - 抽取数据获取逻辑
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '../../../shared/utils/logging';
import {
  listProjects,
  getFileSizeMb,
  PROJECTS_CHANGED_EVENT,
  deleteProject,
} from '../../../services/tauri';
import { useSettings } from '../../../context/SettingsContext';
import {
  extractProjectMediaMetrics,
  notify,
  pickPreferredSizeMb,
  RawProjectRecord,
  resolveProjectVideoPath,
  concurrentMap,
} from '@/shared';
import { Project, DashboardStats } from '../types';

export interface UseDashboardReturn {
  projects: Project[];
  loading: boolean;
  stats: DashboardStats;
  loadProjects: () => Promise<void>;
  toggleStar: (id: string) => void;
  deleteProject: (id: string) => void;
  createNewProject: () => void;
  openProject: (id: string) => void;
}

export function useDashboard(): UseDashboardReturn {
  const navigate = useNavigate();
  const { addRecentProject } = useSettings();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [_deleteConfirmId, _setDeleteConfirmId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      const rawProjects = await listProjects();
      const filtered = rawProjects.filter((p) => typeof p.id === 'string');
      const mapped: Project[] = await concurrentMap(
        filtered,
        async (project: RawProjectRecord) => {
          const metrics = extractProjectMediaMetrics(project);
          const videoPath = resolveProjectVideoPath(project);
          const exactSizeMb = videoPath ? (await getFileSizeMb(videoPath)) : 0;
          const size = pickPreferredSizeMb(exactSizeMb, metrics.explicitSizeMb, metrics.estimatedSizeMb);

          return {
            id: String(project.id),
            title: String(project.name || '未命名项目'),
            thumbnail: `https://picsum.photos/seed/${project.id || 'default'}/300/200`,
            createdAt: String(project.createdAt || new Date().toISOString()),
            updatedAt: String(project.updatedAt || project.createdAt || new Date().toISOString()),
            duration: metrics.durationSec,
            size,
            starred: false,
            tags: [String(project.status || 'draft')],
            status: (project.status as Project['status']) ?? 'draft',
          };
        }
      );
      setProjects(mapped);
    } catch (error) {
      logger.error('加载项目失败:', { error });
      notify.error(error, '加载项目失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
    const handleProjectsChanged = () => { void loadProjects(); };
    window.addEventListener(PROJECTS_CHANGED_EVENT, handleProjectsChanged);
    return () => window.removeEventListener(PROJECTS_CHANGED_EVENT, handleProjectsChanged);
  }, [loadProjects]);

  const stats = useMemo((): DashboardStats => {
    const totalProjects = projects.length;
    const totalDuration = projects.reduce((sum, p) => sum + p.duration, 0);
    const totalSize = projects.reduce((sum, p) => sum + p.size, 0);
    return { totalProjects, totalDuration, totalSize };
  }, [projects]);

  const toggleStar = useCallback((id: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p)));
  }, []);

  const _confirmDelete = async (id: string) => {
    try {
      const ok = await deleteProject(id);
      if (ok) {
        notify.success('项目已删除');
        await loadProjects();
      } else {
        notify.error(null, '删除项目失败');
      }
    } catch (error) {
      logger.error('删除项目失败:', { error });
      notify.error(error, '删除项目失败，请稍后重试');
    } finally {
      _setDeleteConfirmId(null);
    }
  };

  const createNewProject = useCallback(() => { navigate('/project/new'); }, [navigate]);

  const openProject = useCallback((id: string) => {
    addRecentProject(id);
    navigate(`/project/edit/${id}`);
  }, [navigate, addRecentProject]);

  return {
    projects,
    loading,
    stats,
    loadProjects,
    toggleStar,
    deleteProject,
    createNewProject,
    openProject,
  };
}
