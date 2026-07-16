/**
 * 空状态 — 暂无文案提示
 */
import React from 'react';
import { FileText } from 'lucide-react';
import styles from './../edit-step/script-writing.module.less';

const EmptyState: React.FC = () => {
  return (
    <div className={styles.emptyState}>
      <FileText className={styles.emptyIcon} size={24} strokeWidth={1.5} />
      <p className={styles.emptyTitle}>暂无文案</p>
      <p className={styles.emptyDesc}>点击左侧按钮生成文案</p>
    </div>
  );
};

export default EmptyState;
