/**
 * 导出服务
 * 支持多种格式的音视频导出
 * 集成 Tauri 后端进行实际视频处理
 */

import { invoke } from '@tauri-apps/api/core';
import { logger } from '../../../shared/utils/logging';

// Re-export types from shared source
export type { ExportFormat, ExportQuality, ExportResolution, EncoderSettings, ExportConfig, ExportResult } from '../../export/types';
export { EXPORT_PRESETS, FORMAT_INFO } from '../../export/types';

export const FORMAT_MIME_TYPES: Record<ExportFormat, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
};

export class ExportService {
  private currentExportId: string | null = null;
  private config: ExportConfig | null = null;

  /** Shared config merging logic: partial + instance + preset defaults */
  private _buildConfig(overrides: Partial<ExportConfig>, useInstance = true): ExportConfig {
    const quality = overrides.quality ?? (useInstance ? this.config?.quality : undefined) ?? 'medium';
    const preset = EXPORT_PRESETS[quality];
    return {
      format: overrides.format ?? (useInstance ? this.config?.format : undefined) ?? 'mp4',
      quality,
      resolution: overrides.resolution ?? (useInstance ? this.config?.resolution : undefined) ?? preset.resolution ?? '1080p',
      frameRate: overrides.frameRate ?? (useInstance ? this.config?.frameRate : undefined) ?? preset.frameRate ?? 30,
      aspectRatio: overrides.aspectRatio ?? (useInstance ? this.config?.aspectRatio : undefined) ?? '16:9',
      audioCodec: overrides.audioCodec ?? (useInstance ? this.config?.audioCodec : undefined) ?? preset.encoder?.audioCodec ?? 'aac',
      audioBitrate: overrides.audioBitrate ?? (useInstance ? this.config?.audioBitrate : undefined) ?? preset.audioBitrate ?? '192k',
      sampleRate: overrides.sampleRate ?? (useInstance ? this.config?.sampleRate : undefined) ?? 48000,
      channels: overrides.channels ?? (useInstance ? this.config?.channels : undefined) ?? 2,
      encoder: overrides.encoder ?? (useInstance ? this.config?.encoder : undefined) ?? preset.encoder ?? { videoCodec: 'h264', audioCodec: 'aac', crf: 23, preset: 'medium' },
      subtitleEnabled: overrides.subtitleEnabled ?? (useInstance ? this.config?.subtitleEnabled : undefined) ?? false,
      subtitlePath: overrides.subtitlePath ?? (useInstance ? this.config?.subtitlePath : undefined),
      burnSubtitles: overrides.burnSubtitles ?? (useInstance ? this.config?.burnSubtitles : undefined) ?? false,
      watermarkEnabled: overrides.watermarkEnabled ?? (useInstance ? this.config?.watermarkEnabled : undefined) ?? false,
      watermarkText: overrides.watermarkText ?? (useInstance ? this.config?.watermarkText : undefined),
      watermarkImage: overrides.watermarkImage ?? (useInstance ? this.config?.watermarkImage : undefined),
      watermarkPosition: overrides.watermarkPosition ?? (useInstance ? this.config?.watermarkPosition : undefined) ?? 'bottom-right',
      watermarkOpacity: overrides.watermarkOpacity ?? (useInstance ? this.config?.watermarkOpacity : undefined) ?? 0.8,
      title: overrides.title ?? (useInstance ? this.config?.title : undefined),
      author: overrides.author ?? (useInstance ? this.config?.author : undefined),
      copyright: overrides.copyright ?? (useInstance ? this.config?.copyright : undefined),
    };
  }

  setConfig(config: Partial<ExportConfig>): void {
    this.config = this._buildConfig(config, false);
  }

  getConfig(): ExportConfig | null {
    return this.config;
  }

  async exportVideo(
    inputPath: string,
    outputPath: string,
    config: Partial<ExportConfig>,
    onProgress?: (percent: number) => void
  ): Promise<ExportResult> {
    const fullConfig = this._buildConfig(config, true);

    const exportId = crypto.randomUUID();
    this.currentExportId = exportId;

    logger.info('[ExportService] 开始导出:', {
      exportId,
      input: inputPath,
      output: outputPath,
      format: fullConfig.format,
    });

    try {
      const result = await invoke<{
        outputPath: string;
        duration: number;
        fileSize: number;
      }>('export_video', {
        inputPath,
        outputPath,
        format: fullConfig.format,
        resolution: fullConfig.resolution,
        frameRate: fullConfig.frameRate,
        videoCodec: fullConfig.encoder.videoCodec,
        audioCodec: fullConfig.audioCodec,
        crf: fullConfig.encoder.crf ?? 23,
        subtitleEnabled: fullConfig.subtitleEnabled,
        subtitlePath: fullConfig.subtitlePath,
        burnSubtitles: fullConfig.burnSubtitles,
      });

      logger.info('[ExportService] 导出完成:', { exportId, result });

      return {
        outputPath: result.outputPath,
        duration: result.duration,
        fileSize: result.fileSize,
        format: fullConfig.format,
      };
    } catch (error) {
      logger.error('[ExportService] 导出失败:', { exportId, error });
      throw error;
    } finally {
      this.currentExportId = null;
    }
  }

  async cancelExport(): Promise<void> {
    if (this.currentExportId) {
      logger.info('[ExportService] 取消导出:', { exportId: this.currentExportId });
      try {
        await invoke('cancel_export', { exportId: this.currentExportId });
      } catch (error) {
        logger.warn('[ExportService] 取消导出失败:', { error });
      }
      this.currentExportId = null;
    }
  }

  getExportPresets(): Record<ExportQuality, Partial<ExportConfig>> {
    return EXPORT_PRESETS;
  }

  getFormatInfo(format: ExportFormat) {
    return FORMAT_INFO[format];
  }
}

export const exportService = new ExportService();
export default exportService;
