/**
 * 警告提示组件
 * 职责：显示警告信息和跳转按钮
 *
 * 重构说明：
 * - 从原 VideoComposing.tsx (716行) 中提取警告 UI
 * - 职责单一：只负责警告提示
 */

import React from 'react';
import styles from '../VideoComposing.module.less';

// ============================================
// 类型定义
// ============================================

interface WarningAlertProps {
  /** 警告图标 */
  icon?: string;
  /** 警告消息 */
  message: string;
  /** 按钮文本 */
  buttonText: string;
  /** 按钮点击回调 */
  onButtonClick: () => void;
  /** 标题 */
  title?: string;
}

// ============================================
// 警告提示组件
// ============================================

export const WarningAlert: React.FC<WarningAlertProps> = ({
  icon = '⚠️',
  message,
  buttonText,
  onButtonClick,
  title = '视频合成配置',
}) => {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepTitle}>
        <div className={styles.stepTitleLeft}>
          <h2>
            <span aria-hidden="true">⚙️</span> {title}
          </h2>
        </div>
      </div>
      <div className={styles.warningAlert}>
        <span aria-hidden="true">{icon}</span> {message}
        <button className={styles.warningAlertBtn} onClick={onButtonClick}>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default WarningAlert;
