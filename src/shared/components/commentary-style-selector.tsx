/**
 * CommentaryStyleSelector — 风格预设选择器（共享版本）
 *
 * 统一的风格选择 UI，支持单选 / 多选模式。
 * CommentaryPanel 和 workspace ScriptWriting 均使用此组件。
 */

import React, { memo } from 'react';
import { cn } from '@/shared/utils/cn';

interface StyleOption {
  value: string;
  label: string;
  description?: string;
  desc?: string;
  emoji?: string;
  icon?: string;
  color?: string;
}

interface Props {
  options: StyleOption[];
  selected: string | string[];
  onChange: (value: string | string[]) => void;
  multiSelect?: boolean;
  /** 自定义容器 className */
  className?: string;
  /** 选项渲染模式：'card' 使用 Card 样式，'compact' 使用紧凑样式 */
  variant?: 'card' | 'compact';
  /** 使用模块化 CSS 类名映射 */
  styles?: Record<string, string>;
}

const CommentaryStyleSelector: React.FC<Props> = ({
  options,
  selected,
  onChange,
  multiSelect = false,
  className,
  variant = 'card',
  styles: css,
}) => {
  const isSelected = (value: string) => {
    if (multiSelect && Array.isArray(selected)) {
      return selected.includes(value);
    }
    return selected === value;
  };

  const handleSelect = (value: string) => {
    if (multiSelect) {
      const arr = Array.isArray(selected) ? selected : [selected];
      if (arr.includes(value)) {
        onChange(arr.filter((v) => v !== value));
      } else {
        onChange([...arr, value]);
      }
    } else {
      onChange(value);
    }
  };

  if (variant === 'compact' && css) {
    return (
      <div className={css.commentaryStyleSection}>
        <div className={css.commentaryStyleGrid}>
          {options.map((style) => (
            <div
              key={style.value}
              className={`${css.commentaryStyleItem} ${
                isSelected(style.value) ? css.commentaryStyleActive : ''
              }`}
              onClick={() => handleSelect(style.value)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(style.value)}
              style={{ '--style-color': style.color } as React.CSSProperties}
            >
              <span className={css.commentaryStyleIcon}>
                {style.icon || style.emoji}
              </span>
              <span className={css.commentaryStyleName}>{style.label}</span>
              <span className={css.commentaryStyleDesc}>
                {style.desc || style.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card variant (default) — uses Tailwind classes
  const cardStyles = css ?? {};

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <p className="text-sm text-muted-foreground">
        {multiSelect
          ? '选择多个风格，系统将分别为每种风格生成一个版本'
          : '选择解说风格，系统将据此调整文案语气和节奏'}
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {options.map((opt) => (
          <div
            key={opt.value}
            className={cn(
              'cursor-pointer transition-all border-2 border-transparent rounded-lg',
              'hover:border-primary hover:-translate-y-0.5',
              isSelected(opt.value) && 'border-primary bg-primary/10',
              cardStyles.styleCard,
              isSelected(opt.value) && cardStyles.styleCardSelected,
            )}
            onClick={() => handleSelect(opt.value)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSelect(opt.value)}
          >
            <div className="flex items-start gap-3 p-3">
              <span className="text-2xl leading-none">
                {opt.emoji || opt.icon}
              </span>
              <div className="flex flex-col flex-1 gap-0.5">
                <span className="text-sm font-medium">{opt.label}</span>
                <span className="text-xs text-muted-foreground">
                  {opt.description || opt.desc}
                </span>
              </div>
              {isSelected(opt.value) && (
                <span className="shrink-0 text-xs font-medium text-primary">
                  {multiSelect ? '✓' : '已选'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(CommentaryStyleSelector);
