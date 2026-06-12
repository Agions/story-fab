/**
 * VideoExport handlers — split from VideoExport.tsx
 */
import { useState, useCallback, useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { tauri } from '@/core/tauri';
import { notify } from '@/shared';
import { logger } from '@/shared/utils/logging';
import type { ExportSettings } from '@/core/types';
import { PLATFORM_PRESETS } from './exportConfig';

interface UseExportHandlersProps {
  state: {
    synthesisData?: { finalVideoUrl?: string };
    currentVideo?: { duration?: number };
    exportSettings?: Partial<ExportSettings>;
  };
  onExportSettingsChange: (settings: ExportSettings) => void;
  onComplete?: () => void;
}

export interface ExportHandlers {
  exporting: boolean;
  progress: number;
  progressStage: string;
  etaSeconds: number | null;
  exported: boolean;
  exportedFile: string | null;
  exportError: string | null;
  selectedPlatform: string | null;
  batchMode: boolean;
  selectedPlatforms: string[];
  currentExportId: string | null;
  config: ExportSettings;
  estimateFileSize: () => string;
  getEstimatedFileSize: () => string;
  setConfig: React.Dispatch<React.SetStateAction<ExportSettings>>;
  setSelectedPlatform: (v: string | null) => void;
  setBatchMode: (v: boolean) => void;
  setSelectedPlatforms: (v: string[]) => void;
  handleExport: () => Promise<void>;
  handleBatchExport: () => Promise<void>;
  handleCancel: () => Promise<void>;
  togglePlatformSelection: (value: string) => void;
}

export function useExportHandlers({
  state,
  onExportSettingsChange,
  onComplete,
}: UseExportHandlersProps): ExportHandlers {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [exported, setExported] = useState(false);
  const [_exportedFile, setExportedFile] = useState<string | null>(null);
  const [_exportError, setExportError] = useState<string | null>(null);
  const [_startTime, _setStartTime] = useState<number>(Date.now());
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [currentExportId, setCurrentExportId] = useState<string | null>(null);

  const [config, setConfig] = useState<ExportSettings>({
    format: state.exportSettings?.format || 'mp4',
    quality: state.exportSettings?.quality || 'high',
    resolution: state.exportSettings?.resolution || '1080p',
    fps: state.exportSettings?.fps || 30,
    includeSubtitles: state.exportSettings?.includeSubtitles ?? true,
    burnSubtitles: state.exportSettings?.burnSubtitles ?? true,
    includeWatermark: state.exportSettings?.includeWatermark ?? false,
  });

  // 监听 Rust processing-progress 事件
  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    let cancelled = false;
    if (exporting) {
      listen<{ stage: string; progress: number; time_remaining_secs?: number }>(
        'processing-progress',
        (event) => {
          const { stage, progress, time_remaining_secs } = event.payload;
          setProgress(Math.round(progress * 100));
          setProgressStage(stage);
          if (time_remaining_secs !== undefined) {
            setEtaSeconds(Math.round(time_remaining_secs));
          }
        }
      ).then((fn) => {
        // If cleanup already ran before listen() resolved, unlisten immediately
        if (cancelled) {
          fn();
        } else {
          unlisten = fn;
        }
      }).catch((err) => {
        logger.error('[useExportHandlers] Failed to subscribe to processing-progress', err);
      });
    }
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [exporting]);

  const handleCancel = useCallback(async () => {
    if (!currentExportId) return;
    try {
      await tauri.cancelExport(currentExportId);
      notify.info('导出已取消');
    } catch {
      notify.error(new Error('取消导出失败'), '取消失败');
    }
    setExporting(false);
    setProgress(0);
    setProgressStage('');
    setEtaSeconds(null);
    setCurrentExportId(null);
  }, [currentExportId]);

  const estimateFileSize = useCallback(() => {
    if (!state.currentVideo?.duration) return '0 MB';
    const bitrateMap: Record<string, number> = { low: 1.5, medium: 4, high: 10, ultra: 30 };
    const bitrate = bitrateMap[config.quality] || 5;
    const sizeMB = (bitrate * state.currentVideo.duration) / 8;
    return sizeMB > 1000 ? `${(sizeMB / 1000).toFixed(1)} GB` : `${sizeMB.toFixed(1)} MB`;
  }, [state.currentVideo?.duration, config.quality]);

  const getEstimatedFileSize = useCallback(() => {
    if (!state.currentVideo?.duration) return '0 MB';
    const platform = PLATFORM_PRESETS.find(p => p.value === selectedPlatform);
    const bitrate = platform?.bitrate || (config.quality === 'low' ? 1.5 : config.quality === 'medium' ? 4 : config.quality === 'high' ? 10 : 30);
    const sizeMB = (bitrate * state.currentVideo.duration) / 8;
    return sizeMB > 1000 ? `${(sizeMB / 1000).toFixed(1)} GB` : `${sizeMB.toFixed(1)} MB`;
  }, [state.currentVideo?.duration, selectedPlatform, config.quality]);

  const handleExport = useCallback(async () => {
    if (!state.synthesisData?.finalVideoUrl) {
      notify.warning('请先完成视频合成');
      return;
    }

    setExporting(true);
    setProgress(0);
    setProgressStage('准备导出...');
    setEtaSeconds(null);
    setExportError(null);

    try {
      const outputPath = `/tmp/story-fab/export_${Date.now()}.mp4`;
      setCurrentExportId(outputPath);

      setProgressStage('正在编码...');

      await tauri.autonomousRender({
        input_path: state.synthesisData.finalVideoUrl ?? '',
        output_path: outputPath,
      });

      setProgress(100);
      setProgressStage('导出完成');
      setEtaSeconds(0);

      onExportSettingsChange(config);
      setExportedFile(outputPath);
      setExported(true);
      notify.success('视频导出完成！');
      onComplete?.();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setExportError(msg);
      notify.error(msg, '导出失败');
    } finally {
      setExporting(false);
    }
  }, [state.synthesisData?.finalVideoUrl, config, onExportSettingsChange, onComplete]);

  const handleBatchExport = useCallback(async () => {
    if (!state.synthesisData?.finalVideoUrl) {
      notify.warning('请先完成视频合成');
      return;
    }
    if (selectedPlatforms.length === 0) {
      notify.warning('请至少选择一个发布平台');
      return;
    }

    setExporting(true);
    setProgress(0);
    setEtaSeconds(null);

    try {
      for (let i = 0; i < selectedPlatforms.length; i++) {
        const platform = PLATFORM_PRESETS.find(p => p.value === selectedPlatforms[i]);
        if (!platform) continue;

        const outputPath = `/tmp/story-fab/export_${platform.value}_${Date.now()}.mp4`;
        setCurrentExportId(outputPath);
        setProgressStage(`${platform.emoji} ${platform.label} 导出中... (${i + 1}/${selectedPlatforms.length})`);

        const exportConfig: ExportSettings = {
          ...config,
          resolution: platform.resolution as ExportSettings['resolution'],
        };
        onExportSettingsChange(exportConfig);

        await tauri.autonomousRender({
          input_path: state.synthesisData.finalVideoUrl ?? '',
          output_path: outputPath,
        });

        setProgress(Math.round(((i + 1) / selectedPlatforms.length) * 100));
      }

      setProgress(100);
      setProgressStage('全部导出完成');
      setEtaSeconds(0);
      setExported(true);
      notify.success(`批量导出完成！共 ${selectedPlatforms.length} 个平台`);
      onComplete?.();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setExportError(msg);
      notify.error(msg, '批量导出失败');
    } finally {
      setExporting(false);
    }
  }, [state.synthesisData?.finalVideoUrl, selectedPlatforms, config, onExportSettingsChange, onComplete]);

  const togglePlatformSelection = useCallback((value: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }, []);

  return {
    exporting,
    progress,
    progressStage,
    etaSeconds,
    exported,
    exportedFile: _exportedFile,
    exportError: _exportError,
    selectedPlatform,
    batchMode,
    selectedPlatforms,
    currentExportId,
    config,
    estimateFileSize,
    getEstimatedFileSize,
    setConfig,
    setSelectedPlatform,
    setBatchMode,
    setSelectedPlatforms,
    handleExport,
    handleBatchExport,
    handleCancel,
    togglePlatformSelection,
  };
}