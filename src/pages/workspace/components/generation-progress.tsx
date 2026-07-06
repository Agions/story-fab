/**
 * 生成进度组件
 * 职责：显示 AI 生成进度和动画
 *
 * 重构说明：
 * - 从原 ScriptWriting.tsx (686行) 中提取进度 UI
 * - 职责单一：只负责进度显示
 */

import React from 'react';
import styles from './../script-writing.module.less';

// ============================================
// 类型定义
// ============================================

interface GenerationProgressProps {
  /** 进度 0-100 */
  progress: number;
  /** 当前生成的功能标题 */
  functionTitle: string;
}

// ============================================
// 生成进度组件
// ============================================

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  progress,
  functionTitle,
}) => {
  return (
    <div className={styles.progressSection}>
      <div className={styles.progressLabel}>
        <svg
          className={styles.progressLabelIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
        正在生成 {functionTitle}...
        <span className={styles.progressPercent}>{progress}%</span>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
      <div className={styles.typingIndicator}>
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
        <div className={styles.typingDot} />
        <span className={styles.typingLabel}>AI 正在创作中</span>
      </div>
    </div>
  );
};

export default GenerationProgress;
