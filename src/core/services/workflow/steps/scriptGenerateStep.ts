import { scriptTemplateService } from '../../../templates/script.templates';
import { aiService } from '../../ai.service';
import { storageService } from '../../storage.service';
import type {
  VideoInfo,
  VideoAnalysis,
  ScriptTemplate,
  ScriptData,
  AIModel,
} from '@/core/types';

export interface ScriptGenerateConfig {
  style: string;
  tone: string;
  length: 'short' | 'medium' | 'long';
  targetAudience: string;
  language: string;
}

export interface ScriptGenerateResult {
  script: ScriptData;
}

export async function executeScriptGenerateStep(
  videoInfo: VideoInfo,
  videoAnalysis: VideoAnalysis,
  selectedTemplate: ScriptTemplate,
  model: AIModel,
  params: ScriptGenerateConfig,
  projectId: string,
  updateProgress: (progress: number) => void
): Promise<ScriptGenerateResult> {
  // 应用模板生成脚本结构
  const templateResult = scriptTemplateService.applyTemplate(selectedTemplate.id, {
    topic: videoInfo.name,
    duration: videoInfo.duration,
    keywords: videoAnalysis.scenes.flatMap((s) => s.tags),
  });

  updateProgress(45);

  // 为每个段落生成内容
  const segments = await Promise.all(
    templateResult.structure.map(async (section, index) => {
      const prompt = buildSegmentPrompt(section, videoInfo, videoAnalysis, params);
      const content = await aiService.generateText(model, prompt);

      updateProgress(45 + ((index + 1) / templateResult.structure.length) * 10);

      return {
        id: section.id,
        startTime: 0,
        endTime: 0,
        content: content.trim(),
        type: getSegmentType(section.type),
        notes: section.tips?.join('\n'),
      };
    })
  );

  // 创建脚本数据
  const script: ScriptData = {
    id: `script_${Date.now()}`,
    title: `${videoInfo.name} 解说脚本`,
    content: segments.map((s) => s.content).join('\n\n'),
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
      templateName: selectedTemplate.name,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 保存脚本
  const project = storageService.projects.get(projectId);
  if (project) {
    project.scripts.push(script);
    storageService.projects.save(project);
  }

  return { script };
}

function getSegmentType(type: string): string {
  switch (type) {
    case 'hook':
    case 'intro':
    case 'body':
    case 'conclusion':
    case 'cta':
      return 'narration';
    case 'transition':
      return 'transition';
    default:
      return 'narration';
  }
}

function buildSegmentPrompt(
  section: any,
  videoInfo: VideoInfo,
  analysis: VideoAnalysis,
  params: ScriptGenerateConfig
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
