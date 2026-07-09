/**
 * 空状态：提示用户先完成视频合成
 * 单一职责：展示合成未完成提示
 */
import React from 'react';
import styles from './video-export.module.less';

interface NoSynthesisAlertProps {
  /** 跳转到合成步骤 */
  onNavigateToSynth: () => void;
}

const NoSynthesisAlertComponent: React.FC<NoSynthesisAlertProps> = ({ onNavigateToSynth }) => (
  <div className={styles.stepContent}>
    <div className={styles.stepTitle}>
      <div className={styles.stepTitleLeft}>
        <h2>📤 导出设置</h2>
      </div>
    </div>
    <div className={styles.warningAlert}>
      ⚠️ 请先完成视频合成
      <button
        className={styles.warningAlertBtn}
        onClick={onNavigateToSynth}
      >
        去合成
      </button>
    </div>
  </div>
);

export const NoSynthesisAlert = React.memo(NoSynthesisAlertComponent);
NoSynthesisAlert.displayName = 'NoSynthesisAlert';
