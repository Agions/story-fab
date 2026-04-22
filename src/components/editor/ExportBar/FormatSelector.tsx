/**
 * FormatSelector — 导出格式选择器
 * 3 buttons: 9:16 | 1:1 | 16:9
 * shadcn Button variant=outline
 * Selected: --accent-primary border + text
 * Unselected: --text-secondary
 */
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';

export type AspectRatio = '9:16' | '1:1' | '16:9';

const FORMATS: { value: AspectRatio; label: string; icon: string }[] = [
  { value: '9:16', label: '9:16', icon: '📱' },
  { value: '1:1', label: '1:1', icon: '🖼️' },
  { value: '16:9', label: '16:9', icon: '🖥️' },
];

interface FormatSelectorProps {
  selected: AspectRatio;
  onChange: (format: AspectRatio) => void;
  disabled?: boolean;
}

export const FormatSelector = memo<FormatSelectorProps>(({
  selected,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-1">
      {FORMATS.map((fmt) => {
        const isSelected = selected === fmt.value;
        return (
          <Button
            key={fmt.value}
            variant="outline"
            size="sm"
            onClick={() => onChange(fmt.value)}
            disabled={disabled}
            className={`
              h-7 px-3 text-xs font-mono gap-1
              ${isSelected
                ? 'border-accent-primary text-accent-primary bg-accent-primary/10'
                : 'border-border-default text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              }
            `}
            style={{ borderRadius: 6 }}
          >
            <span>{fmt.icon}</span>
            <span>{fmt.label}</span>
          </Button>
        );
      })}
    </div>
  );
});

FormatSelector.displayName = 'FormatSelector';
