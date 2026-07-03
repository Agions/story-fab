/**
 * 脚本统计栏
 * 职责：显示脚本统计信息（字数、预计时长、风格）
 *
 * 重构说明：
 * - 从原 ScriptWriting.tsx (686行) 中提取统计 UI
 * - 职责单一：只负责统计显示
 */

import React from 'react';
import styles from '../ScriptWriting.module.less';

const ALIGNMENT_GATE_THRESHOLD = {
  minConfidence: 0.8,
  maxDriftSeconds: 0.8,
} as const;

// ============================================
// 类型定义
// ============================================

interface ScriptStatsBarProps {
  /** 字数 */
  wordCount: number;
  /** 预计时长（秒） */
  estimatedDuration: number;
  /** 风格 */
  style: string;
  /** 音画对齐状态 */
  alignmentGate?: {
    averageConfidence: number;
    maxDriftSeconds: number;
    passed: boolean;
  } | null;
}

// ============================================
// 脚本统计栏组件
// ============================================

export const ScriptStatsBar: React.FC<ScriptStatsBarProps> = ({
  wordCount,
  estimatedDuration,
  style,
  alignmentGate,
}) => {
  return (
    <>
      <div className={styles.scriptStats}>
        {/* 字数 */}
        <StatItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
          label="字数:"
          value={wordCount.toString()}
        />

        {/* 预计时长 */}
        <StatItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          label="预计:"
          value={`~${estimatedDuration}秒`}
        />

        {/* 风格 */}
        <StatItem
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
          label="风格:"
          value={style}
        />
      </div>

      {/* 音画对齐状态 */}
      {alignmentGate && <AlignmentAlert gate={alignmentGate} />}
    </>
  );
};

// ============================================
// 内部子组件：统计项
// ============================================

const StatItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => {
  return (
    <span className={styles.statItem}>
      {icon}
      {label} <span className={styles.statValue}>{value}</span>
    </span>
  );
};

// ============================================
// 内部子组件：音画对齐提示
// ============================================

const AlignmentAlert: React.FC<{
  gate: { averageConfidence: number; maxDriftSeconds: number; passed: boolean };
}> = ({ gate }) => {
  return (
    <div
      className={`${styles.alignmentAlert} ${
        gate.passed ? styles.alertSuccess : styles.alertWarning
      }`}
    >
      <svg
        className={styles.alignmentIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {gate.passed ? (
          <>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </>
        )}
      </svg>
      <div>
        <div className={styles.alignmentTitle}>
          {gate.passed ? '✓ 音画对齐通过' : '⚠ 音画对齐待优化'}
        </div>
        <div>
          平均置信度 {gate.averageConfidence.toFixed(2)}（阈值 {ALIGNMENT_GATE_THRESHOLD.minConfidence}），
          最大漂移 {gate.maxDriftSeconds.toFixed(2)}s（阈值 {ALIGNMENT_GATE_THRESHOLD.maxDriftSeconds}s）
        </div>
      </div>
    </div>
  );
};

export default ScriptStatsBar;
