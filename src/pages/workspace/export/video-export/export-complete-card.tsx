/**
 * 导出完成卡片
 * 单一职责：展示导出完成信息和下载/预览/分享按钮
 */
import React from 'react';
import { CheckCircle2, PlayCircle, Download, Share2 } from 'lucide-react';
import styles from './video-export.module.less';

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
      <CheckCircle2 className={styles.completeIcon} size={48} strokeWidth={1.5} />
      <h3 className={styles.completeTitle}>🎉 视频导出成功！</h3>
      <div className={styles.completeMeta}>
        <span className={styles.completeMetaTag}>{meta.format.toUpperCase()}</span>
        <span className={styles.completeMetaTag}>{meta.resolution}</span>
        <span className={styles.completeMetaTag}>{meta.fps}fps</span>
      </div>
      <div className={styles.completeSub}>预估大小：{meta.estimatedSize}</div>
      <div className={styles.completeActions}>
        <button className={`${styles.completeBtn} ${styles.completeBtnSecondary}`}>
          <PlayCircle size={16} />
          预览
        </button>
        <button className={`${styles.completeBtn} ${styles.completeBtnPrimary}`}>
          <Download size={16} />
          下载视频
        </button>
        <button className={`${styles.completeBtn} ${styles.completeBtnSecondary}`}>
          <Share2 size={16} />
          分享
        </button>
      </div>
    </div>
  </div>
);

export const ExportCompleteCard = React.memo(ExportCompleteCardComponent);
ExportCompleteCard.displayName = 'ExportCompleteCard';
