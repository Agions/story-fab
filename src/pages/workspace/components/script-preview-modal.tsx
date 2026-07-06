/**
 * 脚本预览弹窗
 */
import React from 'react';
import type { ScriptData } from '@/types';
import { COMMENTARY_STYLES } from '../edit-step/script-config';
import styles from './../script-writing.module.less';

interface ScriptPreviewModalProps {
  script: ScriptData;
  wordCount: number;
  estimatedDuration: number;
  style: string;
  commentaryStyle: string;
  onClose: () => void;
}

const ScriptPreviewModal: React.FC<ScriptPreviewModalProps> = ({
  script,
  wordCount,
  estimatedDuration,
  commentaryStyle,
  style,
  onClose,
}) => {
  return (
    <div className={styles.scriptPreviewModal} onClick={onClose}>
      <div className={styles.scriptPreviewContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.scriptPreviewHeader}>
          <h3>脚本预览</h3>
          <button className={styles.scriptPreviewClose} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.scriptPreviewBody}>
          <div className={styles.scriptMeta}>
            <span>
              风格:{' '}
              {COMMENTARY_STYLES.find((s) => s.value === commentaryStyle)?.label || style}
            </span>
            <span>字数: {wordCount}</span>
            <span>预计: ~{estimatedDuration}秒</span>
          </div>
          <pre className={styles.scriptPreviewText}>{script.content}</pre>
        </div>
      </div>
    </div>
  );
};

export default ScriptPreviewModal;
