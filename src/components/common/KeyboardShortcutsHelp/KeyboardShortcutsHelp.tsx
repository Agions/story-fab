/**
 * KeyboardShortcutsHelp - 键盘快捷键帮助面板
 * 按 ? 键呼出 / 关闭
 * 使用 shadcn/ui Dialog + Tailwind CSS
 */

import React, { useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { KEYBOARD_SHORTCUTS_HELP } from '../../../hooks/useKeyboardShortcuts';
import styles from '@/components/common/KeyboardShortcutsHelp/KeyboardShortcutsHelp.module.css';

interface KeyboardShortcutsHelpProps {
  visible: boolean;
  onClose: () => void;
}

const KbdKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className={styles.kbd}>{children}</kbd>
);

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ visible, onClose }) => {
  // Escape key listener
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border border-[var(--border)] bg-[var(--bg-secondary)] max-h-[70vh] flex flex-col">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-[var(--text)] flex items-center gap-2 text-base">
            ⌨️ 键盘快捷键 | Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-[var(--text-secondary)] text-xs">
            按 <KbdKey>?</KbdKey> 或 <KbdKey>Esc</KbdKey> 关闭 / Press to close
          </DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          {KEYBOARD_SHORTCUTS_HELP.map((section) => (
            <div key={section.category} className={styles.section}>
              <div className={styles.sectionTitle}>{section.category}</div>
              <div className={styles.items}>
                {section.items.map((item) => (
                  <div key={item.key} className={styles.item}>
                    <div className={styles.keys}>
                      {item.key.split('+').map((part, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <span className={styles.plus}>+</span>}
                          <KbdKey>{part.trim()}</KbdKey>
                        </React.Fragment>
                      ))}
                    </div>
                    <span className={styles.desc}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// 全局 ? 键监听 hook（可在 App root 层使用一次）
export const useShortcutsHelpToggle = (onToggle: (visible: boolean) => void) => {
  const handler = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    // Skip if focused in input/textarea
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }
    if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      onToggle(true);
    }
  }, [onToggle]);

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler]);
};

export default KeyboardShortcutsHelp;
