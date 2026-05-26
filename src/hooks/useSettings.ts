/**
 * 设置页面专用 Hooks
 */
import { useState, useCallback, useMemo } from 'react';
import { PROJECT_SAVE_BEHAVIOR_KEY, type ProjectSaveBehavior } from '../shared/constants/settings';
import useLocalStorage from './useLocalStorage';

/**
 * 应用设置类型
 */
export interface AppSettings {
  autoSave: boolean;
  compactMode: boolean;
  theme: string;
  defaultModel: string;
  projectSaveBehavior: ProjectSaveBehavior;
  outputPath: string;
  recentProjects: string[];
}

/**
 * 设置状态 Hook (兼容 SettingsContext)
 */
export function useSettingsStore() {
  const [autoSave, setAutoSave] = useLocalStorage('StoryFab-autosave', true);
  const [compactMode, setCompactMode] = useLocalStorage('StoryFab-compact', false);
  const [theme, setTheme] = useLocalStorage('StoryFab-theme', 'light');
  const [defaultModel, setDefaultModel] = useLocalStorage('StoryFab-default-model', 'deepseek-v4-flash');
  const [projectSaveBehavior, setProjectSaveBehavior] = useLocalStorage<ProjectSaveBehavior>(PROJECT_SAVE_BEHAVIOR_KEY, 'stay');
  const [outputPath, setOutputPath] = useLocalStorage('StoryFab-output-path', '');
  const [recentProjects, setRecentProjects] = useLocalStorage<string[]>('StoryFab-recent-projects', []);

  const settings = useMemo<AppSettings>(() => ({
    autoSave,
    compactMode,
    theme,
    defaultModel,
    projectSaveBehavior,
    outputPath,
    recentProjects,
  }), [autoSave, compactMode, theme, defaultModel, projectSaveBehavior, outputPath, recentProjects]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    if (newSettings.autoSave !== undefined) setAutoSave(newSettings.autoSave);
    if (newSettings.compactMode !== undefined) setCompactMode(newSettings.compactMode);
    if (newSettings.theme !== undefined) setTheme(newSettings.theme);
    if (newSettings.defaultModel !== undefined) setDefaultModel(newSettings.defaultModel);
    if (newSettings.projectSaveBehavior !== undefined) setProjectSaveBehavior(newSettings.projectSaveBehavior);
    if (newSettings.outputPath !== undefined) setOutputPath(newSettings.outputPath);
    if (newSettings.recentProjects !== undefined) setRecentProjects(newSettings.recentProjects);
  }, [setAutoSave, setCompactMode, setTheme, setDefaultModel, setProjectSaveBehavior, setOutputPath, setRecentProjects]);

  const resetSettings = useCallback(() => {
    setAutoSave(true);
    setCompactMode(false);
    setTheme('light');
    setDefaultModel('deepseek-v4-flash');
    setProjectSaveBehavior('stay');
    setOutputPath('');
    setRecentProjects([]);
  }, [setAutoSave, setCompactMode, setTheme, setDefaultModel, setProjectSaveBehavior, setOutputPath, setRecentProjects]);

  const addRecentProject = useCallback((projectId: string) => {
    setRecentProjects(prev => {
      const filtered = prev.filter(id => id !== projectId);
      return [projectId, ...filtered].slice(0, 10);
    });
  }, [setRecentProjects]);

  return {
    settings,
    updateSettings,
    resetSettings,
    addRecentProject,
  };
}

/**
 * API 密钥状态管理 Hook
 */
export function useApiKeyState(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testKey = useCallback(async (provider: string, testFn: (p: string, k: string) => Promise<boolean>) => {
    setIsTesting(true);
    try {
      const valid = await testFn(provider, value);
      setIsValid(valid);
      return valid;
    } catch {
      setIsValid(false);
      return false;
    } finally {
      setIsTesting(false);
    }
  }, [value]);

  const reset = useCallback(() => {
    setValue('');
    setIsValid(null);
    setIsTesting(false);
  }, []);

  return { value, setValue, isValid, isTesting, testKey, reset };
}


