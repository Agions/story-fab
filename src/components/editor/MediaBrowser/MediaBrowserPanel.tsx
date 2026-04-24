/**
 * MediaBrowserPanel — 媒体浏览器面板
 * 240px 固定宽度，shadcn ScrollArea
 * Header: "Media" + import button (primary orange)
 */
import React, { memo, useState, useCallback } from 'react';
import { ScrollArea } from '../../ui/scroll-area';
import { Button } from '../../ui/button';
import { MediaItem } from './MediaItem';
import { FolderTree } from './FolderTree';
import { FolderPlus, Upload } from 'lucide-react';

export interface MediaFile {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text';
  thumbnail?: string;
  duration?: number;  // seconds
  size: number;
  path: string;
}

interface MediaBrowserPanelProps {
  files?: MediaFile[];
  folders?: { id: string; name: string; parentId?: string }[];
  onFileDoubleClick?: (file: MediaFile) => void;
  onFileDrag?: (file: MediaFile, e: React.DragEvent) => void;
  onImport?: () => void;
}

export const MediaBrowserPanel = memo<MediaBrowserPanelProps>(({
  files = [],
  folders = [],
  onFileDoubleClick,
  onFileDrag,
  onImport,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const filteredFiles = selectedFolderId
    ? files.filter(() => true) // In real impl, filter by folderId
    : files;

  return (
    <div
      className="flex flex-col bg-bg-secondary border-r border-border-subtle shrink-0"
      style={{ width: 240, height: '100%' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle shrink-0">
        <span className="text-sm font-semibold text-text-primary">Media</span>
        <Button
          variant="default"
          size="icon-sm"
          onClick={onImport}
          className="bg-accent-primary hover:bg-accent-primary-hover text-white"
          title="导入素材"
        >
          <Upload className="size-3.5" />
        </Button>
      </div>

      {/* Folder tree */}
      <div className="border-b border-border-subtle shrink-0">
        <FolderTree
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
        />
      </div>

      {/* File list */}
      <ScrollArea className="flex-1">
        <div className="p-2 flex flex-col gap-1">
          {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-text-disabled text-xs gap-2">
              <FolderPlus className="size-8 opacity-30" />
              <span>暂无素材</span>
              <span className="text-[10px]">点击 + 导入或拖放文件</span>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <MediaItem
                key={file.id}
                item={file}
                onDoubleClick={() => onFileDoubleClick?.(file)}
                onDrag={(e) => onFileDrag?.(file, e)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

MediaBrowserPanel.displayName = 'MediaBrowserPanel';
