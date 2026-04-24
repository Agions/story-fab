/**
 * MenuBar — 顶部菜单栏
 * 36px 高度，bg-secondary 背景
 * 6个菜单: File | Edit | View | Clip | Export | Help
 * 每个菜单使用 shadcn DropdownMenu
 * 快捷键显示在右侧
 */
import React, { memo, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '../ui/dropdown-menu';

interface MenuItemDef {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

interface MenuDef {
  label: string;
  items: (MenuItemDef | 'separator')[];
}

interface MenuBarProps {
  onAction?: (action: string) => void;
}

const MENUS: MenuDef[] = [
  {
    label: 'File',
    items: [
      { label: 'New Project', shortcut: 'Ctrl+N', onClick: () => {} },
      { label: 'Open Project', shortcut: 'Ctrl+O', onClick: () => {} },
      { label: 'Save', shortcut: 'Ctrl+S', onClick: () => {} },
      'separator',
      { label: 'Export', shortcut: 'Ctrl+E', onClick: () => {} },
      { label: 'Exit', onClick: () => {} },
    ],
  },
  {
    label: 'Edit',
    items: [
      { label: 'Undo', shortcut: 'Ctrl+Z', onClick: () => {} },
      { label: 'Redo', shortcut: 'Ctrl+Y', onClick: () => {} },
      'separator',
      { label: 'Cut', shortcut: 'Ctrl+X', onClick: () => {} },
      { label: 'Copy', shortcut: 'Ctrl+C', onClick: () => {} },
      { label: 'Paste', shortcut: 'Ctrl+V', onClick: () => {} },
      'separator',
      { label: 'Select All', shortcut: 'Ctrl+A', onClick: () => {} },
    ],
  },
  {
    label: 'View',
    items: [
      { label: 'Toggle Inspector', shortcut: 'Ctrl+I', onClick: () => {} },
      { label: 'Toggle Media Browser', shortcut: 'Ctrl+M', onClick: () => {} },
      { label: 'Toggle Preview', shortcut: 'Ctrl+P', onClick: () => {} },
      'separator',
      { label: 'Fullscreen', shortcut: 'F11', onClick: () => {} },
    ],
  },
  {
    label: 'Clip',
    items: [
      { label: 'Add Clip', shortcut: 'Ctrl+Shift+A', onClick: () => {} },
      { label: 'Remove Clip', shortcut: 'Delete', onClick: () => {} },
      'separator',
      { label: 'Split at Playhead', shortcut: 'S', onClick: () => {} },
      { label: 'Delete', shortcut: 'Del', danger: true, onClick: () => {} },
    ],
  },
  {
    label: 'Export',
    items: [
      { label: 'Export Current Clip', shortcut: 'Ctrl+Shift+E', onClick: () => {} },
      { label: 'Export All', shortcut: 'Ctrl+Alt+E', onClick: () => {} },
      'separator',
      { label: 'Export Settings', onClick: () => {} },
    ],
  },
  {
    label: 'Help',
    items: [
      { label: 'Documentation', onClick: () => {} },
      { label: 'Keyboard Shortcuts', shortcut: 'Ctrl+/', onClick: () => {} },
      'separator',
      { label: 'About', onClick: () => {} },
    ],
  },
];

export const MenuBar = memo<MenuBarProps>(({ onAction }) => {
  return (
    <div className="flex items-center h-9 bg-bg-secondary border-b border-border-subtle shrink-0 px-1">
      {MENUS.map((menu) => (
        <DropdownMenu key={menu.label}>
          <DropdownMenuTrigger
            className="
              h-7 px-3 rounded-md text-xs font-medium
              text-text-secondary hover:text-text-primary
              hover:bg-bg-hover transition-colors
              focus:outline-none focus-visible:ring-1 focus-visible:ring-accent-primary
              cursor-pointer
            "
          >
            {menu.label}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" sideOffset={4} className="min-w-[180px]">
            {menu.items.map((item, i) => {
              if (item === 'separator') {
                return <DropdownMenuSeparator key={`sep-${i}`} />;
              }
              return (
                <DropdownMenuItem
                  key={item.label}
                  disabled={item.disabled}
                  variant={item.danger ? 'destructive' : 'default'}
                  onClick={item.onClick}
                  className={`flex justify-between gap-8 ${item.danger ? 'text-accent-danger' : 'text-text-primary'}`}
                >
                  <span className="text-xs">{item.label}</span>
                  {item.shortcut && (
                    <DropdownMenuShortcut className="text-[10px] text-text-disabled">
                      {item.shortcut}
                    </DropdownMenuShortcut>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
    </div>
  );
});

MenuBar.displayName = 'MenuBar';
