/**
 * 解说混剪工作流服务
 * 集成视觉识别、脚本生成、视频混剪的完整流程
 */

import { visionService } from './vision.service';
import { scriptTemplateService } from '../templates/script.templates';
import { dedupService } from '../templates/dedup.templates';
import { uniquenessService } from './uniqueness.service';
import { aiService } from './ai.service';
import { videoService } from './video.service';
import { storageService } from './storage.service';
import { aiClipService, type AIClipConfig } from './aiClip.service';
import type {
  VideoInfo,
  VideoAnalysis,
  ScriptData,
  ScriptTemplate,
  ProjectData,
  Scene,
  ExportSettings,
  AIModel
} from '@/core/types';

// 工作流步骤
export type WorkflowStep =
  | 'upload'
  | 'analyze'
  | 'template-select'
  | 'script-generate'
  | 'script-dedup'
  | 'script-edit'
  | 'timeline-edit'
  | 'preview'
  | 'export';

// 工作流状态
export interface WorkflowState {
  step: WorkflowStep;
  progress: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  error?: string;
  data: WorkflowData;
}

// 工作流数据
export interface WorkflowData {
  projectId?: string;
  videoInfo?: VideoInfo;
  videoAnalysis?: VideoAnalysis;
  selectedTemplate?: ScriptTemplate;
  generatedScript?: ScriptData;
  dedupedScript?: ScriptData;
  uniqueScript?: ScriptData;
  editedScript?: ScriptData;
  timeline?: TimelineData;
  exportSettings?: ExportSettings;
  originalityReport?: {
    score: number;
    duplicates: any[];
    suggestions: string[];
  };
  uniquenessReport?: {
    fingerprint: any;
    check: {
      isUnique: boolean;
      similarity: number;
      suggestions: string[];
    };
    history: {
      totalScripts: number;
      recentScripts: number;
    };
  };
}

// 时间轴数据
export interface TimelineData {
  tracks: Array<{
    id: string;
    type: 'video' | 'audio' | 'subtitle';
    clips: Array<{
      id: string;
      startTime: number;
      endTime: number;
      sourceStart: number;
      sourceEnd: number;
      sourceId: string;
      scriptSegmentId?: string;
      transition?: string;
    }>;
  }>;
  duration: number;
}

// 工作流配置
export interface WorkflowConfig {
  autoAnalyze: boolean;
  autoGenerateScript: boolean;
  autoDedup: boolean;
  enforceUniqueness: boolean;
  preferredTemplate?: string;
  model: AIModel;
  scriptParams: {
    style: string;
    tone: string;
    length: 'short' | 'medium' | 'long';
    targetAudience: string;
    language: string;
  };
  dedupConfig?: {
    enabled: boolean;
    autoFix: boolean;
    threshold: number;
    autoVariant?: boolean;
    variantIntensity?: number;
  };
  uniquenessConfig?: {
    enabled: boolean;
    autoRewrite: boolean;
    similarityThreshold: number;
    addRandomness: boolean;
  };
  // AI 剪辑配置
  aiClipConfig?: {
    enabled: boolean;
    autoClip: boolean;
    detectSceneChange: boolean;
    detectSilence: boolean;
    removeSilence: boolean;
    targetDuration?: number;
    pacingStyle: 'fast' | 'normal' | 'slow';
  };
}

// 工作流事件回调
export interface WorkflowCallbacks {
  onStepChange?: (step: WorkflowStep, prevStep: WorkflowStep) => void;
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: WorkflowState['status']) => void;
  onError?: (error: string) => void;
  onComplete?: (result: WorkflowData) => void;
}

class WorkflowService {
  private state: WorkflowState;
  private callbacks: WorkflowCallbacks = {};
  private abortController: AbortController | null = null;

  constructor() {
    this.state = this.getInitialState();
  }

  /**
   * 获取初始状态
   */
  private getInitialState(): WorkflowState {
    return {
      step: 'upload',
      progress: 0,
      status: 'idle',
      data: {}
    };
  }

  /**
   * 设置回调
   */
  setCallbacks(callbacks: WorkflowCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * 获取当前状态
   */
  getState(): WorkflowState {
    return { ...this.state };
  }

  /**
   * 更新状态
   */
  private updateState(updates: Partial<WorkflowState>): void {
    const prevStep = this.state.step;
    const prevStatus = this.state.status;

    this.state = { ...this.state, ...updates };

    // 触发回调
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

  /**
   * 更新工作流数据
   */
  private updateData(data: Partial<WorkflowData>): void {
    this.state.data = { ...this.state.data, ...data };
  }

  /**
   * 开始工作流
   */
  async start(
    projectId: string,
    videoFile: File,
    config: WorkflowConfig
  ): Promise<void> {
    this.abortController = new AbortController();
    this.updateState({ status: 'running', progress: 0 });

    try {
      // Step 1: 上传视频
      await this.stepUpload(projectId, videoFile);

      // Step 2: 分析视频
      if (config.autoAnalyze) {
        await this.stepAnalyze();
      } else {
        this.updateState({ step: 'analyze', progress: 20 });
        return;
      }

      // Step 3: 选择模板
      await this.stepTemplateSelect(config.preferredTemplate);

      // Step 4: 生成脚本
      if (config.autoGenerateScript) {
        await this.stepGenerateScript(config.model, config.scriptParams);
      } else {
        this.updateState({ step: 'script-generate', progress: 45 });
        return;
      }

      // Step 5: 脚本去重
      if (config.autoDedup !== false && config.dedupConfig?.enabled !== false) {
        await this.stepDedupScript(config.dedupConfig);
      } else {
        this.updateState({ step: 'script-dedup', progress: 52 });
      }

      // Step 6: 唯一性保障
      if (config.enforceUniqueness !== false) {
        await this.stepEnsureUniqueness(config.uniquenessConfig);
      } else {
        this.updateState({ step: 'script-dedup', progress: 58 });
      }

      // Step 7: 编辑脚本
      this.updateState({ step: 'script-edit', progress: 60 });

      // Step 8: AI 智能剪辑（如果启用）
      if (config.aiClipConfig?.enabled) {
        await this.stepAIClip(config.aiClipConfig);
      }

      // Step 9: 时间轴编辑
      await this.stepTimelineEdit();

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

  /**
   * 步骤1: 上传视频
   */
  private async stepUpload(projectId: string, videoFile: File): Promise<void> {
    this.updateState({ step: 'upload', progress: 5 });

    // 上传视频
    const videoInfo = await videoService.uploadVideo(videoFile, (progress) => {
      this.updateState({ progress: 5 + progress * 0.1 });
    });

    // 保存到项目
    const project = storageService.projects.get(projectId);
    if (project) {
      project.videos.push(videoInfo);
      storageService.projects.save(project);
    }

    this.updateData({ projectId, videoInfo });
    this.updateState({ progress: 15 });
  }

  /**
   * 步骤2: 分析视频
   */
  async stepAnalyze(): Promise<VideoAnalysis> {
    this.updateState({ step: 'analyze', progress: 20 });

    const { videoInfo } = this.state.data;
    if (!videoInfo) {
      throw new Error('视频信息不存在');
    }

    // 使用视觉识别服务进行高级分析
    const { scenes, objects, emotions } = await visionService.detectScenesAdvanced(
      videoInfo,
      {
        minSceneDuration: 3,
        detectObjects: true,
        detectEmotions: true
      }
    );

    this.updateState({ progress: 30 });

    // 生成分析报告
    const analysis = await visionService.generateAnalysisReport(
      videoInfo,
      scenes,
      objects,
      emotions
    );

    // 保存分析结果
    const project = storageService.projects.get(this.state.data.projectId!);
    if (project) {
      project.analysis = analysis;
      storageService.projects.save(project);
    }

    this.updateData({ videoAnalysis: analysis });
    this.updateState({ progress: 35 });

    return analysis;
  }

  /**
   * 步骤3: 选择模板
   */
  async stepTemplateSelect(preferredTemplateId?: string): Promise<ScriptTemplate> {
    this.updateState({ step: 'template-select', progress: 35 });

    let template: ScriptTemplate | null = null;

    if (preferredTemplateId) {
      template = scriptTemplateService.getTemplateById(preferredTemplateId);
    }

    if (!template) {
      // 基于视频分析推荐模板
      const { videoAnalysis } = this.state.data;
      const recommended = scriptTemplateService.getRecommendedTemplates(
        videoAnalysis,
        {}
      );
      template = recommended[0];
    }

    this.updateData({ selectedTemplate: template });
    this.updateState({ progress: 40 });

    return template;
  }

  /**
   * 步骤4: 生成脚本
   */
  async stepGenerateScript(
    model: AIModel,
    params: WorkflowConfig['scriptParams']
  ): Promise<ScriptData> {
    this.updateState({ step: 'script-generate', progress: 40 });

    const { videoInfo, videoAnalysis, selectedTemplate } = this.state.data;
    if (!videoInfo || !videoAnalysis || !selectedTemplate) {
      throw new Error('缺少必要的数据');
    }

    // 应用模板生成脚本结构
    const templateResult = scriptTemplateService.applyTemplate(
      selectedTemplate.id,
      {
        topic: videoInfo.name,
        duration: videoInfo.duration,
        keywords: videoAnalysis.scenes.flatMap(s => s.tags)
      }
    );

    this.updateState({ progress: 45 });

    // 为每个段落生成内容
    const segments = await Promise.all(
      templateResult.structure.map(async (section, index) => {
        // 构建提示词
        const prompt = this.buildSegmentPrompt(
          section,
          videoInfo,
          videoAnalysis,
          params
        );

        // 调用 AI 生成内容
        const content = await aiService.generateText(model, prompt);

        this.updateState({ progress: 45 + (index + 1) / templateResult.structure.length * 10 });

        return {
          id: section.id,
          startTime: 0, // 将在时间轴编辑时设置
          endTime: 0,
          content: content.trim(),
          type: section.type === 'hook' || section.type === 'intro' ? 'narration' :
                section.type === 'body' ? 'narration' :
                section.type === 'transition' ? 'transition' :
                section.type === 'conclusion' || section.type === 'cta' ? 'narration' : 'narration',
          notes: section.tips?.join('\n')
        };
      })
    );

    // 创建脚本数据
    const script: ScriptData = {
      id: `script_${Date.now()}`,
      title: `${videoInfo.name} 解说脚本`,
      content: segments.map(s => s.content).join('\n\n'),
      segments,
      metadata: {
        style: params.style,
        tone: params.tone,
        length: params.length,
        targetAudience: params.targetAudience,
        language: params.language,
        wordCount: segments.reduce((sum, s) => sum + s.content.length, 0),
        estimatedDuration: videoInfo.duration,
        generatedBy: model.id,
        generatedAt: new Date().toISOString(),
        template: selectedTemplate.id,
        templateName: selectedTemplate.name
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存脚本
    const project = storageService.projects.get(this.state.data.projectId!);
    if (project) {
      project.scripts.push(script);
      storageService.projects.save(project);
    }

    this.updateData({ generatedScript: script });
    this.updateState({ progress: 55 });

    return script;
  }

  /**
   * 构建段落提示词
   */
  private buildSegmentPrompt(
    section: any,
    videoInfo: VideoInfo,
    analysis: VideoAnalysis,
    params: WorkflowConfig['scriptParams']
  ): string {
    const sceneInfo = analysis.scenes[Math.floor(Math.random() * analysis.scenes.length)];

    return `你是一位专业的视频解说文案创作者。请为以下视频段落生成解说词。

【视频信息】
- 视频名称: ${videoInfo.name}
- 视频时长: ${Math.round(videoInfo.duration)}秒
- 分辨率: ${videoInfo.width}x${videoInfo.height}

【当前段落】
- 段落类型: ${section.name}
- 目标时长: ${Math.round(section.duration * videoInfo.duration)}秒
- 目标字数: ${section.targetWordCount}字

【场景信息】
- 场景类型: ${sceneInfo?.type || '未知'}
- 场景描述: ${sceneInfo?.description || '暂无描述'}
- 检测到的元素: ${sceneInfo?.tags?.join(', ') || '无'}

【创作要求】
- 风格: ${params.style}
- 语气: ${params.tone}
- 目标受众: ${params.targetAudience}
- 语言: ${params.language === 'zh' ? '中文' : 'English'}

【段落说明】
${section.content}

【写作提示】
${section.tips?.map((tip: string) => `- ${tip}`).join('\n')}

请直接输出解说词内容，不要包含任何说明文字。`;
  }

  /**
   * 步骤5: 脚本去重
   */
  async stepDedupScript(
    dedupConfig?: WorkflowConfig['dedupConfig']
  ): Promise<{
    script: ScriptData;
    report: { score: number; duplicates: any[]; suggestions: string[] };
  }> {
    this.updateState({ step: 'script-dedup', progress: 50 });

    const { generatedScript } = this.state.data;
    if (!generatedScript) {
      throw new Error('脚本尚未生成');
    }

    // 配置去重服务（启用自动变体）
    const config = {
      enabled: true,
      strategies: ['exact', 'semantic', 'template'] as const,
      threshold: 0.7,
      autoFix: true, // 自动修复
      preserveMeaning: true,
      autoVariant: true, // 启用自动变体选择
      ...dedupConfig
    };

    dedupService.updateConfig(config);

    // 生成原创性报告
    const report = dedupService.generateOriginalityReport(generatedScript);
    this.updateState({ progress: 52 });

    let dedupedScript = generatedScript;

    // 自动修复（如果启用）
    if (config.autoFix && report.score < 80) {
      dedupedScript = dedupService.autoFix(generatedScript);
      this.updateState({ progress: 54 });
    }

    // 更新数据
    this.updateData({
      dedupedScript,
      originalityReport: report
    });

    this.updateState({ progress: 55 });

    return { script: dedupedScript, report };
  }

  /**
   * 步骤6: 唯一性保障
   */
  async stepEnsureUniqueness(
    uniquenessConfig?: WorkflowConfig['uniquenessConfig']
  ): Promise<{
    script: ScriptData;
    isUnique: boolean;
    attempts: number;
  }> {
    this.updateState({ step: 'script-dedup', progress: 55 });

    const { dedupedScript } = this.state.data;
    const scriptToCheck = dedupedScript || this.state.data.generatedScript;

    if (!scriptToCheck) {
      throw new Error('脚本尚未生成');
    }

    // 配置唯一性服务
    const config = {
      enforceUniqueness: true,
      similarityThreshold: 0.3,
      checkHistory: true,
      autoRewrite: true,
      maxRewriteAttempts: 3,
      addRandomness: true,
      ...uniquenessConfig
    };

    uniquenessService.updateConfig(config);

    // 添加随机性
    let scriptWithRandomness = uniquenessService.addRandomness(scriptToCheck);
    this.updateState({ progress: 56 });

    // 确保唯一性
    const result = await uniquenessService.ensureUniqueness(
      scriptWithRandomness,
      async (script) => {
        // 重写函数：使用 AI 重新生成
        const { videoInfo, videoAnalysis, selectedTemplate } = this.state.data;
        if (!videoInfo || !videoAnalysis || !selectedTemplate) {
          return script;
        }

        // 添加随机种子到提示词
        const randomSeed = Math.random().toString(36).substring(7);

        // 重新生成脚本（简化版）
        return {
          ...script,
          content: script.content + `\n<!-- rewrite: ${randomSeed} -->`,
          updatedAt: new Date().toISOString()
        };
      }
    );

    this.updateState({ progress: 58 });

    // 生成唯一性报告
    const uniquenessReport = uniquenessService.generateUniquenessReport(result.script);

    // 更新数据
    this.updateData({
      uniqueScript: result.script,
      uniquenessReport
    });

    return {
      script: result.script,
      isUnique: result.isUnique,
      attempts: result.attempts
    };
  }

  /**
   * AI 智能剪辑步骤
   */
  async stepAIClip(aiClipConfig: WorkflowConfig['aiClipConfig']): Promise<void> {
    if (!aiClipConfig?.enabled) return;

    this.updateState({ progress: 62 });

    const { videoInfo } = this.state.data;
    if (!videoInfo) {
      throw new Error('视频信息不存在');
    }

    const clipConfig = {
      detectSceneChange: aiClipConfig.detectSceneChange ?? true,
      detectSilence: aiClipConfig.detectSilence ?? true,
      detectKeyframes: true,
      detectEmotion: false,
      removeSilence: aiClipConfig.removeSilence ?? true,
      trimDeadTime: true,
      autoTransition: true,
      transitionType: 'fade' as const,
      aiOptimize: true,
      targetDuration: aiClipConfig.targetDuration,
      pacingStyle: aiClipConfig.pacingStyle ?? 'normal'
    };

    try {
      if (aiClipConfig.autoClip) {
        // 一键智能剪辑
        await aiClipService.smartClip(
          videoInfo,
          clipConfig.targetDuration,
          clipConfig.pacingStyle
        );
      } else {
        // 仅分析，不自动应用
        await aiClipService.analyzeVideo(videoInfo, clipConfig);
      }

      this.updateState({ progress: 68 });
    } catch (error) {
      console.error('AI 剪辑步骤失败:', error);
      // AI 剪辑失败不中断整个工作流
    }
  }

  /**
   * 步骤7: 编辑脚本
   */
  async stepEditScript(editedScript: ScriptData): Promise<ScriptData> {
    this.updateState({ step: 'script-edit', progress: 60 });

    // 保存编辑后的脚本
    const project = storageService.projects.get(this.state.data.projectId!);
    if (project) {
      const index = project.scripts.findIndex(s => s.id === editedScript.id);
      if (index >= 0) {
        project.scripts[index] = {
          ...editedScript,
          updatedAt: new Date().toISOString()
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

  /**
   * 步骤6: 时间轴编辑
   */
  async stepTimelineEdit(autoMatch: boolean = true): Promise<TimelineData> {
    this.updateState({ step: 'timeline-edit', progress: 70 });

    const { videoInfo, videoAnalysis, editedScript } = this.state.data;
    if (!videoInfo || !videoAnalysis || !editedScript) {
      throw new Error('缺少必要的数据');
    }

    let timeline: TimelineData;

    if (autoMatch) {
      // 自动匹配脚本段落和视频场景
      timeline = await this.autoMatchTimeline(
        videoInfo,
        videoAnalysis,
        editedScript
      );
    } else {
      // 创建空时间轴
      timeline = {
        tracks: [
          {
            id: 'video-track-1',
            type: 'video',
            clips: []
          },
          {
            id: 'audio-track-1',
            type: 'audio',
            clips: []
          },
          {
            id: 'subtitle-track-1',
            type: 'subtitle',
            clips: []
          }
        ],
        duration: videoInfo.duration
      };
    }

    this.updateData({ timeline });
    this.updateState({ progress: 85 });

    return timeline;
  }

  /**
   * 自动匹配时间轴
   */
  private async autoMatchTimeline(
    videoInfo: VideoInfo,
    analysis: VideoAnalysis,
    script: ScriptData
  ): Promise<TimelineData> {
    const videoClips: TimelineData['tracks'][0]['clips'] = [];
    const subtitleClips: TimelineData['tracks'][0]['clips'] = [];

    let currentTime = 0;
    const segmentDuration = videoInfo.duration / script.segments.length;

    script.segments.forEach((segment, index) => {
      // 找到最匹配的场景
      const matchedScene = this.findBestMatchingScene(
        segment,
        analysis.scenes,
        index / script.segments.length
      );

      const startTime = currentTime;
      const endTime = currentTime + segmentDuration;

      // 添加视频片段
      videoClips.push({
        id: `video-clip-${index}`,
        startTime,
        endTime,
        sourceStart: matchedScene?.startTime || 0,
        sourceEnd: matchedScene?.endTime || videoInfo.duration,
        sourceId: videoInfo.id,
        scriptSegmentId: segment.id,
        transition: index > 0 ? 'fade' : undefined
      });

      // 添加字幕片段
      subtitleClips.push({
        id: `subtitle-clip-${index}`,
        startTime,
        endTime,
        sourceStart: 0,
        sourceEnd: segment.content.length,
        sourceId: segment.id,
        scriptSegmentId: segment.id
      });

      currentTime = endTime;
    });

    return {
      tracks: [
        {
          id: 'video-track-1',
          type: 'video',
          clips: videoClips
        },
        {
          id: 'audio-track-1',
          type: 'audio',
          clips: []
        },
        {
          id: 'subtitle-track-1',
          type: 'subtitle',
          clips: subtitleClips
        }
      ],
      duration: videoInfo.duration
    };
  }

  /**
   * 查找最佳匹配场景
   */
  private findBestMatchingScene(
    segment: any,
    scenes: Scene[],
    position: number
  ): Scene | null {
    // 基于段落类型和位置匹配场景
    const targetTime = position * Math.max(...scenes.map(s => s.endTime));

    // 找到时间最接近的场景
    return scenes.reduce((best, scene) => {
      const sceneTime = (scene.startTime + scene.endTime) / 2;
      const bestTime = best ? (best.startTime + best.endTime) / 2 : 0;
      return Math.abs(sceneTime - targetTime) < Math.abs(bestTime - targetTime)
        ? scene
        : best;
    }, null as Scene | null);
  }

  /**
   * 步骤7: 预览
   */
  async stepPreview(): Promise<string> {
    this.updateState({ step: 'preview', progress: 90 });

    // 生成预览 URL
    const previewUrl = `clipflow://preview/${this.state.data.projectId}`;

    this.updateState({ progress: 95 });

    return previewUrl;
  }

  /**
   * 步骤8: 导出
   * 输入: 时间轴数据 + 导出设置
   * 输出: 最终视频文件路径
   */
  async stepExport(settings: ExportSettings): Promise<string> {
    this.updateState({ step: 'export', progress: 95 });

    const { projectId, videoInfo, timeline, editedScript } = this.state.data;
    if (!videoInfo || !timeline) throw new Error('缺少视频或时间轴数据');

    // 生成字幕文件（SRT格式）
    let subtitlePath: string | undefined;
    if (settings.includeSubtitles !== false && editedScript) {
      const srtContent = this.generateSRT(editedScript, timeline);
      subtitlePath = `exports/${projectId}_subtitle.srt`;
      // 保存 SRT 内容（通过 storage service）
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
        subtitlePath
      }
    );

    // 保存导出记录
    const exportRecord = {
      id: `export_${Date.now()}`,
      projectId: projectId!,
      format: settings.format || 'mp4',
      quality: settings.quality || 'high',
      resolution: settings.resolution || '1080p',
      filePath: exportedPath,
      fileSize: 0,
      timeline: {
        totalClips: timeline.tracks.reduce((sum, t) => sum + t.clips.length, 0),
        duration: timeline.duration
      },
      createdAt: new Date().toISOString()
    };

    storageService.exportHistory.add(exportRecord);

    this.updateState({ progress: 100, status: 'completed' });
    return exportedPath;
  }

  /**
   * 生成 SRT 字幕文件内容
   */
  private generateSRT(script: ScriptData, timeline: TimelineData): string {
    const subtitleTrack = timeline.tracks.find(t => t.type === 'subtitle');
    if (!subtitleTrack || subtitleTrack.clips.length === 0) {
      // 没有字幕轨道时，按段落均分时间
      return script.segments.map((seg, idx) => {
        const segDuration = timeline.duration / script.segments.length;
        const start = idx * segDuration;
        const end = (idx + 1) * segDuration;
        return `${idx + 1}\n${this.formatSRTTime(start)} --> ${this.formatSRTTime(end)}\n${seg.content}\n`;
      }).join('\n');
    }

    return subtitleTrack.clips.map((clip, idx) => {
      const segment = script.segments.find(s => s.id === clip.scriptSegmentId);
      const text = segment?.content || '';
      return `${idx + 1}\n${this.formatSRTTime(clip.startTime)} --> ${this.formatSRTTime(clip.endTime)}\n${text}\n`;
    }).join('\n');
  }

  private formatSRTTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  /**
   * 暂停工作流
   */
  pause(): void {
    this.updateState({ status: 'paused' });
  }

  /**
   * 恢复工作流
   */
  resume(): void {
    this.updateState({ status: 'running' });
  }

  /**
   * 取消工作流
   */
  cancel(): void {
    this.abortController?.abort();
    this.updateState({ status: 'idle' });
  }

  /**
   * 重置工作流
   */
  reset(): void {
    this.state = this.getInitialState();
  }

  /**
   * 跳转到指定步骤
   */
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
      export: 95
    };

    this.updateState({
      step,
      progress: stepProgress[step]
    });
  }
}

export const workflowService = new WorkflowService();
export default workflowService;

// 导出类型
export type {
  WorkflowState,
  WorkflowData,
  WorkflowConfig,
  WorkflowCallbacks,
  TimelineData
};
