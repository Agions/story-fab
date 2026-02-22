/**
 * 存储服务
 * 统一的本地存储管理
 */

import type { ProjectData, AppState, UserPreferences } from '@/core/types';

// 存储键名
const STORAGE_KEYS = {
  PROJECTS: 'reelforge_projects',
  APP_STATE: 'reelforge_app_state',
  USER_PREFERENCES: 'reelforge_preferences',
  RECENT_FILES: 'reelforge_recent_files',
  MODEL_SETTINGS: 'reelforge_model_settings',
  EXPORT_HISTORY: 'reelforge_export_history'
};

class StorageService {
  /**
   * 项目存储
   */
  projects = {
    getAll: (): ProjectData[] => {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : [];
    },

    getById: (id: string): ProjectData | null => {
      const projects = this.projects.getAll();
      return projects.find(p => p.id === id) || null;
    },

    save: (project: ProjectData): void => {
      const projects = this.projects.getAll();
      const index = projects.findIndex(p => p.id === project.id);

      if (index >= 0) {
        projects[index] = { ...project, updatedAt: new Date().toISOString() };
      } else {
        projects.push(project);
      }

      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    },

    delete: (id: string): void => {
      const projects = this.projects.getAll().filter(p => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    },

    search: (query: string): ProjectData[] => {
      const projects = this.projects.getAll();
      const lowerQuery = query.toLowerCase();
      return projects.filter(p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery)
      );
    },

    getRecent: (count: number = 10): ProjectData[] => {
      return this.projects.getAll()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, count);
    },

    export: (id: string): string => {
      const project = this.projects.getById(id);
      return project ? JSON.stringify(project, null, 2) : '';
    },

    import: (json: string): ProjectData | null => {
      try {
        const project = JSON.parse(json);
        project.id = `${project.id}_imported_${Date.now()}`;
        project.createdAt = new Date().toISOString();
        project.updatedAt = new Date().toISOString();
        this.projects.save(project);
        return project;
      } catch {
        return null;
      }
    }
  };

  /**
   * 应用状态
   */
  appState = {
    get: (): Partial<AppState> => {
      const data = localStorage.getItem(STORAGE_KEYS.APP_STATE);
      return data ? JSON.parse(data) : {};
    },

    set: (state: Partial<AppState>): void => {
      const current = this.appState.get();
      localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify({ ...current, ...state }));
    },

    clear: (): void => {
      localStorage.removeItem(STORAGE_KEYS.APP_STATE);
    }
  };

  /**
   * 用户偏好
   */
  preferences = {
    get: (): UserPreferences => {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      const defaults: UserPreferences = {
        autoSave: true,
        autoSaveInterval: 30,
        defaultVideoQuality: 'high',
        defaultOutputFormat: 'mp4',
        enablePreview: true,
        previewQuality: 'medium',
        notifications: true,
        soundEffects: true
      };
      return data ? { ...defaults, ...JSON.parse(data) } : defaults;
    },

    set: (prefs: Partial<UserPreferences>): void => {
      const current = this.preferences.get();
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify({ ...current, ...prefs }));
    },

    reset: (): void => {
      localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES);
    }
  };

  /**
   * 最近文件
   */
  recentFiles = {
    get: (): string[] => {
      const data = localStorage.getItem(STORAGE_KEYS.RECENT_FILES);
      return data ? JSON.parse(data) : [];
    },

    add: (path: string): void => {
      const files = this.recentFiles.get();
      const updated = [path, ...files.filter(f => f !== path)].slice(0, 20);
      localStorage.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify(updated));
    },

    remove: (path: string): void => {
      const files = this.recentFiles.get().filter(f => f !== path);
      localStorage.setItem(STORAGE_KEYS.RECENT_FILES, JSON.stringify(files));
    },

    clear: (): void => {
      localStorage.removeItem(STORAGE_KEYS.RECENT_FILES);
    }
  };

  /**
   * 模型设置
   */
  modelSettings = {
    get: (provider: string): any => {
      const data = localStorage.getItem(`${STORAGE_KEYS.MODEL_SETTINGS}_${provider}`);
      return data ? JSON.parse(data) : null;
    },

    set: (provider: string, settings: any): void => {
      localStorage.setItem(`${STORAGE_KEYS.MODEL_SETTINGS}_${provider}`, JSON.stringify(settings));
    },

    delete: (provider: string): void => {
      localStorage.removeItem(`${STORAGE_KEYS.MODEL_SETTINGS}_${provider}`);
    },

    getAll: (): Record<string, any> => {
      const settings: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEYS.MODEL_SETTINGS)) {
          const provider = key.replace(`${STORAGE_KEYS.MODEL_SETTINGS}_`, '');
          settings[provider] = this.modelSettings.get(provider);
        }
      }
      return settings;
    }
  };

  /**
   * 导出历史
   */
  exportHistory = {
    get: (): any[] => {
      const data = localStorage.getItem(STORAGE_KEYS.EXPORT_HISTORY);
      return data ? JSON.parse(data) : [];
    },

    add: (record: any): void => {
      const history = this.exportHistory.get();
      history.unshift({ ...record, timestamp: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEYS.EXPORT_HISTORY, JSON.stringify(history.slice(0, 100)));
    },

    clear: (): void => {
      localStorage.removeItem(STORAGE_KEYS.EXPORT_HISTORY);
    }
  };

  /**
   * 通用存储
   */
  set<T>(key: string, value: T): void {
    localStorage.setItem(`reelforge_${key}`, JSON.stringify(value));
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    const data = localStorage.getItem(`reelforge_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  }

  remove(key: string): void {
    localStorage.removeItem(`reelforge_${key}`);
  }

  /**
   * 清空所有数据
   */
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    // 清理所有 reelforge_ 前缀的数据
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('reelforge_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * 导出所有数据
   */
  exportAll(): string {
    const data: Record<string, any> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('reelforge_')) {
        const value = localStorage.getItem(key);
        data[key] = value ? JSON.parse(value) : null;
      }
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * 导入数据
   */
  importAll(json: string): boolean {
    try {
      const data = JSON.parse(json);
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取存储大小
   */
  getSize(): { used: number; total: number } {
    let used = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('reelforge_')) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      }
    }

    // localStorage 通常限制为 5-10MB
    const total = 5 * 1024 * 1024;

    return { used, total };
  }
}

export const storageService = new StorageService();
export default storageService;
