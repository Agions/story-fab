/**
 * 快捷键系统
 */
import { useEffect, useCallback } from 'react';

type HotkeyCallback = () => void;

interface HotkeyConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: HotkeyCallback;
  description?: string;
}

interface HotkeyGroup {
  name: string;
  hotkeys: HotkeyConfig[];
}

// 预设快捷键
export const HOTKEY_PRESETS: HotkeyGroup[] = [
  {
    name: '通用',
    hotkeys: [
      { key: 's', ctrl: true, callback: () => {}, description: '保存' },
      { key: 'z', ctrl: true, callback: () => {}, description: '撤销' },
      { key: 'y', ctrl: true, callback: () => {}, description: '重做' },
    ],
  },
  {
    name: '编辑器',
    hotkeys: [
      { key: ' ', ctrl: false, callback: () => {}, description: '播放/暂停' },
      { key: 'b', ctrl: true, callback: () => {}, description: '粗体' },
      { key: 'i', ctrl: true, callback: () => {}, description: '斜体' },
    ],
  },
  {
    name: '导出',
    hotkeys: [
      { key: 'e', ctrl: true, callback: () => {}, description: '导出' },
      { key: 'p', ctrl: true, shift: true, callback: () => {}, description: '预览' },
    ],
  },
];

/**
 * 快捷键 Hook
 */
export function useHotkeys(hotkeys: HotkeyConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const hotkey of hotkeys) {
        const { key, ctrl = false, shift = false, alt = false, callback } = hotkey;
        
        const matchKey = event.key.toLowerCase() === key.toLowerCase();
        const matchCtrl = event.ctrlKey === ctrl;
        const matchShift = event.shiftKey === shift;
        const matchAlt = event.altKey === alt;
        
        if (matchKey && matchCtrl && matchShift && matchAlt) {
          event.preventDefault();
          callback();
          return;
        }
      }
    },
    [hotkeys]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * 获取快捷键显示文本
 */
export function getHotkeyText(config: HotkeyConfig): string {
  const parts: string[] = [];
  
  if (config.ctrl) parts.push('Ctrl');
  if (config.shift) parts.push('Shift');
  if (config.alt) parts.push('Alt');
  parts.push(config.key.toUpperCase());
  
  return parts.join(' + ');
}

/**
 * 格式化快捷键显示
 */
export function formatHotkey(key: string): string {
  const map: Record<string, string> = {
    ' ': 'Space',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Escape': 'Esc',
    'Delete': 'Del',
    'Backspace': 'Backspace',
  };
  
  return map[key] || key;
}

export default { useHotkeys, HOTKEY_PRESETS, getHotkeyText, formatHotkey };
