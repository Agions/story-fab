import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, 
  Space, 
  Tooltip, 
  Dropdown, 
  Slider,
  Divider,
  Input
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  DragOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ColumnWidthOutlined,
  SettingOutlined,
  DoubleRightOutlined
} from '@ant-design/icons';
import styles from './Timeline.module.less';

interface Track {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  clips: any[];
}

interface TimelineProps {
  currentTime: number;
  duration: number;
  tracks: Track[];
  onTimeUpdate: (time: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({ 
  currentTime, 
  duration, 
  tracks,
  onTimeUpdate
}) => {
  const [scale, setScale] = useState(100); // 时间轴缩放比例
  const [trackList, setTrackList] = useState<Track[]>(tracks || []);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const tracksContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [showTimeline, setShowTimeline] = useState<boolean>(true);
  
  // 时间格式化
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 计算时间轴宽度
  const timelineWidth = Math.max(2000, duration * scale); // 每秒100px
  
  // 计算播放头位置
  const playheadPosition = currentTime * scale;
  
  // 更新播放头位置
  useEffect(() => {
    if (playheadRef.current) {
      playheadRef.current.style.left = `${playheadPosition}px`;
    }
    
    // 自动滚动时间轴，确保播放头可见
    if (tracksContainerRef.current) {
      const container = tracksContainerRef.current;
      const playheadX = playheadPosition;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      
      // 如果播放头不在可视区域内，滚动到适当位置
      if (playheadX < scrollLeft || playheadX > scrollLeft + containerWidth - 50) {
        container.scrollLeft = playheadX - containerWidth / 2;
      }
    }
  }, [playheadPosition]);
  
  // 处理时间轴点击，跳转到指定时间
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tracksContainerRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left + tracksContainerRef.current.scrollLeft;
      const time = x / scale;
      
      if (time >= 0 && time <= duration) {
        onTimeUpdate(time);
      }
    }
  };
  
  // 处理播放头拖动
  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && tracksContainerRef.current && timelineRef.current) {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + tracksContainerRef.current.scrollLeft;
        const time = Math.max(0, Math.min(duration, x / scale));
        onTimeUpdate(time);
      }
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // 缩放时间轴
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 20, 300));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 20, 40));
  };
  
  // 重置缩放
  const handleResetZoom = () => {
    setScale(100);
  };
  
  // 添加轨道
  const addTrack = (type: 'video' | 'audio' | 'text') => {
    const newTrack: Track = {
      id: `${type}-${trackList.length + 1}`,
      name: `${type === 'video' ? '视频' : type === 'audio' ? '音频' : '文本'}轨道 ${trackList.length + 1}`,
      type,
      clips: []
    };
    
    setTrackList([...trackList, newTrack]);
  };
  
  // 渲染时间刻度
  const renderTimeRuler = () => {
    const rulerMarks = [];
    const smallMarksPerSecond = 4; // 每秒4个小刻度
    const totalSmallMarks = Math.ceil(duration * smallMarksPerSecond);
    const smallMarkInterval = scale / smallMarksPerSecond;
    
    for (let i = 0; i <= totalSmallMarks; i++) {
      const isSecondMark = i % smallMarksPerSecond === 0;
      const time = i / smallMarksPerSecond;
      
      rulerMarks.push(
        <div
          key={i}
          className={`${styles.rulerMark} ${isSecondMark ? styles.secondMark : ''}`}
          style={{ left: `${i * smallMarkInterval}px` }}
        >
          {isSecondMark && (
            <div className={styles.timeLabel}>{formatTime(time)}</div>
          )}
        </div>
      );
    }
    
    return (
      <div className={styles.timeRuler}>
        {rulerMarks}
      </div>
    );
  };
  
  // 渲染轨道
  const renderTracks = () => {
    return trackList.map(track => (
      <div 
        key={track.id} 
        className={`${styles.track} ${styles[track.type]}`}
      >
        <div className={styles.trackHeader}>
          <div className={styles.trackName}>
            {track.name}
          </div>
          <div className={styles.trackType}>
            {track.type === 'video' ? '视频' : track.type === 'audio' ? '音频' : '文本'}
          </div>
          <Tooltip title="删除轨道">
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              className={styles.trackAction}
              onClick={() => setTrackList(trackList.filter(t => t.id !== track.id))}
            />
          </Tooltip>
        </div>
        <div 
          className={styles.trackContent}
          style={{ width: `${timelineWidth}px` }}
        >
          {/* 这里将来会渲染轨道上的片段 */}
        </div>
      </div>
    ));
  };
  
  return (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineToolbar}>
        <div className={styles.timelineControls}>
          <Tooltip title="添加视频轨道">
            <Button 
              type="text" 
              icon={<PlusOutlined />} 
              onClick={() => addTrack('video')}
            >
              视频轨道
            </Button>
          </Tooltip>
          <Tooltip title="添加音频轨道">
            <Button 
              type="text" 
              icon={<PlusOutlined />} 
              onClick={() => addTrack('audio')}
            >
              音频轨道
            </Button>
          </Tooltip>
          <Tooltip title="添加文本轨道">
            <Button 
              type="text" 
              icon={<PlusOutlined />} 
              onClick={() => addTrack('text')}
            >
              文本轨道
            </Button>
          </Tooltip>
        </div>
        
        <div className={styles.zoomControls}>
          <Tooltip title="缩小">
            <Button 
              type="text" 
              icon={<ZoomOutOutlined />} 
              onClick={handleZoomOut}
              disabled={scale <= 40}
            />
          </Tooltip>
          <Tooltip title="重置">
            <Button 
              type="text" 
              icon={<ColumnWidthOutlined />} 
              onClick={handleResetZoom}
              disabled={scale === 100}
            />
          </Tooltip>
          <Tooltip title="放大">
            <Button 
              type="text" 
              icon={<ZoomInOutlined />} 
              onClick={handleZoomIn}
              disabled={scale >= 300}
            />
          </Tooltip>
          <div className={styles.scaleIndicator}>{scale}%</div>
        </div>
      </div>
      
      <div 
        className={styles.timelineContent}
        ref={tracksContainerRef}
      >
        <div className={styles.timelineFixed}>
          <div className={styles.timelineHeader}>
            <Button 
              type="text" 
              icon={showTimeline ? <DoubleRightOutlined /> : <DoubleRightOutlined style={{ transform: 'rotate(180deg)' }} />}
              onClick={() => setShowTimeline(!showTimeline)}
              className={styles.toggleButton}
            />
          </div>
          <div className={styles.trackHeaders}>
            {trackList.map(track => (
              <div key={track.id} className={styles.trackHeaderPlaceholder}>
                {/* 轨道标题的占位，用于保持对齐 */}
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.timelineScrollable}>
          <div 
            className={styles.timelineRulerContainer}
            style={{ width: `${timelineWidth}px` }}
          >
            {renderTimeRuler()}
          </div>
          
          <div 
            className={styles.tracksArea}
            ref={timelineRef}
            onClick={handleTimelineClick}
          >
            <div className={styles.tracksContainer}>
              {renderTracks()}
            </div>
            
            <div 
              className={styles.playhead} 
              ref={playheadRef}
              style={{ left: `${playheadPosition}px` }}
              onMouseDown={handlePlayheadMouseDown}
            >
              <div className={styles.playheadHead} />
              <div className={styles.playheadLine} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline; 