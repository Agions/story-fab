/**
 * Script Export Service
 * Export commentary script to plain text file.
 */
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { formatTime } from '@/shared/utils/formatting';
import { logger } from '@/shared/utils/logging';

type ExportScriptSegment = { startTime: number; endTime: number; content: string };
type ExportScriptData = { projectName: string; createdAt: string; segments: ExportScriptSegment[] };

export const exportScriptToFile = async (script: ExportScriptData, filename: string): Promise<void> => {
  try {
    const savePath = await save({
      defaultPath: filename,
      filters: [{ name: '文本文件', extensions: ['txt'] }]
    });
    if (!savePath) return;
    let content = '';
    content += `项目: ${script.projectName}\n`;
    content += `创建时间: ${new Date(script.createdAt).toLocaleString()}\n\n`;
    script.segments.forEach((segment) => {
      content += `[${formatTime(segment.startTime)} - ${formatTime(segment.endTime)}]\n`;
      content += `${segment.content}\n\n`;
    });
    await writeTextFile(savePath, content);
  } catch (error) {
    logger.error('导出脚本失败:', error);
    throw error;
  }
};