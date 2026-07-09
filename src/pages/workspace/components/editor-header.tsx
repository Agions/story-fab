/**
 * 编辑器头部 — 文件图标 + 标题 + 复制按钮
 */
import React from 'react';
import styles from './../edit-step/script-writing.module.less';

interface EditorHeaderProps {
  onCopy: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ onCopy }) => {
  return (
    <div className={styles.editorHeader}>
      <div className={styles.editorHeaderLeft}>
        <svg
          className={styles.editorHeaderIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <h3 className={styles.editorTitle}>文案编辑</h3>
      </div>
      <div className={styles.editorActions}>
        <button
          className={styles.iconBtn}
          onClick={onCopy}
          title="复制文案"
          aria-label="复制文案"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default EditorHeader;
