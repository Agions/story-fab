/**
 * AppearanceSettings — 外观设置
 * Theme toggle: shadcn Switch — "Dark" / "Light"
 */
import React, { memo } from 'react';
import { Switch } from '../ui/switch';

interface AppearanceSettingsProps {
  theme?: 'light' | 'dark' | 'auto';
  onThemeChange?: (theme: 'light' | 'dark' | 'auto') => void;
}

export const AppearanceSettings = memo<AppearanceSettingsProps>(({
  theme = 'dark',
  onThemeChange,
}) => {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Theme</h3>

        <div className="flex items-center gap-4">
          {(['dark', 'light', 'auto'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onThemeChange?.(t)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md border transition-colors
                ${theme === t
                  ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                  : 'border-border-subtle bg-bg-tertiary text-text-secondary hover:text-text-primary'
                }
              `}
            >
              <span className="w-3 h-3 rounded-full" style={{
                backgroundColor: t === 'light' ? '#f0f0f2' : t === 'dark' ? '#0d0d0f' : 'linear-gradient(135deg, #f0f0f2 50%, #0d0d0f 50%)'
              }} />
              <span className="text-xs font-medium capitalize">{t === 'auto' ? 'Auto' : t === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

AppearanceSettings.displayName = 'AppearanceSettings';
