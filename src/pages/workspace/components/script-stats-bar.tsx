/**
 * 脚本统计栏
 * 职责：显示脚本统计信息（字数、预计时长、风格）
 *
 * 重构说明：
 * - 从原 ScriptWriting.tsx (686行) 中提取统计 UI
 * - 职责单一：只负责统计显示
 */

import React from 'react';
import { FileText, Clock, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './../edit-step/script-writing.module.less';

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
          icon={<FileText size={16} />}
          label="字数:"
          value={wordCount.toString()}
        />

        {/* 预计时长 */}
        <StatItem
          icon={<Clock size={16} />}
          label="预计:"
          value={`~${estimatedDuration}秒`}
        />

        {/* 风格 */}
        <StatItem
          icon={<Sparkles size={16} />}
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
      <span className={styles.alignmentIcon}>
        {gate.passed ? (
          <CheckCircle2 size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
      </span>
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
