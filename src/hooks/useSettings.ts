/**
 * 设置页面专用 Hooks
 */
import { useState, useCallback } from 'react';

/**
 * 应用设置类型
 */
export interface AppSettings {
  autoSave: boolean;
  compactMode: boolean;
  language: string;
  theme: string;
  defaultModel: string;
  outputPath: string;
  recentProjects: string[];
}

/**
 * 本地存储 Hook
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('LocalStorage save error:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

/**
 * 设置状态 Hook (兼容 SettingsContext)
 */
export function useSettingsStore() {
  const [autoSave, setAutoSave] = useLocalStorage('clipflow-autosave', true);
  const [compactMode, setCompactMode] = useLocalStorage('clipflow-compact', false);
  const [language, setLanguage] = useLocalStorage('clipflow-language', 'zh-CN');
  const [theme, setTheme] = useLocalStorage('clipflow-theme', 'light');
  const [defaultModel, setDefaultModel] = useLocalStorage('clipflow-default-model', 'deepseek-chat');
  const [outputPath, setOutputPath] = useLocalStorage('clipflow-output-path', '');
  const [recentProjects, setRecentProjects] = useLocalStorage<string[]>('clipflow-recent-projects', []);

  const settings: AppSettings = {
    autoSave,
    compactMode,
    language,
    theme,
    defaultModel,
    outputPath,
    recentProjects,
  };

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    if (newSettings.autoSave !== undefined) setAutoSave(newSettings.autoSave);
    if (newSettings.compactMode !== undefined) setCompactMode(newSettings.compactMode);
    if (newSettings.language !== undefined) setLanguage(newSettings.language);
    if (newSettings.theme !== undefined) setTheme(newSettings.theme);
    if (newSettings.defaultModel !== undefined) setDefaultModel(newSettings.defaultModel);
    if (newSettings.outputPath !== undefined) setOutputPath(newSettings.outputPath);
    if (newSettings.recentProjects !== undefined) setRecentProjects(newSettings.recentProjects);
  }, [setAutoSave, setCompactMode, setLanguage, setTheme, setDefaultModel, setOutputPath, setRecentProjects]);

  const resetSettings = useCallback(() => {
    setAutoSave(true);
    setCompactMode(false);
    setLanguage('zh-CN');
    setTheme('light');
    setDefaultModel('deepseek-chat');
    setOutputPath('');
    setRecentProjects([]);
  }, [setAutoSave, setCompactMode, setLanguage, setTheme, setDefaultModel, setOutputPath, setRecentProjects]);

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

/**
 * 设置状态 Hook
 */
export function useAppSettings() {
  const [autoSave, setAutoSave] = useLocalStorage('clipflow-autosave', true);
  const [compactMode, setCompactMode] = useLocalStorage('clipflow-compact', false);
  const [language, setLanguage] = useLocalStorage('clipflow-language', 'zh-CN');
  const [theme, setTheme] = useLocalStorage('clipflow-theme', 'light');
  const [defaultModel, setDefaultModel] = useLocalStorage('clipflow-default-model', 'deepseek-chat');
  const [outputPath, setOutputPath] = useLocalStorage('clipflow-output-path', '');

  const resetAll = useCallback(() => {
    setAutoSave(true);
    setCompactMode(false);
    setLanguage('zh-CN');
    setTheme('light');
    setDefaultModel('deepseek-chat');
    setOutputPath('');
  }, [setAutoSave, setCompactMode, setLanguage, setTheme, setDefaultModel, setOutputPath]);

  return {
    autoSave, setAutoSave,
    compactMode, setCompactMode,
    language, setLanguage,
    theme, setTheme,
    defaultModel, setDefaultModel,
    outputPath, setOutputPath,
    resetAll,
  };
}
