/**
 * 导出进度展示
 * 单一职责：展示进度环、阶段标签、ETA 和取消按钮
 */
import React from 'react';
import styles from './video-export.module.less';

interface ExportProgress {
  /** 0-100 */
  percent: number;
  /** 当前阶段描述（覆盖自动推断） */
  stageLabel?: string;
  /** 预计剩余秒数；null = 未知 */
  etaSeconds: number | null;
}

interface ExportingPanelProps {
  progress: ExportProgress;
  onCancel: () => void;
}

/** 根据进度推断阶段文案（业务逻辑内联，方便测试） */
function inferStageLabel(percent: number): React.ReactNode {
  if (percent < 30) return <>🎬 视频编码中...</>;
  if (percent < 60) return <>🔊 音频编码中...</>;
  if (percent < 90) return <>💾 生成文件...</>;
  return <>✨ 导出完成！</>;
}

const ExportingPanelComponent: React.FC<ExportingPanelProps> = ({ progress, onCancel }) => {
  const { percent, stageLabel, etaSeconds } = progress;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={styles.stepContent}>
      <div className={styles.exportingCard}>
        <div className={styles.progressCircle}>
          <svg className={styles.progressCircleSvg} viewBox="0 0 100 100">
            <circle className={styles.progressCircleTrack} cx="50" cy="50" r="45" />
            <circle
              className={styles.progressCircleFill}
              cx="50"
              cy="50"
              r="45"
              style={{ strokeDashoffset: offset }}
            />
          </svg>
          <div className={styles.progressPercent}>{percent}%</div>
        </div>
        <div className={styles.progressLabel}>
          {stageLabel ?? inferStageLabel(percent)}
        </div>
        <div className={styles.progressSub}>
          {etaSeconds !== null && etaSeconds > 0
            ? `预计剩余: ${etaSeconds}s`
            : etaSeconds === 0 ? '导出完成！' : '请耐心等待...'}
        </div>
        <button className={styles.cancelBtn} onClick={onCancel}>
          取消导出
        </button>
        <div className={styles.progressBarSection}>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className={styles.progressBarPercent}>{percent}%</div>
        </div>
      </div>
    </div>
  );
};

export const ExportingPanel = React.memo(ExportingPanelComponent);
ExportingPanel.displayName = 'ExportingPanel';
