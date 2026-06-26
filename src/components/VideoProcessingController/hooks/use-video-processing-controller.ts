/**
 * useVideoProcessingController hook — 14 useState 集中化入口
 * 来源: refactor/video-processing-usereducer (v3.4 §A2 范式)
 */
import { useReducer, useMemo, useCallback } from 'react';
import { notify } from '@/shared';
import { logger } from '@/shared/utils/logging';
import { tauri } from '@/core/tauri';
import { AppError } from '@/core/errors';
import type { VideoSegment } from '@/types';
import {
  initialVideoProcessingState,
  videoProcessingReducer,
  type VideoProcessingAction,
  type VideoProcessingState,
  type Updater,
  type CustomQualitySettings,
} from './use-video-processing-controller.reducer';

type Setter<K extends keyof VideoProcessingState> = (
  updater: Updater<VideoProcessingState[K]>,
) => void;
type VideoProcessingSetters = { [K in keyof VideoProcessingState]: Setter<K> };

const makeSetters = (
  dispatch: React.Dispatch<VideoProcessingAction>,
): VideoProcessingSetters => {
  return Object.fromEntries(
    (Object.keys(initialVideoProcessingState) as (keyof VideoProcessingState)[]).map(
      (key) => [
        key,
        (updater: Updater<VideoProcessingState[typeof key]>) =>
          dispatch({ type: 'update', key, updater: updater as Updater<unknown> }),
      ],
    ),
  ) as VideoProcessingSetters;
};

interface UseVideoProcessingControllerArgs {
  videoPath: string;
  segments: Array<{ start: number; end: number; type?: string; content?: string }>;
  onProcessingComplete?: (outputPath: string) => void;
}

export const useVideoProcessingController = ({
  videoPath,
  segments,
  onProcessingComplete,
}: UseVideoProcessingControllerArgs) => {
  const [state, dispatch] = useReducer(videoProcessingReducer, initialVideoProcessingState);
  const setters = useMemo(() => makeSetters(dispatch), []);
  const {
    videoQuality, exportFormat, transitionType, transitionDuration,
    audioProcess, audioVolume, useSubtitles,
    processingBatch, currentBatchItem, batchProgress, batchItems,
    customSettings, activePanels,
  } = state;

  const addBatchItem = useCallback(() => {
    if (!segments || segments.length === 0) {
      notify.warning('没有可用的脚本片段');
      return;
    }
    setters.batchItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        videoPath,
        segments: [...segments],
        name: `批处理 ${batchItems.length + 1}`,
        completed: false,
      },
    ]);
  }, [segments, batchItems.length, videoPath, setters]);

  const removeBatchItem = useCallback((id: string) => {
    setters.batchItems((prev) => prev.filter((item) => item.id !== id));
  }, [setters]);

  const updateCustomSettings = useCallback((patch: Partial<CustomQualitySettings>) => {
    setters.customSettings((prev) => ({ ...prev, ...patch }));
  }, [setters]);

  const processVideo = useCallback(
    async (
      segmentsToProcess: VideoSegment[],
      itemName?: string,
      itemVideoPath?: string,
    ): Promise<string> => {
      const inputPath = itemVideoPath ?? videoPath;
      try {
        const fileName = itemName
          ? `${itemName.replace(/[^\w\s-]/gi, '')}_${new Date().toISOString().split('T')[0]}`
          : `剪辑_${new Date().toISOString().split('T')[0]}`;

        type SaveFilePicker = (options?: {
          suggestedName?: string;
          types?: Array<{
            description?: string;
            accept: Record<string, string[]>;
          }>;
        }) => Promise<{ name: string }>;
        const showSaveFilePicker = (
          window as Window & { showSaveFilePicker?: SaveFilePicker }
        ).showSaveFilePicker;
        if (typeof showSaveFilePicker !== 'function') {
          throw new AppError('APP_BROWSER_UNSUPPORTED', '当前环境不支持文件选择器', {
            userMessage: '当前浏览器不支持文件选择器',
          });
        }

        const saveHandle = await showSaveFilePicker({
          suggestedName: `${fileName}.${exportFormat}`,
          types: [
            {
              description: '视频文件',
              accept: { 'video/*': [`.${exportFormat}`] },
            },
          ],
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
          transitionDuration,
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
    },
    [
      videoPath, exportFormat, videoQuality, audioVolume, audioProcess,
      transitionType, transitionDuration, useSubtitles, onProcessingComplete,
    ],
  );

  const startBatchProcessing = useCallback(async () => {
    if (batchItems.length === 0) {
      notify.warning('请先添加批处理项目');
      return;
    }

    setters.processingBatch(true);
    setters.currentBatchItem(0);
    setters.batchProgress(0);

    const newOutputPaths: string[] = [];

    for (let i = 0; i < batchItems.length; i++) {
      setters.currentBatchItem(i);
      const item = batchItems[i];

      try {
        const segmentsToProcess: VideoSegment[] = item.segments.map((s, idx) => ({
          id: `batch-${item.id}-${idx}`,
          sourceIndex: idx,
          startTime: s.start,
          endTime: s.end,
          duration: s.end - s.start,
        }));
        const outputPath = await processVideo(segmentsToProcess, item.name, item.videoPath);
        newOutputPaths.push(outputPath);

        setters.batchItems((prevItems) =>
          prevItems.map((prevItem, index) =>
            index === i ? { ...prevItem, completed: true } : prevItem,
          ),
        );

        setters.batchProgress(((i + 1) / batchItems.length) * 100);
      } catch (error) {
        logger.error(`处理批次项 ${i + 1} 失败:`, { error });
        notify.error(error, `处理 "${item.name}" 失败`);
        continue;
      }
    }

    setters.processingBatch(false);
    notify.success(`完成批量处理，共 ${newOutputPaths.length} 个文件`);
  }, [batchItems, processVideo, setters]);

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
    setters.audioVolume(resolvedValue);
  };

  const togglePanel = (key: string) => {
    setters.activePanels((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  return {
    // state (read)
    videoQuality, exportFormat, transitionType, transitionDuration,
    audioProcess, audioVolume, useSubtitles,
    processingBatch, currentBatchItem, batchProgress, batchItems,
    customSettings, activePanels,
    // setters (write, 1:1 兼容原 hook API)
    setVideoQuality: setters.videoQuality,
    setExportFormat: setters.exportFormat,
    setTransitionType: setters.transitionType,
    setTransitionDuration: setters.transitionDuration,
    setAudioProcess: setters.audioProcess,
    setUseSubtitles: setters.useSubtitles,
    // operations
    addBatchItem, removeBatchItem, updateCustomSettings,
    processVideo, startBatchProcessing, handleProcessCurrentVideo,
    handleAudioVolumeChange, togglePanel,
  };
};
