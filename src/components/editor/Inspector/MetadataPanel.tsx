/**
 * MetadataPanel — 元数据表格
 * 显示: Resolution, Codec, Bitrate, FPS
 */
import React, { memo } from 'react';
import type { ClipInfo } from './InspectorPanel';

interface MetadataPanelProps {
  clip: ClipInfo;
}

export const MetadataPanel = memo<MetadataPanelProps>(({ clip }) => {
  const rows: { label: string; value: string }[] = [
    { label: 'Resolution', value: clip.resolution || '1920×1080' },
    { label: 'Codec', value: clip.codec || 'H.264' },
    { label: 'Bitrate', value: clip.bitrate || '8 Mbps' },
    { label: 'FPS', value: clip.fps ? `${clip.fps}` : '30' },
  ];

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Metadata</h3>

      <div className="flex flex-col rounded-md border border-border-subtle overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-3 py-2 bg-bg-tertiary ${i < rows.length - 1 ? 'border-b border-border-subtle' : ''}`}
          >
            <span className="text-[11px] text-text-secondary">{row.label}</span>
            <span
              className="text-[11px] text-text-primary"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

MetadataPanel.displayName = 'MetadataPanel';
