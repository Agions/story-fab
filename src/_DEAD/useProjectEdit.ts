/**
 * 项目编辑 Hook
 * 封装项目编辑的常用逻辑
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { notify } from '@/shared';
import { loadProjectWithRetry, saveProjectToFile } from '@/services/tauri';
import { normalizeProjectFile, type ProjectFileLike } from '@/core/utils/project-file';

export interface UseProjectEditOptions {
  /** 自动保存 */
  autoSave?: boolean;
  /** 保存后跳转 */
  redirectAfterSave?: boolean;
}

export interface ProjectEditState {
  projectId: string | null;
  project: ProjectFileLike | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  hasChanges: boolean;
}

export interface ProjectEditActions {
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  updateProject: (data: Partial<ProjectFileLike>) => void;
  resetProject: () => void;
}

/**
 * 项目编辑 Hook
 */
export function useProjectEdit(options: UseProjectEditOptions = {}): [ProjectEditState, ProjectEditActions] {
  const { autoSave = true, redirectAfterSave = false } = options;
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [state, setState] = useState<ProjectEditState>({
    projectId: id || null,
    project: null,
    loading: false,
    saving: false,
    error: null,
    hasChanges: false,
  });

  // 加载项目
  const loadProject = useCallback(async (projectId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const project = await loadProjectWithRetry(projectId);
      setState(prev => ({
        ...prev,
        project: normalizeProjectFile(project as any),
        loading: false,
        projectId,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '加载失败',
      }));
      notify.error(error, '加载项目失败');
    }
  }, []);

  // 保存项目
  const saveProject = useCallback(async () => {
    if (!state.project || state.saving) return;

    setState(prev => ({ ...prev, saving: true }));

    try {
      const savedProjectId = state.projectId ?? await saveProjectToFile(state.project!.id, state.project);
      const projectId = savedProjectId ?? state.projectId;
      setState(prev => ({
        ...prev,
        projectId: projectId as string,
        saving: false,
        hasChanges: false,
      }));

      notify.success('项目保存成功');

      if (redirectAfterSave) {
        navigate(`/project/${projectId}`);
      }
    } catch (error) {
      setState(prev => ({ ...prev, saving: false }));
      notify.error(error, '保存项目失败');
    }
  }, [state.project, state.saving, navigate, redirectAfterSave]);

  // 更新项目
  const updateProject = useCallback((data: Partial<ProjectFileLike>) => {
    setState(prev => ({
      ...prev,
      project: prev.project ? { ...prev.project, ...data } : null,
      hasChanges: true,
    }));
  }, []);

  // 重置项目
  const resetProject = useCallback(() => {
    setState(prev => ({
      ...prev,
      project: null,
      hasChanges: false,
      error: null,
    }));
  }, []);

  // 自动保存
  useEffect(() => {
    if (autoSave && state.hasChanges && state.project) {
      const timer = setTimeout(() => {
        saveProject();
      }, 3000); // 3 秒无操作后自动保存

      return () => clearTimeout(timer);
    }
  }, [autoSave, state.hasChanges, state.project, saveProject]);

  // 加载项目
  useEffect(() => {
    if (id) {
      loadProject(id);
    }
  }, [id, loadProject]);

  return [
    state,
    { loadProject, saveProject, updateProject, resetProject },
  ];
}

export default useProjectEdit;
