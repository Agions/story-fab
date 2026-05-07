/**
 * Settings Context
 *
 * 用户偏好设置的 Context 层
 * 底层使用 appStore 的 userSettings 状态
 */
import React, { createContext, useContext, ReactNode } from 'react';
import { useAppStore, UserSettings } from '@/store/appStore';
import { useSettingsStore } from '@/hooks/useSettings';

interface SettingsContextValue {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  compactMode: boolean;
  language: string;
  addRecentProject: (projectId: string) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const settings = useAppStore((s) => s.userSettings);
  const updateSettings = useAppStore((s) => s.updateUserSettings);
  const { addRecentProject } = useSettingsStore();

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        compactMode: settings.compactMode,
        language: settings.language,
        addRecentProject,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
