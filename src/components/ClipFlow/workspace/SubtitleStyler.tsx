/**
 * SubtitleStyler — 字幕样式编辑器
 * 提供 5 种预设 + 实时预览 + 精细调节
 */

import React, { memo, useState } from 'react';
import { toast } from '@/components/ui/sonner';
import styles from './SubtitleStyler.module.less';

// ─── 预设类型 ────────────────────────────────────────────────────────────────

export interface SubtitleStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;       // 相对视频宽度的百分比
  color: string;
  strokeColor: string;
  strokeWidth: number;
  backgroundColor: string;
  backgroundRadius: number;
  position: 'bottom' | 'top' | 'center';
  textAlign: 'left' | 'center' | 'right';
  shadowColor: string;
  shadowBlur: number;
}

export interface SubtitleStylerProps {
  value: SubtitleStyle;
  onChange: (style: SubtitleStyle) => void;
}

// ─── 5 种预设 ────────────────────────────────────────────────────────────────

export const SUBTITLE_PRESETS: SubtitleStyle[] = [
  {
    id: 'simple',
    name: '简约白底',
    fontFamily: 'sans-serif',
    fontSize: 3.5,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    backgroundColor: 'rgba(0,0,0,0)',
    backgroundRadius: 0,
    position: 'bottom',
    textAlign: 'center',
    shadowColor: 'transparent',
    shadowBlur: 0,
  },
  {
    id: 'glass',
    name: '透明玻璃态',
    fontFamily: 'sans-serif',
    fontSize: 3.2,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    backgroundRadius: 8,
    position: 'bottom',
    textAlign: 'center',
    shadowColor: 'rgba(0,0,0,0)',
    shadowBlur: 0,
  },
  {
    id: 'neon',
    name: '动感霓虹',
    fontFamily: 'Arial Black, sans-serif',
    fontSize: 4,
    color: '#00FFFF',
    strokeColor: '#FF00FF',
    strokeWidth: 3,
    backgroundColor: 'rgba(0,0,0,0)',
    backgroundRadius: 0,
    position: 'bottom',
    textAlign: 'center',
    shadowColor: '#00FFFF',
    shadowBlur: 12,
  },
  {
    id: 'cinema',
    name: '经典影院',
    fontFamily: 'Times New Roman, serif',
    fontSize: 3.5,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.75)',
    backgroundRadius: 0,
    position: 'bottom',
    textAlign: 'center',
    shadowColor: 'transparent',
    shadowBlur: 0,
  },
  {
    id: 'danmu',
    name: '弹幕风格',
    fontFamily: 'sans-serif',
    fontSize: 4.5,
    color: '#FFFFFF',
    strokeColor: '#000000',
    strokeWidth: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    backgroundRadius: 4,
    position: 'bottom',
    textAlign: 'center',
    shadowColor: 'transparent',
    shadowBlur: 0,
  },
];

// ─── 预设标签 ────────────────────────────────────────────────────────────────

const PRESET_ICONS: Record<string, string> = {
  simple: '⬜',
  glass: '🫧',
  neon: '🌈',
  cinema: '🎬',
  danmu: '💬',
};

// ─── ASS 导出辅助 ────────────────────────────────────────────────────────────

export function styleToASS(style: SubtitleStyle): string {
  return `Style: ${style.id}
Fontname: ${style.fontFamily}
Fontsize: ${Math.round(style.fontSize * 10)}
PrimaryColour: &H${style.color.replace('#', '')}
OutlineColour: &H${style.strokeColor.replace('#', '')}
Bold: -1
Outline: ${style.strokeWidth}
Shadow: ${style.shadowBlur}`;
}

// ─── 主组件 ─────────────────────────────────────────────────────────────────

const SubtitleStyler: React.FC<SubtitleStylerProps> = ({ value, onChange }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(value.id);

  const handlePresetClick = (preset: SubtitleStyle) => {
    setSelectedPreset(preset.id);
    onChange(preset);
  };

  const handleFieldChange = (field: keyof SubtitleStyle, newValue: string | number) => {
    setSelectedPreset('');
    onChange({ ...value, [field]: newValue });
  };

  // 预览样式
  const previewStyle: React.CSSProperties = {
    fontFamily: value.fontFamily,
    fontSize: value.fontSize > 10 ? `${value.fontSize * 3}px` : `${value.fontSize * 10}px`,
    color: value.color,
    WebkitTextStroke: value.strokeWidth > 0 ? `${value.strokeWidth}px ${value.strokeColor}` : undefined,
    textShadow: value.shadowBlur > 0
      ? `0 0 ${value.shadowBlur}px ${value.shadowColor}`
      : undefined,
    backgroundColor: value.backgroundColor,
    borderRadius: value.backgroundRadius,
    textAlign: value.textAlign,
    padding: value.backgroundColor !== 'rgba(0,0,0,0)' ? '4px 12px' : '0 12px',
    position: value.position === 'center' ? 'relative' : undefined,
    alignSelf: value.position === 'center' ? 'center' : value.position === 'top' ? 'flex-start' : 'flex-end',
  };

  return (
    <div className={styles.container}>
      {/* 左侧：预设选择 */}
      <div className={styles.presetList}>
        <h3 className={styles.sectionTitle}>预设样式</h3>
        <div className={styles.presets}>
          {SUBTITLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`${styles.presetCard} ${selectedPreset === preset.id ? styles.presetCardActive : ''}`}
              onClick={() => handlePresetClick(preset)}
            >
              <span className={styles.presetIcon}>{PRESET_ICONS[preset.id]}</span>
              <span className={styles.presetName}>{preset.name}</span>
            </button>
          ))}
        </div>

        {/* 精细调节 */}
        <h3 className={styles.sectionTitle} style={{ marginTop: 20 }}>精细调节</h3>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span>字体大小</span>
            <input
              type="range"
              min="2"
              max="8"
              step="0.5"
              value={value.fontSize}
              onChange={(e) => handleFieldChange('fontSize', parseFloat(e.target.value))}
            />
            <span className={styles.fieldValue}>{value.fontSize}%</span>
          </label>
          <label className={styles.field}>
            <span>描边宽度</span>
            <input
              type="range"
              min="0"
              max="6"
              step="0.5"
              value={value.strokeWidth}
              onChange={(e) => handleFieldChange('strokeWidth', parseFloat(e.target.value))}
            />
            <span className={styles.fieldValue}>{value.strokeWidth}px</span>
          </label>
          <label className={styles.field}>
            <span>文字颜色</span>
            <input
              type="color"
              value={value.color}
              onChange={(e) => handleFieldChange('color', e.target.value)}
              className={styles.colorInput}
            />
          </label>
          <label className={styles.field}>
            <span>描边颜色</span>
            <input
              type="color"
              value={value.strokeColor}
              onChange={(e) => handleFieldChange('strokeColor', e.target.value)}
              className={styles.colorInput}
            />
          </label>
          <label className={styles.field}>
            <span>背景颜色</span>
            <input
              type="color"
              value={value.backgroundColor.startsWith('rgba') ? '#000000' : value.backgroundColor}
              onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
              className={styles.colorInput}
            />
          </label>
          <label className={styles.field}>
            <span>圆角</span>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={value.backgroundRadius}
              onChange={(e) => handleFieldChange('backgroundRadius', parseInt(e.target.value))}
            />
            <span className={styles.fieldValue}>{value.backgroundRadius}px</span>
          </label>
          <label className={styles.field}>
            <span>位置</span>
            <select
              value={value.position}
              onChange={(e) => handleFieldChange('position', e.target.value as SubtitleStyle['position'])}
              className={styles.selectInput}
            >
              <option value="bottom">底部</option>
              <option value="top">顶部</option>
              <option value="center">居中</option>
            </select>
          </label>
        </div>

        {/* ASS 导出 */}
        <div className={styles.assExport}>
          <h3 className={styles.sectionTitle}>ASS 样式</h3>
          <pre className={styles.assCode}>{styleToASS(value)}</pre>
          <button
            className={styles.copyBtn}
            onClick={() => {
              navigator.clipboard.writeText(styleToASS(value));
              toast.success('已复制 ASS 样式');
            }}
          >
            复制 ASS 样式
          </button>
        </div>
      </div>

      {/* 右侧：实时预览 */}
      <div className={styles.preview}>
        <h3 className={styles.sectionTitle}>实时预览</h3>
        <div className={styles.previewScreen}>
          <div className={styles.previewVideoArea}>
            <span className={styles.previewHint}>视频预览区域</span>
            <div className={styles.subtitleWrapper} style={{ justifyContent: value.position === 'top' ? 'flex-start' : value.position === 'center' ? 'center' : 'flex-end' }}>
              <span style={previewStyle} className={styles.previewSubtitle}>
                这是一条示例字幕
              </span>
            </div>
          </div>
        </div>
        <div className={styles.previewInfo}>
          <span>{value.name}</span>
          <span>{value.fontFamily}</span>
          <span>{value.fontSize}%</span>
        </div>
      </div>
    </div>
  );
};

export default memo(SubtitleStyler);