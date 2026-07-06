/**
 * 完成提示组件
 * 职责：显示视频合成完成的状态和操作按钮
 *
 * 重构说明：
 * - 从原 VideoComposing.tsx (716行) 中提取完成 UI
 * - 职责单一：只负责完成状态显示
 */

import React from 'react';
import styles from './../video-composing.module.less';

// ============================================
// 类型定义
// ============================================

interface CompleteNoticeProps {
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 下一步按钮文本 */
  nextButtonText?: string;
  /** 下一步回调 */
  onNext: () => void;
  /** 预览回调（可选） */
  onPreview?: () => void;
}

// ============================================
// 完成提示组件
// ============================================

export const CompleteNotice: React.FC<CompleteNoticeProps> = ({
  title = '视频合成完成',
  description = '您的视频已准备就绪，可以进行导出',
  nextButtonText = '下一步：导出视频',
  onNext,
  onPreview,
}) => {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <div className={styles.stepTitleLeft}>
          <h2>
            <span aria-hidden="true">🎬</span> {title}
          </h2>
          <span className={styles.statusBadge}>
            <span className={styles.statusBadgeDot} />
            已合成
          </span>
        </div>
      </div>

      <div className={styles.completeCard}>
        <svg
          className={styles.completeIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <h3 className={styles.completeTitle}>视频合成成功！</h3>
        <p className={styles.completeDesc}>{description}</p>
        <div className={styles.completeActions}>
          <button
            className={`${styles.completeBtn} ${styles.completeBtnSecondary}`}
            onClick={onPreview}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
            预览效果
          </button>
          <button
            className={`${styles.completeBtn} ${styles.completeBtnPrimary}`}
            onClick={onNext}
          >
            {nextButtonText}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteNotice;
