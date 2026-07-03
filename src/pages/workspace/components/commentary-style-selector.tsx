/**
 * 解说风格选择器
 * 职责：解说风格选择 UI
 *
 * 重构说明：
 * - 从原 ScriptWriting.tsx (686行) 中提取解说风格选择 UI
 * - 职责单一：只负责解说风格选择
 */

import React from 'react';
import styles from '././../script-writing.module.less';
import { COMMENTARY_STYLES } from '../script-config';

// ============================================
// 类型定义
// ============================================

interface CommentaryStyleSelectorProps {
  /** 当前选中的风格 */
  currentStyle: string;
  /** 风格变更回调 */
  onStyleChange: (style: string) => void;
}

// ============================================
// 解说风格选择器组件
// ============================================

export const CommentaryStyleSelector: React.FC<CommentaryStyleSelectorProps> = ({
  currentStyle,
  onStyleChange,
}) => {
  return (
    <div className={styles.commentaryStyleSection}>
      <span className={styles.commentaryStyleLabel}>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        解说风格
      </span>
      <div className={styles.commentaryStyleGrid}>
        {COMMENTARY_STYLES.map((style) => (
          <div
            key={style.value}
            className={`${styles.commentaryStyleItem} ${
              currentStyle === style.value ? styles.commentaryStyleActive : ''
            }`}
            onClick={() => onStyleChange(style.value)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onStyleChange(style.value)}
            style={{ '--style-color': style.color } as React.CSSProperties}
          >
            <span className={styles.commentaryStyleIcon}>{style.icon}</span>
            <span className={styles.commentaryStyleName}>{style.label}</span>
            <span className={styles.commentaryStyleDesc}>{style.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentaryStyleSelector;
