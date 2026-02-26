import { storageService } from '../storage.service';
import {
  executeUploadStep,
  executeAnalyzeStep,
  executeTemplateStep,
  executeScriptGenerateStep,
  executeDedupStep,
  executeUniquenessStep,
  executeAIClipStep,
  executeTimelineStep,
  executeExportStep,
} from './steps';
import type {
  WorkflowState,
  WorkflowData,
  WorkflowConfig,
  WorkflowCallbacks,
  WorkflowStep,
  TimelineData,
  STEP_PROGRESS,
} from './types';

class WorkflowService {
  private state: WorkflowState;
  private callbacks: WorkflowCallbacks = {};
  private abortController: AbortController | null = null;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): WorkflowState {
    return {
      step: 'upload',
      progress: 0,
      status: 'idle',
      data: {},
    };
  }

  setCallbacks(callbacks: WorkflowCallbacks): void {
    this.callbacks = callbacks;
  }

  getState(): WorkflowState {
    return { ...this.state };
  }

  private updateState(updates: Partial<WorkflowState>): void {
    const prevStep = this.state.step;
    const prevStatus = this.state.status;

    this.state = { ...this.state, ...updates };

    if (updates.step && updates.step !== prevStep) {
      this.callbacks.onStepChange?.(updates.step, prevStep);
    }
    if (updates.progress !== undefined) {
      this.callbacks.onProgress?.(updates.progress);
    }
    if (updates.status && updates.status !== prevStatus) {
      this.callbacks.onStatusChange?.(updates.status);
    }
    if (updates.error) {
      this.callbacks.onError?.(updates.error);
    }
  }

  private updateData(data: Partial<WorkflowData>): void {
    this.state.data = { ...this.state.data, ...data };
  }

  async start(
    projectId: string,
    videoFile: File,
    config: WorkflowConfig
  ): Promise<void> {
    this.abortController = new AbortController();
    this.updateState({ status: 'running', progress: 0 });

    try {
      // Step 1: 上传视频
      const uploadResult = await executeUploadStep(
        projectId,
        videoFile,
        (progress) => this.updateState({ progress })
      );
      this.updateData(uploadResult);
      this.updateState({ progress: 15 });

      // Step 2: 分析视频
      if (config.autoAnalyze) {
        const analyzeResult = await executeAnalyzeStep(
          uploadResult.videoInfo,
          projectId,
          (progress) => this.updateState({ progress })
        );
        this.updateData({ videoAnalysis: analyzeResult.analysis });
      } else {
        this.updateState({ step: 'analyze', progress: 20 });
        return;
      }

      // Step 3: 选择模板
      const templateResult = await executeTemplateStep(
        this.state.data.videoAnalysis!,
        config.preferredTemplate
      );
      this.updateData({ selectedTemplate: templateResult.template });
      this.updateState({ step: 'template-select', progress: 40 });

      // Step 4: 生成脚本
      if (config.autoGenerateScript) {
        const scriptResult = await executeScriptGenerateStep(
          this.state.data.videoInfo!,
          this.state.data.videoAnalysis!,
          this.state.data.selectedTemplate!,
          config.model,
          config.scriptParams,
          projectId,
          (progress) => this.updateState({ progress })
        );
        this.updateData({ generatedScript: scriptResult.script });
      } else {
        this.updateState({ step: 'script-generate', progress: 45 });
        return;
      }

      // Step 5: 脚本去重
      if (config.autoDedup !== false && config.dedupConfig?.enabled !== false) {
        const dedupResult = await executeDedupStep(
          this.state.data.generatedScript!,
          config.dedupConfig,
          (progress) => this.updateState({ progress })
        );
        this.updateData({
          dedupedScript: dedupResult.script,
          originalityReport: dedupResult.report,
        });
      }

      // Step 6: 唯一性保障
      if (config.enforceUniqueness !== false) {
        const uniquenessResult = await executeUniquenessStep(
          this.state.data.dedupedScript || this.state.data.generatedScript!,
          async (script) => this.rewriteScript(script),
          config.uniquenessConfig,
          (progress) => this.updateState({ progress })
        );
        this.updateData({
          uniqueScript: uniquenessResult.script,
          uniquenessReport: uniquenessResult.report,
        });
      }

      // Step 7: 编辑脚本
      this.updateState({ step: 'script-edit', progress: 60 });

      // Step 8: AI 智能剪辑
      if (config.aiClipConfig?.enabled) {
        await executeAIClipStep(
          this.state.data.videoInfo!,
          config.aiClipConfig,
          (progress) => this.updateState({ progress })
        );
      }

      // Step 9: 时间轴编辑
      const timeline = await executeTimelineStep(
        this.state.data.videoInfo!,
        this.state.data.videoAnalysis!,
        this.state.data.editedScript || this.state.data.uniqueScript!,
        true
      );
      this.updateData({ timeline });
      this.updateState({ step: 'timeline-edit', progress: 85 });

      // Step 10: 预览
      this.updateState({ step: 'preview', progress: 90 });

      // Step 11: 导出
      this.updateState({ step: 'export', progress: 100, status: 'completed' });
      this.callbacks.onComplete?.(this.state.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '工作流执行失败';
      this.updateState({ status: 'error', error: errorMessage });
      throw error;
    }
  }

  private async rewriteScript(script: any): Promise<any> {
    const randomSeed = Math.random().toString(36).substring(7);
    return {
      ...script,
      content: script.content + `\n<!-- rewrite: ${randomSeed} -->`,
      updatedAt: new Date().toISOString(),
    };
  }

  async stepEditScript(editedScript: any): Promise<any> {
    this.updateState({ step: 'script-edit', progress: 60 });

    const project = storageService.projects.get(this.state.data.projectId!);
    if (project) {
      const index = project.scripts.findIndex((s: any) => s.id === editedScript.id);
      if (index >= 0) {
        project.scripts[index] = {
          ...editedScript,
          updatedAt: new Date().toISOString(),
        };
      } else {
        project.scripts.push(editedScript);
      }
      storageService.projects.save(project);
    }

    this.updateData({ editedScript });
    this.updateState({ progress: 70 });
    return editedScript;
  }

  async stepExport(settings: any): Promise<string> {
    this.updateState({ step: 'export', progress: 95 });

    const exportedPath = await executeExportStep(
      this.state.data.projectId!,
      this.state.data.videoInfo!,
      this.state.data.timeline!,
      this.state.data.editedScript,
      settings
    );

    this.updateState({ progress: 100, status: 'completed' });
    return exportedPath;
  }

  pause(): void {
    this.updateState({ status: 'paused' });
  }

  resume(): void {
    this.updateState({ status: 'running' });
  }

  cancel(): void {
    this.abortController?.abort();
    this.updateState({ status: 'idle' });
  }

  reset(): void {
    this.state = this.getInitialState();
  }

  jumpToStep(step: WorkflowStep): void {
    const stepProgress: Record<WorkflowStep, number> = {
      upload: 0,
      analyze: 20,
      'template-select': 35,
      'script-generate': 40,
      'script-dedup': 50,
      'script-edit': 60,
      'timeline-edit': 70,
      preview: 90,
      export: 95,
    };

    this.updateState({
      step,
      progress: stepProgress[step],
    });
  }
}

export const workflowService = new WorkflowService();
export default workflowService;
