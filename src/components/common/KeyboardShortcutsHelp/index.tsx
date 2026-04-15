/**
 * KeyboardShortcutsHelp - 键盘快捷键帮助面板
 * 按 ? 键呼出 / 关闭
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Typography } from 'antd';
import { KEYBOARD_SHORTCUTS_HELP } from '@/hooks/use-keyboard-shortcuts';
import styles from './KeyboardShortcutsHelp.module.css';

const { Title, Text } = Typography;

interface KeyboardShortcutsHelpProps {
  visible: boolean;
  onClose: () => void;
}

const KbdKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className={styles.kbd}>{children}</kbd>
);

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ visible, onClose }) => {
  // ? 键监听（全局）
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
    <Modal
      open={visible}
      onCancel={onClose}
      onOk={onClose}
      okText="关闭"
      cancelButtonProps={{ style: { display: 'none' } }}
      title={
        <span style={{ fontWeight: 600 }}>
          ⌨️ 键盘快捷键
        </span>
      }
      width={480}
      centered
      footer={null}
      destroyOnClose
    >
      <div className={styles.content}>
        {KEYBOARD_SHORTCUTS_HELP.map((section) => (
          <div key={section.category} className={styles.section}>
            <Title level={5} className={styles.sectionTitle}>{section.category}</Title>
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
                  <Text type="secondary" className={styles.desc}>{item.desc}</Text>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className={styles.footer}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            按 <KbdKey>?</KbdKey> 或 <KbdKey>Esc</KbdKey> 关闭
          </Text>
        </div>
      </div>
    </Modal>
  );
};

// 全局 ? 键监听 hook（可在 App root 层使用一次）
export const useShortcutsHelpToggle = (onToggle: (visible: boolean) => void) => {
  const handler = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    // 输入框中不触发
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
