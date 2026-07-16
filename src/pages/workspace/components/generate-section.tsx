/**
 * 生成按钮区域 — 字数统计 + 重新生成 + 预览脚本按钮
 */
import React from 'react';
import { Eye } from 'lucide-react';
import { RefreshCwIcon } from '@/components/icons';
import type { ScriptData } from '@/types';
import styles from './../edit-step/script-writing.module.less';

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
          <RefreshCwIcon strokeWidth={2.5} />
          重新生成
        </button>
      </div>

      {/* 预览脚本按钮 */}
      {currentScript && (
        <button className={styles.previewScriptBtn} onClick={onPreview}>
          <Eye size={16} />
          预览脚本
        </button>
      )}
    </div>
  );
};

export default GenerateSection;
