/**
 * ShortcutSettings — 快捷键设置
 * Table: Action | Shortcut (editable)
 * 20+ shortcuts with editable bindings
 */
import React, { memo, useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface Shortcut {
  action: string;
  keys: string;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { action: 'Play / Pause', keys: 'Space' },
  { action: 'Set In Point', keys: 'I' },
  { action: 'Set Out Point', keys: 'O' },
  { action: 'Reverse Play', keys: 'J' },
  { action: 'Stop', keys: 'K' },
  { action: 'Forward Play', keys: 'L' },
  { action: 'Delete Selection', keys: 'Delete' },
  { action: 'Undo', keys: 'Ctrl+Z' },
  { action: 'Redo', keys: 'Ctrl+Y' },
  { action: 'Cut', keys: 'Ctrl+X' },
  { action: 'Copy', keys: 'Ctrl+C' },
  { action: 'Paste', keys: 'Ctrl+V' },
  { action: 'Select All', keys: 'Ctrl+A' },
  { action: 'Split at Playhead', keys: 'S' },
  { action: 'New Project', keys: 'Ctrl+N' },
  { action: 'Open Project', keys: 'Ctrl+O' },
  { action: 'Save Project', keys: 'Ctrl+S' },
  { action: 'Export', keys: 'Ctrl+E' },
  { action: 'Toggle Fullscreen', keys: 'F11' },
  { action: 'Show Shortcuts', keys: 'Ctrl+/' },
];

export const ShortcutSettings = memo(() => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(DEFAULT_SHORTCUTS);

  const updateShortcut = (index: number, keys: string) => {
    setShortcuts((prev) =>
      prev.map((s, i) => (i === index ? { ...s, keys } : s))
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
        Keyboard Shortcuts
      </h3>

      <div className="border border-border-subtle rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-tertiary">
              <th className="text-left px-4 py-2 text-[11px] font-medium text-text-secondary w-1/2">Action</th>
              <th className="text-left px-4 py-2 text-[11px] font-medium text-text-secondary">Shortcut</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map((shortcut, i) => (
              <tr
                key={shortcut.action}
                className={`border-b border-border-subtle last:border-0 ${i % 2 === 0 ? 'bg-bg-secondary' : 'bg-bg-tertiary/50'}`}
              >
                <td className="px-4 py-2 text-xs text-text-primary">{shortcut.action}</td>
                <td className="px-4 py-2">
                  <Input
                    value={shortcut.keys}
                    onChange={(e) => updateShortcut(i, e.target.value)}
                    className="h-6 w-32 text-[11px] bg-bg-tertiary border-border-subtle text-text-primary font-mono"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ShortcutSettings.displayName = 'ShortcutSettings';
