import { dedupService } from '../../../templates/dedup.templates';
import type { ScriptData } from '@/core/types';

export interface DedupConfig {
  enabled: boolean;
  autoFix: boolean;
  threshold: number;
  autoVariant?: boolean;
  variantIntensity?: number;
}

export interface DedupResult {
  script: ScriptData;
  report: {
    score: number;
    duplicates: any[];
    suggestions: string[];
  };
}

export async function executeDedupStep(
  generatedScript: ScriptData,
  dedupConfig?: DedupConfig,
  updateProgress?: (progress: number) => void
): Promise<DedupResult> {
  // 配置去重服务
  const config = {
    enabled: true,
    strategies: ['exact', 'semantic', 'template'] as const,
    threshold: 0.7,
    autoFix: true,
    preserveMeaning: true,
    autoVariant: true,
    ...dedupConfig,
  };

  dedupService.updateConfig(config);

  // 生成原创性报告
  const report = dedupService.generateOriginalityReport(generatedScript);
  updateProgress?.(52);

  let dedupedScript = generatedScript;

  // 自动修复
  if (config.autoFix && report.score < 80) {
    dedupedScript = dedupService.autoFix(generatedScript);
    updateProgress?.(54);
  }

  return { script: dedupedScript, report };
}
