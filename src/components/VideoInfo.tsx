import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { VideoCameraOutlined, ClockCircleOutlined, FileOutlined } from '@ant-design/icons';
import styles from './VideoInfo.module.less';

interface VideoInfoProps {
  name: string;
  duration: number;
  path?: string;
  metadata?: {
    width?: number;
    height?: number;
    fps?: number;
    codec?: string;
  };
}

/**
 * 视频信息展示组件
 */
const VideoInfo: React.FC<VideoInfoProps> = ({ 
  name, 
  duration, 
  path,
  metadata 
}) => {
  // 格式化时间为分:秒
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '未知';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 格式化路径，只显示最后的文件名部分
  const formatPath = (path?: string): string => {
    if (!path) return '未知路径';
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  return (
    <Card title="视频信息" className={styles.container}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Statistic 
            title="视频名称"
            value={name}
            valueStyle={{ fontSize: '16px' }}
            prefix={<FileOutlined />}
          />
        </Col>
        
        <Col span={8}>
          <Statistic 
            title="时长"
            value={formatDuration(duration)}
            valueStyle={{ fontSize: '16px' }}
            prefix={<ClockCircleOutlined />}
          />
        </Col>
        
        <Col span={8}>
          <Statistic 
            title="源文件"
            value={formatPath(path)}
            valueStyle={{ fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis' }}
            prefix={<VideoCameraOutlined />}
          />
        </Col>
        
        {metadata && (
          <>
            {metadata.width && metadata.height && (
              <Col span={8}>
                <Statistic 
                  title="分辨率"
                  value={`${metadata.width} x ${metadata.height}`}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
            )}
            
            {metadata.fps && (
              <Col span={8}>
                <Statistic 
                  title="帧率"
                  value={`${metadata.fps.toFixed(2)} FPS`}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
            )}
            
            {metadata.codec && (
              <Col span={8}>
                <Statistic 
                  title="编码"
                  value={metadata.codec}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
            )}
          </>
        )}
      </Row>
    </Card>
  );
};

export default VideoInfo; 