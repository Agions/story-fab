/**
 * ShortcutOverlay — 快捷键覆盖层
 *
 * 触发方式：
 *  - 按 ? 键
 *  - 菜单 Help → Keyboard Shortcuts
 */
import React, { useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import styles from './ShortcutOverlay.module.less';

export interface ShortcutOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutItem {
  key: string;
  desc: string;
}

interface ShortcutCategory {
  category: string;
  items: ShortcutItem[];
}

const KEYBOARD_SHORTCUTS: ShortcutCategory[] = [
  {
    category: '播放控制',
    items: [
      { key: 'Space', desc: '播放 / 暂停' },
      { key: 'K', desc: '暂停' },
      { key: 'J', desc: '后退 3 秒' },
      { key: 'L', desc: '前进 3 秒' },
      { key: '←', desc: '后退 1 秒' },
      { key: '→', desc: '前进 1 秒' },
    ],
  },
  {
    category: '入出点标记',
    items: [
      { key: 'I', desc: '标记入点' },
      { key: 'O', desc: '标记出点' },
    ],
  },
  {
    category: '项目操作',
    items: [
      { key: '⌘S / Ctrl+S', desc: '保存项目' },
      { key: '⌘Z / Ctrl+Z', desc: '撤销' },
      { key: '⇧⌘Z / Ctrl+Shift+Z', desc: '重做' },
      { key: '⌘E / Ctrl+E', desc: '导出' },
      { key: '⌘A / Ctrl+A', desc: '全选' },
    ],
  },
  {
    category: '片段编辑',
    items: [
      { key: 'Delete', desc: '删除选中片段' },
      { key: '⌘C / Ctrl+C', desc: '复制' },
      { key: '⌘V / Ctrl+V', desc: '粘贴' },
    ],
  },
  {
    category: '时间线',
    items: [
      { key: '↑', desc: '放大时间线' },
      { key: '↓', desc: '缩小时间线' },
      { key: 'Home', desc: '跳转到开头' },
      { key: 'End', desc: '跳转到结尾' },
    ],
  },
];

function KbdBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className={styles.kbdBadge}>
      {children}
    </kbd>
  );
}

export const ShortcutOverlay = React.memo<ShortcutOverlayProps>(
  ({ open, onOpenChange }) => {
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const target = e.target as HTMLElement;
          if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
          ) {
            return;
          }
          e.preventDefault();
          onOpenChange(true);
        }
        if (e.key === 'Escape' && open) {
          onOpenChange(false);
        }
      },
      [open, onOpenChange]
    );

    useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className={`max-w-lg w-full p-0 overflow-hidden ${styles.overlay}`}
        >
          <DialogHeader className={`px-6 pt-5 pb-4 ${styles.header}`}>
            <DialogTitle className={styles.title}>
              键盘快捷键
            </DialogTitle>
            <DialogDescription className={styles.description}>
              Keyboard Shortcuts — 按 <kbd className={styles.inlineKbd}>?</kbd> 键快速打开
            </DialogDescription>
          </DialogHeader>

          <div className={styles.scrollArea}>
            {KEYBOARD_SHORTCUTS.map((group) => (
              <div key={group.category} className={styles.category}>
                <div className={styles.categoryTitle}>
                  {group.category}
                </div>
                <table className={styles.table}>
                  <tbody>
                    {group.items.map((item, i) => (
                      <tr
                        key={item.key}
                        className={`${styles.row} ${i % 2 === 0 ? styles.rowEven : styles.rowOdd}`}
                      >
                        <td className={`${styles.cell} ${styles.cellKey}`}>
                          <div className={styles.keyGroup}>
                            {item.key.split('/').map((part, j) => (
                              <React.Fragment key={j}>
                                {j > 0 && (
                                  <span className={styles.separator}>/</span>
                                )}
                                {part.trim().split('+').map((keyPart, k) => (
                                  <React.Fragment key={k}>
                                    {k > 0 && (
                                      <span className={styles.separator}>+</span>
                                    )}
                                    <KbdBadge>
                                      {keyPart.trim()}
                                    </KbdBadge>
                                  </React.Fragment>
                                ))}
                              </React.Fragment>
                            ))}
                          </div>
                        </td>
                        <td className={`${styles.cell} ${styles.cellDesc}`}>
                          {item.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

ShortcutOverlay.displayName = 'ShortcutOverlay';
export default ShortcutOverlay;
