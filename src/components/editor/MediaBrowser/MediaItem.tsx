/**
 * MediaItem — 单个媒体项卡片
 * 16:9 缩略图, 名称截断, 右下角时长徽章
 * Double-click 添加到时间线
 */
import React, { memo, useCallback } from 'react';
import { FileVideo, FileAudio, FileImage, FileText } from 'lucide-react';
import type { MediaFile } from './MediaBrowserPanel';

interface MediaItemProps {
  item: MediaFile;
  onDoubleClick?: () => void;
  onDrag?: (e: React.DragEvent) => void;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TYPE_ICONS = {
  video: FileVideo,
  audio: FileAudio,
  image: FileImage,
  text: FileText,
};

export const MediaItem = memo<MediaItemProps>(({ item, onDoubleClick, onDrag }) => {
  const Icon = TYPE_ICONS[item.type] || FileVideo;

  const handleDoubleClick = useCallback(() => {
    onDoubleClick?.();
  }, [onDoubleClick]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-cutdeck-media', JSON.stringify(item));
    onDrag?.(e);
  }, [item, onDrag]);

  return (
    <div
      className="group relative flex items-center gap-2 p-2 rounded-md cursor-pointer bg-bg-tertiary hover:bg-bg-hover border border-transparent hover:border-border-subtle transition-colors"
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={handleDoubleClick}
    >
      {/* Thumbnail / Icon */}
      <div
        className="relative shrink-0 rounded overflow-hidden bg-black/40"
        style={{ width: 64, height: 36 }}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="size-5 text-text-disabled" />
          </div>
        )}

        {/* Duration badge */}
        {item.duration !== undefined && item.duration > 0 && (
          <div
            className="absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[9px] text-text-primary bg-black/70"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            {formatDuration(item.duration)}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-text-primary truncate">{item.name}</p>
        <p className="text-[10px] text-text-disabled">
          {(item.size / 1024 / 1024).toFixed(1)} MB
        </p>
      </div>
    </div>
  );
});

MediaItem.displayName = 'MediaItem';
