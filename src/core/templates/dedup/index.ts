export * from './types';
export * from './detectors';
export * from './rewriters';

import type { ScriptData, ScriptSegment } from '@/core/types';
import type { DedupConfig, DuplicateResult, OriginalityReport, DedupStrategy } from './types';
import {
  detectExactDuplicates,
  detectSemanticDuplicates,
  detectTemplateContent,
  detectStructuralDuplicates,
  calculateSimilarity,
  calculateStructureSimilarity,
  normalizeText,
  deduplicateResults
} from './detectors';
import {
  mergeSegments,
  rewriteSegment,
  replaceTemplatePhrases,
  generateOriginalityReport
} from './rewriters';

class DedupService {
  private config: DedupConfig;

  constructor(config: Partial<DedupConfig> = {}) {
    this.config = {
      enabled: true,
      strategies: ['exact', 'semantic', 'template'],
      threshold: 0.7,
      autoFix: false,
      preserveMeaning: true,
      autoVariant: true,
      ...config
    };
  }

  updateConfig(config: Partial<DedupConfig>): void {
    this.config = { ...this.config, ...config };
  }

  detectDuplicates(script: ScriptData): DuplicateResult[] {
    const duplicates: DuplicateResult[] = [];
    const segments = script.segments;

    if (this.config.strategies.includes('exact')) {
      duplicates.push(...detectExactDuplicates(segments, normalizeText));
    }

    if (this.config.strategies.includes('semantic')) {
      duplicates.push(
        ...detectSemanticDuplicates(segments, this.config.threshold, calculateSimilarity)
      );
    }

    if (this.config.strategies.includes('template')) {
      duplicates.push(...detectTemplateContent(segments));
    }

    if (this.config.strategies.includes('structural')) {
      duplicates.push(
        ...detectStructuralDuplicates(
          segments,
          this.config.threshold,
          calculateStructureSimilarity
        )
      );
    }

    return deduplicateResults(duplicates).sort((a, b) => b.similarity - a.similarity);
  }

  autoFix(script: ScriptData): ScriptData {
    const duplicates = this.detectDuplicates(script);
    let fixedSegments = [...script.segments];

    for (const dup of duplicates) {
      const targetIndex = fixedSegments.findIndex(
        (s) => s.id === dup.target.segmentId
      );

      if (targetIndex >= 0) {
        switch (dup.type) {
          case 'exact':
            fixedSegments = mergeSegments(fixedSegments, dup);
            break;
          case 'similar':
            fixedSegments[targetIndex] = rewriteSegment(
              fixedSegments[targetIndex],
              dup.similarity,
              this.config.autoVariant
            );
            break;
          case 'template':
            fixedSegments[targetIndex] = replaceTemplatePhrases(fixedSegments[targetIndex]);
            break;
        }
      }
    }

    return {
      ...script,
      segments: fixedSegments,
      content: fixedSegments.map((s) => s.content).join('\n\n'),
      updatedAt: new Date().toISOString()
    };
  }

  generateOriginalityReport(script: ScriptData): OriginalityReport {
    const duplicates = this.detectDuplicates(script);
    const { score, suggestions } = generateOriginalityReport(script, duplicates);

    return {
      score,
      duplicates,
      suggestions
    };
  }
}

export const dedupService = new DedupService();
export default dedupService;
