/**
 * EffectsPanel — 效果列表
 * 每个效果: 名称 + Switch 开关
 * shadcn Card 样式
 */
import React, { memo, useState } from 'react';
import { Switch } from '../../ui/switch';

interface Effect {
  id: string;
  name: string;
  enabled: boolean;
}

interface EffectsPanelProps {
  clipId: string;
  effects?: Effect[];
}

const DEFAULT_EFFECTS: Effect[] = [
  { id: 'eq', name: '均衡器', enabled: false },
  { id: 'denoise', name: '降噪', enabled: false },
  { id: 'stabilize', name: '稳定化', enabled: false },
  { id: 'colorgrade', name: '色彩分级', enabled: true },
];

export const EffectsPanel = memo<EffectsPanelProps>(({ clipId, effects = DEFAULT_EFFECTS }) => {
  const [localEffects, setLocalEffects] = useState(effects);

  const toggleEffect = (id: string) => {
    setLocalEffects((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Effects</h3>

      <div className="flex flex-col gap-1.5">
        {localEffects.map((effect) => (
          <div
            key={effect.id}
            className="flex items-center justify-between px-3 py-2 rounded-md bg-bg-tertiary border border-border-subtle"
          >
            <span className="text-xs text-text-primary">{effect.name}</span>
            <Switch
              checked={effect.enabled}
              onCheckedChange={() => toggleEffect(effect.id)}
              size="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
});

EffectsPanel.displayName = 'EffectsPanel';
