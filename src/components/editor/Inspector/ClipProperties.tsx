/**
 * ClipProperties — 片段属性表单
 * 显示: name, duration, start/end timecode
 * 使用 shadcn Input，JetBrains Mono 字体
 */
import React, { memo, useState, useCallback } from 'react';
import { Input } from '../../ui/input';
import type { ClipInfo } from './InspectorPanel';
import { formatTime } from '../../../shared/utils/formatting';

interface ClipPropertiesProps {
  clip: ClipInfo;
  onUpdate?: (clipId: string, updates: Partial<ClipInfo>) => void;
  onDelete?: (clipId: string) => void;
}

export const ClipProperties = memo<ClipPropertiesProps>(({ clip, onUpdate }) => {
  const [name, setName] = useState(clip.name);

  const handleNameBlur = useCallback(() => {
    if (name !== clip.name) {
      onUpdate?.(clip.id, { name });
    }
  }, [name, clip.id, clip.name, onUpdate]);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Properties</h3>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] text-text-secondary">名称</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          className="h-7 text-xs bg-bg-tertiary border-border-subtle text-text-primary"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] text-text-secondary">时长</label>
        <div
          className="h-7 px-2 flex items-center text-xs text-accent-primary bg-bg-tertiary border border-border-subtle rounded-md"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          {formatTime(clip.duration)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary">开始</label>
          <div
            className="h-7 px-2 flex items-center text-[11px] text-text-primary bg-bg-tertiary border border-border-subtle rounded-md"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {formatTime(clip.startTime)}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-text-secondary">结束</label>
          <div
            className="h-7 px-2 flex items-center text-[11px] text-text-primary bg-bg-tertiary border border-border-subtle rounded-md"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {formatTime(clip.endTime)}
          </div>
        </div>
      </div>
    </div>
  );
});

ClipProperties.displayName = 'ClipProperties';
