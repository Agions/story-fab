/**
 * 生成按钮区域 — 字数统计 + 重新生成 + 预览脚本按钮
 */
import React from 'react';
import type { ScriptData } from '@/types';
import styles from '././../script-writing.module.less';

interface GenerateSectionProps {
  currentScript: ScriptData | null;
  wordCount: number;
  estimatedDuration: number;
  generating: boolean;
  onRegenerate: () => void;
  onPreview: () => void;
}

const GenerateSection: React.FC<GenerateSectionProps> = ({
  currentScript,
  wordCount,
  estimatedDuration,
  generating,
  onRegenerate,
  onPreview,
}) => {
  return (
    <div className={styles.generateSection}>
      <div className={styles.generateRow}>
        {currentScript && (
          <span className={styles.generateStats}>
            ✓ {wordCount} 字 · ~{estimatedDuration}秒
          </span>
        )}
        <button
          className={styles.regenBtn}
          onClick={onRegenerate}
          disabled={generating}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          重新生成
        </button>
      </div>

      {/* 预览脚本按钮 */}
      {currentScript && (
        <button className={styles.previewScriptBtn} onClick={onPreview}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          预览脚本
        </button>
      )}
    </div>
  );
};

export default GenerateSection;
