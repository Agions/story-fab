/**
 * 功能模式选择器
 * 职责：AI 功能模式选择 UI（视频解说/第一人称/混剪）
 *
 * 重构说明：
 * - 从原 ScriptWriting.tsx (686行) 中提取功能模式选择 UI
 * - 职责单一：只负责功能模式选择
 */

import React from 'react';
import styles from '../ScriptWriting.module.less';
import { FEATURE_TO_FUNCTION, type AIFunctionType } from '../functionModeMap';

// ============================================
// 类型定义
// ============================================

export interface FunctionMode {
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  features: string[];
  example: string;
}

export interface FunctionModeSelectorProps {
  /** 功能配置 */
  functionConfig: Record<AIFunctionType, FunctionMode>;
  /** 当前选中的功能类型 */
  currentType: AIFunctionType;
  /** 是否有对应内容（用于显示"已生成"标签） */
  hasContent: (key: AIFunctionType) => boolean;
  /** 类型选择回调 */
  onTypeChange: (type: AIFunctionType) => void;
}

// ============================================
// 功能模式选择器组件
// ============================================

export const FunctionModeSelector: React.FC<FunctionModeSelectorProps> = ({
  functionConfig,
  currentType,
  hasContent,
  onTypeChange,
}) => {
  return (
    <div className={styles.modeList}>
      {(Object.entries(functionConfig) as [AIFunctionType, FunctionMode][]).map(([key, func]) => {
        const isActive = currentType === key;
        const isGenerated = hasContent(key);

        return (
          <div
            key={key}
            className={`${styles.modeItem} ${isActive ? styles.modeActive : ''}`}
            onClick={() => onTypeChange(key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onTypeChange(key)}
          >
            <div className={styles.modeItemInner}>
              <span className={styles.modeItemIcon}>{func.icon}</span>
              <div className={styles.modeItemContent}>
                <div className={styles.modeItemName}>
                  {func.title}
                  {isGenerated && <span className={styles.modeItemBadge}>已生成</span>}
                </div>
                <div className={styles.modeItemDesc}>{func.description}</div>
              </div>
            </div>
            <div className={styles.modeItemCheck}>
              <div className={styles.modeItemCheckDot} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 从外部 feature 同步当前功能类型
 * 提取说明：原代码中此 useEffect 内联在主组件中
 */
export function useSyncFunctionType(
  currentType: AIFunctionType,
  selectedFeature: string,
  setType: (type: AIFunctionType) => void
): void {
  React.useEffect(() => {
    if (selectedFeature === 'none') return;
    const mapped = FEATURE_TO_FUNCTION[selectedFeature as 'smartClip' | 'voiceover' | 'subtitle'];
    if (!mapped || mapped === currentType) return;
    setType(mapped);
  }, [currentType, selectedFeature, setType]);
}

/**
 * 获取 functionType 对应的 feature
 */
export default FunctionModeSelector;
