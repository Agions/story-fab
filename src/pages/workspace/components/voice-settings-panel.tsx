/**
 * 配音设置面板
 * 职责：配音相关的配置 UI（音色、语速、音量等）
 *
 * 重构说明：
 * - 从原 VideoComposing.tsx (716行) 中提取配音设置 UI
 * - 职责单一：只负责配音相关配置界面
 * - 通过 props 接收配置和回调，实现解耦
 */

import React, { useState } from 'react';
import styles from './../video-composing.module.less';
import {
  VOICE_OPTIONS,
  VOICE_PRESETS,
  VOICE_SPEED_MIN,
  VOICE_SPEED_MAX,
  VOICE_SPEED_RANGE,
  type SynthesizeConfig,
} from '../shared/compose-config';

// ============================================
// 类型定义
// ============================================

interface VoiceSettingsPanelProps {
  /** 当前配置 */
  config: SynthesizeConfig;
  /** 配置更新回调 */
  onConfigChange: (updates: Partial<SynthesizeConfig>) => void;
  /** 是否有配音 */
  hasVoice: boolean;
}

// ============================================
// 配音设置面板组件
// ============================================

export const VoiceSettingsPanel: React.FC<VoiceSettingsPanelProps> = ({
  config,
  onConfigChange,
  hasVoice,
}) => {
  const [isMixPreviewPlaying, setIsMixPreviewPlaying] = useState(false);

  return (
    <div className={styles.panelBody}>
      {/* 启用配音开关 */}
      <div className={styles.switchRow}>
        <div>
          <div className={styles.switchLabel}>启用配音</div>
          <div className={styles.switchSub}>为视频添加 AI 配音</div>
        </div>
        <button
          className={`${styles.toggle} ${config.enableVoice ? styles.toggleOn : ''}`}
          onClick={() => onConfigChange({ enableVoice: !config.enableVoice })}
          role="switch"
          aria-checked={config.enableVoice}
        />
      </div>

      {config.enableVoice && (
        <>
          {/* 音色选择 */}
          <div className={styles.voiceGrid}>
            {VOICE_OPTIONS.map((voice) => (
              <div
                key={voice.value}
                className={`${styles.voiceItem} ${config.voiceId === voice.value ? styles.voiceActive : ''}`}
                onClick={() => onConfigChange({ voiceId: voice.value })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onConfigChange({ voiceId: voice.value })}
              >
                <div className={styles.voiceCheck}>
                  <div className={styles.voiceCheckDot} />
                </div>
                <div className={styles.voiceName}>
                  <span className={styles.voiceEmoji}>{voice.emoji}</span>
                  {voice.label}
                </div>
                <div className={styles.voiceDesc}>{voice.desc}</div>
              </div>
            ))}
          </div>

          {/* 语音风格预设 */}
          <div className={styles.sliderLabel} style={{ marginBottom: '10px', display: 'block' }}>
            语音风格预设
          </div>
          <div className={styles.voicePresetGrid}>
            {VOICE_PRESETS.map((preset) => (
              <div
                key={preset.value}
                className={`${styles.voicePresetItem} ${config.voicePreset === preset.value ? styles.voicePresetActive : ''}`}
                onClick={() => onConfigChange({ voicePreset: preset.value })}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onConfigChange({ voicePreset: preset.value })}
              >
                <span className={styles.voicePresetIcon}>{preset.emoji}</span>
                <span className={styles.voicePresetName}>{preset.label}</span>
                <span className={styles.voicePresetDesc}>{preset.desc}</span>
              </div>
            ))}
          </div>

          {/* 语速滑块 */}
          <SliderControl
            label="语速"
            value={config.voiceSpeed}
            min={VOICE_SPEED_MIN}
            max={VOICE_SPEED_MAX}
            valueFormatter={(v) => `${v}%`}
            onChange={(value) => onConfigChange({ voiceSpeed: value })}
            fillColor={undefined}
            thumbPositionCalculator={(v) => ((v - VOICE_SPEED_MIN) / VOICE_SPEED_RANGE) * 100}
          />

          {/* 配音音量滑块 */}
          <SliderControl
            label="配音音量"
            value={config.voiceVolume}
            min={0}
            max={100}
            valueFormatter={(v) => `${v}%`}
            onChange={(value) => onConfigChange({ voiceVolume: value })}
          />

          {/* 原音频音量滑块 */}
          <SliderControl
            label="原音频音量"
            value={config.originalAudioVolume}
            min={0}
            max={100}
            valueFormatter={(v) => `${v}%`}
            onChange={(value) => onConfigChange({ originalAudioVolume: value })}
            fillColor="linear-gradient(90deg, rgba(90, 158, 158, 0.5), rgba(90, 158, 158, 0.8))"
          />

          {/* 音频波形指示器 */}
          {hasVoice && <WaveformIndicator barCount={40} />}

          {/* 混音预览按钮 */}
          <button
            className={styles.mixPreviewBtn}
            onClick={() => setIsMixPreviewPlaying(!isMixPreviewPlaying)}
            disabled={!hasVoice}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMixPreviewPlaying ? (
                <rect x="6" y="4" width="4" height="16" />
              ) : (
                <polygon points="5 3 19 12 5 21 5 3" />
              )}
            </svg>
            {isMixPreviewPlaying ? '停止预览' : '混音预览'}
          </button>

          {/* 配音状态 */}
          <div className={styles.statusRow}>
            {hasVoice ? (
              <>
                <span className={`${styles.statusDot} ${styles.dotGreen}`} />
                <span>配音已就绪</span>
              </>
            ) : (
              <>
                <span className={`${styles.statusDot} ${styles.dotRed}`} />
                <span>请先生成配音</span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// 滑块控件（提取为可复用组件）
// ============================================

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  valueFormatter?: (value: number) => string;
  onChange: (value: number) => void;
  fillColor?: string;
  thumbPositionCalculator?: (value: number) => number;
}

/**
 * 通用滑块控件
 * 提取说明：原代码中有 3 个相似的滑块实现，现统一为可复用组件
 */
const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  valueFormatter = (v) => `${v}`,
  onChange,
  fillColor,
  thumbPositionCalculator,
}) => {
  const position = thumbPositionCalculator ? thumbPositionCalculator(value) : value;

  return (
    <div className={styles.sliderGroup}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderValue}>{valueFormatter(value)}</span>
      </div>
      <div className={styles.sliderTrack}>
        <div
          className={styles.sliderFill}
          style={{
            width: `${position}%`,
            ...(fillColor ? { background: fillColor } : {}),
          }}
        />
        <div className={styles.sliderThumb} style={{ left: `${position}%` }} />
        <input
          type="range"
          className={styles.sliderInput}
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
      </div>
    </div>
  );
};

// ============================================
// 波形指示器（提取为可复用组件）
// ============================================

interface WaveformIndicatorProps {
  barCount?: number;
}

/**
 * 音频波形指示器
 * 提取说明：原代码中波形渲染逻辑内联在组件中，现提取为独立组件
 */
const WaveformIndicator: React.FC<WaveformIndicatorProps> = ({ barCount = 40 }) => {
  return (
    <div className={styles.waveformSection}>
      <div className={styles.waveformLabel}>音频波形</div>
      <div className={styles.waveformContainer}>
        <div className={styles.waveformBars}>
          {Array.from({ length: barCount }).map((_, i) => (
            <div
              key={i}
              className={styles.waveformBar}
              style={{
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceSettingsPanel;
