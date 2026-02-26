import { videoService } from '../../video.service';
import { storageService } from '../../storage.service';
import type { VideoInfo, ScriptData, ExportSettings, TimelineData } from '@/core/types';

export async function executeExportStep(
  projectId: string,
  videoInfo: VideoInfo,
  timeline: TimelineData,
  editedScript: ScriptData | undefined,
  settings: ExportSettings
): Promise<string> {
  // 生成字幕文件
  let subtitlePath: string | undefined;
  if (settings.includeSubtitles !== false && editedScript) {
    const srtContent = generateSRT(editedScript, timeline);
    subtitlePath = `exports/${projectId}_subtitle.srt`;
    storageService.save(`srt-${projectId}`, srtContent);
  }

  // 构建输出路径
  const outputPath = `exports/${projectId}_${Date.now()}.${settings.format || 'mp4'}`;

  // 调用视频服务导出
  const exportedPath = await videoService.exportVideo(
    videoInfo.path,
    outputPath,
    {
      format: settings.format,
      quality: settings.quality,
      resolution: settings.resolution,
      includeSubtitles: !!subtitlePath,
      subtitlePath,
    }
  );

  // 保存导出记录
  const exportRecord = {
    id: `export_${Date.now()}`,
    projectId,
    format: settings.format || 'mp4',
    quality: settings.quality || 'high',
    resolution: settings.resolution || '1080p',
    filePath: exportedPath,
    fileSize: 0,
    timeline: {
      totalClips: timeline.tracks.reduce((sum, t) => sum + t.clips.length, 0),
      duration: timeline.duration,
    },
    createdAt: new Date().toISOString(),
  };

  storageService.exportHistory.add(exportRecord);

  return exportedPath;
}

function generateSRT(script: ScriptData, timeline: TimelineData): string {
  const subtitleTrack = timeline.tracks.find((t) => t.type === 'subtitle');

  if (!subtitleTrack || subtitleTrack.clips.length === 0) {
    // 没有字幕轨道时，按段落均分时间
    return script.segments
      .map((seg, idx) => {
        const segDuration = timeline.duration / script.segments.length;
        const start = idx * segDuration;
        const end = (idx + 1) * segDuration;
        return `${idx + 1}\n${formatSRTTime(start)} --> ${formatSRTTime(end)}\n${seg.content}\n`;
      })
      .join('\n');
  }

  return subtitleTrack.clips
    .map((clip, idx) => {
      const segment = script.segments.find((s) => s.id === clip.scriptSegmentId);
      const text = segment?.content || '';
      return `${idx + 1}\n${formatSRTTime(clip.startTime)} --> ${formatSRTTime(
        clip.endTime
      )}\n${text}\n`;
    })
    .join('\n');
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}
