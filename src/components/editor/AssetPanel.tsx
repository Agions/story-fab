import React, { useState } from 'react';
import { 
  Tabs, 
  Button, 
  Upload, 
  Card, 
  List, 
  Input, 
  Empty, 
  Tooltip, 
  Space,
  Dropdown,
  Typography,
  Tag
} from 'antd';
import { 
  UploadOutlined, 
  VideoCameraOutlined, 
  AudioOutlined, 
  FileImageOutlined,
  FileTextOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { formatDuration, formatFileSize } from '@/shared';
import styles from './AssetPanel.module.less';

const { TabPane } = Tabs;
const { Search } = Input;
const { Text } = Typography;

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

// 模拟素材数据
const mockAssets: Asset[] = [
  {
    id: 'video-1',
    name: '片段1.mp4',
    type: 'video',
    src: 'https://example.com/video1.mp4',
    thumbnail: 'https://picsum.photos/96/54?random=1',
    duration: 45,
    size: 10.5,
    tags: ['入场']
  },
  {
    id: 'video-2',
    name: '片段2.mp4',
    type: 'video',
    src: 'https://example.com/video2.mp4',
    thumbnail: 'https://picsum.photos/96/54?random=2',
    duration: 30,
    size: 8.2,
    tags: ['特写']
  },
  {
    id: 'audio-1',
    name: '背景音乐.mp3',
    type: 'audio',
    src: 'https://example.com/audio1.mp3',
    duration: 120,
    size: 3.5,
    tags: ['音乐']
  },
  {
    id: 'image-1',
    name: 'logo.png',
    type: 'image',
    src: 'https://example.com/image1.png',
    thumbnail: 'https://picsum.photos/96/54?random=3',
    size: 0.8,
    tags: ['素材']
  },
  {
    id: 'text-1',
    name: '字幕1',
    type: 'text',
    src: 'Hello World',
    size: 0.1,
    tags: ['字幕']
  }
];

interface AssetPanelProps {}

const AssetPanel: React.FC<AssetPanelProps> = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 过滤显示的素材
  const filteredAssets = assets.filter(asset => {
    // 按类型过滤
    if (activeTab !== 'all' && asset.type !== activeTab) {
      return false;
    }
    
    // 按搜索词过滤
    if (searchQuery && !asset.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // 删除素材
  const handleDelete = (id: string) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };
  
  // 添加到时间轴
  const addToTimeline = (asset: Asset) => {
    console.log('添加到时间轴', asset);
    // 这里将来会实现与Timeline组件的交互
  };
  
  // 渲染素材缩略图或图标
  const renderThumbnail = (asset: Asset) => {
    switch (asset.type) {
      case 'video':
        return asset.thumbnail ? (
          <img src={asset.thumbnail} className={styles.thumbnail} alt={asset.name} />
        ) : (
          <div className={styles.assetIconContainer}>
            <VideoCameraOutlined className={styles.assetIcon} />
          </div>
        );
      case 'audio':
        return (
          <div className={styles.assetIconContainer}>
            <AudioOutlined className={styles.assetIcon} />
          </div>
        );
      case 'image':
        return asset.thumbnail ? (
          <img src={asset.thumbnail} className={styles.thumbnail} alt={asset.name} />
        ) : (
          <div className={styles.assetIconContainer}>
            <FileImageOutlined className={styles.assetIcon} />
          </div>
        );
      case 'text':
        return (
          <div className={styles.assetIconContainer}>
            <FileTextOutlined className={styles.assetIcon} />
          </div>
        );
      default:
        return null;
    }
  };
  
  // 上传素材
  const handleUpload = (info: any) => {
    console.log('上传文件', info);
    // 实际项目中会处理文件上传和转码
  };
  
  // 素材项操作菜单
  const assetMenu = (id: string) => ({
    items: [
      {
        key: '1',
        label: '重命名',
        onClick: () => console.log('重命名', id)
      },
      {
        key: '2',
        label: '下载',
        onClick: () => console.log('下载', id)
      },
      {
        key: '3',
        label: '复制',
        onClick: () => console.log('复制', id)
      },
      {
        type: 'divider',
      },
      {
        key: '4',
        label: '删除',
        danger: true,
        onClick: () => handleDelete(id)
      }
    ],
  });
  
  return (
    <div className={styles.assetPanelContainer}>
      <div className={styles.assetSearch}>
        <Search
          placeholder="搜索素材..."
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className={styles.assetTabs}
      >
        <TabPane tab="全部" key="all" />
        <TabPane tab="视频" key="video" />
        <TabPane tab="音频" key="audio" />
        <TabPane tab="图片" key="image" />
        <TabPane tab="文本" key="text" />
      </Tabs>
      
      <div className={styles.uploadContainer}>
        <Upload
          multiple
          showUploadList={false}
          customRequest={handleUpload}
        >
          <Button 
            icon={<UploadOutlined />} 
            block
          >
            上传素材
          </Button>
        </Upload>
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
                  <Tooltip title={asset.name}>
                    <div className={styles.assetName}>{asset.name}</div>
                  </Tooltip>
                  <div className={styles.assetDetails}>
                    <span className={styles.assetSize}>{formatFileSize(asset.size)}</span>
                    {asset.tags.map(tag => (
                      <Tag key={tag} className={styles.assetTag}>{tag}</Tag>
                    ))}
                  </div>
                </div>
              </div>
              <Dropdown menu={assetMenu(asset.id)} trigger={['click']} placement="bottomRight">
                <Button 
                  type="text" 
                  className={styles.assetMenuButton}
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Dropdown>
            </div>
          ))
        ) : (
          <Empty 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                {searchQuery 
                  ? "没有找到匹配的素材" 
                  : activeTab === 'all' 
                    ? "没有素材" 
                    : `没有${activeTab === 'video' ? '视频' : activeTab === 'audio' ? '音频' : activeTab === 'image' ? '图片' : '文本'}素材`
                }
              </span>
            }
          />
        )}
      </div>
    </div>
  );
};

export default AssetPanel; 