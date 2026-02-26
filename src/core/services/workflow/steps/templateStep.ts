import { scriptTemplateService } from '../../../templates/script.templates';
import type { ScriptTemplate, VideoAnalysis } from '@/core/types';

export interface TemplateStepResult {
  template: ScriptTemplate;
}

export async function executeTemplateStep(
  videoAnalysis: VideoAnalysis,
  preferredTemplateId?: string
): Promise<TemplateStepResult> {
  let template: ScriptTemplate | null = null;

  if (preferredTemplateId) {
    template = scriptTemplateService.getTemplateById(preferredTemplateId);
  }

  if (!template) {
    // 基于视频分析推荐模板
    const recommended = scriptTemplateService.getRecommendedTemplates(videoAnalysis, {});
    template = recommended[0];
  }

  return { template };
}
