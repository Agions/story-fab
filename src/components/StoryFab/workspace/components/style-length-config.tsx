/**
 * 风格长度配置器
 * 职责：文案风格和长度选择 UI
 *
 * 重构说明：
 * - 从原 ScriptWriting.tsx (686行) 中提取风格/长度选择 UI
 * - 职责单一：只负责风格和长度配置
 */

import React from 'react';
import styles from '../ScriptWriting.module.less';
import { SCRIPT_STYLES, SCRIPT_LENGTHS } from '../script-config';

// ============================================
// 类型定义
// ============================================

interface StyleLengthConfigProps {
  /** 当前风格 */
  currentStyle: string;
  /** 当前长度 */
  currentLength: string;
  /** 风格变更回调 */
  onStyleChange: (style: string) => void;
  /** 长度变更回调 */
  onLengthChange: (length: string) => void;
}

// ============================================
// 风格长度配置器组件
// ============================================

export const StyleLengthConfig: React.FC<StyleLengthConfigProps> = ({
  currentStyle,
  currentLength,
  onStyleChange,
  onLengthChange,
}) => {
  return (
    <div className={styles.subConfigRow}>
      {/* 风格选择 */}
      <div className={styles.selectGroup}>
        <label htmlFor="styleSelect">语气风格</label>
        <div className={styles.selectWrapper}>
          <select
            id="styleSelect"
            className={styles.selectInput}
            value={currentStyle}
            onChange={(e) => onStyleChange(e.target.value)}
          >
            {SCRIPT_STYLES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <svg
            className={styles.selectArrow}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* 长度选择 */}
      <div className={styles.selectGroup}>
        <label htmlFor="lengthSelect">文案长度</label>
        <div className={styles.selectWrapper}>
          <select
            id="lengthSelect"
            className={styles.selectInput}
            value={currentLength}
            onChange={(e) => onLengthChange(e.target.value)}
          >
            {SCRIPT_LENGTHS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label} ({l.time})
              </option>
            ))}
          </select>
          <svg
            className={styles.selectArrow}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StyleLengthConfig;
