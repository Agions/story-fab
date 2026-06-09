/**
 * 合成进度组件
 * 职责：显示视频合成进度和状态
 *
 * 重构说明：
 * - 从原 VideoComposing.tsx (716行) 中提取进度显示 UI
 * - 职责单一：只负责进度可视化
 */

import React from 'react';
import styles from '../VideoComposing.module.less';

// ============================================
// 类型定义
// ============================================

export interface SynthesizeProgressProps {
  /** 进度 0-100 */
  progress: number;
}

// ============================================
// 进度标签映射
// ============================================

/**
 * 根据进度返回对应的标签和图标
 * 提取说明：原代码中使用三元表达式嵌套，可读性差，现使用映射表
 */
function getProgressLabel(progress: number): { icon: string; text: string } {
  if (progress < 30) return { icon: '🎤', text: '生成配音中...' };
  if (progress < 60) return { icon: '📝', text: '生成字幕中...' };
  if (progress < 80) return { icon: '✨', text: '应用特效中...' };
  return { icon: '🔗', text: '音画同步中...' };
}

// ============================================
// 合成进度组件
// ============================================

export const SynthesizeProgress: React.FC<SynthesizeProgressProps> = ({ progress }) => {
  // 圆环进度计算
  const CIRCLE_RADIUS = 45;
  const circumference = 2 * Math.PI * CIRCLE_RADIUS;
  const offset = circumference - (progress / 100) * circumference;
  const label = getProgressLabel(progress);

  return (
    <div className={styles.synthesizingCard}>
      <div className={styles.synthesizeProgressCircle}>
        <svg className={styles.synthesizeProgressCircleSvg} viewBox="0 0 100 100">
          <circle
            className={styles.synthesizeProgressCircleTrack}
            cx="50"
            cy="50"
            r={CIRCLE_RADIUS}
          />
          <circle
            className={styles.synthesizeProgressCircleFill}
            cx="50"
            cy="50"
            r={CIRCLE_RADIUS}
            style={{ strokeDashoffset: offset }}
          />
        </svg>
        <div className={styles.synthesizeProgressPercent}>{progress}%</div>
      </div>
      <div className={styles.synthesizeProgressLabel}>
        <span aria-hidden="true">{label.icon}</span> {label.text}
      </div>
      <div className={styles.synthesizeProgressSub}>请耐心等待...</div>
    </div>
  );
};

export default SynthesizeProgress;
