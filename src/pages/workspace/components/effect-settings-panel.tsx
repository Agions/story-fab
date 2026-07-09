/**
 * 特效设置面板
 * 职责：视频特效相关的配置 UI
 *
 * 重构说明：
 * - 从原 VideoComposing.tsx (716行) 中提取特效设置 UI
 * - 职责单一：只负责特效相关配置界面
 */

import React from 'react';
import styles from './../assemble/video-composing.module.less';
import { EFFECT_STYLES, type SynthesizeConfig } from '../shared/compose-config';

// ============================================
// 类型定义
// ============================================

interface EffectSettingsPanelProps {
  /** 当前配置 */
  config: SynthesizeConfig;
  /** 配置更新回调 */
  onConfigChange: (updates: Partial<SynthesizeConfig>) => void;
}

// ============================================
// 特效设置面板组件
// ============================================

export const EffectSettingsPanel: React.FC<EffectSettingsPanelProps> = ({
  config,
  onConfigChange,
}) => {
  return (
    <div className={styles.panelBody}>
      {/* 启用特效开关 */}
      <div className={styles.switchRow}>
        <div>
          <div className={styles.switchLabel}>启用视频特效</div>
          <div className={styles.switchSub}>为视频添加视觉特效</div>
        </div>
        <button
          className={`${styles.toggle} ${config.enableEffect ? styles.toggleOn : ''}`}
          onClick={() => onConfigChange({ enableEffect: !config.enableEffect })}
          role="switch"
          aria-checked={config.enableEffect}
        />
      </div>

      {config.enableEffect && (
        <>
          <div className={styles.sliderLabel} style={{ marginBottom: '10px', display: 'block' }}>
            特效风格
          </div>
          <div className={styles.effectGrid}>
            {EFFECT_STYLES.map((style) => (
              <div
                key={style.value}
                className={`${styles.effectItem} ${config.effectStyle === style.value ? styles.effectActive : ''}`}
                onClick={() => onConfigChange({ effectStyle: style.value })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onConfigChange({ effectStyle: style.value })}
              >
                <div className={styles.effectName}>{style.label}</div>
                <div className={styles.effectDesc}>{style.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EffectSettingsPanel;
