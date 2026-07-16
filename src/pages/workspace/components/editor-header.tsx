/**
 * 编辑器头部 — 文件图标 + 标题 + 复制按钮
 */
import React from 'react';
import { FileText, Copy } from 'lucide-react';
import styles from './../edit-step/script-writing.module.less';

interface EditorHeaderProps {
  onCopy: () => void;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({ onCopy }) => {
  return (
    <div className={styles.editorHeader}>
      <div className={styles.editorHeaderLeft}>
        <FileText className={styles.editorHeaderIcon} size={20} />
        <h3 className={styles.editorTitle}>文案编辑</h3>
      </div>
      <div className={styles.editorActions}>
        <button
          className={styles.iconBtn}
          onClick={onCopy}
          title="复制文案"
          aria-label="复制文案"
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
};

export default EditorHeader;
