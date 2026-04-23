import React, { useState, useRef } from 'react';
import { logger } from '@/utils/logger';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Upload, Video, Music, Image, FileText, MoreHorizontal, Search, X, Plus } from 'lucide-react';
import { formatDuration, formatFileSize } from '@/shared';
import styles from './AssetPanel.module.less';

const TABS_CONFIG = [
  { key: 'all', label: '全部' },
  { key: 'video', label: '视频' },
  { key: 'audio', label: '音频' },
  { key: 'image', label: '图片' },
  { key: 'text', label: '文本' },
] as const;

interface Asset {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'image' | 'text';
  src: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  tags: string[];
}

type AssetTab = (typeof TABS_CONFIG)[number]['key'];

// AssetPanel - displays user uploaded assets
const AssetPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AssetTab>('all');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 过滤显示的素材
  const filteredAssets = assets.filter(asset => {
    if (activeTab !== 'all' && asset.type !== activeTab) return false;
    if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // 删除素材
  const handleDelete = (id: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== id));
  };

  // 添加到时间轴
  const addToTimeline = (asset: Asset) => {
    logger.debug('添加到时间轴', { asset });
  };

  // 渲染素材缩略图或图标
  const renderThumbnail = (asset: Asset) => {
    const iconClass = styles.assetIcon;
    switch (asset.type) {
      case 'video':
        return asset.thumbnail ? (
          <img src={asset.thumbnail} className={styles.thumbnail} alt={asset.name} />
        ) : (
          <div className={styles.assetIconContainer}>
            <Video className={iconClass} size={24} />
          </div>
        );
      case 'audio':
        return (
          <div className={styles.assetIconContainer}>
            <Music className={iconClass} size={24} />
          </div>
        );
      case 'image':
        return asset.thumbnail ? (
          <img src={asset.thumbnail} className={styles.thumbnail} alt={asset.name} />
        ) : (
          <div className={styles.assetIconContainer}>
            <Image className={iconClass} size={24} />
          </div>
        );
      case 'text':
        return (
          <div className={styles.assetIconContainer}>
            <FileText className={iconClass} size={24} />
          </div>
        );
      default:
        return null;
    }
  };

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    logger.debug('上传文件', { count: files.length });
    // 实际项目中会处理文件上传和转码
    Array.from(files).forEach(file => {
      const id = crypto.randomUUID();
      const asset: Asset = {
        id,
        name: file.name,
        type: file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('image/') ? 'image' : 'text',
        src: URL.createObjectURL(file),
        size: file.size,
        tags: [],
      };
      setAssets(prev => [...prev, asset]);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 素材项操作菜单
  const assetMenu = (id: string) => [
    { key: '1', label: '重命名', onClick: () => logger.debug('重命名', { id }) },
    { key: '2', label: '下载', onClick: () => logger.debug('下载', { id }) },
    { key: '3', label: '复制', onClick: () => logger.debug('复制', { id }) },
    { key: '4', label: '删除', danger: true, onClick: () => handleDelete(id) },
  ];

  const getEmptyMessage = () => {
    if (searchQuery) return '没有找到匹配的素材';
    if (activeTab === 'all') return '没有素材';
    const labels: Record<string, string> = { video: '视频', audio: '音频', image: '图片', text: '文本' };
    return `没有${labels[activeTab] || activeTab}素材`;
  };

  return (
    <div className={styles.assetPanelContainer}>
      <div className={styles.assetSearch}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索素材..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 pr-8"
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery('')}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssetTab)} className={styles.assetTabs}>
        <TabsList className="w-full justify-start overflow-auto">
          {TABS_CONFIG.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key} className="text-xs">{tab.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className={styles.uploadContainer}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus size={14} className="mr-1" />上传素材
        </Button>
      </div>

      <div className={styles.assetList}>
        {filteredAssets.length > 0 ? (
          filteredAssets.map(asset => (
            <div key={asset.id} className={styles.assetItem}>
              <div
                className={styles.assetContent}
                onClick={() => addToTimeline(asset)}
              >
                <div className={styles.assetPreview}>
                  {renderThumbnail(asset)}
                  {asset.duration && (
                    <div className={styles.assetDuration}>
                      {formatDuration(asset.duration)}
                    </div>
                  )}
                </div>
                <div className={styles.assetInfo}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className={`${styles.assetName} truncate cursor-default`}>
                        {asset.name}
                      </TooltipTrigger>
                      <TooltipContent side="top">{asset.name}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className={styles.assetDetails}>
                    <span className={styles.assetSize}>{formatFileSize(asset.size)}</span>
                    {asset.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors ${styles.assetMenuButton}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal size={14} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {assetMenu(asset.id).map((item, idx) =>
                    item.key === '4' ? (
                      <DropdownMenuItem key={idx} className="text-destructive focus:text-destructive" onClick={(e: React.MouseEvent) => { e.stopPropagation(); item.onClick(); }}>
                        {item.label}
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem key={idx} onClick={(e: React.MouseEvent) => { e.stopPropagation(); item.onClick(); }}>
                        {item.label}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
            <FileText size={32} className="mb-3 opacity-30" />
            <span>{getEmptyMessage()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetPanel;
