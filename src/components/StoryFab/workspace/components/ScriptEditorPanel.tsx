/**
 * 脚本编辑器
 * 职责：脚本内容编辑 UI
 *
 * 重构说明：
 * - 从原 ScriptWriting.tsx (686行) 中提取脚本编辑 UI
 * - 职责单一：只负责脚本编辑
 */

import React from 'react';
import styles from '../ScriptWriting.module.less';

// ============================================
// 类型定义
// ============================================

export interface ScriptEditorPanelProps {
  /** 当前脚本内容 */
  content: string;
  /** 占位符 */
  placeholder: string;
  /** 是否禁用 */
  disabled: boolean;
  /** 内容变更回调 */
  onChange: (content: string) => void;
}

// ============================================
// 脚本编辑器组件
// ============================================

export const ScriptEditorPanel: React.FC<ScriptEditorPanelProps> = ({
  content,
  placeholder,
  disabled,
  onChange,
}) => {
  return (
    <div className={styles.scriptEditor}>
      <textarea
        className={styles.scriptTextarea}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="文案内容"
      />
    </div>
  );
};

export default ScriptEditorPanel;
