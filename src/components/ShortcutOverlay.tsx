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
} from './ui/dialog';
import { useTheme } from '@/context/ThemeContext';

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

function KbdBadge({ children, style: kbdStyle }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <kbd
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 6px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        fontWeight: 500,
        borderRadius: '4px',
        border: '1px solid',
        whiteSpace: 'nowrap',
        minWidth: '24px',
        lineHeight: 1.4,
        ...kbdStyle,
      }}
    >
      {children}
    </kbd>
  );
}

export const ShortcutOverlay = React.memo<ShortcutOverlayProps>(
  ({ open, onOpenChange }) => {
    const { isDarkMode } = useTheme();

    // 全局 ? 键监听
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

    const borderColor = isDarkMode
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(0,0,0,0.08)';
    const headerBg = isDarkMode
      ? 'rgba(255,255,255,0.04)'
      : 'rgba(0,0,0,0.02)';
    const rowHover = isDarkMode
      ? 'rgba(255,255,255,0.04)'
      : 'rgba(0,0,0,0.03)';
    const mutedColor = isDarkMode ? '#8a8a96' : '#71717a';
    const primaryColor = isDarkMode ? '#f0f0f2' : '#09090b';
    const kbdBg = isDarkMode
      ? 'rgba(255,255,255,0.08)'
      : 'rgba(0,0,0,0.06)';
    const kbdBorder = isDarkMode
      ? 'rgba(255,255,255,0.12)'
      : 'rgba(0,0,0,0.12)';

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className="max-w-lg w-full p-0 overflow-hidden"
          style={{
            backgroundColor: isDarkMode ? '#141418' : '#ffffff',
            border: `1px solid ${borderColor}`,
          }}
        >
          <DialogHeader
            className="px-6 pt-5 pb-4"
            style={{ backgroundColor: headerBg, borderBottom: `1px solid ${borderColor}` }}
          >
            <DialogTitle
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: primaryColor,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              键盘快捷键
            </DialogTitle>
            <DialogDescription
              style={{
                fontSize: '12px',
                color: mutedColor,
                marginTop: '2px',
              }}
            >
              Keyboard Shortcuts — 按 <kbd style={{ background: kbdBg, border: `1px solid ${kbdBorder}`, color: primaryColor, padding: '2px 6px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500, borderRadius: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '24px', lineHeight: 1.4 }}>?</kbd> 键快速打开
            </DialogDescription>
          </DialogHeader>

          <div
            className="overflow-y-auto"
            style={{
              maxHeight: '420px',
              padding: '0 0 16px',
            }}
          >
            {KEYBOARD_SHORTCUTS.map((group) => (
              <div key={group.category} style={{ marginTop: '16px' }}>
                <div
                  style={{
                    padding: '6px 16px',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: mutedColor,
                  }}
                >
                  {group.category}
                </div>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                  }}
                >
                  <tbody>
                    {group.items.map((item, i) => (
                      <tr
                        key={item.key}
                        style={{
                          borderTop: `1px solid ${borderColor}`,
                          backgroundColor: i % 2 === 0 ? 'transparent' : rowHover,
                        }}
                      >
                        <td
                          style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            color: primaryColor,
                            width: '45%',
                            verticalAlign: 'middle',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              flexWrap: 'wrap',
                            }}
                          >
                            {item.key.split('/').map((part, j) => (
                              <React.Fragment key={j}>
                                {j > 0 && (
                                  <span style={{ color: mutedColor, fontSize: '10px' }}>
                                    /
                                  </span>
                                )}
                                {part.trim().split('+').map((keyPart, k) => (
                                  <React.Fragment key={k}>
                                    {k > 0 && (
                                      <span style={{ color: mutedColor, fontSize: '10px' }}>
                                        +
                                      </span>
                                    )}
                                    <KbdBadge
                                      style={{
                                        background: kbdBg,
                                        border: `1px solid ${kbdBorder}`,
                                        color: primaryColor,
                                      }}
                                    >
                                      {keyPart.trim()}
                                    </KbdBadge>
                                  </React.Fragment>
                                ))}
                              </React.Fragment>
                            ))}
                          </div>
                        </td>
                        <td
                          style={{
                            padding: '8px 16px',
                            fontSize: '12px',
                            color: mutedColor,
                            verticalAlign: 'middle',
                          }}
                        >
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
