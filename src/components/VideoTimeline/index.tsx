/**
 * 视频时间轴组件
 * 用于可视化编辑视频和音频时间轴
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Slider,
  Space,
  Typography,
  Tooltip,
  Tag,
  Divider,
  Row,
  Col,
  InputNumber,
  message
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ScissorOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';
import type { VideoInfo, ScriptData } from '@/core/types';
import styles from './index.module.less';

const { Text, Title } = Typography;

// 时间轴轨道类型
interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'script';
  name: string;
  clips: TimelineClip[];
  isMuted?: boolean;
  isLocked?: boolean;
}

// 时间轴片段
interface TimelineClip {
  id: string;
  trackId: string;
  startTime: number;
  endTime: number;
  sourceStart: number;
  sourceEnd: number;
  name: string;
  color?: string;
}

// 时间轴数据
interface TimelineData {
  tracks: TimelineTrack[];
  duration: number;
  currentTime: number;
}

interface VideoTimelineProps {
  timeline?: TimelineData;
  videoInfo?: VideoInfo;
  script?: ScriptData;
  onSave?: (timeline: TimelineData) => void;
}

export const VideoTimeline: React.FC<VideoTimelineProps> = ({
  timeline: initialTimeline,
  videoInfo,
  script,
  onSave
}) => {
  const [timeline, setTimeline] = useState<TimelineData>(
    initialTimeline || {
      tracks: [
        {
          id: 'video-1',
          type: 'video',
          name: '视频轨道 1',
          clips: [],
          isMuted: false,
          isLocked: false
        },
        {
          id: 'audio-1',
          type: 'audio',
          name: '音频轨道 1',
          clips: [],
          isMuted: false,
          isLocked: false
        },
        {
          id: 'script-1',
          type: 'script',
          name: '解说词',
          clips: [],
          isMuted: false,
          isLocked: false
        }
      ],
      duration: videoInfo?.duration || 0,
      currentTime: 0
    }
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // 处理播放/暂停
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // 处理时间变化
  const handleTimeChange = (value: number) => {
    setTimeline(prev => ({ ...prev, currentTime: value }));
  };

  // 添加片段
  const handleAddClip = (trackId: string) => {
    const newClip: TimelineClip = {
      id: `clip-${Date.now()}`,
      trackId,
      startTime: timeline.currentTime,
      endTime: timeline.currentTime + 5,
      sourceStart: 0,
      sourceEnd: 5,
      name: '新片段'
    };

    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      )
    }));

    message.success('已添加片段');
  };

  // 删除片段
  const handleDeleteClip = (clipId: string) => {
    setTimeline(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(clip => clip.id !== clipId)
      }))
    }));

    setSelectedClip(null);
    message.success('已删除片段');
  };

  // 保存时间轴
  const handleSave = () => {
    onSave?.(timeline);
    message.success('时间轴已保存');
  };

  // 渲染轨道头部
  const renderTrackHeader = (track: TimelineTrack) => (
    <div className={styles.trackHeader}>
      <Space direction="vertical" size={0}>
        <Text strong>{track.name}</Text>
        <Space size="small">
          {track.isMuted && <Tag size="small">静音</Tag>}
          {track.isLocked && <Tag size="small">锁定</Tag>}
        </Space>
      </Space>
    </div>
  );

  // 渲染轨道内容
  const renderTrackContent = (track: TimelineTrack) => (
    <div className={styles.trackContent}>
      {track.clips.map(clip => (
        <div
          key={clip.id}
          className={`${styles.clip} ${selectedClip === clip.id ? styles.selected : ''}`}
          style={{
            left: `${(clip.startTime / timeline.duration) * 100}%`,
            width: `${((clip.endTime - clip.startTime) / timeline.duration) * 100}%`
          }}
          onClick={() => setSelectedClip(clip.id)}
        >
          <div className={styles.clipContent}>
            <Text ellipsis>{clip.name}</Text>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.videoTimeline}>
      {/* 工具栏 */}
      <Card size="small" className={styles.toolbar}>
        <Space>
          <Button
            icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={handlePlayPause}
          >
            {isPlaying ? '暂停' : '播放'}
          </Button>
          <Divider type="vertical" />
          <Button icon={<PlusOutlined />} onClick={() => handleAddClip('video-1')}>
            添加片段
          </Button>
          <Button
            icon={<DeleteOutlined />}
            danger
            disabled={!selectedClip}
            onClick={() => selectedClip && handleDeleteClip(selectedClip)}
          >
            删除
          </Button>
          <Divider type="vertical" />
          <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
            保存
          </Button>
          <Divider type="vertical" />
          <Space>
            <Tooltip title="缩小">
              <Button icon={<ZoomOutOutlined />} onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} />
            </Tooltip>
            <Text>{Math.round(zoom * 100)}%</Text>
            <Tooltip title="放大">
              <Button icon={<ZoomInOutlined />} onClick={() => setZoom(z => Math.min(3, z + 0.1))} />
            </Tooltip>
          </Space>
        </Space>
      </Card>

      {/* 时间显示 */}
      <div className={styles.timeDisplay}>
        <Text code className={styles.currentTime}>
          {formatTime(timeline.currentTime)}
        </Text>
        <Text type="secondary">/</Text>
        <Text code>{formatTime(timeline.duration)}</Text>
      </div>

      {/* 时间轴滑块 */}
      <div className={styles.timelineSlider}>
        <Slider
          min={0}
          max={timeline.duration}
          step={0.1}
          value={timeline.currentTime}
          onChange={handleTimeChange}
          tooltip={{ formatter: (value) => formatTime(value || 0) }}
        />
      </div>

      {/* 轨道列表 */}
      <div className={styles.tracksContainer} ref={timelineRef}>
        {timeline.tracks.map(track => (
          <div key={track.id} className={styles.track}>
            {renderTrackHeader(track)}
            {renderTrackContent(track)}
          </div>
        ))}
      </div>

      {/* 选中片段信息 */}
      {selectedClip && (
        <Card size="small" title="片段信息" className={styles.clipInfo}>
          {timeline.tracks
            .flatMap(t => t.clips)
            .filter(c => c.id === selectedClip)
            .map(clip => (
              <Row key={clip.id} gutter={[16, 8]}>
                <Col span={12}>
                  <Text type="secondary">名称:</Text>
                  <div>{clip.name}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">时长:</Text>
                  <div>{formatTime(clip.endTime - clip.startTime)}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">开始时间:</Text>
                  <div>{formatTime(clip.startTime)}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">结束时间:</Text>
                  <div>{formatTime(clip.endTime)}</div>
                </Col>
              </Row>
            ))}
        </Card>
      )}
    </div>
  );
};

export default VideoTimeline;
