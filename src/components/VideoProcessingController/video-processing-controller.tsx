import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Scissors,
} from 'lucide-react';
import { BasicSettings, EffectsSettings, BatchProcessing } from '@/components/VideoProcessingController/mods';
import {
  QUALITY_OPTIONS,
  FORMAT_OPTIONS,
  type QualityValue,
  type FormatValue,
  type TransitionValue,
  type AudioProcessValue,
} from '@/components/VideoProcessingController/constants';
import { useVideoProcessingController } from './hooks/use-video-processing-controller';
import styles from '@/components/VideoProcessingController/VideoProcessingController.module.less';

interface VideoProcessingControllerProps {
  videoPath: string;
  segments: Array<{ start: number; end: number; type?: string; content?: string }>;
  onProcessingComplete?: (outputPath: string) => void;
  defaultQuality?: (typeof QUALITY_OPTIONS)[number]['value'];
  defaultFormat?: (typeof FORMAT_OPTIONS)[number]['value'];
}

const calculateTotalDuration = (segments: Array<{ start: number; end: number }>): number => {
  return segments.reduce((total, segment) => total + (segment.end - segment.start), 0);
};

const VideoProcessingController: React.FC<VideoProcessingControllerProps> = ({
  videoPath,
  segments,
  onProcessingComplete,
  defaultQuality = 'medium',
  defaultFormat = 'mp4',
}) => {
  const {
    videoQuality, exportFormat, transitionType, transitionDuration,
    audioProcess, audioVolume, useSubtitles,
    processingBatch, currentBatchItem, batchProgress, batchItems,
    customSettings, activePanels,
    setVideoQuality, setExportFormat, setTransitionType, setTransitionDuration,
    setAudioProcess, setUseSubtitles,
    addBatchItem, removeBatchItem, updateCustomSettings,
    startBatchProcessing, handleProcessCurrentVideo,
    handleAudioVolumeChange, togglePanel,
  } = useVideoProcessingController({ videoPath, segments, onProcessingComplete });

  // Apply default quality/format if provided (one-time init effect)
  React.useEffect(() => {
    if (defaultQuality) setVideoQuality(defaultQuality as QualityValue);
    if (defaultFormat) setExportFormat(defaultFormat as FormatValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
