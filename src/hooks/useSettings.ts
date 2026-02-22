/**
 * 应用设置相关的自定义钩子
 * 提供了一系列钩子用于管理应用设置和API密钥
 * 
 * @author Agions
 * @date 2024
 * @version 1.0
 */
import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import { AIModelType } from '../types';

// 启用调试模式
const DEBUG = false;

// 从本地存储获取值的通用函数
const getStoredValue = <T>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    if (DEBUG) console.log(`[useSettings] 读取设置: ${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`[useSettings] 读取 ${key} 时发生错误:`, error);
    return defaultValue;
  }
};

// 设置本地存储值的通用函数
const setStoredValue = <T>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    if (DEBUG) console.log(`[useSettings] 保存设置: ${key}`, value);
  } catch (error) {
    console.error(`[useSettings] 保存 ${key} 时发生错误:`, error);
  }
};

// 完整的应用设置类型
export interface AppSettings {
  autoSave: boolean;
  autoUpdate: boolean;
  highQualityExport: boolean;
  enableTranscode: boolean;
  showLineNumbers: boolean;
  defaultModelIndex: number;
  preferredAIProvider: string;
  preferredAICategory: string;
  language: 'zh' | 'en';
  theme: 'light' | 'dark' | 'auto';
  ffmpegPath?: string;
  lastExportFormat?: string;
  recentProjects?: string[];
}

// 默认设置
const DEFAULT_SETTINGS: AppSettings = {
  autoSave: true,
  autoUpdate: true,
  highQualityExport: true,
  enableTranscode: false,
  showLineNumbers: true,
  defaultModelIndex: 0,
  preferredAIProvider: 'openai',
  preferredAICategory: 'all',
  language: 'zh',
  theme: 'auto',
  recentProjects: []
};

// API密钥状态类型
export interface ApiKeyState {
  value: string;
  isValid: boolean | null;
  isTesting: boolean;
}

// 应用设置钩子
export const useSettingsStore = () => {
  const [settings, setSettings] = useState<AppSettings>(
    () => getStoredValue('app_settings', DEFAULT_SETTINGS)
  );

  // 更新设置
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      setStoredValue('app_settings', updated);
      return updated;
    });
  }, []);

  // 重置为默认设置
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setStoredValue('app_settings', DEFAULT_SETTINGS);
    if (DEBUG) console.log('[useSettings] 重置所有设置为默认值');
  }, []);

  // 添加最近项目
  const addRecentProject = useCallback((projectId: string) => {
    setSettings(prev => {
      const recentProjects = prev.recentProjects || [];
      // 如果已存在，先移除
      const filtered = recentProjects.filter(id => id !== projectId);
      // 添加到最前面
      const updated = [projectId, ...filtered].slice(0, 10); // 最多保留10个
      
      const newSettings = { ...prev, recentProjects: updated };
      setStoredValue('app_settings', newSettings);
      return newSettings;
    });
  }, []);

  return { 
    settings, 
    updateSettings, 
    resetSettings,
    addRecentProject
  };
};

// API密钥相关钩子
// OpenAI API密钥
export const useOpenAIAPIKey = () => {
  const [apiKey, setApiKey] = useState<ApiKeyState>(() => getStoredValue('openai_api_key', { 
    value: '', 
    isValid: null, 
    isTesting: false 
  }));

  const updateApiKey = useCallback((newApiKey: Partial<ApiKeyState>) => {
    setApiKey(prev => {
      const updated = { ...prev, ...newApiKey };
      setStoredValue('openai_api_key', updated);
      return updated;
    });
  }, []);

  return [apiKey, updateApiKey] as const;
};

// Claude API密钥
export const useClaudeAPIKey = () => {
  const [apiKey, setApiKey] = useState<ApiKeyState>(() => getStoredValue('anthropic_api_key', { 
    value: '', 
    isValid: null, 
    isTesting: false 
  }));

  const updateApiKey = useCallback((newApiKey: Partial<ApiKeyState>) => {
    setApiKey(prev => {
      const updated = { ...prev, ...newApiKey };
      setStoredValue('anthropic_api_key', updated);
      return updated;
    });
  }, []);

  return [apiKey, updateApiKey] as const;
};

// 讯飞 API密钥
export const useXFAPIKey = () => {
  const [apiKey, setApiKey] = useState<ApiKeyState>(() => getStoredValue('iflytek_api_key', { 
    value: '', 
    isValid: null, 
    isTesting: false 
  }));

  const updateApiKey = useCallback((newApiKey: Partial<ApiKeyState>) => {
    setApiKey(prev => {
      const updated = { ...prev, ...newApiKey };
      setStoredValue('iflytek_api_key', updated);
      return updated;
    });
  }, []);

  return [apiKey, updateApiKey] as const;
};

// 智谱 API密钥
export const useZhipuAPIKey = () => {
  const [apiKey, setApiKey] = useState<ApiKeyState>(() => getStoredValue('zhipu_api_key', { 
    value: '', 
    isValid: null, 
    isTesting: false 
  }));

  const updateApiKey = useCallback((newApiKey: Partial<ApiKeyState>) => {
    setApiKey(prev => {
      const updated = { ...prev, ...newApiKey };
      setStoredValue('zhipu_api_key', updated);
      return updated;
    });
  }, []);

  return [apiKey, updateApiKey] as const;
};

// Anthropic API密钥
export const useAnthropic = () => {
  const [apiKey, setApiKey] = useState<ApiKeyState>(() => getStoredValue('anthropic_api_key', { 
    value: '', 
    isValid: null, 
    isTesting: false 
  }));

  const updateApiKey = useCallback((newApiKey: Partial<ApiKeyState>) => {
    setApiKey(prev => {
      const updated = { ...prev, ...newApiKey };
      setStoredValue('anthropic_api_key', updated);
      return updated;
    });
  }, []);

  return [apiKey, updateApiKey] as const;
};

// 百度 API密钥
export const useBaiduAPIKey = () => {
  const [apiKey, setApiKey] = useState<ApiKeyState>(() => getStoredValue('baidu_api_key', { 
    value: '', 
    isValid: null, 
    isTesting: false 
  }));

  const updateApiKey = useCallback((newApiKey: Partial<ApiKeyState>) => {
    setApiKey(prev => {
      const updated = { ...prev, ...newApiKey };
      setStoredValue('baidu_api_key', updated);
      return updated;
    });
  }, []);

  return [apiKey, updateApiKey] as const;
};

// 通用API密钥设置钩子
export const useApiKey = (provider: string) => {
  const storageKey = `${provider}_api_key`;
  
  const [apiKey, setApiKey] = useState<ApiKeyState>(() => getStoredValue(storageKey, { 
    value: '', 
    isValid: null, 
    isTesting: false 
  }));

  const updateApiKey = useCallback((newApiKey: Partial<ApiKeyState>) => {
    setApiKey(prev => {
      const updated = { ...prev, ...newApiKey };
      setStoredValue(storageKey, updated);
      return updated;
    });
  }, [storageKey]);

  // 验证API密钥
  const validateApiKey = useCallback(async () => {
    if (!apiKey.value) {
      updateApiKey({ isValid: false });
      return false;
    }

    updateApiKey({ isTesting: true });
    
    try {
      // 这里应该调用实际的验证接口
      // 目前使用模拟验证
      const valid = await new Promise<boolean>(resolve => {
        setTimeout(() => {
          if (provider === 'openai' && !apiKey.value.startsWith('sk-')) {
            resolve(false);
          } else if (provider === 'anthropic' && !apiKey.value.startsWith('sk-ant-')) {
            resolve(false);
          } else {
            resolve(apiKey.value.length >= 10);
          }
        }, 800);
      });

      updateApiKey({ isValid: valid, isTesting: false });
      return valid;
    } catch (error) {
      console.error(`[useSettings] 验证${provider} API密钥时发生错误:`, error);
      updateApiKey({ isValid: false, isTesting: false });
      return false;
    }
  }, [apiKey.value, provider, updateApiKey]);

  return { apiKey, updateApiKey, validateApiKey };
};

// 自动保存设置
export const useAutoSave = () => {
  const { settings, updateSettings } = useSettingsStore();

  const toggleAutoSave = useCallback(() => {
    updateSettings({ autoSave: !settings.autoSave });
  }, [settings.autoSave, updateSettings]);

  return [settings.autoSave, toggleAutoSave] as const;
};

// 主题设置
export const useTheme = () => {
  const { isDarkMode, setIsDarkMode } = useStore();
  const { settings, updateSettings } = useSettingsStore();

  // 切换主题
  const toggleTheme = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    updateSettings({ theme: newDarkMode ? 'dark' : 'light' });
  }, [isDarkMode, setIsDarkMode, updateSettings]);

  // 设置主题
  const setTheme = useCallback((theme: 'light' | 'dark' | 'auto') => {
    updateSettings({ theme });
    
    if (theme === 'auto') {
      // 使用系统设置
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    } else {
      setIsDarkMode(theme === 'dark');
    }
  }, [setIsDarkMode, updateSettings]);

  return { isDarkMode, toggleTheme, theme: settings.theme, setTheme };
};

// 首选模型
export const usePreferredModel = () => {
  const { settings, updateSettings } = useSettingsStore();

  const updateDefaultModelIndex = useCallback((index: number) => {
    updateSettings({ defaultModelIndex: index });
  }, [updateSettings]);

  return [settings.defaultModelIndex, updateDefaultModelIndex] as const;
};

// 首选AI提供商
export const usePreferredAIProvider = () => {
  const { settings, updateSettings } = useSettingsStore();

  const updatePreferredProvider = useCallback((provider: string) => {
    updateSettings({ preferredAIProvider: provider });
  }, [updateSettings]);

  return [settings.preferredAIProvider, updatePreferredProvider] as const;
};

// 首选AI类别
export const usePreferredAICategory = () => {
  const { settings, updateSettings } = useSettingsStore();

  const updatePreferredCategory = useCallback((category: string) => {
    updateSettings({ preferredAICategory: category });
  }, [updateSettings]);

  return [settings.preferredAICategory, updatePreferredCategory] as const;
}; 