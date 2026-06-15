/**
 * useVideoEditorPage hook — 15 useState 集中化入口
 * 来源: refactor/video-editor-page-usereducer (v3.4 §A2 范式)
 */
import { useReducer, useMemo, useCallback, useRef, useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { save } from '@tauri-apps/plugin-dialog';
import { convertFileSrc } from '@tauri-apps/api/core';
import { ScriptSegment } from '@/types';
import { notify } from '@/shared';
import { logger } from '@/shared/utils/logging';
import { tauri } from '@/core/tauri/TauriBridge';
import type { ExportSettingsState } from '../ExportSettings';
import styles from '@/components/VideoEditor/VideoEditor.module.less';
import {
  initialVideoEditorPageState,
  videoEditorPageReducer,
  type VideoEditorPageAction,
  type VideoEditorPageState,
  type Updater,
} from './useVideoEditorPage.reducer';

type Setter<K extends keyof VideoEditorPageState> = (
  updater: Updater<VideoEditorPageState[K]>,
) => void;
type VideoEditorPageSetters = { [K in keyof VideoEditorPageState]: Setter<K> };

const makeSetters = (
  dispatch: React.Dispatch<VideoEditorPageAction>,
): VideoEditorPageSetters => {
  return Object.fromEntries(
    (Object.keys(initialVideoEditorPageState) as (keyof VideoEditorPageState)[]).map(
      (key) => [
        key,
        (updater: Updater<VideoEditorPageState[typeof key]>) =>
          dispatch({ type: 'update', key, updater: updater as Updater<unknown> }),
      ],
    ),
  ) as VideoEditorPageSetters;
};

interface UseVideoEditorPageArgs {
  videoPath: string;
  segments: ScriptSegment[];
  onEditComplete?: (outputPath: string | ScriptSegment[]) => void;
}

// 全局变量存储视频时长，用于拖拽边界计算
let globalVideoDuration = 0;

export const useVideoEditorPage = ({
  videoPath,
  segments,
  onEditComplete,
}: UseVideoEditorPageArgs) => {
  const [state, dispatch] = useReducer(videoEditorPageReducer, initialVideoEditorPageState);
  const setters = useMemo(() => makeSetters(dispatch), []);
  const {
    currentTime, duration, isPlaying,
    processing, processProgress,
    selectedSegment, editedSegments,
    exportSettings, settingsTab, showSettingsModal,
    showPreviewModal, previewSegment, previewLoading, previewUrl,
    isDragging, dragType, dragSegmentId,
  } = state;

  // 拖拽状态用 ref 存储，避免 useCallback 依赖导致重新绑定
  const dragStateRef = useRef({
    isDragging: false,
    dragSegmentId: null as string | null,
    dragType: null as 'move' | 'start' | 'end' | null,
    duration: 0,
  });

  // 同步 dragStateRef
  useEffect(() => {
    dragStateRef.current = { isDragging, dragSegmentId, dragType, duration };
  }, [isDragging, dragSegmentId, dragType, duration]);

  // 同步传入的 segments
  useEffect(() => {
    setters.editedSegments(segments);
  }, [segments, setters]);

  // 更新全局视频时长
  useEffect(() => {
    globalVideoDuration = duration;
  }, [duration]);

  // 清理临时文件
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.includes('temp')) {
        tauri.cleanTempFile(previewUrl).catch((e) =>
          logger.error('clean_temp_file error:', { error: e }),
        );
      }
    };
  }, [previewUrl]);

  // 处理时间更新
  const handleTimeUpdate = useCallback(
    (time: number) => {
      setters.currentTime(time);
    },
    [setters],
  );

  // 点击片段
  const handleSegmentClick = useCallback(
    (segment: ScriptSegment) => {
      setters.currentTime(segment.startTime);
      setters.selectedSegment(segment);
    },
    [setters],
  );

  // 预览片段
  const handlePreviewSegment = useCallback(
    async (segment: ScriptSegment) => {
      setters.previewLoading(true);
      setters.previewSegment(segment);
      setters.showPreviewModal(true);

      try {
        const tempPath = await tauri.generatePreview({
          inputPath: videoPath,
          segment: {
            start: segment.startTime,
            end: segment.endTime,
          },
        });

        const fileUrl = convertFileSrc(tempPath);
        setters.previewUrl(fileUrl);
      } catch (error) {
        logger.error('生成预览失败:', { error });
        notify.error(error, '生成预览失败');
      } finally {
        setters.previewLoading(false);
      }
    },
    [videoPath, setters],
  );

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setters.showPreviewModal(false);
    setters.previewUrl('');
    setters.previewSegment(null);
  }, [setters]);

  // 显示导出设置
  const handleShowSettings = useCallback(() => {
    setters.showSettingsModal(true);
  }, [setters]);

  // 处理导出设置变化
  const handleSettingsChange = useCallback(
    (changes: Partial<ExportSettingsState>) => {
      setters.exportSettings((prev) => ({ ...prev, ...changes }));
    },
    [setters],
  );

  // 处理视频导出
  const handleExportVideo = useCallback(async () => {
    setters.showSettingsModal(false);

    if (!editedSegments || editedSegments.length === 0) {
      notify.warning('没有可用的脚本片段来剪辑视频');
      return;
    }

    try {
      const savePath = await save({
        defaultPath: `剪辑_${new Date().toISOString().split('T')[0]}.${exportSettings.exportFormat}`,
        filters: [{ name: '视频文件', extensions: [exportSettings.exportFormat] }],
      });

      if (!savePath) return;

      setters.processing(true);
      setters.processProgress(0);

      const unlistenHandler: UnlistenFn = await listen<number>(
        'cut_progress',
        (event) => {
          setters.processProgress(Math.round(event.payload * 100));
        },
      );

      await tauri.cutVideo({
        inputPath: videoPath,
        outputPath: savePath,
        segments: editedSegments.map((s) => ({
          start: s.startTime,
          end: s.endTime,
        })),
      });

      unlistenHandler();

      if (onEditComplete) {
        onEditComplete(savePath);
      }

      notify.success('视频剪辑完成');
    } catch (error) {
      logger.error('导出视频失败:', { error });
      notify.error(error, '导出视频失败');
    } finally {
      setters.processing(false);
    }
  }, [editedSegments, exportSettings, videoPath, onEditComplete, setters]);

  // 保存片段
  const handleSaveSegments = useCallback(() => {
    if (onEditComplete) {
      onEditComplete(editedSegments);
    }
    notify.success('片段时间已更新');
  }, [editedSegments, onEditComplete]);

  // 计算时间位置
  const getTimeFromPosition = useCallback(
    (clientX: number): number => {
      const timelineEl = document.querySelector(`.${styles.timelineContainer}`);
      if (!timelineEl) return 0;

      const rect = timelineEl.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, relativeX / rect.width));

      return percentage * duration;
    },
    [duration],
  );

  // 拖拽时间线 ref，避免 useCallback 依赖
  const timelineStateRef = useRef({ duration: 0 });
  useEffect(() => {
    timelineStateRef.current.duration = duration;
  }, [duration]);

  // 拖拽移动 — 从 ref 读取状态，避免闭包陷阱
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      const { isDragging, dragSegmentId, dragType } = dragStateRef.current;
      if (!isDragging || !dragSegmentId || !dragType) return;

      const timelineTime = getTimeFromPosition(e.clientX);
      const dur = timelineStateRef.current.duration;

      setters.editedSegments((prev) =>
        prev.map((segment) => {
          if (segment.id !== dragSegmentId) return segment;

          const original = segment;
          let newStart = original.startTime;
          let newEnd = original.endTime;

          switch (dragType) {
            case 'move': {
              const segmentDuration = original.endTime - original.startTime;
              newStart = timelineTime;
              newEnd = timelineTime + segmentDuration;

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
              newStart = Math.min(timelineTime, original.endTime - 0.5);
              newStart = Math.max(0, newStart);
              break;
            }
            case 'end': {
              newEnd = Math.max(timelineTime, original.startTime + 0.5);
              newEnd = Math.min(dur, newEnd);
              break;
            }
          }

          return { ...segment, startTime: newStart, endTime: newEnd };
        }),
      );
    },
    [getTimeFromPosition, setters],
  );

  // 结束拖拽 — 重置状态
  const handleDragEnd = useCallback(() => {
    setters.isDragging(false);
    setters.dragType(null);
    setters.dragSegmentId(null);

    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleDragMove, setters]);

  // 开始拖拽 — 稳定函数
  const handleDragStart = useCallback(
    (segmentId: string, type: 'move' | 'start' | 'end', e: React.MouseEvent) => {
      e.stopPropagation();
      setters.isDragging(true);
      setters.dragType(type);
      setters.dragSegmentId(segmentId);

      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [handleDragMove, handleDragEnd, setters],
  );

  return {
    // state (read)
    currentTime, duration, isPlaying,
    processing, processProgress,
    selectedSegment, editedSegments,
    exportSettings, settingsTab, showSettingsModal,
    showPreviewModal, previewSegment, previewLoading, previewUrl,
    isDragging, dragType, dragSegmentId,
    // setters (write, 1:1 兼容原 hook API)
    setCurrentTime: setters.currentTime,
    setDuration: setters.duration,
    setIsPlaying: setters.isPlaying,
    setSelectedSegment: setters.selectedSegment,
    setEditedSegments: setters.editedSegments,
    setSettingsTab: setters.settingsTab,
    setShowSettingsModal: setters.showSettingsModal,
    setShowPreviewModal: setters.showPreviewModal,
    setPreviewSegment: setters.previewSegment,
    setPreviewLoading: setters.previewLoading,
    setPreviewUrl: setters.previewUrl,
    setIsDragging: setters.isDragging,
    // operations
    handleTimeUpdate, handleSegmentClick, handlePreviewSegment, handleClosePreview,
    handleShowSettings, handleSettingsChange, handleExportVideo, handleSaveSegments,
    handleDragStart,
  };
};

// Re-export globalVideoDuration setter for any external use
export const setGlobalVideoDuration = (d: number) => {
  globalVideoDuration = d;
};
