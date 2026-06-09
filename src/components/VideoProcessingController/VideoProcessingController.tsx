import { logger } from '@/shared/utils/logging';
import React, { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Scissors,
} from 'lucide-react';
import { tauri } from '@/core/tauri';
import { notify } from '@/shared';
import type { VideoSegment } from '@/core/types';
import { BasicSettings, EffectsSettings, BatchProcessing } from '@/components/VideoProcessingController/mods';
import {
  QUALITY_OPTIONS,
  FORMAT_OPTIONS,
  AUDIO_PROCESS_OPTIONS,
  TRANSITION_OPTIONS,
  type QualityValue,
  type FormatValue,
  type TransitionValue,
  type AudioProcessValue,
} from '@/components/VideoProcessingController/constants';
import styles from '@/components/VideoProcessingController/VideoProcessingController.module.less';

interface VideoProcessingControllerProps {
  videoPath: string;
  segments: Array<{ start: number; end: number; type?: string; content?: string }>;
  onProcessingComplete?: (outputPath: string) => void;
  defaultQuality?: (typeof QUALITY_OPTIONS)[number]['value'];
  defaultFormat?: (typeof FORMAT_OPTIONS)[number]['value'];
  defaultTransition?: (typeof TRANSITION_OPTIONS)[number]['value'];
  defaultAudioProcess?: (typeof AUDIO_PROCESS_OPTIONS)[number]['value'];
}

interface BatchItem {
  id: string;
  videoPath: string;
  segments: Array<{ start: number; end: number; type?: string; content?: string }>;
  name: string;
  completed: boolean;
}

interface CustomQualitySettings {
  resolution: string;
  bitrate: number;
  framerate: number;
  useHardwareAcceleration: boolean;
}

type SaveFilePicker = (options?: {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}) => Promise<{ name: string }>;

const calculateTotalDuration = (segments: Array<{ start: number; end: number }>): number => {
  return segments.reduce((total, segment) => total + (segment.end - segment.start), 0);
};

const VideoProcessingController: React.FC<VideoProcessingControllerProps> = ({
  videoPath,
  segments,
  onProcessingComplete,
  defaultQuality = 'medium',
  defaultFormat = 'mp4',
  defaultAudioProcess = 'original'
}) => {
  const [videoQuality, setVideoQuality] = useState<QualityValue>(defaultQuality as QualityValue);
  const [exportFormat, setExportFormat] = useState<FormatValue>(defaultFormat as FormatValue);
  const [transitionType, setTransitionType] = useState<TransitionValue>('fade');
  const [transitionDuration, setTransitionDuration] = useState(1);
  const [audioProcess, setAudioProcess] = useState<AudioProcessValue>(defaultAudioProcess as AudioProcessValue);
  const [audioVolume, setAudioVolume] = useState(100);
  const [useSubtitles, setUseSubtitles] = useState(true);

  const [processingBatch, setProcessingBatch] = useState(false);
  const [currentBatchItem, setCurrentBatchItem] = useState(0);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  const [customSettings, setCustomSettings] = useState<CustomQualitySettings>({
    resolution: '1920x1080',
    bitrate: 4000,
    framerate: 30,
    useHardwareAcceleration: true
  });

  useEffect(() => {
    const cleanup = () => {};
    return cleanup;
  }, []);

  const addBatchItem = useCallback(() => {
    if (!segments || segments.length === 0) {
      notify.warning('没有可用的脚本片段');
      return;
    }
    const newBatchItem: BatchItem = {
      id: Date.now().toString(),
      videoPath,
      segments: [...segments],
      name: `批处理 ${batchItems.length + 1}`,
      completed: false
    };
    setBatchItems(prev => [...prev, newBatchItem]);
  }, [segments, batchItems.length, videoPath]);

  const removeBatchItem = useCallback((id: string) => {
    setBatchItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateCustomSettings = useCallback((patch: Partial<CustomQualitySettings>) => {
    setCustomSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const processVideo = useCallback(async (segmentsToProcess: VideoSegment[], itemName?: string, itemVideoPath?: string): Promise<string> => {
    // Use the per-batch video path if provided (multi-video batch), otherwise fall back to the current video
    const inputPath = itemVideoPath ?? videoPath;
    try {
      const fileName = itemName ?
        `${itemName.replace(/[^\w\s-]/gi, '')}_${new Date().toISOString().split('T')[0]}` :
        `剪辑_${new Date().toISOString().split('T')[0]}`;

      const showSaveFilePicker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
      if (typeof showSaveFilePicker !== 'function') {
        throw new Error('当前环境不支持文件选择器');
      }

      const saveHandle = await showSaveFilePicker({
        suggestedName: `${fileName}.${exportFormat}`,
        types: [{
          description: '视频文件',
          accept: { 'video/*': [`.${exportFormat}`] }
        }]
      });
      const outputPath = saveHandle.name;

      const audioParams = { volume: audioVolume / 100, process: audioProcess !== 'none' };

      await tauri.cutVideo({
        inputPath,
        outputPath,
        segments: segmentsToProcess.map((s) => ({ start: s.startTime, end: s.endTime })),
        quality: videoQuality,
        format: exportFormat,
        transition: transitionType,
        transitionDuration: transitionDuration,
        audioParams,
        addSubtitles: useSubtitles,
      });

      if (onProcessingComplete) {
        onProcessingComplete(outputPath);
      }
      return outputPath;
    } catch (error) {
      logger.error('视频处理失败:', { error });
      notify.error(error, '视频处理失败');
      throw error;
    }
  }, [exportFormat, videoQuality, audioVolume, audioProcess, transitionType, transitionDuration, useSubtitles, videoPath, onProcessingComplete]);

  const startBatchProcessing = useCallback(async () => {
    if (batchItems.length === 0) {
      notify.warning('请先添加批处理项目');
      return;
    }

    setProcessingBatch(true);
    setCurrentBatchItem(0);
    setBatchProgress(0);

    const newOutputPaths: string[] = [];

    for (let i = 0; i < batchItems.length; i++) {
      setCurrentBatchItem(i);
      const item = batchItems[i];

      try {
        const segmentsToProcess: VideoSegment[] = item.segments.map((s, i) => ({
          id: `batch-${item.id}-${i}`,
          sourceIndex: i,
          startTime: s.start,
          endTime: s.end,
          duration: s.end - s.start,
        }));
        const outputPath = await processVideo(segmentsToProcess, item.name, item.videoPath);
        newOutputPaths.push(outputPath);

        setBatchItems(prevItems => prevItems.map((prevItem, index) =>
          index === i ? { ...prevItem, completed: true } : prevItem
        ));

        setBatchProgress(((i + 1) / batchItems.length) * 100);
      } catch (error) {
        logger.error(`处理批次项 ${i + 1} 失败:`, { error });
        notify.error(error, `处理 "${item.name}" 失败`);
        continue;
      }
    }

    setProcessingBatch(false);
    notify.success(`完成批量处理，共 ${newOutputPaths.length} 个文件`);
  }, [batchItems, processVideo]);

  const handleProcessCurrentVideo = useCallback(async () => {
    if (!segments || segments.length === 0) {
      notify.warning('没有可用的脚本片段');
      return;
    }

    try {
      const segmentsToProcess: VideoSegment[] = segments.map((s, i) => ({
        id: `seg-${i}`,
        sourceIndex: i,
        startTime: s.start,
        endTime: s.end,
        duration: s.end - s.start,
      }));
      await processVideo(segmentsToProcess);
      notify.success('视频处理完成');
    } catch (error) {
      notify.error(error as Parameters<typeof notify.error>[0], '视频处理失败');
    }
  }, [segments, processVideo]);

  const handleAudioVolumeChange = (value: number | readonly number[]) => {
    const resolvedValue = Array.isArray(value) ? value[0] : value;
    setAudioVolume(resolvedValue);
  };

  const [activePanels, setActivePanels] = useState<string[]>(['basic']);

  const togglePanel = (key: string) => {
    setActivePanels(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  return (
    <div className={styles.container}>
      <Card className={styles.controllerCard}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={18} />
            视频处理控制器
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">

          {/* 基本设置 */}
          <details className={styles.panel} open={activePanels.includes('basic')}>
            <summary
              className="cursor-pointer p-2 font-medium flex items-center justify-between rounded-md hover:bg-accent"
              onClick={(e) => { e.preventDefault(); togglePanel('basic'); }}
            >
              基本设置
              <span className="text-muted-foreground">{activePanels.includes('basic') ? '▼' : '▶'}</span>
            </summary>
            {activePanels.includes('basic') && (
              <div className="p-2">
                <BasicSettings
                  videoQuality={videoQuality}
                  exportFormat={exportFormat}
                  customSettings={customSettings}
                  onQualityChange={(v) => setVideoQuality(v as QualityValue)}
                  onFormatChange={(v) => setExportFormat(v as FormatValue)}
                  onCustomSettingsChange={updateCustomSettings}
                />
              </div>
            )}
          </details>

          {/* 转场和音频效果 */}
          <details className={styles.panel} open={activePanels.includes('effects')}>
            <summary
              className="cursor-pointer p-2 font-medium flex items-center justify-between rounded-md hover:bg-accent"
              onClick={(e) => { e.preventDefault(); togglePanel('effects'); }}
            >
              转场和音频效果
              <span className="text-muted-foreground">{activePanels.includes('effects') ? '▼' : '▶'}</span>
            </summary>
            {activePanels.includes('effects') && (
              <div className="p-2">
                <EffectsSettings
                  transitionType={transitionType}
                  transitionDuration={transitionDuration}
                  audioProcess={audioProcess}
                  audioVolume={audioVolume}
                  useSubtitles={useSubtitles}
                  onTransitionChange={(v) => setTransitionType(v as TransitionValue)}
                  onTransitionDurationChange={setTransitionDuration}
                  onAudioProcessChange={(v) => setAudioProcess(v as AudioProcessValue)}
                  onAudioVolumeChange={handleAudioVolumeChange}
                  onSubtitlesChange={setUseSubtitles}
                />
              </div>
            )}
          </details>

          {/* 批量处理 */}
          <details className={styles.panel} open={activePanels.includes('batch')}>
            <summary
              className="cursor-pointer p-2 font-medium flex items-center justify-between rounded-md hover:bg-accent"
              onClick={(e) => { e.preventDefault(); togglePanel('batch'); }}
            >
              批量处理
              <span className="text-muted-foreground">{activePanels.includes('batch') ? '▼' : '▶'}</span>
            </summary>
            {activePanels.includes('batch') && (
              <div className="p-2">
                <BatchProcessing
                  batchItems={batchItems}
                  processingBatch={processingBatch}
                  currentBatchItem={currentBatchItem}
                  batchProgress={batchProgress}
                  onAddBatchItem={addBatchItem}
                  onRemoveBatchItem={removeBatchItem}
                  onStartBatchProcessing={startBatchProcessing}
                  calculateTotalDuration={calculateTotalDuration as (segments: Array<{ start?: number; end?: number }>) => number}
                />
              </div>
            )}
          </details>

          <div className={styles.actionButtons}>
            <Button
              variant="default"
              onClick={handleProcessCurrentVideo}
            >
              <Scissors size={14} className="mr-1" />
              处理当前视频
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(VideoProcessingController);
