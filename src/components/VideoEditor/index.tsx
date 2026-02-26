import React, { useState, useCallback, useEffect, memo } from 'react';
import { Card, Typography, message } from 'antd';
import { invoke } from '@tauri-apps/api/tauri';
import { save } from '@tauri-apps/api/dialog';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { ScriptSegment } from '@/types';

import VideoPlayer from './VideoPlayer';
import Timeline from './Timeline';
import SegmentDetails from './SegmentDetails';
import EditorControls from './EditorControls';
import ExportSettings, { ExportSettingsState, TransitionType } from './ExportSettings';
import PreviewModal from './PreviewModal';

import styles from './VideoEditor.module.less';

const { Title } = Typography;

// 全局变量存储视频时长，用于拖拽边界计算
let globalVideoDuration = 0;

interface VideoEditorProps {
  videoPath: string;
  segments: ScriptSegment[];
  onEditComplete?: (outputPath: string | ScriptSegment[]) => void;
}

const VideoEditor: React.FC<VideoEditorProps> = ({ videoPath, segments, onEditComplete }) => {
  // 播放器状态
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // 处理状态
  const [processing, setProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);

  // 片段状态
  const [selectedSegment, setSelectedSegment] = useState<ScriptSegment | null>(null);
  const [editedSegments, setEditedSegments] = useState<ScriptSegment[]>(segments);

  // 导出设置状态
  const [exportSettings, setExportSettings] = useState<ExportSettingsState>({
    videoQuality: 'medium',
    exportFormat: 'mp4',
    transitionType: 'fade',
    transitionDuration: 1,
    audioVolume: 100,
    useSubtitles: true,
  });
  const [settingsTab, setSettingsTab] = useState('general');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // 预览状态
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewSegment, setPreviewSegment] = useState<ScriptSegment | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'start' | 'end' | null>(null);
  const [dragSegmentId, setDragSegmentId] = useState<string | null>(null);

  // 同步传入的 segments
  useEffect(() => {
    setEditedSegments(segments);
  }, [segments]);

  // 更新全局视频时长
  useEffect(() => {
    globalVideoDuration = duration;
  }, [duration]);

  // 清理临时文件
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.includes('temp')) {
        invoke('clean_temp_file', { path: previewUrl }).catch(console.error);
      }
    };
  }, [previewUrl]);

  // 处理时长变化
  const handleDurationChange = useCallback((newDuration: number) => {
    setDuration(newDuration);
  }, []);

  // 处理时间更新
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // 处理播放状态变化
  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  // 点击片段
  const handleSegmentClick = useCallback((segment: ScriptSegment) => {
    setCurrentTime(segment.startTime);
    setSelectedSegment(segment);
  }, []);

  // 预览片段
  const handlePreviewSegment = useCallback(async (segment: ScriptSegment) => {
    setPreviewLoading(true);
    setPreviewSegment(segment);
    setShowPreviewModal(true);

    try {
      const tempPath = await invoke<string>('generate_preview', {
        inputPath: videoPath,
        segment: {
          start: segment.startTime,
          end: segment.endTime,
          type: segment.type,
        },
        transition: exportSettings.transitionType,
        transitionDuration: exportSettings.transitionDuration,
        volume: exportSettings.audioVolume / 100,
        addSubtitles: exportSettings.useSubtitles,
      });

      const fileUrl = convertFileSrc(tempPath);
      setPreviewUrl(fileUrl);
    } catch (error) {
      console.error('生成预览失败:', error);
      message.error('生成预览失败: ' + error);
    } finally {
      setPreviewLoading(false);
    }
  }, [videoPath, exportSettings]);

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setShowPreviewModal(false);
    setPreviewUrl('');
    setPreviewSegment(null);
  }, []);

  // 显示导出设置
  const handleShowSettings = useCallback(() => {
    setShowSettingsModal(true);
  }, []);

  // 处理导出设置变化
  const handleSettingsChange = useCallback((changes: Partial<ExportSettingsState>) => {
    setExportSettings(prev => ({ ...prev, ...changes }));
  }, []);

  // 处理视频导出
  const handleExportVideo = useCallback(async () => {
    setShowSettingsModal(false);

    if (!editedSegments || editedSegments.length === 0) {
      message.warning('没有可用的脚本片段来剪辑视频');
      return;
    }

    try {
      const savePath = await save({
        defaultPath: `剪辑_${new Date().toISOString().split('T')[0]}.${exportSettings.exportFormat}`,
        filters: [{ name: '视频文件', extensions: [exportSettings.exportFormat] }],
      });

      if (!savePath) return;

      setProcessing(true);
      setProcessProgress(0);

      const unlistenHandler = await (window as any).__TAURI__.event.listen(
        'cut_progress',
        (event: { payload: number }) => {
          setProcessProgress(Math.round(event.payload * 100));
        }
      );

      await invoke('cut_video', {
        inputPath: videoPath,
        outputPath: savePath,
        segments: editedSegments.map(s => ({
          start: s.startTime,
          end: s.endTime,
          type: s.type,
          content: s.content,
        })),
        quality: exportSettings.videoQuality,
        format: exportSettings.exportFormat,
        transition: exportSettings.transitionType,
        transitionDuration: exportSettings.transitionDuration,
        volume: exportSettings.audioVolume / 100,
        addSubtitles: exportSettings.useSubtitles,
      }).catch(error => {
        console.error('视频剪辑失败:', error);
        message.error('视频剪辑失败: ' + error);
        setProcessing(false);
        return null;
      });

      unlistenHandler();

      if (onEditComplete) {
        onEditComplete(savePath);
      }

      message.success('视频剪辑完成');
    } catch (error) {
      console.error('导出视频失败:', error);
      message.error('导出视频失败');
    } finally {
      setProcessing(false);
    }
  }, [editedSegments, exportSettings, videoPath, onEditComplete]);

  // 保存片段
  const handleSaveSegments = useCallback(() => {
    if (onEditComplete) {
      onEditComplete(editedSegments);
    }
    message.success('片段时间已更新');
  }, [editedSegments, onEditComplete]);

  // 计算时间位置
  const getTimeFromPosition = useCallback((clientX: number): number => {
    const timelineEl = document.querySelector(`.${styles.timelineContainer}`);
    if (!timelineEl) return 0;

    const rect = timelineEl.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));

    return percentage * duration;
  }, [duration]);

  // 拖拽移动
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragSegmentId || !dragType) return;

    const currentTime = getTimeFromPosition(e.clientX);

    setEditedSegments(prev =>
      prev.map(segment => {
        if (segment.id !== dragSegmentId) return segment;

        const original = segment;
        let newStart = original.startTime;
        let newEnd = original.endTime;

        switch (dragType) {
          case 'move': {
            const segmentDuration = original.endTime - original.startTime;
            newStart = currentTime;
            newEnd = currentTime + segmentDuration;

            if (newStart < 0) {
              newStart = 0;
              newEnd = segmentDuration;
            }
            if (newEnd > globalVideoDuration) {
              newEnd = globalVideoDuration;
              newStart = newEnd - segmentDuration;
            }
            break;
          }
          case 'start': {
            newStart = Math.min(currentTime, original.endTime - 0.5);
            newStart = Math.max(0, newStart);
            break;
          }
          case 'end': {
            newEnd = Math.max(currentTime, original.startTime + 0.5);
            newEnd = Math.min(duration, newEnd);
            break;
          }
        }

        return { ...segment, startTime: newStart, endTime: newEnd };
      })
    );
  }, [isDragging, dragSegmentId, dragType, getTimeFromPosition, duration]);

  // 结束拖拽
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    setDragSegmentId(null);

    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  // 开始拖拽
  const handleDragStart = useCallback((segmentId: string, type: 'move' | 'start' | 'end', e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setDragSegmentId(segmentId);

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [handleDragMove, handleDragEnd]);

  return (
    <div className={styles.editorContainer}>
      <Title level={4}>视频混剪编辑器</Title>

      <Card>
        <VideoPlayer
          videoPath={videoPath}
          currentTime={currentTime}
          duration={duration}
          isPlaying={isPlaying}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={handleDurationChange}
          onPlayStateChange={handlePlayStateChange}
        />

        <Timeline
          segments={editedSegments}
          duration={duration}
          onSegmentClick={handleSegmentClick}
          onDragStart={handleDragStart}
        />

        {selectedSegment && (
          <SegmentDetails
            segment={selectedSegment}
            onPreview={handlePreviewSegment}
          />
        )}

        <EditorControls
          processing={processing}
          processProgress={processProgress}
          hasSegments={editedSegments.length > 0}
          onExport={handleShowSettings}
          onSettings={handleShowSettings}
          onSave={handleSaveSegments}
        />
      </Card>

      <ExportSettings
        visible={showSettingsModal}
        settings={exportSettings}
        activeTab={settingsTab}
        onTabChange={setSettingsTab}
        onSettingsChange={handleSettingsChange}
        onOk={handleExportVideo}
        onCancel={() => setShowSettingsModal(false)}
      />

      <PreviewModal
        visible={showPreviewModal}
        loading={previewLoading}
        previewUrl={previewUrl}
        previewSegment={previewSegment}
        onClose={handleClosePreview}
      />
    </div>
  );
};

export default memo(VideoEditor);
