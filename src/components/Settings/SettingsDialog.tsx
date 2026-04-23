/**
 * SettingsDialog — 设置对话框
 * shadcn Dialog, 640px wide
 * 4 tabs: AI | Appearance | Shortcuts | Export
 */
import React, { memo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AISettings } from './AISettings';
import { AppearanceSettings } from './AppearanceSettings';
import { ShortcutSettings } from './ShortcutSettings';
import { ExportSettings } from './ExportSettings';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabKey = 'ai' | 'appearance' | 'shortcuts' | 'export';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ai', label: 'AI' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'shortcuts', label: 'Shortcuts' },
  { key: 'export', label: 'Export' },
];

export const SettingsDialog = memo<SettingsDialogProps>(({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('ai');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full" style={{ maxWidth: 640, backgroundColor: '#18181B', border: '1px solid #27272A' }}>
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-text-primary">
            Settings
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px
                ${activeTab === tab.key
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {activeTab === 'ai' && <AISettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'shortcuts' && <ShortcutSettings />}
          {activeTab === 'export' && <ExportSettings />}
        </div>
      </DialogContent>
    </Dialog>
  );
});

SettingsDialog.displayName = 'SettingsDialog';
