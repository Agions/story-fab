/**
 * 生成进度组件
 * 职责：显示 AI 生成进度和动画
 *
 * 重构说明：
 * - 从原 ScriptWriting.tsx (686行) 中提取进度 UI
 * - 职责单一：只负责进度显示
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './../edit-step/script-writing.module.less';

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
        <Loader2 className={styles.progressLabelIcon} size={16} />
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
