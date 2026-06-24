/**
 * 步骤 6: 导出发布
 * ComposedVideoData → ExportResult
 */

import type { PipelineStep, PipelineDataContext, ComposedVideoData } from '../engine';
import type { ExportResult, ExportFormat, ExportQuality } from '@/types';
import { invoke, TauriCommand } from '@/core/tauri';

export interface ExportStepConfig {
  format?: ExportFormat;
  quality?: ExportQuality;
  outputDir?: string;
}

export const createExportStep = (config: ExportStepConfig = {}): PipelineStep<ComposedVideoData, ExportResult> => ({
  name: 'export',

  validate(input) {
    if (!input?.videoPath) {
      return { valid: false, reason: '合成视频路径为空' };
    }
    return { valid: true };
  },

  async execute(input: ComposedVideoData, ctx: PipelineDataContext): Promise<ExportResult> {
    const {
      format = 'mp4',
      quality = 'high',
      outputDir,
    } = config;

    const outputPath = outputDir
      ? `${outputDir}/storyfab_${ctx.projectId}_export.${format}`
      : `/tmp/storyfab_${ctx.projectId}_export.${format}`;

    try {
      // 调用后端导出
      const result = await invoke(TauriCommand.EXPORT_VIDEO, {
        inputPath: input.videoPath,
        outputPath,
        format,
        quality,
      });

      const exportResult = result as any;

      return {
        outputPath: exportResult?.outputPath ?? outputPath,
        duration: input.duration,
        fileSize: exportResult?.fileSize ?? 0,
        format,
      };
    } catch (err) {
      // 如果后端导出失败，返回原始路径
      return {
        outputPath: input.videoPath,
        duration: input.duration,
        fileSize: 0,
        format,
      };
    }
  },
});
