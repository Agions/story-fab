import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Clock, File } from 'lucide-react';
import { formatDuration } from '@/shared';
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

const StatisticItem = ({ title, value, icon }: { title: string; value: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex flex-col">
    <span className="text-xs text-muted-foreground mb-0.5">{title}</span>
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-sm text-text-primary font-medium truncate">{value}</span>
    </div>
  </div>
);

/**
 * 视频信息展示组件
 */
const VideoInfo: React.FC<VideoInfoProps> = ({
  name,
  duration,
  path,
  metadata
}) => {
  // 格式化路径，只显示最后的文件名部分
  const formatPath = (path?: string): string => {
    if (!path) return '未知路径';
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1];
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">视频信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <StatisticItem title="视频名称" value={name} icon={<File size={14} />} />
          <StatisticItem title="时长" value={formatDuration(duration)} icon={<Clock size={14} />} />
          <StatisticItem title="源文件" value={formatPath(path)} icon={<Video size={14} />} />

          {metadata && (
            <>
              {metadata.width && metadata.height && (
                <StatisticItem title="分辨率" value={`${metadata.width} x ${metadata.height}`} />
              )}
              {metadata.fps && (
                <StatisticItem title="帧率" value={`${metadata.fps} fps`} />
              )}
              {metadata.codec && (
                <StatisticItem title="编码格式" value={metadata.codec} />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoInfo;
