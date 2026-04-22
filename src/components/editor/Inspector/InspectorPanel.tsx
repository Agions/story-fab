/**
 * InspectorPanel — 右侧属性检查面板
 * 280px 固定宽度，bg-secondary 背景
 * 包含: ClipProperties, Effects, Metadata
 */
import React, { memo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipProperties } from './ClipProperties';
import { EffectsPanel } from './EffectsPanel';
import { MetadataPanel } from './MetadataPanel';

export interface ClipInfo {
  id: string;
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  resolution?: string;
  codec?: string;
  bitrate?: string;
  fps?: number;
}

interface InspectorPanelProps {
  selectedClip?: ClipInfo | null;
  onClipUpdate?: (clipId: string, updates: Partial<ClipInfo>) => void;
  onClipDelete?: (clipId: string) => void;
}

export const InspectorPanel = memo<InspectorPanelProps>(({
  selectedClip,
  onClipUpdate,
  onClipDelete,
}) => {
  return (
    <div
      className="flex flex-col bg-bg-secondary border-l border-border-subtle shrink-0"
      style={{ width: 280, height: '100%' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-subtle shrink-0">
        <h2 className="text-sm font-semibold text-text-primary">Inspector</h2>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        {selectedClip ? (
          <div className="flex flex-col gap-4 p-4">
            <ClipProperties
              clip={selectedClip}
              onUpdate={onClipUpdate}
              onDelete={onClipDelete}
            />
            <EffectsPanel clipId={selectedClip.id} />
            <MetadataPanel clip={selectedClip} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-text-disabled text-sm">
            选择片段以查看属性
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

InspectorPanel.displayName = 'InspectorPanel';
