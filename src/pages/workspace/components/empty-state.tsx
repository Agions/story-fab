/**
 * 空状态 — 暂无文案提示
 */
import React from 'react';
import styles from './../script-writing.module.less';

const EmptyState: React.FC = () => {
  return (
    <div className={styles.emptyState}>
      <svg
        className={styles.emptyIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <p className={styles.emptyTitle}>暂无文案</p>
      <p className={styles.emptyDesc}>点击左侧按钮生成文案</p>
    </div>
  );
};

export default EmptyState;
