import { videoService } from '../../video.service';
import { storageService } from '../../storage.service';
import type { WorkflowState, WorkflowData } from '../types';

export interface UploadStepResult {
  videoInfo: any;
  projectId: string;
}

export async function executeUploadStep(
  projectId: string,
  videoFile: File,
  updateProgress: (progress: number) => void
): Promise<UploadStepResult> {
  // 上传视频
  const videoInfo = await videoService.uploadVideo(videoFile, (progress) => {
    updateProgress(5 + progress * 0.1);
  });

  // 保存到项目
  const project = storageService.projects.get(projectId);
  if (project) {
    project.videos.push(videoInfo);
    storageService.projects.save(project);
  }

  return { videoInfo, projectId };
}
