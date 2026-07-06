/**
 * 字幕设置面板
 * 职责：字幕相关的配置 UI
 *
 * 重构说明：
 * - 从原 VideoComposing.tsx (716行) 中提取字幕设置 UI
 * - 职责单一：只负责字幕相关配置界面
 */

import React from 'react';
import styles from '././../video-composing.module.less';
import { SUBTITLE_POSITIONS, type SynthesizeConfig } from '../shared/compose-config';

// ============================================
// 类型定义
// ============================================

interface SubtitleSettingsPanelProps {
  /** 当前配置 */
  config: SynthesizeConfig;
  /** 配置更新回调 */
  onConfigChange: (updates: Partial<SynthesizeConfig>) => void;
}

// ============================================
// 字幕设置面板组件
// ============================================

export const SubtitleSettingsPanel: React.FC<SubtitleSettingsPanelProps> = ({
  config,
  onConfigChange,
}) => {
  return (
    <div className={styles.panelBody}>
      {/* 启用字幕开关 */}
      <div className={styles.switchRow}>
        <div>
          <div className={styles.switchLabel}>启用字幕</div>
          <div className={styles.switchSub}>自动生成同步字幕</div>
        </div>
        <button
          className={`${styles.toggle} ${config.enableSubtitle ? styles.toggleOn : ''}`}
          onClick={() => onConfigChange({ enableSubtitle: !config.enableSubtitle })}
          role="switch"
          aria-checked={config.enableSubtitle}
        />
      </div>

      {config.enableSubtitle && (
        <>
          <div className={styles.sliderLabel} style={{ marginBottom: '10px', display: 'block' }}>
            字幕位置
          </div>
          <div className={styles.positionGroup}>
            {SUBTITLE_POSITIONS.map((pos) => (
              <button
                key={pos.value}
                className={`${styles.positionBtn} ${config.subtitlePosition === pos.value ? styles.positionActive : ''}`}
                onClick={() =>
                  onConfigChange({ subtitlePosition: pos.value as 'bottom' | 'center' | 'top' })
                }
              >
                {pos.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SubtitleSettingsPanel;
