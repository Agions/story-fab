import { visionService } from '../../vision.service';
import { storageService } from '../../storage.service';
import type { VideoInfo, VideoAnalysis } from '@/core/types';

export interface AnalyzeStepResult {
  analysis: VideoAnalysis;
}

export async function executeAnalyzeStep(
  videoInfo: VideoInfo,
  projectId: string,
  updateProgress: (progress: number) => void
): Promise<AnalyzeStepResult> {
  // 使用视觉识别服务进行高级分析
  const { scenes, objects, emotions } = await visionService.detectScenesAdvanced(
    videoInfo,
    {
      minSceneDuration: 3,
      detectObjects: true,
      detectEmotions: true,
    }
  );

  updateProgress(30);

  // 生成分析报告
  const analysis = await visionService.generateAnalysisReport(
    videoInfo,
    scenes,
    objects,
    emotions
  );

  // 保存分析结果
  const project = storageService.projects.get(projectId);
  if (project) {
    project.analysis = analysis;
    storageService.projects.save(project);
  }

  return { analysis };
}
