/**
 * 导出完成卡片
 * 单一职责：展示导出完成信息和下载/预览/分享按钮
 */
import React from 'react';
import styles from '../video-export.module.less';

interface ExportCompleteMeta {
  format: string;
  resolution: string;
  fps: number;
  estimatedSize: string;
}

interface ExportCompleteCardProps {
  meta: ExportCompleteMeta;
}

const ExportCompleteCardComponent: React.FC<ExportCompleteCardProps> = ({ meta }) => (
  <div className={styles.stepContent}>
    <div className={styles.completeCard}>
      <svg className={styles.completeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <h3 className={styles.completeTitle}>🎉 视频导出成功！</h3>
      <div className={styles.completeMeta}>
        <span className={styles.completeMetaTag}>{meta.format.toUpperCase()}</span>
        <span className={styles.completeMetaTag}>{meta.resolution}</span>
        <span className={styles.completeMetaTag}>{meta.fps}fps</span>
      </div>
      <div className={styles.completeSub}>预估大小：{meta.estimatedSize}</div>
      <div className={styles.completeActions}>
        <button className={`${styles.completeBtn} ${styles.completeBtnSecondary}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
          预览
        </button>
        <button className={`${styles.completeBtn} ${styles.completeBtnPrimary}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          下载视频
        </button>
        <button className={`${styles.completeBtn} ${styles.completeBtnSecondary}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          分享
        </button>
      </div>
    </div>
  </div>
);

export const ExportCompleteCard = React.memo(ExportCompleteCardComponent);
ExportCompleteCard.displayName = 'ExportCompleteCard';
