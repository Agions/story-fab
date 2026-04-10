import { visionService } from '../../vision.service';
import { storageService } from '../../storage.service';
import type { VideoInfo, VideoAnalysis } from '@/core/types';

export interface AnalyzeStepResult {
  analysis: VideoAnalysis;
}

export async function executeAnalyzeStep(
  videoInfo: VideoInfo,
  projectId: string,
  updateProgress: (progress: number) => void = () => {}
): Promise<AnalyzeStepResult> {
  // 阶段1：场景检测 (0-30%)
  updateProgress(5);
  const { scenes } = await visionService.detectScenesAdvanced(
    videoInfo,
    { minSceneDuration: 3, detectObjects: false, detectEmotions: false }
  );
  updateProgress(15);

  // 阶段2：对象识别 (30-60%)
  const { objects } = await visionService.detectScenesAdvanced(
    videoInfo,
    { minSceneDuration: 3, detectObjects: true, detectEmotions: false }
  );
  updateProgress(30);

  // 阶段3：情绪分析 (60-80%)
  const { emotions } = await visionService.detectScenesAdvanced(
    videoInfo,
    { minSceneDuration: 3, detectObjects: false, detectEmotions: true }
  );
  updateProgress(60);

  // 阶段4：生成报告 (80-100%)
  const analysis = await visionService.generateAnalysisReport(
    videoInfo,
    scenes,
    objects,
    emotions
  );
  updateProgress(100);

  // 保存分析结果
  const project = storageService.projects.getById(projectId);
  if (project) {
    (project as any).analysis = analysis;
    storageService.projects.save(project);
  }

  return { analysis };
}
